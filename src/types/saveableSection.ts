/**
 * A form section a parent can save through a ref (e.g. "Save All" in the ambient draft popup).
 * save() runs the section's own validation and save, and resolves to true when it was saved.
 */
export type SaveableSectionHandle = {
  save: () => Promise<boolean>;
};

/** Prefill values without null / undefined, so they never clear a field */
export const withoutEmptyValues = <T extends object>(values?: Partial<T> | null): Partial<T> =>
  Object.fromEntries(
    Object.entries(values ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '')
  ) as Partial<T>;
