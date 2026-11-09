import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useAppSelector } from '@/hooks';

type UseStatementCatalogLookupsArgs = {
  facilityId?: number | null;
  departmentId?: number | null;
  practitionerId?: number | null;
};

const displayName = (value: unknown): string => {
  if (value == null) return '-';
  if (typeof value === 'string') return value.trim() || '-';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const name =
      record.name ??
      record.facilityName ??
      record.fullName ??
      record.englishName ??
      record.departmentName ??
      record.nameEn ??
      record.englishFullName;
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
  }
  return '-';
};

export const useStatementCatalogLookups = ({
  facilityId,
  departmentId,
  practitionerId
}: UseStatementCatalogLookupsArgs) => {
  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const { data: department } = useGetDepartmentByIdQuery(departmentId as number, {
    skip: departmentId == null
  });
  const { data: practitioner } = useGetPractitionerByIdQuery(practitionerId as number, {
    skip: practitionerId == null
  });

  const selectedFacilityId = Number(selectedFacility?.id ?? 0);
  const facilityName =
    facilityId != null && selectedFacilityId === Number(facilityId)
      ? displayName(selectedFacility)
      : selectedFacilityId
        ? displayName(selectedFacility)
        : '-';

  const practitionerName = (() => {
    const source = (practitioner as any)?.data ?? practitioner;
    if (source == null) return '-';
    const first = String(source.firstName ?? source.englishFirstName ?? '').trim();
    const last = String(source.lastName ?? source.englishLastName ?? '').trim();
    const full = `${first} ${last}`.trim();
    if (full) return `Dr. ${full}`;
    return displayName(source);
  })();

  return {
    facilityName,
    departmentName: displayName((department as any)?.data ?? department),
    practitionerName
  };
};
