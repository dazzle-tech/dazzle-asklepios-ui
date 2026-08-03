import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

export type Filters = {
  preAuthId: string;
  approvalNumber: string;
  encounterId: string;
  patientId: string;
  patientInsuranceId: string;
  status: string | null;
  outcome: string | null;
  requestDateFrom: string | null;
  requestDateTo: string | null;
};

export const initialFilters: Filters = {
  preAuthId: '',
  approvalNumber: '',
  encounterId: '',
  patientId: '',
  patientInsuranceId: '',
  status: null,
  outcome: null,
  requestDateFrom: null,
  requestDateTo: null
};

export const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitting', value: 'SUBMITTING' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

export const outcomeOptions = [
  { label: 'Complete', value: 'Complete' },
  { label: 'Error', value: 'Error' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' }
];

export type FilterOption = {
  label: string;
  value: keyof Filters | string;
  type: 'text' | 'select' | 'date';
  data?: { label: string; value: string }[];
};

export const filterOptions: FilterOption[] = [
  { label: 'Approval Number', value: 'approvalNumber', type: 'text' },
  { label: 'Status', value: 'status', type: 'select', data: statusOptions },
  { label: 'Outcome', value: 'outcome', type: 'select', data: outcomeOptions },
  { label: 'Request Date From', value: 'requestDateFrom', type: 'date' },
  { label: 'Request Date To', value: 'requestDateTo', type: 'date' }
];

export type PreAuthorizationRowHandlers = {
  onView: (row: PreAuthorizationTrackingResponse) => void;
  onRefreshFromWaseel: (row: PreAuthorizationTrackingResponse) => void;
  onCommunication: (row: PreAuthorizationTrackingResponse) => void;
  onViewCommunications: (row: PreAuthorizationTrackingResponse) => void;
  onCancel: (row: PreAuthorizationTrackingResponse) => void;
};
