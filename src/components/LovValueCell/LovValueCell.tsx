import React, { useMemo } from 'react';
import { useGetLovAllValuesQuery, useGetLovsQuery } from '@/services/setupService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';

type Props = {
  valueKey?: string | number | null;
  lovCode?: string | number | null;
  listOfValueId?: string | number | null;
  fallback?: React.ReactNode;
};

const LovValueCell = ({
  valueKey,
  lovCode,
  listOfValueId,
  fallback = '-'
}: Props) => {
  const { data: lovDefinitions } = useGetLovsQuery({
    ...initialListRequest,
    pageSize: 1000
  });

  const { data: allLovValues } = useGetLovAllValuesQuery({
    ...initialListRequestAllValues
  });

  const resolvedLovCode = useMemo(() => {
    if (lovCode != null && lovCode !== '') {
      return String(lovCode);
    }

    if (listOfValueId == null || listOfValueId === '') {
      return null;
    }

    const lovDef = lovDefinitions?.object?.find(
      (item: any) => String(item.key) === String(listOfValueId)
    );

    return lovDef?.lovCode ? String(lovDef.lovCode) : null;
  }, [lovCode, listOfValueId, lovDefinitions]);

  const displayValue = useMemo(() => {
    if (valueKey == null || valueKey === '') {
      return fallback;
    }

    const values = allLovValues?.object ?? [];
    const matchingValues = resolvedLovCode
      ? values.filter(
          (item: any) =>
            String(item.lovCode ?? item.code ?? item.key) === String(resolvedLovCode)
        )
      : values;

    const matchedItem = matchingValues.find(
      (item: any) => String(item.key) === String(valueKey)
    );

    return (
      matchedItem?.lovDisplayVale ??
      matchedItem?.lovDisplayValue ??
      valueKey ??
      fallback
    );
  }, [allLovValues, fallback, resolvedLovCode, valueKey]);

  return <>{displayValue}</>;
};

export default LovValueCell;
