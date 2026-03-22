
export const toHumanEncounterVaccinationError = (
  err: any,
  fieldLabels: Record<string, string> = {
    patientId: 'Patient',
    encounterId: 'Encounter',
    vaccineId: 'Vaccine',
    vaccineBrandId: 'Used Brand',
    vaccineDoseId: 'Dose Number',
    dateAdministered: 'Date Administered',
    vaccineLotNumber: 'Vaccine Lot Number',
    administeredLocation: 'Administered Location',
    externalFacilityName: 'External Facility Name',
    administrationReactions: 'Administration Reactions',
    notes: 'Notes',
    cancellationReason: 'Cancellation Reason',
    cancelledById: 'Cancelled By',
    reviewedById: 'Reviewed By'
  }
): string => {
  const data = err?.data ?? {};
  const title = data?.title ?? '';
  const detail = data?.detail ?? '';
  const message = data?.message ?? '';
  const type = data?.type ?? '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId ? `\nTrace ID: ${data?.traceId || data?.correlationId}` : '';

  const payloadText = [title, detail, message].filter(Boolean).join(' | ');
  const lower = payloadText.toLowerCase();

  const isValidation =
    data?.message === 'error.validation' ||
    title?.toLowerCase?.().includes?.('argument not valid') ||
    (typeof type === 'string' && type.includes('constraint-violation'));

  const normalize = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be empty')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size must be between')) return 'length is out of range';
    return msg || 'invalid value';
  };

  if (isValidation && Array.isArray(fieldErrors) && fieldErrors.length) {
    const lines = fieldErrors.map((fe: any) => {
      const label = fieldLabels[fe.field] ?? fe.field;
      return `• ${label}: ${normalize(fe.message)}`;
    });
    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  const looksLikeConstraintViolation = lower.includes('constraintviolation') || lower.includes('interpolatedmessage=');
  if (looksLikeConstraintViolation) {
    const matches: Array<{ field: string; msg: string }> = [];
    const regex = /propertyPath\s*=\s*([a-zA-Z0-9_.\[\]]+).*?interpolatedMessage\s*=\s*'([^']+)'/g;

    let m: RegExpExecArray | null;
    while ((m = regex.exec(payloadText)) !== null) {
      matches.push({ field: m[1], msg: m[2] });
    }

    if (matches.length) {
      const lines = matches.map(({ field, msg }) => {
        const base = field.split(/[.\[\]]/).filter(Boolean).pop() || field;
        const label = fieldLabels[base] ?? base;
        return `• ${label}: ${normalize(msg)}`;
      });
      return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
    }
  }

  let errorKey = data?.errorKey || data?.message || data?.properties?.message || '';
  errorKey = typeof errorKey === 'string' ? errorKey.replace(/^error\./, '') : '';

  const keyMap: Record<string, string> = {
    'payload.required': 'Encounter vaccination payload is required.',
    'id.required': 'Encounter vaccination id is required.',
    'patient.required': 'Patient is required.',
    'encounter.required': 'Encounter is required.',

    'patient.notfound': 'Patient not found.',
    notfound: 'Encounter vaccination not found.',

    'patient.vaccine.dose.duplicate': 'This patient already has the same vaccine and dose recorded.',
    'patient.vaccine.dose.duplicate.active':
      'This patient already has the same vaccine and dose recorded (non-cancelled).',

    'patient.invalid': 'Invalid patient id.',
    'vaccine.invalid': 'Invalid vaccine id.',
    'dose.invalid': 'Invalid vaccine dose id.',
    'brand.invalid': 'Invalid vaccine brand id.',
    'cancelledBy.invalid': 'Invalid cancelledById (user not found).',
    'reviewedBy.invalid': 'Invalid reviewedById (user not found).',

    'cancellationReason.required': 'Cancellation reason is required when status is CANCELLED.',
    'cancelledAt.required': 'CancelledAt is required when status is CANCELLED.',
    'cancelledBy.required': 'CancelledById is required when status is CANCELLED.',
    'reviewedAt.required': 'ReviewedAt is required when status is REVIEW.',
    'reviewedBy.required': 'ReviewedById is required when status is REVIEW.',

    'db.constraint': 'Database constraint violated while saving encounter vaccination.'
  };

  if (errorKey && keyMap[errorKey]) return keyMap[errorKey] + traceId;

  if (lower.includes('duplicate')) return 'This patient already has the same vaccine and dose recorded.' + traceId;
  if (lower.includes('cancellation reason')) return 'Cancellation reason is required.' + traceId;

  return (detail || title || message || 'Unexpected error occurred while saving vaccine.') + traceId;
};
