import { store } from '@/store';
import { enumsApi } from '@/services/enumsApi';

/** Get the enum list by name from RTK Query cache (empty array if not loaded/missing). */
export function getEnumByName(name: string): readonly string[] {
  const state = store.getState();
  const sel = enumsApi.endpoints.getEnums.select()(state);
  return sel?.data?.[name] ?? [];
}

/** Convert "VERY_HIGH_RISK" -> "Very High Risk". */
export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Return [{value, label}, ...] for use in selects, radios, etc. */
export function getEnumOptions(name: string): { value: string; label: string }[] {
  const values = getEnumByName(name);
  return values.map(v => ({
    value: v,
    label: formatEnumLabel(v),
  }));
}
