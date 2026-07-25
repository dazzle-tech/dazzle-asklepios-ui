import React from 'react';

import { Form } from 'rsuite';

import {
  FaGavel
} from 'react-icons/fa';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { useAppDispatch } from '@/hooks';

import { notify } from '@/utils/uiReducerActions';

import {
  useAddBillingRuleMutation,
  useUpdateBillingRuleMutation
} from '@/services/setup/billingRuleSetup/billingRuleSetupService';

import { useEnumOptions } from '@/services/enumsApi';

import type {
  BillingRule,
  SaveBillingRuleRequest
} from '@/types/model-types-new';

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  width: number;
  billingRule: BillingRule;
  setBillingRule: React.Dispatch<
    React.SetStateAction<BillingRule>
  >;
  onSaveSuccess?: () => void;
};

const normalizeBillingRuleError = (
  error: any
) => {
  const data = error?.data ?? error ?? {};
  const errorKey = data?.errorKey ?? data?.message;

  switch (errorKey) {
    case 'name.exists':
      return 'A billing rule with this name already exists.';
    case 'id.mismatch':
      return 'Billing rule id mismatch. Please refresh and try again.';
    default:
      return (
        data?.detail ??
        data?.title ??
        data?.message ??
        'Failed to save billing rule'
      );
  }
};

const AddEditBillingRuleSetup: React.FC<
  Props
> = ({
  open,
  setOpen,
  width,
  billingRule,
  setBillingRule,
  onSaveSuccess
}) => {
  const dispatch = useAppDispatch();

  const isEdit = Boolean(billingRule.id);

  const itemTypeOptions =
    useEnumOptions('BillingItemTypes') ??
    [];

  const triggerOptions =
    useEnumOptions('BillingTrigger') ??
    [];

  const [
    addBillingRule,
    { isLoading: isCreating }
  ] = useAddBillingRuleMutation();

  const [
    updateBillingRule,
    { isLoading: isUpdating }
  ] = useUpdateBillingRuleMutation();

  const isLoading =
    isCreating || isUpdating;

  const validate = (): string | null => {
    if (
      !billingRule.name ||
      !billingRule.name.trim()
    ) {
      return 'Rule name is required.';
    }

    if (!billingRule.billingItemType) {
      return 'Item type is required.';
    }

    if (!billingRule.billingTrigger) {
      return 'Billing trigger is required.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      dispatch(
        notify({
          msg: validationMessage,
          sev: 'warning'
        })
      );

      return;
    }

    const payload: SaveBillingRuleRequest = {
      id: isEdit ? billingRule.id : null,
      name: billingRule.name!.trim(),
      billingItemType:
        billingRule.billingItemType!,
      billingTrigger:
        billingRule.billingTrigger!,
      isDefault: Boolean(
        billingRule.isDefault
      )
    };

    try {
      if (isEdit && billingRule.id) {
        await updateBillingRule({
          id: billingRule.id,
          data: payload
        }).unwrap();
      } else {
        await addBillingRule(payload).unwrap();
      }

      dispatch(
        notify({
          msg: isEdit
            ? 'Billing rule updated successfully'
            : 'Billing rule created successfully',
          sev: 'success'
        })
      );

      onSaveSuccess?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            normalizeBillingRuleError(
              error
            ),
          sev: 'error'
        })
      );
    }
  };

  const content = () => (
    <Form fluid>
      <MyInput
        required
        width="100%"
        fieldLabel="Rule Name"
        fieldName="name"
        record={billingRule}
        setRecord={setBillingRule}
      />

      <br />

      <div className="billing-rule-two-columns">
        <MyInput
          required
          width="100%"
          fieldLabel="Item Type"
          fieldType="select"
          fieldName="billingItemType"
          selectData={itemTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={billingRule}
          setRecord={setBillingRule}
          searchable={false}
          isEnum
        />

        <MyInput
          required
          width="100%"
          fieldLabel="Billing Trigger"
          fieldType="select"
          fieldName="billingTrigger"
          selectData={triggerOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={billingRule}
          setRecord={setBillingRule}
          searchable={false}
          isEnum
        />
      </div>

      <br />

      <MyInput
        width="100%"
        fieldLabel="Set as default for this item type"
        fieldType="checkbox"
        fieldName="isDefault"
        record={billingRule}
        setRecord={setBillingRule}
      />
    </Form>
  );

  const direction =
    localStorage.getItem('direction') ||
    'LTR';

  const dir =
    direction === 'RTL'
      ? 'rtl'
      : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        isEdit
          ? 'Edit Billing Rule'
          : 'New Billing Rule'
      }
      position="right"
      content={() => (
        <div dir={dir}>{content()}</div>
      )}
      actionButtonLabel={
        isEdit ? 'Save' : 'Create'
      }
      actionButtonFunction={handleSave}
      isDisabledActionBtn={isLoading}
      steps={[
        {
          title: 'Billing Rule Information',
          icon: <FaGavel />
        }
      ]}
      size={
        width > 600 ? '36vw' : '80vw'
      }
    />
  );
};

export default AddEditBillingRuleSetup;
