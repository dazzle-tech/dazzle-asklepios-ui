/**
 * Helpers for converting the backend `ToothNumber` enum string (e.g. "Tooth5")
 * into the numeric tooth index and the zero-padded image-asset code (e.g. "05")
 * used by the `Tooth_XX_vertical.png` image files, which are unchanged from the
 * legacy zero-padded numbering scheme.
 */

export const toothIndexFromEnum = (toothNumber: string): number =>
  parseInt(toothNumber.replace('Tooth', ''), 10);

export const toothImageCodeFromEnum = (toothNumber: string): string =>
  toothIndexFromEnum(toothNumber).toString().padStart(2, '0');
