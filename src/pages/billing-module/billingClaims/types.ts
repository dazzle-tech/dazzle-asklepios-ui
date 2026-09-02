export type Filters = {
  status: string | null;
  claimType: string | null;
  claimSubType: string | null;
  claimReference: string | null;
  provClaimNo: string | null;
  uploadName: string | null;
  preAuthRefNo: string | null;
  encounterId: string | null;
  patientId: string | null;
};

export const initialFilters: Filters = {
  status: null,
  claimType: null,
  claimSubType: null,
  claimReference: null,
  provClaimNo: null,
  uploadName: null,
  preAuthRefNo: null,
  encounterId: null,
  patientId: null
};

export type FilterOption = {
  label: string;
  value: keyof Filters;
  type: 'text' | 'select';
  data?: { label: string; value: string }[];
};

export const CLAIM_STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitting', value: 'SUBMITTING' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Failed', value: 'FAILED' }
];

export const WASEEL_CLAIM_TYPE_OPTIONS = [
  { label: 'Professional', value: 'PROFESSIONAL' },
  { label: 'Dental', value: 'DENTAL' },
  { label: 'Pharmacy', value: 'PHARMACY' }
];

export const WASEEL_CLAIM_SUB_TYPE_OPTIONS = [
  { label: 'Outpatient', value: 'OUTPATIENT' },
  { label: 'Emergency', value: 'EMERGENCY' }
];

export const isProfessionalClaimType = (claimType?: string | null) =>
  String(claimType ?? '').toUpperCase() === 'PROFESSIONAL';

export const subTypeOptionsForClaimType = (claimType?: string | null) =>
  isProfessionalClaimType(claimType)
    ? WASEEL_CLAIM_SUB_TYPE_OPTIONS
    : WASEEL_CLAIM_SUB_TYPE_OPTIONS.filter(option => option.value === 'OUTPATIENT');

export const filterOptions: FilterOption[] = [
  { label: 'Status', value: 'status', type: 'select', data: CLAIM_STATUS_OPTIONS },
  { label: 'Type', value: 'claimType', type: 'select', data: WASEEL_CLAIM_TYPE_OPTIONS },
  { label: 'Sub Type', value: 'claimSubType', type: 'select', data: WASEEL_CLAIM_SUB_TYPE_OPTIONS },
  { label: 'Claim Reference', value: 'claimReference', type: 'text' },
  { label: 'Provider Claim No', value: 'provClaimNo', type: 'text' },
  { label: 'Upload Name', value: 'uploadName', type: 'text' },
  { label: 'Pre-Auth Ref No', value: 'preAuthRefNo', type: 'text' },
  { label: 'Encounter ID', value: 'encounterId', type: 'text' },
  { label: 'Patient ID', value: 'patientId', type: 'text' }
];

export type ClaimRowHandlers = {
  onPreview: (row: import('@/types/model-types-new').ClaimTrackingResponse) => void;
  onResubmit: (row: import('@/types/model-types-new').ClaimTrackingResponse) => void;
  onRefreshUpload: (row: import('@/types/model-types-new').ClaimTrackingResponse) => void;
};
