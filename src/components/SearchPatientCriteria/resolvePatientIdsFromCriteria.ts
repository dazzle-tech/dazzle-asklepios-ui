import {
  useLazyGetPatientsByAnyDocumentNumberQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByFullNameQuery,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useLazyGetPatientsByPrimaryPhoneQuery
} from '@/services/patient/patientService';
import { useCallback } from 'react';

export type PatientSearchCriteria = {
  searchByField?: string | null;
  patientName?: string | Date | null;
};

const PAGE = { page: 0, size: 50, sort: 'id,asc' as const };

const toIds = (res: any): number[] => {
  const rows = (res?.data ?? res?.content ?? []) as any[];
  const ids = rows
    .map(p => Number(p?.id))
    .filter(id => Number.isFinite(id) && id > 0);
  return Array.from(new Set(ids));
};

/**
 * Resolves SearchPatientCriteria { searchByField, patientName } into patient IDs
 * using the same patientService endpoints previously used by PatientSearch.
 * Empty criteria → []; non-empty with no matches → [].
 */
export function useResolvePatientIdsFromCriteria() {
  const [fetchByMrn] = useLazyGetPatientsByMedicalRecordNumberQuery();
  const [fetchByPrimaryPhone] = useLazyGetPatientsByPrimaryPhoneQuery();
  const [fetchByDob] = useLazyGetPatientsByDateOfBirthQuery();
  const [fetchByFullName] = useLazyGetPatientsByFullNameQuery();
  const [fetchByDocumentNo] = useLazyGetPatientsByAnyDocumentNumberQuery();

  const resolvePatientIds = useCallback(
    async (criteria: PatientSearchCriteria | null | undefined): Promise<number[]> => {
      const field = String(criteria?.searchByField ?? 'fullName');
      const patientName = criteria?.patientName;
      const raw =
        patientName instanceof Date
          ? ''
          : String(patientName ?? '').trim();

      // DOB may arrive as a Date from MyInput date field
      if (field !== 'dob' && !raw) return [];
      if (field === 'dob' && !(patientName instanceof Date) && !raw) return [];

      const common = { ...PAGE, timestamp: Date.now() };

      try {
        let res: any = null;

        switch (field) {
          case 'patientMrn':
            res = await fetchByMrn({ medicalRecordNumber: raw, ...common } as any).unwrap();
            break;
          case 'phoneNumber':
            res = await fetchByPrimaryPhone({ phone: raw, ...common } as any).unwrap();
            break;
          case 'documentNumber':
            res = await fetchByDocumentNo({ number: raw, ...common } as any).unwrap();
            break;
          case 'dob': {
            let dateStr = '';
            if (patientName instanceof Date && !Number.isNaN(patientName.getTime())) {
              const y = patientName.getFullYear();
              const m = String(patientName.getMonth() + 1).padStart(2, '0');
              const d = String(patientName.getDate()).padStart(2, '0');
              dateStr = `${y}-${m}-${d}`;
            } else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
              dateStr = raw.slice(0, 10);
            } else {
              const asDate = new Date(raw);
              if (Number.isNaN(asDate.getTime())) return [];
              const y = asDate.getFullYear();
              const m = String(asDate.getMonth() + 1).padStart(2, '0');
              const d = String(asDate.getDate()).padStart(2, '0');
              dateStr = `${y}-${m}-${d}`;
            }
            res = await fetchByDob({ date: dateStr, ...common } as any).unwrap();
            break;
          }
          case 'fullName':
          default:
            res = await fetchByFullName({ keyword: raw, ...common } as any).unwrap();
            break;
        }

        return toIds(res);
      } catch {
        return [];
      }
    },
    [fetchByMrn, fetchByPrimaryPhone, fetchByDob, fetchByFullName, fetchByDocumentNo]
  );

  return { resolvePatientIds };
}

export default useResolvePatientIdsFromCriteria;
