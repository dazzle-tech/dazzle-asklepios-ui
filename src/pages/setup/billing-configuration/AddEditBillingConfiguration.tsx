// src/pages/setup/BillingConfiguration/AddEditBillingConfiguration.tsx

import React, {
  useEffect
} from 'react';

import {
  Form
} from 'rsuite';

import {
  FaSlidersH
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
  useGetAllFacilitiesQuery
} from '@/services/security/facilityService';

import {
  useEnumNames,
  useEnumOptions
} from '@/services/enumsApi';

import {
  useAddBillingConfigurationMutation,
  useUpdateBillingConfigurationMutation
} from '@/services/billing/billingConfigurationService';

import type {
  BillingConfiguration,
  BillingConfigurationKey,
  BillingConfigurationStatus,
  BillingConfigurationValueType,
  SaveBillingConfigurationRequest
} from '@/types/model-types-new';

type Props = {
  open: boolean;

  setOpen: (
    value: boolean
  ) => void;

  width: number;

  billingConfiguration:
    BillingConfiguration;

  setBillingConfiguration:
    React.Dispatch<
      React.SetStateAction<
        BillingConfiguration
      >
    >;

  onSaveSuccess?: () => void;
};

const AddEditBillingConfiguration:
React.FC<Props> = ({
  open,
  setOpen,
  width,
  billingConfiguration,
  setBillingConfiguration,
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

  const configurationKeyOptions =
    useEnumOptions(
      'BillingConfigurationKey'
    );

  const valueTypeOptions =
    useEnumOptions(
      'BillingConfigurationValueType'
    );

  const statusOptions =
    useEnumOptions(
      'BillingConfigurationStatus'
    );

  /*
   * All available enum names.
   *
   * Expected values:
   *
   * BillingRoundingMethod
   * SequenceResetFrequency
   */
  const enumNames =
    useEnumNames();

  /*
   * The selected enum code is stored directly in the record.
   *
   * Example:
   *
   * billingConfiguration.enumCode =
   * 'BillingRoundingMethod'
   */
  const selectedEnumCode =
    billingConfiguration
      .enumCode
      ? String(
          billingConfiguration
            .enumCode
        )
      : '';

  /*
   * Load enum values dynamically using the selected enum code.
   */
  const enumValueOptions =
    useEnumOptions(
      selectedEnumCode
    );

  const [
    addBillingConfiguration,
    {
      isLoading:
        isAdding
    }
  ] =
    useAddBillingConfigurationMutation();

  const [
    updateBillingConfiguration,
    {
      isLoading:
        isUpdating
    }
  ] =
    useUpdateBillingConfigurationMutation();

  const isEdit =
    Boolean(
      billingConfiguration.id
    );

  const isLoading =
    isAdding ||
    isUpdating;

  useEffect(() => {
    if (
      !open ||
      billingConfiguration.id
    ) {
      return;
    }

    setBillingConfiguration(
      previous => ({
        ...previous,

        facilityId:
          previous.facilityId ??
          selectedFacility?.id,

        valueType:
          previous.valueType ??
          'STRING',

        configurationValue:
          previous
            .configurationValue ??
          '',

        enumCode:
          previous.enumCode ??
          null,

        active:
          previous.active ??
          true,

        status:
          previous.status ??
          'DRAFT'
      })
    );
  }, [
    open,
    billingConfiguration.id,
    selectedFacility?.id,
    setBillingConfiguration
  ]);

  const handleValueTypeChange = (
    updated:
      any
  ) => {
    const nextRecord =
      typeof updated ===
      'function'
        ? updated(
            billingConfiguration
          )
        : updated;

    const valueType =
      nextRecord?.valueType ??
      nextRecord?.value ??
      updated?.value ??
      updated ??
      '';

    setBillingConfiguration(
      previous => ({
        ...previous,

        valueType:
          valueType as
            BillingConfigurationValueType,

        /*
         * Clear the old value whenever Value Type changes.
         */
        configurationValue:
          '',

        /*
         * enumCode is used only when the type is ENUM.
         */
        enumCode:
          valueType ===
            'ENUM'
            ? previous.enumCode ??
              null
            : null
      })
    );
  };

  const handleEnumCodeChange = (
    updated:
      any
  ) => {
    const nextRecord =
      typeof updated ===
      'function'
        ? updated(
            billingConfiguration
          )
        : updated;

    const selectedValue =
      nextRecord?.enumCode ??
      nextRecord?.value ??
      nextRecord?.name ??
      nextRecord?.enumName ??
      updated?.value ??
      updated?.name ??
      updated?.enumName ??
      updated ??
      '';

    /*
     * Store only the short enum code.
     *
     * If a complete class name is returned accidentally,
     * extract its final part.
     */
    const enumCodeParts =
      String(
        selectedValue || ''
      ).split('.');

    const enumCode =
      enumCodeParts[
        enumCodeParts.length -
          1
      ] || '';

    setBillingConfiguration(
      previous => ({
        ...previous,

        enumCode:
          enumCode ||
          null,

        /*
         * Clear the previous default value when Enum Type changes.
         */
        configurationValue:
          ''
      })
    );
  };

  const validate = ():
    string | null => {
    if (
      !billingConfiguration
        .facilityId
    ) {
      return 'Facility is required.';
    }

    if (
      !billingConfiguration
        .configurationKey
    ) {
      return 'Configuration key is required.';
    }

    if (
      !billingConfiguration
        .valueType
    ) {
      return 'Value type is required.';
    }

    if (
      billingConfiguration
        .valueType ===
        'ENUM' &&
      !billingConfiguration
        .enumCode
    ) {
      return 'Enum type is required.';
    }

    if (
      billingConfiguration
        .configurationValue ===
          undefined ||
      billingConfiguration
        .configurationValue ===
          null ||
      String(
        billingConfiguration
          .configurationValue
      ).trim() === ''
    ) {
      return 'Default value is required.';
    }

    if (
      billingConfiguration
        .valueType ===
        'BOOLEAN' &&
      ![
        'true',
        'false'
      ].includes(
        String(
          billingConfiguration
            .configurationValue
        ).toLowerCase()
      )
    ) {
      return 'Boolean value must be true or false.';
    }

    if (
      [
        'INTEGER',
        'LONG',
        'DECIMAL'
      ].includes(
        billingConfiguration
          .valueType
      ) &&
      Number.isNaN(
        Number(
          billingConfiguration
            .configurationValue
        )
      )
    ) {
      return 'Default value must be numeric.';
    }

    if (
      billingConfiguration
        .valueType ===
        'JSON'
    ) {
      try {
        JSON.parse(
          String(
            billingConfiguration
              .configurationValue
          )
        );
      } catch {
        return 'Default value must contain valid JSON.';
      }
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
        SaveBillingConfigurationRequest = {
        facilityId:
          Number(
            billingConfiguration
              .facilityId
          ),

        configurationKey:
          billingConfiguration
            .configurationKey as
            BillingConfigurationKey,

        valueType:
          billingConfiguration
            .valueType as
            BillingConfigurationValueType,

        configurationValue:
          String(
            billingConfiguration
              .configurationValue
          ).trim(),

        enumCode:
          billingConfiguration
            .valueType ===
            'ENUM'
            ? billingConfiguration
                .enumCode ||
              null
            : null,

        description:
          billingConfiguration
            .description
            ?.trim() ||
          null,

        active:
          billingConfiguration
            .active ??
          true,

        status:
          (
            billingConfiguration
              .status ??
            'DRAFT'
          ) as
            BillingConfigurationStatus
      };

      try {
        if (
          isEdit &&
          billingConfiguration.id
        ) {
          await updateBillingConfiguration({
            id:
              billingConfiguration.id,

            data: {
              ...payload,

              id:
                billingConfiguration.id
            }
          }).unwrap();

          dispatch(
            notify({
              msg:
                'Billing configuration updated successfully',

              sev:
                'success'
            })
          );
        } else {
          await addBillingConfiguration(
            payload
          ).unwrap();

          dispatch(
            notify({
              msg:
                'Billing configuration created successfully',

              sev:
                'success'
            })
          );
        }

        setOpen(false);

        onSaveSuccess?.();
      } catch (
        error:
          any
      ) {
        const detail =
          error?.data?.detail ||
          error?.data?.title ||
          error?.data?.message;

        dispatch(
          notify({
            msg:
              detail ||
              (
                isEdit
                  ? 'Failed to update billing configuration'
                  : 'Failed to create billing configuration'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const renderDefaultValueInput =
    () => {
      switch (
        billingConfiguration
          .valueType
      ) {
        case 'BOOLEAN':
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldType="select"
              fieldName="configurationValue"
              selectData={[
                {
                  label:
                    'True',

                  value:
                    'true'
                },
                {
                  label:
                    'False',

                  value:
                    'false'
                }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
              placeholder="Select Default Value"
              searchable={false}
            />
          );

        case 'INTEGER':
        case 'LONG':
        case 'DECIMAL':
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldType="number"
              fieldName="configurationValue"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
              placeholder="Enter Default Value"
            />
          );

        case 'ENUM':
          return (
            <>
              <MyInput
                required
                width="100%"
                fieldLabel="Enum Type"
                fieldType="select"
                fieldName="enumCode"
                selectData={
                  enumNames ??
                  []
                }
                selectDataLabel="label"
                selectDataValue="value"
                record={
                  billingConfiguration
                }
                setRecord={
                  handleEnumCodeChange
                }
                placeholder="Select Enum Type"
                searchable
              />

              <br />

              <MyInput
                required
                width="100%"
                fieldLabel="Default Value"
                fieldType="select"
                fieldName="configurationValue"
                selectData={
                  enumValueOptions ??
                  []
                }
                selectDataLabel="label"
                selectDataValue="value"
                record={
                  billingConfiguration
                }
                setRecord={
                  setBillingConfiguration
                }
                placeholder={
                  selectedEnumCode
                    ? 'Select Default Value'
                    : 'Select Enum Type First'
                }
                searchable
                disabled={
                  !selectedEnumCode
                }
              />
            </>
          );

        case 'DATE':
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldType="date"
              fieldName="configurationValue"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
            />
          );

        case 'DATETIME':
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldType="datetime-local"
              fieldName="configurationValue"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
            />
          );

        case 'JSON':
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldType="textarea"
              fieldName="configurationValue"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
              placeholder='{"key":"value"}'
            />
          );

        case 'STRING':
        default:
          return (
            <MyInput
              required
              width="100%"
              fieldLabel="Default Value"
              fieldName="configurationValue"
              record={
                billingConfiguration
              }
              setRecord={
                setBillingConfiguration
              }
              placeholder="Enter Default Value"
            />
          );
      }
    };

  const content = () => (
    <Form fluid>
      <div className="billing-configuration-two-columns">
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
            billingConfiguration
          }
          setRecord={
            setBillingConfiguration
          }
          placeholder="Select Facility"
          searchable
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Configuration Key"
          fieldType="select"
          fieldName="configurationKey"
          selectData={
            configurationKeyOptions
          }
          selectDataLabel="label"
          selectDataValue="value"
          record={
            billingConfiguration
          }
          setRecord={
            setBillingConfiguration
          }
          placeholder="Select Configuration Key"
          searchable
        />
      </div>

      <br />

      <div className="billing-configuration-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Value Type"
          fieldType="select"
          fieldName="valueType"
          selectData={
            valueTypeOptions
          }
          selectDataLabel="label"
          selectDataValue="value"
          record={
            billingConfiguration
          }
          setRecord={
            handleValueTypeChange
          }
          placeholder="Select Value Type"
          searchable={false}
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Status"
          fieldType="select"
          fieldName="status"
          selectData={
            statusOptions
          }
          selectDataLabel="label"
          selectDataValue="value"
          record={
            billingConfiguration
          }
          setRecord={
            setBillingConfiguration
          }
          placeholder="Select Status"
          searchable={false}
        />
      </div>

      <br />

      {renderDefaultValueInput()}

      <br />

      <MyInput
        width="100%"
        fieldLabel="Description"
        fieldType="textarea"
        fieldName="description"
        record={
          billingConfiguration
        }
        setRecord={
          setBillingConfiguration
        }
        placeholder="Enter Description"
      />

      <br />

      <MyInput
        width="100%"
        fieldLabel="Active"
        fieldType="checkbox"
        fieldName="active"
        record={
          billingConfiguration
        }
        setRecord={
          setBillingConfiguration
        }
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
          ? 'Edit Billing Configuration'
          : 'New Billing Configuration'
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
            'Billing Configuration',

          icon:
            <FaSlidersH />
        }
      ]}
      size={
        width > 600
          ? '40vw'
          : '75vw'
      }
    />
  );
};

export default AddEditBillingConfiguration;