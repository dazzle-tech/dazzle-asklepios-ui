import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useMemo } from 'react';

const byDisplayValue = (a: any, b: any) =>
  String(a?.lovDisplayVale ?? '').localeCompare(String(b?.lovDisplayVale ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  });

/** LOV values come back in no fixed order; lists show them ascending by display value. */
export const useSortedLovQuery = (code: string) => {
  const { data } = useGetLovValuesByCodeQuery(code);
  const sorted = useMemo(
    () => (data?.object ? { ...data, object: data.object.slice().sort(byDisplayValue) } : data),
    [data]
  );
  return { data: sorted };
};
