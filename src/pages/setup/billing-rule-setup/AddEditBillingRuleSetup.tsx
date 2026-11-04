import React, { useEffect, useMemo } from 'react';

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

const WORKFLOW_TRIGGERS = [
  'SUBMIT_ORDER',
  'COLLECT_SAMPLE',
  'ACCEPT_ORDER',
  'APPROVED'
];

const FALLBACK_PAYMENT_OPTIONS = [
  { value: 'SELF_PAY', label: 'Self Pay' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'BOTH', label: 'Both' }
];

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
    case 'trigger.serviceType':
      return 'This billing trigger is only available for laboratory or radiology.';
    case 'paymentType.required':
      return 'Payment type is required.';
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

  const loadedTriggerOptions =
    useEnumOptions('BillingTrigger') ??
    [];

  const loadedPaymentOptions =
    useEnumOptions('BillingRulePaymentType') ??
    [];

  const paymentOptions =
    loadedPaymentOptions.length > 0
      ? loadedPaymentOptions
      : FALLBACK_PAYMENT_OPTIONS;

  const triggerOptions = useMemo(() => {
    const itemType = billingRule.billingItemType;

    return loadedTriggerOptions.filter(option => {
      if (option.value === 'COLLECT_SAMPLE') {
        return itemType === 'LABORATORY';
      }

      if (
        option.value === 'SUBMIT_ORDER' ||
        option.value === 'ACCEPT_ORDER' ||
        option.value === 'APPROVED'
      ) {
        return (
          itemType === 'LABORATORY' ||
          itemType === 'RADIOLOGY'
        );
      }

      return true;
    });
  }, [loadedTriggerOptions, billingRule.billingItemType]);

  useEffect(() => {
    if (!open || !billingRule.billingTrigger) {
      return;
    }

    const stillAllowed = triggerOptions.some(
      option => option.value === billingRule.billingTrigger
    );

    if (!stillAllowed) {
      setBillingRule(current => ({
        ...current,
        billingTrigger: 'ORDERED'
      }));
    }
  }, [
    open,
    billingRule.billingTrigger,
    setBillingRule,
    triggerOptions
  ]);

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

    if (
      billingRule.billingTrigger === 'COLLECT_SAMPLE' &&
      billingRule.billingItemType !== 'LABORATORY'
    ) {
      return 'Collect Sample is available for laboratory only.';
    }

    if (
      WORKFLOW_TRIGGERS.includes(billingRule.billingTrigger) &&
      billingRule.billingItemType !== 'LABORATORY' &&
      billingRule.billingItemType !== 'RADIOLOGY'
    ) {
      return 'This billing trigger is only available for laboratory or radiology.';
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
      paymentType:
        billingRule.paymentType ?? 'BOTH',
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
        required
        width="100%"
        fieldLabel="Payment Type"
        fieldType="select"
        fieldName="paymentType"
        selectData={paymentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={{
          ...billingRule,
          paymentType: billingRule.paymentType ?? 'BOTH'
        }}
        setRecord={setBillingRule}
        searchable={false}
      />

      {WORKFLOW_TRIGGERS.includes(
        billingRule.billingTrigger ?? ''
      ) ? (
        <p className="billing-rule-debit-note-hint">
          This trigger decides when the charge line is created for laboratory
          or radiology. The price calculation stays on the selected billing rule.
        </p>
      ) : null}

      {billingRule.billingTrigger === 'DEBIT_NOTE' ? (
        <p className="billing-rule-debit-note-hint">
          Use this trigger for catalog items that should be billable when added through a patient
          invoice debit note. The charge posts to billing calculation on issue.
        </p>
      ) : null}

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
