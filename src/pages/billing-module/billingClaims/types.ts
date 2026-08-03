export type Filters = {
  status: string | null;
  claimReference: string | null;
  provClaimNo: string | null;
  uploadName: string | null;
  preAuthRefNo: string | null;
  encounterId: string | null;
  patientId: string | null;
};

export const initialFilters: Filters = {
  status: null,
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

export const filterOptions: FilterOption[] = [
  { label: 'Status', value: 'status', type: 'select', data: CLAIM_STATUS_OPTIONS },
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
