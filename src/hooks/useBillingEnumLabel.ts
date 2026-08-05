import { useMemo } from 'react';

import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';

type EnumOption = {
  value: string;
  label: string;
};

export const resolveEnumOptionLabel = (
  options: EnumOption[],
  value?: string | null,
  fallback = '-'
): string => {
  if (!value) {
    return fallback;
  }

  return (
    options.find(option => option.value === value)?.label ??
    formatEnumString(value)
  );
};

export const useBillingTriggerLabel = (
  value?: string | null
): string => {
  const options = useEnumOptions('BillingTrigger');
  return useMemo(
    () => resolveEnumOptionLabel(options, value),
    [options, value]
  );
};

export const useBillingEventTypeLabel = (
  value?: string | null
): string => {
  const options = useEnumOptions('BillingEventType');
  return useMemo(
    () => resolveEnumOptionLabel(options, value),
    [options, value]
  );
};

export const useBillingSettlementPathLabel = (
  value?: string | null
): string => {
  const options = useEnumOptions('BillingSettlementPath');
  return useMemo(
    () => resolveEnumOptionLabel(options, value),
    [options, value]
  );
};
