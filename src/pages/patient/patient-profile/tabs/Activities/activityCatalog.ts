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
