import {
  formatEnumString
} from '@/utils';

type ApiFieldError = {
  field?: string;

  message?: string;
};

type ApiErrorData = {
  message?: string;

  title?: string;

  detail?: string;

  type?: string;

  traceId?: string;

  requestId?: string;

  correlationId?: string;

  fieldErrors?:
    ApiFieldError[];
};

const discountFieldLabels:
Record<string, string> = {
  id:
    'Discount ID',

  facilityId:
    'Facility',

  code:
    'Discount Code',

  name:
    'Discount Name',

  discountType:
    'Discount Type',

  percentage:
    'Percentage',

  fixedAmount:
    'Fixed Amount',

  currency:
    'Currency',

  applicableOn:
    'Applicable On',

  validFrom:
    'Valid From',

  validTo:
    'Valid To',

  maximumDiscountAmount:
    'Maximum Discount Amount',

  minimumInvoiceAmount:
    'Minimum Invoice Amount',

  requiresReason:
    'Requires Reason',

  requiresApproval:
    'Requires Approval',

  combinable:
    'Combinable',

  isDefault:
    'Default',

  active:
    'Active',

  description:
    'Description'
};

const discountErrorKeyMessages:
Record<string, string> = {
  'payload.required':
    'Discount payload is required.',

  'id.exists':
    'A new discount cannot already have an ID.',

  'id.required':
    'Discount ID is required.',

  'id.invalid':
    'Discount ID is invalid.',

  'id.mismatch':
    'The discount ID does not match the requested record.',

  'facility.required':
    'Facility is required.',

  'facility.notfound':
    'The selected facility was not found.',

  'facility.invalid':
    'The selected facility is invalid.',

  'code.required':
    'Discount code is required.',

  'code.exists':
    'Discount code already exists for this facility.',

  'name.required':
    'Discount name is required.',

  'type.required':
    'Discount type is required.',

  'type.invalid':
    'The selected discount type is invalid.',

  'applicable.on.required':
    'Applicable On is required.',

  'valid.from.required':
    'Valid From date is required.',

  'valid.period.invalid':
    'Valid To date cannot be before Valid From date.',

  'percentage.required':
    'Percentage is required for percentage discount.',

  'percentage.invalid':
    'Discount percentage must be between 0 and 100.',

  'percentage.not.allowed':
    'Percentage must be empty for fixed-amount discount.',

  'fixed.amount.required':
    'Fixed amount is required for fixed-amount discount.',

  'fixed.amount.invalid':
    'Fixed discount amount cannot be negative.',

  'fixed.amount.not.allowed':
    'Fixed amount must be empty for percentage discount.',

  'currency.required':
    'Currency is required for fixed-amount discount.',

  'amount.invalid':
    'Amount cannot be negative.',

  'default.inactive':
    'Inactive discount cannot be set as default. Activate it first.',

  'default.invalid.period':
    'Future or expired discount cannot be set as default.',

  'default.notfound':
    'No active default discount exists for this facility.',

  'active.delete':
    'Active discount cannot be deleted. Deactivate it first.',

  'discount.in.use':
    'This discount is already used and cannot be deleted.',

  'db.constraint':
    'Database constraint violation while saving discount.',

  notfound:
    'Discount record was not found.'
};

const normalizeValidationMessage = (
  message?: string
): string => {
  const normalized =
    String(
      message ??
        ''
    ).toLowerCase();

  if (
    normalized.includes(
      'must not be null'
    )
  ) {
    return 'is required';
  }

  if (
    normalized.includes(
      'must not be blank'
    )
  ) {
    return 'must not be blank';
  }

  if (
    normalized.includes(
      'size must be between'
    )
  ) {
    return 'length is outside the allowed range';
  }

  if (
    normalized.includes(
      'must be greater than or equal'
    )
  ) {
    return 'value is too small';
  }

  if (
    normalized.includes(
      'must be less than or equal'
    )
  ) {
    return 'value is too large';
  }

  return (
    message ||
    'invalid value'
  );
};

export const extractDiscountErrorMessage =
  (
    error:
      any,

    fallbackMessage:
      string
  ): string => {
    const data:
      ApiErrorData =
      error?.data ??
      {};

    const traceId =
      data.traceId ||
      data.requestId ||
      data.correlationId;

    const traceSuffix =
      traceId
        ? `\nTrace ID: ${traceId}`
        : '';

    const isValidationError =
      data.message ===
        'error.validation' ||
      data.title ===
        'Method argument not valid' ||
      (
        typeof data.type ===
          'string' &&
        data.type.includes(
          'constraint-violation'
        )
      );

    if (
      isValidationError &&
      Array.isArray(
        data.fieldErrors
      ) &&
      data.fieldErrors.length >
        0
    ) {
      const lines =
        data.fieldErrors.map(
          fieldError => {
            const fieldName =
              fieldError.field ||
              'Field';

            const label =
              discountFieldLabels[
                fieldName
              ] ??
              formatEnumString(
                fieldName
              );

            return `• ${label}: ${normalizeValidationMessage(
              fieldError.message
            )}`;
          }
        );

      return (
        `Please fix the following fields:\n${lines.join(
          '\n'
        )}${traceSuffix}`
      );
    }

    const rawMessage =
      data.message ||
      '';

    const errorKey =
      rawMessage.startsWith(
        'error.'
      )
        ? rawMessage.substring(
            6
          )
        : rawMessage;

    const mappedMessage =
      errorKey
        ? discountErrorKeyMessages[
            errorKey
          ]
        : undefined;

    const usefulDetail =
      data.detail &&
      data.detail !==
        'null' &&
      !data.detail.includes(
        'ProblemDetailWithCause'
      )
        ? data.detail
        : undefined;

    const usefulTitle =
      data.title &&
      ![
        'Bad Request',
        'Internal Server Error',
        'Method argument not valid',
        'Not Found'
      ].includes(
        data.title
      )
        ? data.title
        : undefined;

    const networkMessage =
      error?.status ===
        'FETCH_ERROR'
        ? 'Unable to connect to the server.'
        : undefined;

    const parsingMessage =
      error?.status ===
        'PARSING_ERROR'
        ? 'The server returned an invalid response.'
        : undefined;

    return (
      mappedMessage ||
      usefulDetail ||
      usefulTitle ||
      networkMessage ||
      parsingMessage ||
      fallbackMessage
    ) + traceSuffix;
  };