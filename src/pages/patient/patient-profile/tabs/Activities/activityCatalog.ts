const DONE_ACTIVITY_TYPES = new Set([
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_CANCELLED',
  'PHONE_CALL',
  'SMS_OR_MESSAGING',
  'EMAIL',
  'PATIENT_COMPLAINT',
  'PATIENT_INQUIRY',
  'PATIENT_EDUCATION',
  'APPOINTMENT_REMINDER_SENT',
  'UNABLE_TO_REACH_PATIENT',
  'DOCUMENT_RECEIVED'
]);

export const defaultActivityStatus = (activityType: string) =>
  DONE_ACTIVITY_TYPES.has(activityType) ? 'DONE' : 'OPEN';

export const defaultActivityPriority = (activityType: string) =>
  activityType === 'CRITICAL_RESULT_ESCALATION' ? 'HIGH' : 'NORMAL';

export const emptyPatientActivityForm = () => ({
  category: '',
  activityType: '',
  status: 'OPEN',
  priority: 'NORMAL',
  note: '',
  dueAt: '',
  encounterId: null as number | null,
  appointmentId: null as number | null
});
