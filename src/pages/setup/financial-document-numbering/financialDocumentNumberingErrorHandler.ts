type ApiErrorData = {
  message?: string;
  title?: string;
  detail?: string;
  errorKey?: string;
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
    case 'db.notready':
      return 'Database tables are missing. Deploy the gateway Liquibase changelog first.';
    default:
      return data.detail ?? data.title ?? data.message ?? fallback;
  }
};
