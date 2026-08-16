import { NphiesPayer, PatientInsurance } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
export type InsuranceStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';

export const formatInsuranceCell = (
  value: string | number | null | undefined
): string => {
  if (value == null || value === '') {
    return '-';
  }

  return String(value);
};

export const formatInsuranceDate = (
  value: string | Date | null | undefined
): string => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const normalizeInsuranceMatchValue = (
  value: string | number | null | undefined
): string => String(value ?? '').trim().toLowerCase();

export const isDuplicateInsurance = (
  draft: PatientInsurance | Record<string, unknown>,
  saved: PatientInsurance | Record<string, unknown>
): boolean => {
  const draftPolicy = normalizeInsuranceMatchValue(draft.policyNumber as string);
  const savedPolicy = normalizeInsuranceMatchValue(saved.policyNumber as string);
  const draftMember = normalizeInsuranceMatchValue(draft.memberCardId as string);
  const savedMember = normalizeInsuranceMatchValue(saved.memberCardId as string);
  const draftPayer = normalizeInsuranceMatchValue(
    (draft.payerNphiesId ?? draft.payerName) as string
  );
  const savedPayer = normalizeInsuranceMatchValue(
    (saved.payerNphiesId ?? saved.payerName) as string
  );

  if (draftPolicy && savedPolicy && draftPolicy === savedPolicy) {
    return true;
  }

  if (draftMember && savedMember && draftMember === savedMember) {
    return true;
  }

  if (
    draftPayer &&
    savedPayer &&
    draftPayer === savedPayer &&
    draftPolicy &&
    savedPolicy &&
    draftPolicy === savedPolicy
  ) {
    return true;
  }

  const draftExpiry = normalizeInsuranceMatchValue(draft.expirationDate as string);
  const savedExpiry = normalizeInsuranceMatchValue(saved.expirationDate as string);

  return Boolean(
    draftPayer &&
      savedPayer &&
      draftPayer === savedPayer &&
      draftExpiry &&
      savedExpiry &&
      draftExpiry === savedExpiry
  );
};

export const formatInsuranceMoney = (
  value: string | number | null | undefined
): string => {
  if (value == null || value === '') {
    return '-';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  if (amount === 0) {
    return '-';
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getInsuranceStatus = (
  expirationDate: string | Date | null | undefined
): { status: InsuranceStatus; label: string; color: string } => {
  if (!expirationDate) {
    return {
      status: 'UNKNOWN',
      label: 'Unknown',
      color: '#969fb0'
    };
  }

  const expiry = new Date(expirationDate);

  if (Number.isNaN(expiry.getTime())) {
    return {
      status: 'UNKNOWN',
      label: 'Unknown',
      color: '#969fb0'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return {
      status: 'EXPIRED',
      label: 'Expired',
      color: '#e11d48'
    };
  }

  const soonThreshold = new Date(today);
  soonThreshold.setDate(soonThreshold.getDate() + 30);

  if (expiry <= soonThreshold) {
    return {
      status: 'EXPIRING_SOON',
      label: 'Expiring Soon',
      color: '#f59e0b'
    };
  }

  return {
    status: 'ACTIVE',
    label: 'Active',
    color: '#45b887'
  };
};

export const resolveNphiesPayerNameById = (
  nphiesId: string | number | null | undefined,
  nphiesPayersList: NphiesPayer[] = [],
  preferArabic = false
): string | null => {
  if (nphiesId == null || String(nphiesId).trim() === '') {
    return null;
  }

  const normalizedId = String(nphiesId).trim();
  const match = nphiesPayersList.find(
    item => String(item?.nphiesId ?? '').trim() === normalizedId
  );

  if (!match) {
    return null;
  }

  const name = preferArabic
    ? match.nameAr || match.nameEn
    : match.nameEn || match.nameAr;

  return name?.trim() || null;
};

export const getInsuranceProviderName = (
  row: PatientInsurance | Record<string, unknown>,
  payorsList: any[] = [],
  nphiesPayersList: NphiesPayer[] = []
): string => {
  return resolveInsurancePayorDisplayName(row, payorsList, nphiesPayersList);
};

export const resolveInsurancePayorDisplayName = (
  insurance: PatientInsurance | Record<string, unknown>,
  payorsList: any[] = [],
  nphiesPayersList: NphiesPayer[] = []
): string => {
  const row = insurance as Record<string, any>;

  if (formatInsuranceCell(row.payerName as string) !== '-') {
    return String(row.payerName).trim();
  }

  const nphiesLookupIds = [
    row.payerNphiesId,
    row.payorNphiesId,
    row.nphiesId,
    row.waseelPayerId
  ].filter(value => value != null && String(value).trim() !== '');

  for (const lookupId of nphiesLookupIds) {
    const nphiesPayerName = resolveNphiesPayerNameById(lookupId, nphiesPayersList);
    if (nphiesPayerName) {
      return nphiesPayerName;
    }
  }

  for (const lookupId of nphiesLookupIds) {    const payorByNphies = payorsList.find(
      item =>
        String(item?.nphiesId) === String(lookupId) ||
        String(item?.waseelPayerId) === String(lookupId) ||
        String(item?.code) === String(lookupId)
    );

    if (payorByNphies?.name) {
      return String(payorByNphies.name).trim();
    }
  }

  const payorId = Number(row.payorId);
  if (Number.isFinite(payorId) && payorId > 0) {
    const payorById = payorsList.find(item => Number(item?.id) === payorId);
    if (payorById?.name) {
      return String(payorById.name).trim();
    }
  }

  if (formatInsuranceCell(row.payerNphiesId as string) !== '-') {
    return String(row.payerNphiesId).trim();
  }

  if (Number.isFinite(payorId) && payorId > 0) {
    return `Payor #${payorId}`;
  }

  return '-';
};

export const formatInsurancePickerLabel = (
  insurance: PatientInsurance | Record<string, unknown>,
  payorsList: any[] = [],
  nphiesPayersList: NphiesPayer[] = []
): string => {
  const row = insurance as Record<string, any>;
  const payorName = resolveInsurancePayorDisplayName(row, payorsList, nphiesPayersList);  const policyNumber = row.policyNumber ? String(row.policyNumber) : '-';
  const memberId = row.memberCardId ? String(row.memberCardId) : '';
  const primarySuffix = row.isPrimary ? ' (Primary)' : '';

  if (memberId) {
    return `${payorName} · ${policyNumber} · ${memberId}${primarySuffix}`;
  }

  return `${payorName} · ${policyNumber}${primarySuffix}`;
};

export const formatCoverageType = (
  value: string | null | undefined
): string => {
  if (!value) {
    return '-';
  }

  return formatEnumString(value);
};
