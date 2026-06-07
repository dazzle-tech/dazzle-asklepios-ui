import { Patient, PatientInsurance } from '@/types/model-types-new';
import { newPatient, newPatientInsurance } from '@/types/model-types-constructor-new';

const PATIENT_SAVE_KEYS = Object.keys(newPatient) as (keyof Patient)[];

export const pickPatientFields = (source?: Partial<Patient> | null): Partial<Patient> => {
  if (!source) return {};

  const picked: Partial<Patient> = {};

  PATIENT_SAVE_KEYS.forEach(key => {
    const value = source[key];
    if (value !== undefined && value !== null) {
      (picked as any)[key] = value;
    }
  });

  return picked;
};

export const buildPatientSavePayload = (patient: Partial<Patient>): Patient => {
  const picked = pickPatientFields(patient);

  const payload: Patient = {
    ...newPatient,
    ...picked,
    isCompletedPatient: true,
    isUnknown: false
  };

  if (patient.id != null) {
    payload.id = patient.id;
  } else {
    delete (payload as any).id;
    if (patient.isCchiPatient) {
      payload.medicalRecordNumber = '';
    }
  }

  if (payload.dateOfBirth) {
    const rawDob = payload.dateOfBirth as string | Date;
    if (rawDob instanceof Date) {
      payload.dateOfBirth = rawDob.toISOString().slice(0, 10);
    } else if (typeof rawDob === 'string' && rawDob.includes('T')) {
      payload.dateOfBirth = rawDob.split('T')[0];
    }
  }

  return payload;
};

export const extractPatientInsurancesList = (response: any): PatientInsurance[] => {
  const responseData = response?.data ?? response;

  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
  if (Array.isArray(responseData?.object)) return responseData.object;

  return [];
};

export const getCchiInsuranceStorageKey = (
  patientId?: number | string | null,
  documentId?: number | string | null
) => {
  if (patientId) return `cchi-insurance-patient-${patientId}`;
  if (documentId) return `cchi-insurance-document-${documentId}`;
  return '';
};

export const extractCchiInsurance = (mappedResponse: any): Record<string, any> | null => {
  if (!mappedResponse) return null;

  const candidates = [
    mappedResponse.insurance,
    mappedResponse.patientInsurance,
    Array.isArray(mappedResponse.insurances) ? mappedResponse.insurances[0] : null,
    mappedResponse.patient?.insurance,
    Array.isArray(mappedResponse.patient?.insurances) ? mappedResponse.patient.insurances[0] : null
  ];

  const found = candidates.find(item => item && typeof item === 'object');
  return found ?? null;
};

export const resolvePayorIdFromCchiInsurance = (
  insurance: Record<string, any>,
  payorsList: any[]
): number | undefined => {
  const directPayorId = Number(insurance.payorId);
  if (Number.isFinite(directPayorId) && directPayorId > 0) {
    return directPayorId;
  }

  const lookupIds = [
    insurance.payerNphiesId,
    insurance.payorNphiesId,
    insurance.nphiesId,
    insurance.waseelPayerId,
    insurance.payorCode
  ].filter(Boolean);

  for (const lookupId of lookupIds) {
    const payor = payorsList.find(
      item =>
        String(item?.nphiesId) === String(lookupId) ||
        String(item?.waseelPayerId) === String(lookupId) ||
        String(item?.code) === String(lookupId)
    );

    if (payor?.id != null) {
      return Number(payor.id);
    }
  }

  return undefined;
};

export const resolvePlanIdFromCchiInsurance = (
  insurance: Record<string, any>,
  plans: any[]
): number | null => {
  const directPlanId = Number(insurance.planId);
  if (Number.isFinite(directPlanId) && directPlanId > 0) {
    return directPlanId;
  }

  const lookupIds = [insurance.waseelPlanId, insurance.planCode, insurance.networkId].filter(
    Boolean
  );

  for (const lookupId of lookupIds) {
    const plan = plans.find(
      item =>
        String(item?.waseelPlanId) === String(lookupId) ||
        String(item?.networkId) === String(lookupId) ||
        String(item?.code) === String(lookupId)
    );

    if (plan?.id != null) {
      return Number(plan.id);
    }
  }

  return null;
};

export const normalizeCchiPatientInsurance = (
  rawInsurance: Record<string, any>,
  patientId?: number | string | null,
  payorsList: any[] = [],
  plans: any[] = []
): PatientInsurance => {
  const payorId = resolvePayorIdFromCchiInsurance(rawInsurance, payorsList);
  const planId = resolvePlanIdFromCchiInsurance(rawInsurance, plans);

  return {
    ...newPatientInsurance,
    ...rawInsurance,
    id: undefined,
    patientId: patientId != null ? Number(patientId) : undefined,
    payorId: payorId ?? rawInsurance.payorId,
    planId: planId ?? rawInsurance.planId ?? null,
    policyNumber: rawInsurance.policyNumber ?? rawInsurance.memberId ?? '',
    groupNumber: rawInsurance.groupNumber ?? null,
    expirationDate: rawInsurance.expirationDate ?? rawInsurance.expiryDate ?? '',
    isPrimary: rawInsurance.isPrimary ?? true
  } as PatientInsurance;
};
