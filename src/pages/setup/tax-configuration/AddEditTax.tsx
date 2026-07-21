import React, {
  useEffect
} from 'react';

import {
  Form
} from 'rsuite';

import {
  FaPercent
} from 'react-icons/fa';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import {
  useAppDispatch
} from '@/hooks';

import {
  notify
} from '@/utils/uiReducerActions';

import {
  formatEnumString
} from '@/utils';

import {
  useEnumOptions
} from '@/services/enumsApi';

import {
  useGetAllFacilitiesQuery
} from '@/services/security/facilityService';

import {
  useAddTaxMutation,
  useUpdateTaxMutation
} from '@/services/billing/taxService';

import type {
  SaveTaxRequest,
  Tax,
  TaxApplicableOn,
  TaxCalculationType,
  TaxType
} from '@/types/model-types-new';

type Props = {
  open: boolean;

  setOpen: (
    value: boolean
  ) => void;

  width: number;

  tax:
    Tax;

  setTax:
    React.Dispatch<
      React.SetStateAction<
        Tax
      >
    >;

  onSaveSuccess?: () => void;
};

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

const taxFieldLabels:
Record<string, string> = {
  id:
    'Tax ID',

  facilityId:
    'Facility',

  code:
    'Tax Code',

  name:
    'Tax Name',

  taxType:
    'Tax Type',

  percentage:
    'Percentage',

  fixedAmount:
    'Fixed Amount',

  currency:
    'Currency',

  calculationType:
    'Calculation Type',

  applicableOn:
    'Applicable On',

  validFrom:
    'Valid From',

  validTo:
    'Valid To',

  isDefault:
    'Default',

  active:
    'Active',

  description:
    'Description'
};

const taxErrorKeyMessages:
Record<string, string> = {
  'payload.required':
    'Tax payload is required.',

  'id.exists':
    'A new tax cannot already have an ID.',

  'id.required':
    'Tax ID is required.',

  'id.mismatch':
    'The tax ID does not match the requested record.',

  'facility.required':
    'Facility is required.',

  'facility.notfound':
    'The selected facility was not found.',

  'facility.invalid':
    'The selected facility is invalid.',

  'code.required':
    'Tax code is required.',

  'code.exists':
    'Tax code already exists for this facility.',

  'name.en.required':
    'Tax name is required.',

  'type.required':
    'Tax type is required.',

  'calculation.type.required':
    'Calculation type is required.',

  'applicable.on.required':
    'Applicable On is required.',

  'valid.from.required':
    'Valid From date is required.',

  'valid.period.invalid':
    'Valid To date cannot be before Valid From date.',

  'percentage.required':
    'Percentage is required for percentage tax.',

  'percentage.invalid':
    'Tax percentage must be between 0 and 100.',

  'fixed.amount.required':
    'Fixed amount is required for fixed amount tax.',

  'fixed.amount.invalid':
    'Fixed amount cannot be negative.',

  'currency.required':
    'Currency is required for fixed amount tax.',

  'currency.invalid':
    'The selected currency is invalid.',

  'default.inactive':
    'Inactive tax cannot be set as default. Activate it first.',

  'default.invalid.period':
    'Expired or future tax cannot be set as default.',

  'active.delete':
    'Active tax cannot be deleted. Deactivate it first.',

  'tax.in.use':
    'This tax is already used and cannot be deleted.',

  'db.constraint':
    'Database constraint violation while saving tax.',

  notfound:
    'Tax record was not found.'
};

const normalizeValidationMessage = (
  message?: string
) => {
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
    return 'length is out of range';
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

const extractTaxErrorMessage = (
  error:
    any,
  fallbackMessage:
    string
) => {
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
            taxFieldLabels[
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
      ? taxErrorKeyMessages[
          errorKey
        ]
      : undefined;

  const usefulDetail =
    data.detail &&
    data.detail !==
      'null'
      ? data.detail
      : undefined;

  const usefulTitle =
    data.title &&
    ![
      'Bad Request',
      'Internal Server Error',
      'Method argument not valid'
    ].includes(
      data.title
    )
      ? data.title
      : undefined;

  return (
    mappedMessage ||
    usefulDetail ||
    usefulTitle ||
    fallbackMessage
  ) + traceSuffix;
};

const AddEditTax:
React.FC<Props> = ({
  open,
  setOpen,
  width,
  tax,
  setTax,
  onSaveSuccess
}) => {
  const dispatch =
    useAppDispatch();

  const tenant =
    JSON.parse(
      localStorage.getItem(
        'tenant'
      ) || 'null'
    );

  const selectedFacility =
    tenant?.selectedFacility ||
    null;

  const {
    data:
      facilityListResponse
  } =
    useGetAllFacilitiesQuery({});

  const taxTypeOptions =
    useEnumOptions(
      'TaxType'
    );

  const calculationTypeOptions =
    useEnumOptions(
      'TaxCalculationType'
    );

  const applicableOnOptions =
    useEnumOptions(
      'TaxApplicableOn'
    );

  const currencyOptions =
    useEnumOptions(
      'Currency'
    );

  const [
    addTax,
    {
      isLoading:
        isAdding
    }
  ] =
    useAddTaxMutation();

  const [
    updateTax,
    {
      isLoading:
        isUpdating
    }
  ] =
    useUpdateTaxMutation();

  const isEdit =
    Boolean(
      tax.id
    );

  const isLoading =
    isAdding ||
    isUpdating;

  useEffect(() => {
    if (
      !open ||
      tax.id
    ) {
      return;
    }

    setTax(
      previous => ({
        ...previous,

        facilityId:
          previous.facilityId ??
          selectedFacility?.id,

        taxType:
          previous.taxType ??
          'PERCENTAGE',

        calculationType:
          previous.calculationType ??
          'EXCLUSIVE',

        applicableOn:
          previous.applicableOn ??
          'INVOICE',

        validFrom:
          previous.validFrom ||
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        isDefault:
          previous.isDefault ??
          false,

        active:
          previous.active ??
          true
      })
    );
  }, [
    open,
    tax.id,
    selectedFacility?.id,
    setTax
  ]);

  const handleTaxTypeChange = (
    updated:
      any
  ) => {
    const nextRecord =
      typeof updated ===
      'function'
        ? updated(
            tax
          )
        : updated;

    const taxType =
      (
        nextRecord?.taxType ??
        nextRecord?.value ??
        updated?.value ??
        updated
      ) as
        TaxType;

    setTax(
      previous => ({
        ...previous,

        taxType,

        percentage:
          taxType ===
            'PERCENTAGE'
            ? previous.percentage ??
              null
            : null,

        fixedAmount:
          taxType ===
            'FIXED_AMOUNT'
            ? previous.fixedAmount ??
              null
            : null,

        currency:
          taxType ===
            'FIXED_AMOUNT'
            ? previous.currency ??
              null
            : null
      })
    );
  };

  const validate = ():
    string | null => {
    if (!tax.facilityId) {
      return 'Facility is required.';
    }

    if (
      !tax.code?.trim()
    ) {
      return 'Tax code is required.';
    }

    if (
      !tax.name?.trim()
    ) {
      return 'Tax name is required.';
    }

    if (!tax.taxType) {
      return 'Tax type is required.';
    }

    if (
      tax.taxType ===
        'PERCENTAGE'
    ) {
      if (
        tax.percentage ===
          undefined ||
        tax.percentage ===
          null ||
        String(
          tax.percentage
        ).trim() ===
          ''
      ) {
        return 'Percentage is required.';
      }

      const percentage =
        Number(
          tax.percentage
        );

      if (
        Number.isNaN(
          percentage
        ) ||
        percentage < 0 ||
        percentage > 100
      ) {
        return 'Percentage must be between 0 and 100.';
      }
    }

    if (
      tax.taxType ===
        'FIXED_AMOUNT'
    ) {
      if (
        tax.fixedAmount ===
          undefined ||
        tax.fixedAmount ===
          null ||
        String(
          tax.fixedAmount
        ).trim() ===
          ''
      ) {
        return 'Fixed amount is required.';
      }

      const fixedAmount =
        Number(
          tax.fixedAmount
        );

      if (
        Number.isNaN(
          fixedAmount
        ) ||
        fixedAmount < 0
      ) {
        return 'Fixed amount cannot be negative.';
      }

      if (!tax.currency) {
        return 'Currency is required.';
      }
    }

    if (!tax.calculationType) {
      return 'Calculation type is required.';
    }

    if (!tax.applicableOn) {
      return 'Applicable on is required.';
    }

    if (!tax.validFrom) {
      return 'Valid from date is required.';
    }

    if (
      tax.validTo &&
      tax.validFrom &&
      tax.validTo <
        tax.validFrom
    ) {
      return 'Valid to cannot be before valid from.';
    }

    if (
      tax.isDefault &&
      tax.active ===
        false
    ) {
      return 'Default tax must be active.';
    }

    return null;
  };

  const handleSave =
    async () => {
      const validationMessage =
        validate();

      if (
        validationMessage
      ) {
        dispatch(
          notify({
            msg:
              validationMessage,

            sev:
              'warning'
          })
        );

        return;
      }

      const payload:
        SaveTaxRequest = {
        facilityId:
          Number(
            tax.facilityId
          ),

        code:
          String(
            tax.code
          )
            .trim()
            .toUpperCase(),

        name:
          String(
            tax.name
          ).trim(),

        taxType:
          tax.taxType as
            TaxType,

        percentage:
          tax.taxType ===
            'PERCENTAGE'
            ? Number(
                tax.percentage
              )
            : null,

        fixedAmount:
          tax.taxType ===
            'FIXED_AMOUNT'
            ? Number(
                tax.fixedAmount
              )
            : null,

        currency:
          tax.taxType ===
            'FIXED_AMOUNT'
            ? tax.currency ??
              null
            : null,

        calculationType:
          tax.calculationType as
            TaxCalculationType,

        applicableOn:
          tax.applicableOn as
            TaxApplicableOn,

        validFrom:
          String(
            tax.validFrom
          ),

        validTo:
          tax.validTo ||
          null,

        isDefault:
          tax.isDefault ??
          false,

        active:
          tax.active ??
          true,

        description:
          tax.description
            ?.trim() ||
          null
      };

      try {
        if (
          isEdit &&
          tax.id
        ) {
          await updateTax({
            id:
              tax.id,

            data: {
              ...payload,

              id:
                tax.id
            }
          }).unwrap();

          dispatch(
            notify({
              msg:
                'Tax updated successfully',

              sev:
                'success'
            })
          );
        } else {
          await addTax(
            payload
          ).unwrap();

          dispatch(
            notify({
              msg:
                'Tax created successfully',

              sev:
                'success'
            })
          );
        }

        setOpen(
          false
        );

        onSaveSuccess?.();
      } catch (
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractTaxErrorMessage(
                error,
                isEdit
                  ? 'Failed to update tax'
                  : 'Failed to create tax'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const content =
    () => (
      <Form fluid>
        <div className="tax-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Facility"
            fieldType="select"
            fieldName="facilityId"
            selectData={
              facilityListResponse ??
              []
            }
            selectDataLabel="name"
            selectDataValue="id"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Select Facility"
            searchable
            disabled={
              isEdit
            }
          />

          <MyInput
            required
            width="100%"
            fieldLabel="Tax Code"
            fieldName="code"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Enter Tax Code"
          />
        </div>

        <br />

        <div className="tax-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Tax Name"
            fieldName="name"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Enter Tax Name"
          />

          <MyInput
            required
            width="100%"
            fieldLabel="Tax Type"
            fieldType="select"
            fieldName="taxType"
            selectData={
              taxTypeOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              tax
            }
            setRecord={
              handleTaxTypeChange
            }
            placeholder="Select Tax Type"
            searchable={false}
          />
        </div>

        <br />

        {tax.taxType ===
        'FIXED_AMOUNT' ? (
          <div className="tax-two-columns">
            <MyInput
              required
              width="100%"
              fieldLabel="Fixed Amount"
              fieldType="number"
              fieldName="fixedAmount"
              record={
                tax
              }
              setRecord={
                setTax
              }
              placeholder="Enter Fixed Amount"
            />

            <MyInput
              required
              width="100%"
              fieldLabel="Currency"
              fieldType="select"
              fieldName="currency"
              selectData={
                currencyOptions
              }
              selectDataLabel="label"
              selectDataValue="value"
              record={
                tax
              }
              setRecord={
                setTax
              }
              placeholder="Select Currency"
              searchable
            />
          </div>
        ) : (
          <MyInput
            required
            width="100%"
            fieldLabel="Percentage"
            fieldType="number"
            fieldName="percentage"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Enter Percentage"
          />
        )}

        <br />

        <div className="tax-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Calculation Type"
            fieldType="select"
            fieldName="calculationType"
            selectData={
              calculationTypeOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Select Calculation Type"
            searchable={false}
          />

          <MyInput
            required
            width="100%"
            fieldLabel="Applicable On"
            fieldType="select"
            fieldName="applicableOn"
            selectData={
              applicableOnOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              tax
            }
            setRecord={
              setTax
            }
            placeholder="Select Applicable On"
            searchable={false}
          />
        </div>

        <br />

        <div className="tax-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Valid From"
            fieldType="date"
            fieldName="validFrom"
            record={
              tax
            }
            setRecord={
              setTax
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Valid To"
            fieldType="date"
            fieldName="validTo"
            record={
              tax
            }
            setRecord={
              setTax
            }
          />
        </div>

        <br />

        <div className="tax-two-columns">
          <MyInput
            width="100%"
            fieldLabel="Default"
            fieldType="checkbox"
            fieldName="isDefault"
            record={
              tax
            }
            setRecord={
              setTax
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Active"
            fieldType="checkbox"
            fieldName="active"
            record={
              tax
            }
            setRecord={
              setTax
            }
          />
        </div>

        <br />

        <MyInput
          width="100%"
          fieldLabel="Description"
          fieldType="textarea"
          fieldName="description"
          record={
            tax
          }
          setRecord={
            setTax
          }
          placeholder="Enter Description"
        />
      </Form>
    );

  const direction =
    localStorage.getItem(
      'direction'
    ) ||
    'LTR';

  const dir =
    direction ===
      'RTL'
      ? 'rtl'
      : 'ltr';

  return (
    <MyModal
      open={
        open
      }
      setOpen={
        setOpen
      }
      title={
        isEdit
          ? 'Edit Tax'
          : 'New Tax'
      }
      position="right"
      content={() => (
        <div dir={dir}>
          {content()}
        </div>
      )}
      actionButtonLabel={
        isEdit
          ? 'Save'
          : 'Create'
      }
      actionButtonFunction={
        handleSave
      }
      isDisabledActionBtn={
        isLoading
      }
      steps={[
        {
          title:
            'Tax Information',

          icon:
            <FaPercent />
        }
      ]}
      size={
        width > 600
          ? '44vw'
          : '90vw'
      }
    />
  );
};

export default AddEditTax;