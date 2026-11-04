export type ComplaintStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ActionStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';
export type SummaryFilter = 'NEW' | 'UNASSIGNED' | 'ASSIGNED_TO_ME' | 'OVERDUE' | 'RESOLVED' | null;

export type ComplaintIdentityMode = 'anonymous' | 'identified';

/** Primary feedback type — matches backend PatientComplaintFeedbackType. */
export type PatientComplaintFeedbackType = 'COMPLIMENT' | 'SUGGESTION' | 'CONCERN_OR_COMPLAINT';

/** Optional category — matches backend PatientComplaintType. */
export type PatientComplaintType =
  | 'MEDICAL_CARE'
  | 'STAFF_BEHAVIOR'
  | 'FACILITY_CLEANLINESS'
  | 'BILLING_FINANCE'
  | 'WAITING_TIME'
  | 'OTHER';

export type PatientComplaintPreferredContactMethod = 'PHONE' | 'EMAIL' | 'SMS';

export type ComplaintAction = {
  id: number;
  description: string;
  assignedUserId: number;
  assignedUserName: string;
  deadline: string;
  status: ActionStatus;
  result?: string | null;
  completedByUserId?: number | null;
  completedBy?: string | null;
  completedAt?: string | null;
};

export type PatientComplaintAttachment = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdDate?: string | null;
};

export type PatientComplaintListItem = {
  id: number;
  reference: string;
  anonymous: boolean;
  patientName: string;
  subject: string;
  feedbackType?: PatientComplaintFeedbackType | null;
  complaintType?: PatientComplaintType | null;
  incidentDate?: string | null;
  facilityId: number;
  facilityName: string;
  departmentId?: number | null;
  departmentName?: string | null;
  assignedUserId?: number | null;
  assignedUserName?: string | null;
  status: ComplaintStatus;
  targetDeadline?: string | null;
  receivedDate: string;
  overdue: boolean;
};

export type PatientComplaintDetail = PatientComplaintListItem & {
  patientIdentifier?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  preferredContactMethod?: PatientComplaintPreferredContactMethod | null;
  onBehalf?: boolean | null;
  relationshipToPatient?: string | null;
  consentToContact?: boolean;
  incidentTime?: string | null;
  description: string;
  involvedStaffNames?: string | null;
  desiredResolution?: string | null;
  resolutionSummary?: string | null;
  reopenReason?: string | null;
  actions: ComplaintAction[];
  attachments?: PatientComplaintAttachment[];
};

export type PatientComplaintSummary = {
  newCount: number;
  unassignedCount: number;
  assignedToMeCount: number;
  overdueCount: number;
  resolvedCount: number;
};

/** Setup EnumRegistry / useEnumOptions names (simple class names). */
export const PATIENT_COMPLAINT_STATUS_ENUM = 'PatientComplaintStatus';
export const PATIENT_COMPLAINT_FEEDBACK_TYPE_ENUM = 'PatientComplaintFeedbackType';
export const PATIENT_COMPLAINT_TYPE_ENUM = 'PatientComplaintType';
export const PATIENT_COMPLAINT_PREFERRED_CONTACT_METHOD_ENUM =
  'PatientComplaintPreferredContactMethod';

/** Label overrides where default enum title-casing differs from product copy. */
export const PATIENT_COMPLAINT_FEEDBACK_TYPE_LABEL_OVERRIDES: Record<string, string> = {
  CONCERN_OR_COMPLAINT: 'Concern or Complaint'
};

export const PATIENT_COMPLAINT_TYPE_LABEL_OVERRIDES: Record<string, string> = {
  BILLING_FINANCE: 'Billing / Finance'
};

/** UI-only Yes/No for on-behalf toggle (not a backend enum). */
export const ON_BEHALF_OPTIONS = [
  { label: 'No', value: 'false' },
  { label: 'Yes', value: 'true' }
];

/** Aligns with jakarta.validation @Email / common form checks. */
export const isValidComplaintEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * PhoneNumberInput / QuickPatient rule: require more than country-code digits.
 * Values are stored in international format (e.g. +9665…).
 */
export const isValidComplaintPhone = (phone: string) => {
  const value = String(phone ?? '').trim();
  if (!value) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length > 3;
};

export const getStatusColor = (status?: ComplaintStatus | ActionStatus | string | null) => {
  switch (status) {
    case 'NEW':
      return 'var(--primary-blue)';
    case 'IN_PROGRESS':
      return 'var(--primary-orange, #f59e0b)';
    case 'RESOLVED':
      return 'var(--primary-green, #45b887)';
    case 'CLOSED':
      return 'var(--primary-gray, #969fb0)';
    case 'TO_DO':
      return 'var(--primary-blue)';
    case 'DONE':
      return 'var(--primary-green, #45b887)';
    default:
      return 'var(--primary-gray, #969fb0)';
  }
};

/** Prefer backend `overdue` (deadline before Instant.now(), not RESOLVED/CLOSED). */
export const isComplaintOverdue = (
  complaint?: Pick<PatientComplaintListItem, 'overdue' | 'targetDeadline' | 'status'> | null
) => {
  if (!complaint) return false;
  if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') return false;
  if (typeof complaint.overdue === 'boolean') return complaint.overdue;
  if (!complaint.targetDeadline) return false;
  const deadline = new Date(complaint.targetDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < Date.now();
};

export const hasIncompleteActions = (complaint: Pick<PatientComplaintDetail, 'actions'>) =>
  (complaint.actions ?? []).some(action => action.status !== 'DONE');

export const formatDisplayDate = (value?: string | null) => {
  if (!value) return '-';
  // Prefer calendar date strings (yyyy-MM-dd) without timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatDisplayTime = (value?: string | null) => {
  if (!value) return '-';
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  return String(value);
};

export const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Prefer leading calendar portion of ISO strings to avoid TZ day shifts.
  const leadingDate = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (leadingDate) return leadingDate[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Convert a date-input (yyyy-MM-dd) to an Instant ISO string for Instant filter params. */
export const dateInputToInstant = (value: string, endOfDay = false) => {
  if (!value) return '';
  const suffix = endOfDay ? 'T23:59:59.999' : 'T12:00:00.000';
  return new Date(`${value}${suffix}`).toISOString();
};

/** Today as yyyy-MM-dd in local calendar (for max date on incident picker). */
export const todayLocalDateInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const resolveEnumLabel = (
  options: { value: string; label: string }[],
  value?: string | null,
  empty = '-'
) => {
  if (value == null || value === '') return empty;
  return options.find(option => option.value === value)?.label || value;
};

export const formatStaffUserLabel = (user: {
  firstName?: string | null;
  lastName?: string | null;
  login?: string | null;
}) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.login || '';
};
