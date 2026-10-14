import { toothIndexFromEnum, isPrimaryTooth } from '@/utils/toothNumber';

export type ToothShapeType = 'incisor' | 'canine' | 'premolar' | 'molar';

// Permanent teeth (Universal Numbering System, Tooth1..Tooth32): each
// quadrant is 8 teeth, ordered either back-to-front (molar..incisor) or
// front-to-back (incisor..molar) depending on which side of the arch it's on.
function getPermanentToothShapeType(index: number): ToothShapeType {
  const posInBlock = ((index - 1) % 8) + 1;
  const blockIndex = Math.floor((index - 1) / 8);
  const mirrored = blockIndex === 1 || blockIndex === 3;

  if (!mirrored) {
    if (posInBlock <= 3) return 'molar';
    if (posInBlock <= 5) return 'premolar';
    if (posInBlock === 6) return 'canine';
    return 'incisor';
  }

  if (posInBlock <= 2) return 'incisor';
  if (posInBlock === 3) return 'canine';
  if (posInBlock <= 5) return 'premolar';
  return 'molar';
}

// Primary/deciduous teeth (ToothA..ToothT): each quadrant is only 5 teeth --
// no premolars at all in primary dentition, just 2 molars, 1 canine, 2
// incisors per quadrant.
function getPrimaryToothShapeType(index: number): ToothShapeType {
  const posInBlock = ((index - 1) % 5) + 1;
  const blockIndex = Math.floor((index - 1) / 5);
  const mirrored = blockIndex === 1 || blockIndex === 3;

  if (!mirrored) {
    if (posInBlock <= 2) return 'molar';
    if (posInBlock === 3) return 'canine';
    return 'incisor';
  }

  if (posInBlock <= 2) return 'incisor';
  if (posInBlock === 3) return 'canine';
  return 'molar';
}

export function getToothShapeType(toothNumber: string): ToothShapeType {
  const index = toothIndexFromEnum(toothNumber);
  return isPrimaryTooth(toothNumber) ? getPrimaryToothShapeType(index) : getPermanentToothShapeType(index);
}
