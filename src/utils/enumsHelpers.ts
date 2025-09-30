import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { enumsApi } from '@/services/enumsApi';

/** Title-case helper for labels */
export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Subscribes to enums and returns the array for a given key.
 * This both TRIGGERS the fetch (if not in cache) and SUBSCRIBES to updates.
 */
export function useEnumByName(name: string): readonly string[] {
  // Ensure there is an active subscription (and trigger fetch if needed)
  enumsApi.useGetEnumsQuery(undefined, { refetchOnMountOrArgChange: false });

  // Subscribe to RTK Query cache for getEnums
  const selectEnums = useMemo(() => enumsApi.endpoints.getEnums.select(), []);
  const { data } = useSelector(selectEnums);

  return data?.[name] ?? [];
}

/** Returns [{ value, label }] for selects, radios, etc., while subscribed. */
export function useEnumOptions(name: string): { value: string; label: string }[] {
  const values = useEnumByName(name);
  return useMemo(
    () => values.map(v => ({ value: v, label: formatEnumLabel(v) })),
    [values]
  );
}
