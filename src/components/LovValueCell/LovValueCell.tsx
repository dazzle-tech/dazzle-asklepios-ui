import React, { useMemo } from 'react';
import { useGetLovValuesBulkByKeysQuery } from '@/services/setupService';

type Props = {
  valueKey?: string | number | null;
  fallback?: React.ReactNode;
};

const LovValueCell = ({
  valueKey,
  fallback = '-'
}: Props) => {
  const keys = useMemo(
    () =>
      String(valueKey ?? '')
        .split(',')
        .map(key => key.trim())
        .filter(Boolean),
    [valueKey]
  );
console.log("keys:", keys)
  const { data } = useGetLovValuesBulkByKeysQuery(keys, {
    skip: keys.length === 0
  });

  const displayValue = useMemo(() => {
    if (keys.length === 0) {
      return fallback;
    }

    const values = data?.object ?? [];

    const labels = keys.map(key => {
      const item = values.find(
        (value: any) => String(value.key) === String(key)
      );

      return (
        item?.lovDisplayVale ??
        key
      );
    });

    return labels.join(', ');
  }, [data, fallback, keys]);

  return <>{displayValue}</>;
};

export default LovValueCell;