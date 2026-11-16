export const PROCEDURE_STATUSES = [
  'REQUESTED',
  'WAITING_PRE_AUTHORIZATION',
  'AWAITING_CONSENT',
  'STARTED',
  'COMPLETED',
  'CANCELLED'
];

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#E6A100',
  WAITING_PRE_AUTHORIZATION: '#8E6CD9',
  AWAITING_CONSENT: '#17A2B8',
  STARTED: '#0B5ED7',
  IN_PROGRESS: '#0B5ED7',
  CONFIRMED: '#0DAA41',
  COMPLETED: '#0DAA41',
  CANCELLED: '#D64545',
  READY: '#17A2B8'
};

// Mirrors ALLOWED_TRANSITIONS in PatientProcedureWorkflowService
const NEXT_STATUSES: Record<string, string[]> = {
  REQUESTED: ['AWAITING_CONSENT', 'STARTED'],
  AWAITING_CONSENT: ['STARTED'],
  STARTED: ['COMPLETED']
};

export const getStatusColor = (status?: string | null): string =>
  STATUS_COLORS[String(status ?? '').toUpperCase()] ?? '#6c757d';

export const canMoveToStatus = (status: string | undefined, target: string): boolean =>
  (NEXT_STATUSES[status ?? ''] ?? []).includes(target);

export const isClosedStatus = (status?: string | null): boolean =>
  status === 'COMPLETED' || status === 'CANCELLED';

const REGISTRATION_REQUIRED_FIELDS = [
  'consentForm',
  'registrationDateTime',
  'performingDepartmentId',
  'performingPractitionerId'
];

export const isRegistrationComplete = (record: any): boolean =>
  REGISTRATION_REQUIRED_FIELDS.every(field => Boolean(record?.[field]));

/**
 * Ordered for the visit's own department (no other target department), so it is
 * performed from the patient visit rather than from the procedure module.
 */
export const isCurrentDepartment = (record: any): boolean =>
  !record?.toDepartmentId || record.toDepartmentId === record.fromDepartmentId;

/**
 * Performing procedures is not rolled out yet: the procedure module is closed by
 * permissions and the visit's Procedure tab hides its Perform column. Set to true
 * to bring Perform back (current department from the visit, the rest from the module).
 */
export const PROCEDURE_MODULE_IN_USE = true;

/** Whether the visit's Procedure tab may open Perform for this procedure. */
export const canPerformFromVisit = (record: any): boolean =>
  PROCEDURE_MODULE_IN_USE && isCurrentDepartment(record);

const pad = (value: number) => String(value).padStart(2, '0');

/** A stored instant as the HH:mm:ss value the time input works with. */
export const toTimeValue = (instant?: string | null): string | null => {
  if (!instant) return null;
  const date = new Date(instant);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Minutes between two HH:mm:ss values; an end before the start ran past midnight. */
export const minutesBetween = (start?: string | null, end?: string | null): number | null => {
  if (!start || !end) return null;
  const minutesInDay = 24 * 60;
  return (toMinutes(end) - toMinutes(start) + minutesInDay) % minutesInDay;
};

/** An HH:mm:ss value on the given day; moved to the next day when it falls before `after`. */
export const combineDateAndTime = (
  day: string | Date,
  time?: string | null,
  after?: string | null
): string | null => {
  if (!time) return null;
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const date = new Date(day);
  date.setHours(hours, minutes, seconds ?? 0, 0);
  if (after && date < new Date(after)) date.setDate(date.getDate() + 1);
  return date.toISOString();
};
