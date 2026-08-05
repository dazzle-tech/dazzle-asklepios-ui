type ApiErrorData = {
  message?: string;
  title?: string;
  detail?: string;
  errorKey?: string;
};

export const FINANCIAL_DOCUMENT_NUMBERING_ERROR_MAP: Record<string, string> = {
  'facility.required': 'Facility is required.',
  'prefix.required': 'Prefix is required.',
  'sequence.length.invalid': 'Sequence length must be between 1 and 12.',
  'starting.number.invalid': 'Starting number must be at least 1.',
  'document.type.duplicate': 'Duplicate document types are not allowed.',
  'document.type.exists': 'Document numbering already exists for this document type.',
  'facility.mismatch': 'Facility mismatch. Please refresh and try again.',
  'configuration.inactive':
    'Document numbering must be active before generating numbers.',
  'configuration.notfound':
    'Document numbering is not configured for this document type.',
  'sequence.lock.failed':
    'Unable to lock the next sequence number. Please try again.',
  'sequence.exhausted': 'Sequence limit reached for the current period.',
  'request.duplicate': 'This numbering request was already processed.',
  'db.notready':
    'Database tables are missing. Deploy the gateway Liquibase changelog first.'
};

export const extractFinancialDocumentNumberingErrorMessage = (
  error: any,
  fallback: string
): string => {
  const data: ApiErrorData = error?.data ?? error ?? {};
  const errorKey = data.errorKey ?? data.message;

  switch (errorKey) {
    case 'facility.required':
      return 'Facility is required.';
    case 'prefix.required':
      return 'Prefix is required.';
    case 'sequence.length.invalid':
      return 'Sequence length must be between 1 and 12.';
    case 'starting.number.invalid':
      return 'Starting number must be at least 1.';
    case 'document.type.duplicate':
      return 'Duplicate document types are not allowed.';
    case 'document.type.exists':
      return 'Document numbering already exists for this document type.';
    case 'facility.mismatch':
      return 'Facility mismatch. Please refresh and try again.';
    case 'configuration.inactive':
      return 'Document numbering must be active before generating numbers.';
    case 'configuration.notfound':
      return 'Document numbering is not configured for this document type.';
    case 'sequence.lock.failed':
      return 'Unable to lock the next sequence number. Please try again.';
    case 'sequence.exhausted':
      return 'Sequence limit reached for the current period.';
    case 'request.duplicate':
      return 'This numbering request was already processed.';
    case 'db.notready':
      return 'Database tables are missing. Deploy the gateway Liquibase changelog first.';
    default:
      return data.detail ?? data.title ?? data.message ?? fallback;
  }
};
