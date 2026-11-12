/**
 * Helpers for the backend tooth-number identifier string. Two schemes share
 * the same "Tooth" prefix:
 * - Permanent teeth: "Tooth1".."Tooth32" (ToothNumber enum)
 * - Primary/child teeth: "ToothA".."ToothT" (PrimaryToothNumber enum)
 * Both are detected automatically from the string itself -- nothing else in
 * the UI needs to know which chart type is active.
 */

import {
  MIXED_ARCH_SLOT_COUNT,
  MIXED_PRIMARY_SLOT_OFFSET,
  PERMANENT_LOWER_IDS,
  PERMANENT_UPPER_IDS,
  PRIMARY_LOWER_IDS,
  PRIMARY_UPPER_IDS,
  toothDisplayLabelForSystem
} from '@/utils/toothNumberingSystems';

const isPrimaryToothLetter = (remainder: string): boolean => /^[A-T]$/.test(remainder);

/** 1-based position within the tooth set (1-32 for permanent, 1-20 for primary). */
export const toothIndexFromEnum = (toothNumber: string): number => {
  const remainder = toothNumber.replace('Tooth', '');
  if (isPrimaryToothLetter(remainder)) {
    return remainder.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  }
  return parseInt(remainder, 10);
};

/** True for "ToothA".."ToothT" (primary/child tooth identifiers). */
export const isPrimaryTooth = (toothNumber: string): boolean =>
  isPrimaryToothLetter(toothNumber.replace('Tooth', ''));

/**
 * Zero-padded image-asset code (e.g. "05") used by the legacy
 * `Tooth_XX_vertical.png` image files. Only meaningful for permanent teeth --
 * there are no corresponding images for primary teeth, callers should expect
 * `undefined`/no image in that case (handled gracefully by the legacy
 * image-loading try/catch).
 */
export const toothImageCodeFromEnum = (toothNumber: string): string =>
  toothIndexFromEnum(toothNumber).toString().padStart(2, '0');

/**
 * Short label dentists actually use. When a chart numbering system is provided,
 * use Universal / FDI / Palmer labels; otherwise fall back to Universal remnant.
 */
export const toothDisplayLabel = (
  toothNumber: string,
  numberingSystem?: string | null
): string => {
  if (numberingSystem) {
    return toothDisplayLabelForSystem(toothNumber, numberingSystem);
  }
  return toothNumber.replace('Tooth', '');
};

/** CSS class suffix matching styles.less's per-tooth width overrides (zero-padded, permanent only). */
export const toothCssClassSuffix = (toothNumber: string): string =>
  isPrimaryTooth(toothNumber)
    ? toothNumber.replace('Tooth', '')
    : toothImageCodeFromEnum(toothNumber);

export type TreatmentAreaScope =
  | 'SPECIFIC_TOOTH'
  | 'UPPER_ARCH'
  | 'LOWER_ARCH'
  | 'FULL_MOUTH';

const UPPER_ARCH_ORDER = [...PERMANENT_UPPER_IDS, ...PRIMARY_UPPER_IDS];
const LOWER_ARCH_ORDER = [...PERMANENT_LOWER_IDS, ...PRIMARY_LOWER_IDS];
const UPPER_ARCH_SET = new Set(UPPER_ARCH_ORDER);
const LOWER_ARCH_SET = new Set(LOWER_ARCH_ORDER);

/** Scheme-aware upper-arch membership (permanent 1–16 / primary A–J). */
export const isUpperArchTooth = (toothNumber?: string | null): boolean => {
  if (!toothNumber) return false;
  if (UPPER_ARCH_SET.has(toothNumber)) return true;
  if (LOWER_ARCH_SET.has(toothNumber)) return false;
  // Fallback for unexpected ids: permanent index ≤16 or primary index ≤10.
  if (isPrimaryTooth(toothNumber)) {
    return toothIndexFromEnum(toothNumber) <= 10;
  }
  return toothIndexFromEnum(toothNumber) <= 16;
};

const orderIndex = (toothNumber: string, order: string[]): number => {
  const idx = order.indexOf(toothNumber);
  return idx >= 0 ? idx : 9999;
};

/**
 * Split chart teeth into upper/lower by dentition scheme (not length/2).
 * Safe for MIXED inventories that mix primary and permanent ids.
 */
export const splitChartTeethByArch = <T extends { toothNumber?: string | null }>(
  teeth: T[] | null | undefined
): { upper: T[]; lower: T[]; all: T[] } => {
  const list = Array.isArray(teeth) ? [...teeth] : [];
  if (!list.length) {
    return { upper: [], lower: [], all: [] };
  }

  const withNumbers = list.filter(t => t?.toothNumber);
  const upper = withNumbers
    .filter(t => isUpperArchTooth(String(t.toothNumber)))
    .sort(
      (a, b) =>
        orderIndex(String(a.toothNumber), UPPER_ARCH_ORDER) -
        orderIndex(String(b.toothNumber), UPPER_ARCH_ORDER)
    );
  const lower = withNumbers
    .filter(t => !isUpperArchTooth(String(t.toothNumber)))
    .sort(
      (a, b) =>
        orderIndex(String(a.toothNumber), LOWER_ARCH_ORDER) -
        orderIndex(String(b.toothNumber), LOWER_ARCH_ORDER)
    );

  return { upper, lower, all: [...upper, ...lower] };
};

export type MixedArchSlots<T> = {
  permanent: Array<T | null>;
  primary: Array<T | null>;
};

/**
 * Map an arch's saved teeth onto stable anatomical permanent/primary slots.
 * Missing ids become null placeholders so siblings do not shift.
 */
export const buildMixedArchSlots = <T extends { toothNumber?: string | null }>(
  archTeeth: T[] | null | undefined,
  arch: 'upper' | 'lower'
): MixedArchSlots<T> => {
  const permanentIds = arch === 'upper' ? PERMANENT_UPPER_IDS : PERMANENT_LOWER_IDS;
  const primaryIds = arch === 'upper' ? PRIMARY_UPPER_IDS : PRIMARY_LOWER_IDS;
  const byNumber = new Map<string, T>();
  (archTeeth ?? []).forEach(tooth => {
    if (tooth?.toothNumber) {
      byNumber.set(String(tooth.toothNumber), tooth);
    }
  });
  return {
    permanent: permanentIds.map(id => byNumber.get(id) ?? null),
    primary: primaryIds.map(id => byNumber.get(id) ?? null)
  };
};

/**
 * Pad primary slots into the shared 16-column arch so they align under
 * permanent positions 4–13 (outer molar columns stay empty).
 */
export const padPrimarySlotsToArch = <T>(
  primarySlots: Array<T | null>
): Array<T | null> => {
  const leading = Array.from({ length: MIXED_PRIMARY_SLOT_OFFSET }, () => null);
  const trailing = Array.from(
    {
      length: Math.max(
        0,
        MIXED_ARCH_SLOT_COUNT - MIXED_PRIMARY_SLOT_OFFSET - primarySlots.length
      )
    },
    () => null
  );
  return [...leading, ...primarySlots, ...trailing];
};

/** Fixed midline index for the 16-column mixed/adult arch (after UR/LR 8). */
export const MIXED_ARCH_MIDLINE_INDEX = 8;

export const teethForTreatmentScope = <T extends { toothNumber?: string | null }>(
  teeth: T[] | null | undefined,
  scope: TreatmentAreaScope
): T[] => {
  const { upper, lower, all } = splitChartTeethByArch(teeth);
  switch (scope) {
    case 'UPPER_ARCH':
      return upper;
    case 'LOWER_ARCH':
      return lower;
    case 'FULL_MOUTH':
      return all;
    default:
      return [];
  }
};

export const treatmentScopeLabel = (scope?: string | null): string => {
  switch (scope) {
    case 'UPPER_ARCH':
      return 'Upper Arch';
    case 'LOWER_ARCH':
      return 'Lower Arch';
    case 'FULL_MOUTH':
      return 'Full Mouth';
    default:
      return 'Specific Teeth';
  }
};
