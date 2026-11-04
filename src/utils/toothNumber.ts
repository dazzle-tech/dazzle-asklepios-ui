/**
 * Helpers for the backend tooth-number identifier string. Two schemes share
 * the same "Tooth" prefix:
 * - Permanent teeth: "Tooth1".."Tooth32" (ToothNumber enum)
 * - Primary/child teeth: "ToothA".."ToothT" (PrimaryToothNumber enum)
 * Both are detected automatically from the string itself -- nothing else in
 * the UI needs to know which chart type is active.
 */

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

/** Short label dentists actually use: the number (permanent) or the letter (primary). */
export const toothDisplayLabel = (toothNumber: string): string => toothNumber.replace('Tooth', '');

/** CSS class suffix matching styles.less's per-tooth width overrides (zero-padded, permanent only). */
export const toothCssClassSuffix = (toothNumber: string): string =>
  isPrimaryTooth(toothNumber) ? toothDisplayLabel(toothNumber) : toothImageCodeFromEnum(toothNumber);
