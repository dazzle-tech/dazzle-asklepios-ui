/**
 * Color tooth artwork for permanent and primary teeth.
 * Color01–Color32 outer and occlusal SVGs live beside this module.
 */
import { toothImageCodeFromEnum, isPrimaryTooth } from '@/utils/toothNumber';

// Webpack require.context — returns URL strings via asset/resource.
const outerContext = require.context('./assets/color', false, /^\.\/Color\d{2}\.outer\.svg$/);
const primaryOuterContext = require.context('./assets/pediatric', false, /^\.\/Color[A-T]\.outer\.svg$/);
const primaryOcclusalContext = require.context('./assets/pediatric', false, /^\.\/Color[A-T]\.occlusal\.svg$/);
const occlusalContext = require.context('./assets/color', false, /^\.\/Color\d{2}\.occlusal\.svg$/);

function resolve(context: any, code: string, view: 'outer' | 'occlusal'): string | null {
  const key = `./Color${code}.${view}.svg`;
  try {
    const mod = context(key);
    return (mod && mod.default) || mod || null;
  } catch {
    return null;
  }
}

export function getAdultOuterSrc(toothNumber: string): string | null {
  if (!toothNumber || isPrimaryTooth(toothNumber)) return null;
  return resolve(outerContext, toothImageCodeFromEnum(toothNumber), 'outer');
}

export function getAdultOcclusalSrc(toothNumber: string): string | null {
  if (!toothNumber || isPrimaryTooth(toothNumber)) return null;
  return resolve(occlusalContext, toothImageCodeFromEnum(toothNumber), 'occlusal');
}

/** Primary artwork keeps the stable ToothA–ToothT identity (never mapped to a permanent number). */
export function getPrimaryOuterSrc(toothNumber: string): string | null {
  const match = /^Tooth([A-T])$/.exec(toothNumber || '');
  return match ? resolve(primaryOuterContext, match[1], 'outer') : null;
}

export function getPrimaryOcclusalSrc(toothNumber: string): string | null {
  const match = /^Tooth([A-T])$/.exec(toothNumber || '');
  return match ? resolve(primaryOcclusalContext, match[1], 'occlusal') : null;
}
