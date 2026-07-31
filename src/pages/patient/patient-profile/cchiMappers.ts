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

const pickFirstDefined = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return undefined;
};

export const normalizePatientInsuranceFromApi = (
  source?: Record<string, any> | Patient | null
): PatientInsurance => {
  if (!source) {
    return { ...newPatientInsurance };
  }

  const patientId =
    source.patientId ??
    source.patient?.id ??
    null;

  return {
    ...newPatientInsurance,
    ...source,
    id: source.id,
    patientId: patientId != null ? Number(patientId) : undefined,
    payorId:
      source.payorId != null && source.payorId !== ''
        ? Number(source.payorId)
        : source.payorId,
    planId:
      source.planId != null && source.planId !== ''
        ? Number(source.planId)
        : source.planId,
    groupName:
      pickFirstDefined(source, ['groupName', 'group_name', 'insuranceGroupName']) ??
      source.groupName ??
      null,
    planCode:
      pickFirstDefined(source, ['planCode', 'plan_code', 'waseelPlanId']) ??
      source.planCode ??
      null,
    eligibilityStatus:
      pickFirstDefined(source, ['eligibilityStatus', 'eligibility_status']) ??
      source.eligibilityStatus ??
      null,
    siteEligibility:
      pickFirstDefined(source, ['siteEligibility', 'site_eligibility']) ??
      source.siteEligibility ??
      null,
    inforce: pickFirstDefined(source, ['inforce', 'inForce']) ?? source.inforce ?? null,
    gpVisitCopay:
      pickFirstDefined(source, ['gpVisitCopay', 'gp_visit_copay']) ??
      source.gpVisitCopay ??
      null,
    specialistVisitsLimit:
      pickFirstDefined(source, ['specialistVisitsLimit', 'specialist_visits_limit']) ??
      source.specialistVisitsLimit ??
      null,
    eligibilityBenefitsJson:
      pickFirstDefined(source, ['eligibilityBenefitsJson', 'eligibility_benefits_json']) ??
      source.eligibilityBenefitsJson ??
      null,
    lastEligibilityRequestId:
      pickFirstDefined(source, ['lastEligibilityRequestId', 'last_eligibility_request_id']) ??
      source.lastEligibilityRequestId ??
      null,
    lastEligibilitySyncedAt:
      pickFirstDefined(source, ['lastEligibilitySyncedAt', 'last_eligibility_synced_at']) ??
      source.lastEligibilitySyncedAt ??
      null,
    networkId:
      pickFirstDefined(source, ['networkId', 'network_id', 'network']) ??
      source.networkId ??
      null,
    policyClassName:
      pickFirstDefined(source, ['policyClassName', 'policy_class_name']) ??
      source.policyClassName ??
      null,
    groupNumber:
      pickFirstDefined(source, ['groupNumber', 'group_number']) ?? source.groupNumber ?? null,
    memberCardId:
      pickFirstDefined(source, ['memberCardId', 'member_card_id']) ?? source.memberCardId ?? null,
    policyNumber:
      pickFirstDefined(source, ['policyNumber', 'policy_number']) ?? source.policyNumber ?? '',
    payerNphiesId:
      pickFirstDefined(source, ['payerNphiesId', 'payer_nphies_id']) ?? source.payerNphiesId ?? null,
    payerName:
      pickFirstDefined(source, ['payerName', 'payer_name']) ?? source.payerName ?? null
  };
};

const extractPatientInsuranceRows = (response: any): Record<string, any>[] => {
  const responseData = response?.data ?? response;

  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.content)) return responseData.content;
  if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
  if (Array.isArray(responseData?.object)) return responseData.object;

  return [];
};

export const extractPatientInsurancesList = (response: any): PatientInsurance[] =>
  extractPatientInsuranceRows(response).map(row => normalizePatientInsuranceFromApi(row));

export const getCchiInsuranceStorageKey = (
  patientId?: number | string | null,
  documentId?: number | string | null
) => {
  if (patientId) return `cchi-insurance-patient-${patientId}`;
  if (documentId) return `cchi-insurance-document-${documentId}`;
  return '';
};

const normalizeInsuranceDate = (value: unknown): string => {
  if (!value) return '';

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }

  return String(value);
};

type ClassListItem = {
  classType?: string;
  className?: string;
  classValue?: string;
  type?: string;
  name?: string;
  value?: string;
};

const resolveClassListItem = (
  classList: ClassListItem[] | undefined,
  classType: string
): ClassListItem | null => {
  if (!Array.isArray(classList)) {
    return null;
  }

  return (
    classList.find(item => {
      const type = (item?.classType ?? item?.type ?? '')
        .toString()
        .trim()
        .toLowerCase();

      return type === classType.toLowerCase();
    }) ?? null
  );
};

const extractClassListFromSource = (
  source: Record<string, any>
): ClassListItem[] => {
  if (Array.isArray(source.classList)) {
    return source.classList;
  }

  if (Array.isArray(source.coverageClassList)) {
    return source.coverageClassList;
  }

  const firstCoverage = Array.isArray(source.coverages)
    ? source.coverages[0]
    : null;

  if (Array.isArray(firstCoverage?.classList)) {
    return firstCoverage.classList;
  }

  if (Array.isArray(firstCoverage?.coverageClassList)) {
    return firstCoverage.coverageClassList;
  }

  return [];
};

export type WaseelClassListRow = {
  classType: string;
  className: string;
  classValue: string;
};

const normalizeClassListRows = (
  items: ClassListItem[]
): WaseelClassListRow[] =>
  items
    .filter(Boolean)
    .map(item => ({
      classType: String(item.classType ?? item.type ?? '-').trim() || '-',
      className: String(item.className ?? item.name ?? '-').trim() || '-',
      classValue: String(item.classValue ?? item.value ?? '-').trim() || '-'
    }));

export const extractWaseelClassList = (
  insurance?: PatientInsurance | Record<string, unknown> | null
): WaseelClassListRow[] => {
  if (!insurance) {
    return [];
  }

  const raw = insurance as Record<string, any>;
  const jsonRaw =
    raw.eligibilityBenefitsJson ?? raw.eligibility_benefits_json ?? null;

  if (jsonRaw) {
    try {
      const parsed =
        typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
      const fromJson = normalizeClassListRows(
        extractClassListFromSource(parsed)
      );

      if (fromJson.length) {
        return fromJson;
      }
    } catch {
      // ignore invalid eligibility JSON
    }
  }

  return normalizeClassListRows(extractClassListFromSource(raw));
};

export const buildWaseelClassListDisplay = (
  insurance?: PatientInsurance | Record<string, unknown> | null
): WaseelClassListRow[] => {
  const fromWaseel = extractWaseelClassList(insurance);

  if (fromWaseel.length) {
    return fromWaseel;
  }

  if (!insurance) {
    return [];
  }

  const row = insurance as PatientInsurance;
  const fallback: WaseelClassListRow[] = [];

  if (row.groupName || row.groupNumber) {
    fallback.push({
      classType: 'group',
      className: String(row.groupName ?? '-'),
      classValue: String(row.groupNumber ?? '-')
    });
  }

  if (row.policyClassName || row.planCode) {
    fallback.push({
      classType: 'plan',
      className: String(row.policyClassName ?? '-'),
      classValue: String(row.planCode ?? '-')
    });
  }

  return fallback;
};

const NESTED_INSURANCE_KEYS = [
  'coverage',
  'policy',
  'plan',
  'benefits',
  'insuranceDetails',
  'coverageDetails',
  'subscriber',
  'policyHolder',
  'member',
  'benefit'
];

const SNAKE_CASE_INSURANCE_FIELD_MAP: Record<string, keyof PatientInsurance | string> = {
  payer_nphies_id: 'payerNphiesId',
  payor_nphies_id: 'payerNphiesId',
  nphies_id: 'payerNphiesId',
  naphies_id: 'payerNphiesId',
  network_id: 'networkId',
  patient_share: 'patientShare',
  max_limit: 'maxLimit',
  member_card_id: 'memberCardId',
  sponsor_number: 'sponsorNumber',
  coverage_type: 'coverageType',
  relation_with_subscriber: 'relationWithSubscriber',
  policy_class_name: 'policyClassName',
  policy_holder_name: 'policyHolderName',
  policy_holder_id: 'policyHolderId',
  issue_date: 'issueDate',
  expiration_date: 'expirationDate',
  expiry_date: 'expirationDate',
  group_number: 'groupNumber',
  policy_number: 'policyNumber',
  remaining_benefits: 'remainingBenefits',
  remaining_deductibles: 'remainingDeductibles',
  waseel_new_plan: 'waseelNewPlan',
  is_primary: 'isPrimary',
  plan_id: 'planId',
  payor_id: 'payorId',
  patient_id: 'patientId'
};

export const flattenCchiInsuranceSource = (raw: Record<string, any>): Record<string, any> => {
  if (!raw || typeof raw !== 'object') return {};

  let flat: Record<string, any> = { ...raw };

  NESTED_INSURANCE_KEYS.forEach(key => {
    const nested = raw[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      flat = { ...flat, ...nested };
    }
  });

  Object.entries(flat).forEach(([key, value]) => {
    const mappedKey = SNAKE_CASE_INSURANCE_FIELD_MAP[key];
    if (!mappedKey) return;

    if (flat[mappedKey] === undefined || flat[mappedKey] === null || flat[mappedKey] === '') {
      flat[mappedKey] = value;
    }
  });

  return flat;
};

export const extractCchiInsurance = (mappedResponse: any): Record<string, any> | null => {
  if (!mappedResponse) return null;

  const candidates = [
    mappedResponse.insurance,
    mappedResponse.patientInsurance,
    ...(Array.isArray(mappedResponse.insurances) ? mappedResponse.insurances : []),
    mappedResponse.patient?.insurance,
    ...(Array.isArray(mappedResponse.patient?.insurances) ? mappedResponse.patient.insurances : [])
  ].filter(item => item && typeof item === 'object');

  if (!candidates.length) return null;

  const merged = candidates.reduce<Record<string, any>>(
    (acc, item) => flattenCchiInsuranceSource({ ...acc, ...flattenCchiInsuranceSource(item) }),
    {}
  );

  return Object.keys(merged).length ? merged : null;
};

export const mapCchiInsuranceFieldAliases = (raw: Record<string, any>): Record<string, any> => {
  if (!raw || typeof raw !== 'object') return {};

  const source = flattenCchiInsuranceSource(raw);
  const classList = extractClassListFromSource(source);
  const groupClass = resolveClassListItem(classList, 'group');
  const planClass = resolveClassListItem(classList, 'plan');
  const firstCoverage = Array.isArray(source.coverages) ? source.coverages[0] : null;

  const expirationRaw = pickFirstDefined(source, [
    'expirationDate',
    'expiryDate',
    'policyExpiryDate',
    'policyEndDate',
    'endDate',
    'coverageEndDate',
    'benefitEndDate'
  ]) ?? firstCoverage?.benefitEndDate;

  const issueRaw = pickFirstDefined(source, [
    'issueDate',
    'policyStartDate',
    'startDate',
    'effectiveDate',
    'coverageStartDate',
    'benefitStartDate'
  ]) ?? firstCoverage?.benefitStartDate;

  const waseelNewPlanRaw = pickFirstDefined(source, ['waseelNewPlan', 'newPlan', 'isNewPlan']);

  return {
    ...source,
    policyNumber:
      pickFirstDefined(source, [
        'policyNumber',
        'membershipNumber',
        'policyNo',
        'membershipId',
        'insurancePolicyNumber'
      ]) ??
      planClass?.classValue ??
      planClass?.value ??
      firstCoverage?.policyNumber ??
      pickFirstDefined(source, ['memberId']) ??
      '',
    groupNumber:
      pickFirstDefined(source, ['groupNumber', 'groupNo', 'groupId']) ??
      groupClass?.classValue ??
      groupClass?.value ??
      firstCoverage?.policyHolder ??
      null,
    expirationDate: normalizeInsuranceDate(expirationRaw),
    issueDate: normalizeInsuranceDate(issueRaw) || null,
    remainingBenefits:
      pickFirstDefined(source, [
        'remainingBenefits',
        'benefitBalance',
        'benefitsRemaining',
        'remainingBenefit'
      ]) ?? null,
    remainingDeductibles:
      pickFirstDefined(source, [
        'remainingDeductibles',
        'deductibleRemaining',
        'remainingDeductible'
      ]) ?? null,
    memberCardId:
      pickFirstDefined(source, ['memberCardId', 'cardId', 'memberCard', 'cardNumber']) ??
      firstCoverage?.memberId ??
      null,
    payerNphiesId:
      pickFirstDefined(source, [
        'payerNphiesId',
        'payorNphiesId',
        'nphiesId',
        'naphiesId',
        'nphiesPayerId',
        'payerNphies',
        'waseelPayerId',
        'payorCode',
        'insuranceCompanyNphiesId',
        'companyNphiesId',
        'payerId'
      ]) ?? null,
    networkId:
      pickFirstDefined(source, [
        'networkId',
        'waseelNetworkId',
        'planNetworkId',
        'networkCode',
        'network'
      ]) ??
      firstCoverage?.network ??
      null,
    sponsorNumber: pickFirstDefined(source, ['sponsorNumber', 'sponsorNo', 'sponsorId']) ?? null,
    coverageType:
      pickFirstDefined(source, ['coverageType', 'planCoverageType', 'benefitCoverageType']) ??
      firstCoverage?.type ??
      null,
    relationWithSubscriber:
      pickFirstDefined(source, [
        'relationWithSubscriber',
        'subscriberRelation',
        'relation',
        'relationship'
      ]) ??
      firstCoverage?.relationship ??
      null,
    policyClassName:
      pickFirstDefined(source, ['policyClassName', 'className', 'policyClass', 'benefitClass']) ??
      planClass?.className ??
      planClass?.name ??
      null,
    groupName:
      pickFirstDefined(source, ['groupName', 'insuranceGroupName']) ??
      groupClass?.className ??
      groupClass?.name ??
      null,
    planCode:
      pickFirstDefined(source, ['planCode', 'waseelPlanId', 'planCodeValue']) ??
      planClass?.classValue ??
      planClass?.value ??
      null,
    policyHolderName:
      pickFirstDefined(source, [
        'policyHolderName',
        'holderName',
        'subscriberName',
        'policyHolder'
      ]) ??
      groupClass?.className ??
      groupClass?.name ??
      firstCoverage?.policyHolder ??
      null,
    patientShare:
      pickFirstDefined(source, [
        'patientShare',
        'patientShareAmount',
        'shareAmount',
        'coPaymentValue',
        'coPayment',
        'copay',
        'copayment'
      ]) ?? null,
    maxLimit:
      pickFirstDefined(source, [
        'maxLimit',
        'maximumLimit',
        'benefitLimit',
        'maxBenefit',
        'maxBenefitAmount',
        'annualLimit',
        'coverageLimit'
      ]) ?? null,
    waseelNewPlan:
      waseelNewPlanRaw === true ||
      waseelNewPlanRaw === 'true' ||
      waseelNewPlanRaw === 1 ||
      waseelNewPlanRaw === '1'
        ? true
        : waseelNewPlanRaw === false ||
            waseelNewPlanRaw === 'false' ||
            waseelNewPlanRaw === 0 ||
            waseelNewPlanRaw === '0'
          ? false
          : null,
    policyHolderId: pickFirstDefined(source, ['policyHolderId']) ?? null,
    isPrimary: source.isPrimary ?? source.primaryInsurance ?? source.primary ?? true,
    waseelPlanId: pickFirstDefined(source, ['waseelPlanId', 'planCode'])
  };
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
    insurance.naphiesId,
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

  const payorName = pickFirstDefined(insurance, [
    'payorName',
    'payerName',
    'insuranceCompanyName',
    'insuranceProviderName'
  ]);

  if (payorName) {
    const payor = payorsList.find(
      item => String(item?.name).toLowerCase() === String(payorName).toLowerCase()
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

  const lookupIds = [
    insurance.waseelPlanId,
    insurance.planCode,
    insurance.networkId
  ].filter(Boolean);

  for (const lookupId of lookupIds) {
    const plan = plans.find(
      item =>
        String(item?.waseelPlanId) === String(lookupId) ||
        String(item?.networkId) === String(lookupId) ||
        String(item?.code) === String(lookupId) ||
        String(item?.payerNphiesId) === String(lookupId)
    );

    if (plan?.id != null) {
      return Number(plan.id);
    }
  }

  const planName = pickFirstDefined(insurance, ['planName', 'planType', 'planTypeName', 'networkName']);

  if (planName && plans.length) {
    const plan = plans.find(
      item => String(item?.name).toLowerCase() === String(planName).toLowerCase()
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
  const mapped = mapCchiInsuranceFieldAliases(rawInsurance);
  const payorId = resolvePayorIdFromCchiInsurance(mapped, payorsList);
  const planId = resolvePlanIdFromCchiInsurance(mapped, plans);
  const directPayorId = Number(mapped.payorId);
  const directPlanId = Number(mapped.planId);
  const resolvedPayorId =
    payorId ?? (Number.isFinite(directPayorId) && directPayorId > 0 ? directPayorId : mapped.payorId);
  const resolvedPlanId =
    planId ?? (Number.isFinite(directPlanId) && directPlanId > 0 ? directPlanId : null);

  const matchedPayor = payorsList.find(item => Number(item?.id) === Number(resolvedPayorId));
  const matchedPlan = plans.find(item => Number(item?.id) === Number(resolvedPlanId));

  const payerNphiesId =
    mapped.payerNphiesId ??
    matchedPayor?.nphiesId ??
    matchedPayor?.waseelPayerId ??
    null;

  const networkId =
    mapped.networkId ?? matchedPlan?.networkId ?? matchedPlan?.waseelPlanId ?? null;

  return {
    ...newPatientInsurance,
    ...mapped,
    id: undefined,
    patientId: patientId != null ? Number(patientId) : undefined,
    payorId: resolvedPayorId,
    planId: resolvedPlanId,
    policyHolderId: mapped.policyHolderId ?? null,
    policyNumber: mapped.policyNumber ?? '',
    groupNumber: mapped.groupNumber ?? null,
    expirationDate: mapped.expirationDate ?? '',
    remainingBenefits: mapped.remainingBenefits ?? null,
    remainingDeductibles: mapped.remainingDeductibles ?? null,
    memberCardId: mapped.memberCardId ?? null,
    payerNphiesId,
    networkId,
    sponsorNumber: mapped.sponsorNumber ?? null,
    coverageType: mapped.coverageType ?? null,
    relationWithSubscriber: mapped.relationWithSubscriber ?? null,
    policyClassName: mapped.policyClassName ?? null,
    policyHolderName: mapped.policyHolderName ?? null,
    issueDate: mapped.issueDate ?? null,
    patientShare: mapped.patientShare ?? null,
    maxLimit: mapped.maxLimit ?? null,
    waseelNewPlan: mapped.waseelNewPlan ?? null,
    isPrimary: mapped.isPrimary ?? true
  } as PatientInsurance;
};

const PATIENT_INSURANCE_SAVE_KEYS = Object.keys(newPatientInsurance).filter(
  key => !['id', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'].includes(key)
) as (keyof PatientInsurance)[];

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toSaveString = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

export const buildPatientInsuranceSavePayload = (
  rawInsurance: Record<string, any>,
  patientId: number,
  payorsList: any[] = [],
  plans: any[] = []
): Record<string, any> => {
  const normalized = normalizeCchiPatientInsurance(rawInsurance, patientId, payorsList, plans);

  const payload: Record<string, any> = {
    patientId,
    payorId: toNullableNumber(normalized.payorId),
    planId: normalized.planId != null ? Number(normalized.planId) : null,
    policyHolderId: toNullableNumber(normalized.policyHolderId),
    policyNumber: String(normalized.policyNumber ?? ''),
    groupNumber: toSaveString(normalized.groupNumber),
    expirationDate: normalized.expirationDate ?? '',
    remainingBenefits: normalized.remainingBenefits ?? null,
    remainingDeductibles: normalized.remainingDeductibles ?? null,
    memberCardId: toSaveString(normalized.memberCardId),
    payerNphiesId: toSaveString(normalized.payerNphiesId),
    networkId: toSaveString(normalized.networkId),
    sponsorNumber: toSaveString(normalized.sponsorNumber),
    coverageType: toSaveString(normalized.coverageType),
    relationWithSubscriber: toSaveString(normalized.relationWithSubscriber),
    policyClassName: toSaveString(normalized.policyClassName),
    policyHolderName: toSaveString(normalized.policyHolderName),
    issueDate: normalized.issueDate ? normalizeInsuranceDate(normalized.issueDate) : null,
    patientShare: normalized.patientShare ?? null,
    maxLimit: normalized.maxLimit ?? null,
    waseelNewPlan: normalized.waseelNewPlan ?? null,
    isPrimary: normalized.isPrimary ?? false
  };

  PATIENT_INSURANCE_SAVE_KEYS.forEach(key => {
    if (!(key in payload)) {
      const value = (normalized as Record<string, any>)[key];
      if (value !== undefined && value !== null && value !== '') {
        payload[key] = value;
      }
    }
  });

  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  if (payload.payorId != null && (!Number.isFinite(Number(payload.payorId)) || Number(payload.payorId) <= 0)) {
    delete payload.payorId;
  }

  return payload;
};
