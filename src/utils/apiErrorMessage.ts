const DEFAULT_ERROR = 'Unexpected error';



const parseErrorKey = (data: any): string | undefined => {

  const messageKeyProp: string = data?.properties?.messageKey || '';

  if (messageKeyProp.startsWith('error.')) {

    return messageKeyProp.substring(6);

  }



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
  'adjustment.claimLocked':
    'Credit, discount, and debit notes are locked while a Waseel claim is active on this invoice.',
  'adjustment.invalidAmount': 'Adjustment amount must be greater than zero.',
  'adjustment.credit.noOutstanding': 'This invoice has no outstanding balance to credit.',
  'adjustment.credit.exceedsOutstanding':
    'Credit amount exceeds the invoice outstanding balance.',
  'adjustment.discount.patientInvoiceOnly':
    'Discount credit notes are only allowed on patient (customer) invoices.',
  'adjustment.discount.scopeRequired': 'Select whether the discount applies to a line or the whole invoice.',
  'adjustment.discount.amountOrPercentRequired':
    'Enter either a discount amount or a discount percentage.',
  'adjustment.discount.invalidAmount': 'Discount amount must be greater than zero.',
  'adjustment.discount.exceedsOutstanding': 'Discount exceeds the invoice outstanding balance.',
  'adjustment.discount.exceedsLineRemaining': 'Discount exceeds the remaining amount on this line.',
  'adjustment.discount.lineRequired': 'Select an invoice line for the discount.',
  'adjustment.discount.noRemainingLines':
    'No invoice lines have remaining balance available for discount.',
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

export const WALLET_REFUND_ERROR_MAP: Record<string, string> = {
  'refund.exceedsAvailable':
    'Requested refund exceeds the available wallet balance. Reserved funds cannot be refunded.',
  'wallet.refund.exceedsAvailable':
    'Requested refund exceeds the available wallet balance. Reserved funds cannot be refunded.',
  'wallet.notfound': 'No billing wallet was found for this patient.',
  'wallet.notActive': 'The patient wallet is not active.',
  'wallet.balance.invalid': 'The patient wallet balance is inconsistent. Refresh and try again.',
  'amount.invalid': 'Refund amount must be greater than zero.',
  'reason.required': 'A refund reason is required.',
  'refundMethodCode.required': 'Select how the refund should be returned.',
  'refundMethodId.required': 'Select how the refund should be returned.',
  'patient.notfound': 'Patient not found.',
  'patientId.required': 'Patient is required to issue a refund.',
  'requestId.required': 'Refund request id is missing. Refresh and try again.',
  'sourceChannel.required': 'Refund source channel is required.',
  'refundSourceType.required': 'Refund source type is required.',
  'refund.exceedsRefundable': 'Requested refund exceeds the currently refundable amount.',
  'payment.refundable.zero': 'No refundable amount remains for this payment.',
  'numbering.configuration.inactive':
    'Refund numbering is inactive. Activate REFUND numbering in Financial Document Numbering first.',
  'numbering.configuration.notfound':
    'Refund numbering is not configured for this facility. Set it up in Financial Document Numbering like invoices.',
  'numbering.assign.failed':
    'Unable to allocate the next refund document number from setup. Try again.',
  'numbering.facility.required': 'Facility is required to assign a refund document number.',
  'encounter.required': 'Select a visit to issue a numbered refund document.',
  'refund.document.create.failed': 'Unable to save the refund financial document.'
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

export const PRICE_LIST_SETUP_ERROR_MAP: Record<string, string> = {
  'interval.type.duplicate':
    'A cash price list already exists in the selected date range.',
  'interval.payer.duplicate':
    'An insurance price list already exists for this company in the selected date range.',
  'active.cash.duplicate':
    'Only one active Cash Price List is allowed.',
  'active.payer.duplicate':
    'An active price list already exists for this insurance company.',
  'payer.required':
    'Insurance company is required for insurance price lists.',
  'effectiveDate.invalidRange':
    'The end date must be later than the start date.',
  'effectiveDate.startInPast':
    'The start date cannot be in the past.',
  'effectiveDate.required':
    'Effective start date is required for an active price list.',
  'tax.notFound':
    'The selected tax was not found.',
  'item.duplicate':
    'This service is already configured on this price list.',
  'item.duplicateInPriceList':
    'This catalog item is already on the selected price list.',
  'catalog.inactive':
    'Only active services from Service Definition can be added to a price list.',
  'itemCode.duplicate':
    'This item code already exists on the selected price list.',
  'item.idSequenceOutOfSync':
    'Unable to allocate a new price-list item ID. Contact support to fix the database sequence.',
  'item.import.fileRequired':
    'Please choose an Excel or CSV file to import.',
  'item.import.badFileType':
    'Unsupported file type. Upload .xlsx, .xls, or .csv.',
  'item.import.catalogNotFound':
    'A catalog item was not found for one or more rows. Use a valid item code or source ID.',
  'item.import.mappingRequired':
    'A Waseel item mapping is required for insurance price-list items.',
  'item.import.missingHeader':
    'The file is missing required columns. Download the template and try again.',
  'item.import.empty':
    'The file has no data rows.',
  'requiresPreAuthorization.insuranceOnly':
    'Requires Pre-Authorization is only allowed on insurance price list items.'
};

export const WASEEL_ELIGIBILITY_ERROR_MAP: Record<string, string> = {
  'insurance.expired': 'The selected insurance plan is expired. Update the expiration date or choose another plan.',
  'memberCardId.required': 'Member card ID is required before checking eligibility.',
  'policyNumber.required': 'Policy number is required before checking eligibility.',
  'patient.documentId.required': 'Patient document ID is required before checking eligibility.',
  'patient.dateOfBirth.required': 'Patient date of birth is required before checking eligibility.',
  'patient.gender.required': 'Patient gender is required before checking eligibility.',
  'patient.name.required': 'Patient first and last name are required before checking eligibility.',
  'payment.notFound': 'No payment record was found for this visit.',
  'paymentType.insuranceRequired': 'Insurance payment type is required for eligibility on this visit.',
  'insurance.required': 'Insurance is required before checking eligibility.',
  'insurance.notFound': 'Patient insurance was not found.',
  'insurance.patientMismatch': 'The selected insurance does not belong to this patient.',
  'patient.notFound': 'Patient was not found.',
  'request.required': 'Eligibility check request is invalid.',
  'waseel.eligibility.invalidRequest':
    'Waseel rejected the eligibility request because the payload was invalid. Verify patient and insurance details, then try again.',
  'waseel.eligibility.badRequest': 'Waseel rejected the eligibility request. Verify insurance details and try again.',
  'waseel.eligibility.connectionFailed': 'Unable to connect to Waseel. Check your network and try again.',
  'waseel.eligibility.failed': 'Eligibility check failed. Please try again or contact support.'
};

export const extractEligibilityErrorMessage = (
  error: any,
  fallback = 'Eligibility check failed. Please verify insurance details and try again.'
): string => {
  const mappedMessage = extractApiErrorMessage(error, WASEEL_ELIGIBILITY_ERROR_MAP);

  if (mappedMessage && mappedMessage !== DEFAULT_ERROR) {
    return mappedMessage;
  }

  const detail = error?.data?.detail ?? error?.error?.data?.detail;

  if (
    typeof detail === 'string' &&
    detail.toLowerCase().includes('failed to read request')
  ) {
    return WASEEL_ELIGIBILITY_ERROR_MAP['waseel.eligibility.invalidRequest'];
  }

  return fallback;
};

