const DEFAULT_ERROR = 'Unexpected error';



const parseErrorKey = (data: any): string | undefined => {

  const messageProp: string = data?.message || '';

  if (messageProp.startsWith('error.')) {

    return messageProp.substring(6);

  }



  return data?.errorKey ?? data?.properties?.errorKey;

};



export const extractApiErrorMessage = (

  error: any,

  keyMap: Record<string, string> = {}

): string => {

  const status = error?.status ?? error?.error?.status;



  if (status === 'TIMEOUT') {

    return (

      error?.data?.message ??

      error?.error?.data?.message ??

      'The request timed out. Please try again.'

    );

  }



  const data = error?.data ?? error?.error?.data;



  if (data == null) {

    return (

      error?.message ??

      error?.error?.error ??

      (typeof error?.error === 'string' ? error.error : undefined) ??

      DEFAULT_ERROR

    );

  }



  if (typeof data === 'string') {

    return data;

  }



  const errorKey = parseErrorKey(data);



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



  const messageProp: string = data.message || '';

  if (messageProp && !messageProp.startsWith('error.')) {

    return messageProp;

  }



  if (errorKey) {

    return errorKey.replace(/\./g, ' ');

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
  'medication.duplicate':
    'This medication is already on the visit. Edit the existing line to change quantity instead of adding it again.',
  'diagnosticTest.duplicate': 'This diagnostic test is already on the visit.',
  'service.duplicate': 'This service is already on the visit.',
  'procedure.duplicate': 'This procedure is already on the visit.',
  'chargeLine.duplicate': 'A charge line already exists for this service.',
  'payment.wallet.noReservation':
    'Wallet payment could not be linked to any service line. Select billable services and try again.',
  'payment.wallet.exceedsAmount':
    'The reserved service total exceeds the wallet payment amount.',
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

export const CHECKOUT_ERROR_MAP: Record<string, string> = {
  'responsibility.unsettled':
    'Checkout could not settle the full patient balance. Enable patient debit or collect the remaining amount first.',
  'patientOutstanding.remaining':
    'Checkout failed because part of the patient balance is still outstanding.',
  'chargeLine.create.failed':
    'Unable to bill one or more services automatically. Open Prepare & calculate and bill them first.',
  'charge.alreadyClosed': 'This charge is already financially closed.',
  'charge.cancelled': 'This charge was cancelled and cannot be checked out.',
  'charge.reversed': 'This charge was reversed and cannot be checked out.',
  'charge.notfound': 'Billing charge not found. Refresh and try again.',
  'charge.patient.missing': 'Billing charge is missing patient information.',
  'charge.encounter.missing': 'Billing charge is missing encounter information.',
  'charge.currency.missing': 'Billing charge is missing currency information.',
  'request.required': 'Checkout request is invalid. Refresh and try again.',
  'chargeId.required': 'Billing charge is required for checkout.',
  'requestId.required': 'Checkout request id is missing. Refresh and try again.',
  'checkoutBy.required': 'Checkout user is missing. Sign in again and retry.',
  'debit.notAllowed':
    'Patient debit is not allowed for this account. Collect payment instead.',
  'debit.approval.required':
    'Debit approval is required before checkout can post the remaining balance.',
  'responsibility.outstanding.zero':
    'One of the selected services no longer has an outstanding balance. Refresh and try again.'
};

export const ENCOUNTER_START_ERROR_MAP: Record<string, string> = {
  'startedBy.practitioner.notFound':
    'Your user account is not linked to a practitioner profile. Ask an administrator to link your account before starting encounters.',
  'startedBy.practitioner.validationFailed':
    'Unable to validate practitioner profile for the current user.',
  'startedBy.notDoctor':
    'Only physician accounts can start clinical encounters.'
};

