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

const fieldLabels:
Record<string, string> = {
  id:
    'Billing Configuration ID',

  facilityId:
    'Facility',

  configurationKey:
    'Configuration Key',

  valueType:
    'Value Type',

  configurationValue:
    'Default Value',

  enumCode:
    'Enum Type',

  description:
    'Description',

  active:
    'Active',

  status:
    'Status'
};

const errorKeyMessages:
Record<string, string> = {
  'payload.required':
    'Billing configuration payload is required.',

  'id.exists':
    'A new billing configuration cannot already have an ID.',

  'id.required':
    'Billing configuration ID is required.',

  'id.invalid':
    'The billing configuration ID is invalid.',

  'id.mismatch':
    'The billing configuration ID does not match the requested record.',

  'facility.required':
    'Facility is required.',

  'facility.notfound':
    'The selected facility was not found.',

  'facility.invalid':
    'The selected facility is invalid.',

  'key.required':
    'Configuration key is required.',

  'key.exists':
    'This configuration key already exists for the selected facility.',

  'value.type.required':
    'Value type is required.',

  'value.required':
    'Default value is required.',

  'value.numeric.invalid':
    'Default value must be numeric for the selected value type.',

  'value.invalid':
    'The default value is invalid for the selected value type.',

  'value.resolve.failed':
    'Unable to resolve the billing configuration value.',

  'enum.code.required':
    'Enum type is required when Value Type is Enum.',

  'enum.code.invalid':
    'The selected enum type is invalid.',

  'enum.code.notfound':
    'The selected enum type was not found.',

  'enum.value.invalid':
    'The selected default value is not valid for this enum type.',

  'boolean.invalid':
    'Boolean value must be True or False.',

  'status.required':
    'Billing configuration status is required.',

  'configuration.inactive':
    'Billing configuration is not active.',

  'active.delete':
    'Active billing configuration cannot be deleted. Deactivate it first.',

  'db.constraint':
    'A database constraint prevented saving the billing configuration.',

  notfound:
    'Billing configuration was not found.'
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
      'must be greater'
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

  if (
    normalized.includes(
      'must be less'
    )
  ) {
    return 'value is too large';
  }

  return (
    message ||
    'invalid value'
  );
};

const extractErrorKey = (
  message?: string
): string | undefined => {
  if (!message) {
    return undefined;
  }

  return message.startsWith(
    'error.'
  )
    ? message.substring(
        6
      )
    : message;
};

const isGenericTitle = (
  title?: string
): boolean => {
  return [
    undefined,
    '',
    'Bad Request',
    'Internal Server Error',
    'Method argument not valid',
    'Not Found'
  ].includes(
    title
  );
};

export const extractBillingConfigurationErrorMessage =
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
              fieldLabels[
                fieldName
              ] ??
              formatEnumString(
                fieldName
              );

            const message =
              normalizeValidationMessage(
                fieldError.message
              );

            return `• ${label}: ${message}`;
          }
        );

      return (
        `Please fix the following fields:\n${lines.join(
          '\n'
        )}${traceSuffix}`
      );
    }

    const errorKey =
      extractErrorKey(
        data.message
      );

    const mappedMessage =
      errorKey
        ? errorKeyMessages[
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
      !isGenericTitle(
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

    const humanMessage =
      mappedMessage ||
      usefulDetail ||
      usefulTitle ||
      networkMessage ||
      parsingMessage ||
      fallbackMessage;

    return (
      humanMessage +
      traceSuffix
    );
  };