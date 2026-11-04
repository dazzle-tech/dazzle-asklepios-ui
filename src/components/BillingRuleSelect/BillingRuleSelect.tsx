import React, { useMemo } from 'react';

import MyInput from '@/components/MyInput';
import { useGetBillingRulesQuery } from '@/services/setup/billingRuleSetup/billingRuleSetupService';

import type { BillingItemType } from '@/types/model-types-new';

type BillingRuleSelectProps<T extends { billingRuleId?: number | null }> = {
  billingItemType?: BillingItemType | null;
  record: T;
  setRecord: React.Dispatch<React.SetStateAction<T>>;
  width?: string;
  required?: boolean;
  disabled?: boolean;
};

export const testTypeToBillingItemType = (
  testType?: string | null
): BillingItemType | null => {
  if (!testType) {
    return null;
  }

  switch (testType) {
    case 'LABORATORY':
    case 'MICROBIOLOGY':
      return 'LABORATORY';
    case 'RADIOLOGY':
      return 'RADIOLOGY';
    case 'PATHOLOGY':
      return 'PATHOLOGY';
    default:
      return null;
  }
};

const BillingRuleSelect = <T extends { billingRuleId?: number | null }>({
  billingItemType,
  record,
  setRecord,
  width = '100%',
  required = false,
  disabled = false
}: BillingRuleSelectProps<T>) => {
  const { data: billingRulesResponse, isFetching } = useGetBillingRulesQuery(
    {
      page: 0,
      size: 200,
      sort: 'name,asc',
      billingItemType: billingItemType ?? undefined
    },
    { skip: !billingItemType }
  );

  const selectData = useMemo(
    () =>
      (billingRulesResponse?.data ?? []).map(rule => ({
        ...rule,
        displayName: rule.isDefault
          ? `${rule.name ?? ''} (Default)`
          : (rule.name ?? '')
      })),
    [billingRulesResponse?.data]
  );

  return (
    <MyInput
      width={width}
      fieldLabel="Billing Rule"
      fieldName="billingRuleId"
      fieldType="select"
      selectData={selectData}
      selectDataLabel="displayName"
      selectDataValue="id"
      record={record}
      setRecord={setRecord}
      required={required}
      disabled={disabled || !billingItemType || isFetching}
      placeholder={
        !billingItemType
          ? 'Select item type first'
          : isFetching
            ? 'Loading billing rules...'
            : undefined
      }
    />
  );
};

export default BillingRuleSelect;
