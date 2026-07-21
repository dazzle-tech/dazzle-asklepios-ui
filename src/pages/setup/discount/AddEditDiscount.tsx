import React, {
  useEffect
} from 'react';

import {
  Form
} from 'rsuite';

import {
  FaTags
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
  useEnumOptions
} from '@/services/enumsApi';

import {
  useGetAllFacilitiesQuery
} from '@/services/security/facilityService';

import {
  useAddDiscountMutation,
  useUpdateDiscountMutation
} from '@/services/billing/discountService';

import type {
  Discount,
  DiscountApplicableOn,
  DiscountType,
  SaveDiscountRequest
} from '@/types/model-types-new';

import {
  extractDiscountErrorMessage
} from './discountErrorHandler';

type Props = {
  open: boolean;

  setOpen: (
    value: boolean
  ) => void;

  width: number;

  discount:
    Discount;

  setDiscount:
    React.Dispatch<
      React.SetStateAction<
        Discount
      >
    >;

  onSaveSuccess?: () => void;
};

const AddEditDiscount:
React.FC<Props> = ({
  open,
  setOpen,
  width,
  discount,
  setDiscount,
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

  const discountTypeOptions =
    useEnumOptions(
      'DiscountType'
    );

  const applicableOnOptions =
    useEnumOptions(
      'DiscountApplicableOn'
    );

  const currencyOptions =
    useEnumOptions(
      'Currency'
    );

  const [
    addDiscount,
    {
      isLoading:
        isAdding
    }
  ] =
    useAddDiscountMutation();

  const [
    updateDiscount,
    {
      isLoading:
        isUpdating
    }
  ] =
    useUpdateDiscountMutation();

  const isEdit =
    Boolean(
      discount.id
    );

  const isLoading =
    isAdding ||
    isUpdating;

  useEffect(() => {
    if (
      !open ||
      discount.id
    ) {
      return;
    }

    setDiscount(
      previous => ({
        ...previous,

        facilityId:
          previous.facilityId ??
          selectedFacility?.id,

        discountType:
          previous.discountType ??
          'PERCENTAGE',

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

        requiresReason:
          previous.requiresReason ??
          false,

        requiresApproval:
          previous.requiresApproval ??
          false,

        combinable:
          previous.combinable ??
          false,

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
    discount.id,
    selectedFacility?.id,
    setDiscount
  ]);

  const handleDiscountTypeChange = (
    updated:
      any
  ) => {
    const nextRecord =
      typeof updated ===
      'function'
        ? updated(
            discount
          )
        : updated;

    const discountType =
      (
        nextRecord?.discountType ??
        nextRecord?.value ??
        updated?.value ??
        updated
      ) as
        DiscountType;

    setDiscount(
      previous => ({
        ...previous,

        discountType,

        percentage:
          discountType ===
            'PERCENTAGE'
            ? previous.percentage ??
              null
            : null,

        fixedAmount:
          discountType ===
            'FIXED_AMOUNT'
            ? previous.fixedAmount ??
              null
            : null,

        currency:
          discountType ===
            'FIXED_AMOUNT'
            ? previous.currency ??
              selectedFacility
                ?.defaultCurrency ??
              null
            : null
      })
    );
  };

  const validate = ():
    string | null => {
    if (!discount.facilityId) {
      return 'Facility is required.';
    }

    if (
      !discount.code?.trim()
    ) {
      return 'Discount code is required.';
    }

    if (
      !discount.name?.trim()
    ) {
      return 'Discount name is required.';
    }

    if (!discount.discountType) {
      return 'Discount type is required.';
    }

    if (
      discount.discountType ===
        'PERCENTAGE'
    ) {
      if (
        discount.percentage ===
          undefined ||
        discount.percentage ===
          null ||
        String(
          discount.percentage
        ).trim() ===
          ''
      ) {
        return 'Percentage is required.';
      }

      const percentage =
        Number(
          discount.percentage
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
      discount.discountType ===
        'FIXED_AMOUNT'
    ) {
      if (
        discount.fixedAmount ===
          undefined ||
        discount.fixedAmount ===
          null ||
        String(
          discount.fixedAmount
        ).trim() ===
          ''
      ) {
        return 'Fixed amount is required.';
      }

      const fixedAmount =
        Number(
          discount.fixedAmount
        );

      if (
        Number.isNaN(
          fixedAmount
        ) ||
        fixedAmount < 0
      ) {
        return 'Fixed amount cannot be negative.';
      }

      if (!discount.currency) {
        return 'Currency is required.';
      }
    }

    if (!discount.applicableOn) {
      return 'Applicable On is required.';
    }

    if (!discount.validFrom) {
      return 'Valid From date is required.';
    }

    if (
      discount.validTo &&
      discount.validFrom &&
      discount.validTo <
        discount.validFrom
    ) {
      return 'Valid To cannot be before Valid From.';
    }

    if (
      discount.maximumDiscountAmount !==
        undefined &&
      discount.maximumDiscountAmount !==
        null &&
      Number(
        discount.maximumDiscountAmount
      ) < 0
    ) {
      return 'Maximum discount amount cannot be negative.';
    }

    if (
      discount.minimumInvoiceAmount !==
        undefined &&
      discount.minimumInvoiceAmount !==
        null &&
      Number(
        discount.minimumInvoiceAmount
      ) < 0
    ) {
      return 'Minimum invoice amount cannot be negative.';
    }

    if (
      discount.isDefault &&
      discount.active ===
        false
    ) {
      return 'Default discount must be active.';
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
        SaveDiscountRequest = {
        facilityId:
          Number(
            discount.facilityId
          ),

        code:
          String(
            discount.code
          )
            .trim()
            .toUpperCase(),

        name:
          String(
            discount.name
          ).trim(),

        discountType:
          discount.discountType as
            DiscountType,

        percentage:
          discount.discountType ===
            'PERCENTAGE'
            ? Number(
                discount.percentage
              )
            : null,

        fixedAmount:
          discount.discountType ===
            'FIXED_AMOUNT'
            ? Number(
                discount.fixedAmount
              )
            : null,

        currency:
          discount.discountType ===
            'FIXED_AMOUNT'
            ? discount.currency ??
              null
            : null,

        applicableOn:
          discount.applicableOn as
            DiscountApplicableOn,

        validFrom:
          String(
            discount.validFrom
          ),

        validTo:
          discount.validTo ||
          null,

        maximumDiscountAmount:
          discount.maximumDiscountAmount ===
            undefined ||
          discount.maximumDiscountAmount ===
            null ||
          String(
            discount.maximumDiscountAmount
          ).trim() ===
            ''
            ? null
            : Number(
                discount.maximumDiscountAmount
              ),

        minimumInvoiceAmount:
          discount.minimumInvoiceAmount ===
            undefined ||
          discount.minimumInvoiceAmount ===
            null ||
          String(
            discount.minimumInvoiceAmount
          ).trim() ===
            ''
            ? null
            : Number(
                discount.minimumInvoiceAmount
              ),

        requiresReason:
          discount.requiresReason ??
          false,

        requiresApproval:
          discount.requiresApproval ??
          false,

        combinable:
          discount.combinable ??
          false,

        isDefault:
          discount.isDefault ??
          false,

        active:
          discount.active ??
          true,

        description:
          discount.description
            ?.trim() ||
          null
      };

      try {
        if (
          isEdit &&
          discount.id
        ) {
          await updateDiscount({
            id:
              discount.id,

            data: {
              ...payload,

              id:
                discount.id
            }
          }).unwrap();

          dispatch(
            notify({
              msg:
                'Discount updated successfully',

              sev:
                'success'
            })
          );
        } else {
          await addDiscount(
            payload
          ).unwrap();

          dispatch(
            notify({
              msg:
                'Discount created successfully',

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
              extractDiscountErrorMessage(
                error,
                isEdit
                  ? 'Failed to update discount'
                  : 'Failed to create discount'
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
        <div className="discount-two-columns">
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
              discount
            }
            setRecord={
              setDiscount
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
            fieldLabel="Discount Code"
            fieldName="code"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Enter Discount Code"
          />
        </div>

        <br />

        <div className="discount-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Discount Name"
            fieldName="name"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Enter Discount Name"
          />

          <MyInput
            required
            width="100%"
            fieldLabel="Discount Type"
            fieldType="select"
            fieldName="discountType"
            selectData={
              discountTypeOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              discount
            }
            setRecord={
              handleDiscountTypeChange
            }
            placeholder="Select Discount Type"
            searchable={false}
          />
        </div>

        <br />

        {discount.discountType ===
        'FIXED_AMOUNT' ? (
          <div className="discount-two-columns">
            <MyInput
              required
              width="100%"
              fieldLabel="Fixed Amount"
              fieldType="number"
              fieldName="fixedAmount"
              record={
                discount
              }
              setRecord={
                setDiscount
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
                discount
              }
              setRecord={
                setDiscount
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
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Enter Percentage"
          />
        )}

        <br />

        <div className="discount-two-columns">
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
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Select Applicable On"
            searchable={false}
          />

          <MyInput
            width="100%"
            fieldLabel="Maximum Discount Amount"
            fieldType="number"
            fieldName="maximumDiscountAmount"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Enter Maximum Amount"
          />
        </div>

        <br />

        <div className="discount-two-columns">
          <MyInput
            width="100%"
            fieldLabel="Minimum Invoice Amount"
            fieldType="number"
            fieldName="minimumInvoiceAmount"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
            placeholder="Enter Minimum Invoice Amount"
          />

          <div />
        </div>

        <br />

        <div className="discount-two-columns">
          <MyInput
            required
            width="100%"
            fieldLabel="Valid From"
            fieldType="date"
            fieldName="validFrom"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Valid To"
            fieldType="date"
            fieldName="validTo"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />
        </div>

        <br />

        <div className="discount-three-columns">
          <MyInput
            width="100%"
            fieldLabel="Requires Reason"
            fieldType="checkbox"
            fieldName="requiresReason"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Requires Approval"
            fieldType="checkbox"
            fieldName="requiresApproval"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Combinable"
            fieldType="checkbox"
            fieldName="combinable"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />
        </div>

        <br />

        <div className="discount-two-columns">
          <MyInput
            width="100%"
            fieldLabel="Default"
            fieldType="checkbox"
            fieldName="isDefault"
            record={
              discount
            }
            setRecord={
              setDiscount
            }
          />

          <MyInput
            width="100%"
            fieldLabel="Active"
            fieldType="checkbox"
            fieldName="active"
            record={
              discount
            }
            setRecord={
              setDiscount
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
            discount
          }
          setRecord={
            setDiscount
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
          ? 'Edit Discount'
          : 'New Discount'
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
            'Discount Information',

          icon:
            <FaTags />
        }
      ]}
      size={
        width > 600
          ? '46vw'
          : '90vw'
      }
    />
  );
};

export default AddEditDiscount;