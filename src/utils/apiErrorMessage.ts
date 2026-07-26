const DEFAULT_ERROR = 'Unexpected error';

export const extractApiErrorMessage = (
  error: any,
  keyMap: Record<string, string> = {}
): string => {
  const data = error?.data;

  if (data == null) {
    return error?.message || DEFAULT_ERROR;
  }

  if (typeof data === 'string') {
    return data;
  }

  const messageProp: string = data.message || '';
  const errorKey =
    (messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    data.errorKey;

  if (errorKey && keyMap[errorKey]) {
    return keyMap[errorKey];
  }

  if (data.title && data.title !== 'Bad Request') {
    return data.title;
  }

  if (String(data.title ?? '').toLowerCase().includes('failed to read request')) {
    return (
      'The request payload was invalid. Refresh the page and try again. ' +
      'If the problem continues, contact support.'
    );
  }

  if (data.detail) {
    return data.detail;
  }

  if (messageProp && !messageProp.startsWith('error.')) {
    return messageProp;
  }

  return DEFAULT_ERROR;
};

export const INVOICE_GENERATION_ERROR_MAP: Record<string, string> = {
  'encounter.notFinanciallyClosed':
    'Visit must be financially closed before invoicing. Click "Financial Close" or complete checkout on the Billing tab.',
  'encounter.noChargeLines':
    'No billable charges found. Prepare services and complete checkout on the Billing tab first.',
  'encounter.alreadyInvoiced': 'This visit is already invoiced.',
  'encounter.alreadyFinanciallyClosed': 'Visit is already financially closed.',
  'encounter.noBillableServices': 'Visit has no billable services.',
  'encounter.pendingServices':
    'Some services are still pending. Resolve them before financial closure.',
  'encounter.eligibility.required':
    'Insurance eligibility is required. Run Waseel eligibility, then freeze the snapshot.',
  'eligibility.notfound':
    'No successful Waseel eligibility response found for this patient/visit.',
  'eligibility.response.missing': 'Waseel eligibility response data is missing.',
  'eligibility.snapshot.serialize.failed': 'Unable to store eligibility snapshot.',
  'encounter.finalInvoice.exists': 'A final invoice already exists for this visit.',
  'invoice.subtype.exists': 'An invoice of this type already exists for this visit.',
  'invoice.items.empty': 'No invoice line items could be generated.',
  'invoice.noAmounts': 'No invoice amounts were found for this visit.',
  'invoice.patient.exists': 'Patient invoice already exists for this visit.',
  'numbering.configuration.inactive':
    'Financial document numbering is inactive. Activate invoice numbering in setup before generating invoices.',
  'numbering.configuration.notfound':
    'Invoice numbering is not configured for this facility. Set it up in Financial Document Numbering.',
  'numbering.sequence.lock.failed':
    'Unable to reserve the next invoice number. Another user may be generating a document — please try again.',
  'numbering.sequence.exhausted': 'Invoice sequence limit reached for the current period.',
  'numbering.facility.required': 'Facility is required to allocate a document number.',
  'numbering.request.duplicate':
    'This invoice request was already processed. Refresh the issued invoices list.'
};

export const ADJUSTMENT_ERROR_MAP: Record<string, string> = {
  'invoice.notFound': 'Invoice not found.',
  'adjustment.parentNotInvoice': 'Adjustments can only be applied to invoices.',
  'adjustment.invoiceDraft': 'Cannot adjust a draft invoice.',
  'adjustment.invoiceCancelled': 'Cannot adjust a cancelled invoice.',
  'adjustment.invalidAmount': 'Adjustment amount must be greater than zero.',
  'adjustment.credit.noOutstanding': 'This invoice has no outstanding balance to credit.',
  'adjustment.credit.exceedsOutstanding':
    'Credit amount exceeds the invoice outstanding balance.',
  'adjustment.refund.invalidAmount': 'Invalid refund amount.',
  'adjustment.refund.noOverpayment': 'No overpayment — refund is not allowed.',
  'adjustment.refund.exceedsOverpayment': 'Refund exceeds the overpaid amount.',
  'adjustment.lines.required': 'Select at least one service line to adjust.',
  'adjustment.invalidAction': 'This action is not allowed for the selected note type.',
  'adjustment.line.required': 'An invoice line must be selected.',
  'adjustment.line.notFound': 'Invoice line not found.',
  'adjustment.line.noRemaining': 'This line has no remaining amount to credit.',
  'adjustment.line.creditExceedsRemaining': 'Credit exceeds the line remaining amount.',
  'adjustment.line.reduceNotLower': 'Reduced amount must be lower than the current line amount.',
  'adjustment.line.increaseNotHigher': 'Increased amount must be higher than the current line amount.',
  'adjustment.line.chargeLineRequired': 'Select a charge line when adding a service.',
  'adjustment.chargeLine.notFound': 'Charge line not found.',
  'adjustment.chargeLine.encounterMismatch': 'Charge line does not belong to this visit.',
  'adjustment.chargeLine.inactive': 'Selected charge line is not active.',
  'adjustment.line.alreadyInvoiced': 'This service is already on the invoice.',
  'adjustment.line.noAmount': 'Selected service has no billable amount for this invoice.',
  'adjustment.line.duplicate': 'Duplicate line selected in the same adjustment.',
  'adjustment.line.invalidQuantity': 'Quantity must be greater than zero.',
  'adjustment.line.invalidUnitPrice': 'Unit price must be greater than zero.',
  'adjustment.service.categoryRequired': 'Select a service category.',
  'adjustment.service.currencyRequired': 'Currency is required for the new service.',
  'adjustment.service.medicationRequired': 'Select a medication.',
  'adjustment.service.diagnosticRequired': 'Select a diagnostic test.',
  'adjustment.service.serviceRequired': 'Select a service.',
  'adjustment.service.procedureRequired': 'Select a procedure.',
  'adjustment.service.unsupportedCategory': 'This service category is not supported here.',
  'adjustment.chargeLine.notCreated': 'Billing engine did not create a charge line for the new service.',
  'encounter.facility.required': 'Encounter facility is required to bill a new service.',
  'numbering.configuration.inactive':
    'Financial document numbering is inactive. Activate credit/debit note numbering in setup first.',
  'numbering.configuration.notfound':
    'Document numbering is not configured for this facility. Set it up in Financial Document Numbering.',
  'numbering.sequence.lock.failed':
    'Unable to reserve the next document number. Another user may be issuing a document — please try again.',
  'numbering.sequence.exhausted': 'Document sequence limit reached for the current period.',
  'numbering.facility.required': 'Facility is required to allocate a document number.',
  'numbering.request.duplicate':
    'This adjustment request was already processed. Refresh the adjustments list.'
};

export const ENCOUNTER_START_ERROR_MAP: Record<string, string> = {
  'startedBy.practitioner.notFound':
    'Your user account is not linked to a practitioner profile. Ask an administrator to link your account before starting encounters.',
  'startedBy.practitioner.validationFailed':
    'Unable to validate practitioner profile for the current user.',
  'startedBy.notDoctor':
    'Only physician accounts can start clinical encounters.'
};
