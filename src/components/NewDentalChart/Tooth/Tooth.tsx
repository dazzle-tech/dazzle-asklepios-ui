import React, { useMemo } from 'react';
import { getToothShapeType } from './toothShape';

interface ToothProps {
  chartTooth: any;
  selected?: boolean;
  type?: 'condition' | 'treatment';
  hasCondition?: boolean;
  hasTreatment?: boolean;
}

// Schematic (vector) tooth rendering -- replaces the old per-tooth photographic
// PNG set. Reuses the app's existing condition/treatment/selected color
// language (same hues the old canvas overlay used) so the visual meaning is
// unchanged. Crown shape varies by tooth type (incisor/canine/premolar/molar)
// and carries the clinical-state color; the root is a separate shape with its
// own fixed tone (conditions/treatments are marked on the visible crown, not
// the root) plus a thin nerve-line running through both for a more natural
// read. The old image-based components/assets are left in place, unused, as
// a fallback.
const COLORS = {
  normalFill: '#F5F0E8',
  normalStroke: '#C9C2B5',
  conditionFill: '#F44336',
  conditionStroke: '#C62828',
  treatmentFill: '#45B887',
  treatmentStroke: '#2E8B63',
  selectedStroke: '#007BFF',
  missingStroke: '#B0A99F',
  implantDot: '#4A4A4A',
  rootFill: '#D9B98F',
  rootStroke: '#B8965F',
  nerveStroke: '#E0665C'
};

// Crown only (ends at the neck, ~y=70); the root is a separate shared shape
// appended below. Incisor keeps a central ridge, canine a sharp asymmetric
// point, premolar a visible notch between its two cusps, molar four cusps.
const CROWN_PATHS: Record<'incisor' | 'canine' | 'premolar' | 'molar', string> = {
  incisor: 'M 20,16 C 14,16 12,20 12,26 L 11,60 C 11,66 14,70 20,70 L 24,70 C 30,70 33,66 33,60 L 32,26 C 32,20 26,16 20,16 Z',
  canine: 'M 23,4 C 28,5 32,13 32,20 L 31,56 C 31,63 27,70 22,70 C 17,70 13,63 13,56 L 12,20 C 12,13 17,5 23,4 Z',
  premolar:
    'M 8,32 C 8,22 11,15 15,17 C 17,18 18,22 20,22 C 20.5,22 21,20 21,19 L 23,19 C 23,20 23.5,22 24,22 C 26,22 27,18 29,17 C 33,15 36,22 36,32 L 36,60 C 36,67 31,70 22,70 C 13,70 8,67 8,60 Z',
  molar:
    'M 4,34 C 4,24 7,17 11,19 C 13,20 13,23 16,23 C 17,23 17.5,21 18,20 L 20,20 C 20,21.5 20.5,23 22,23 C 23.5,23 24,21.5 24,20 L 26,20 C 26,21 26.5,23 28,23 C 31,23 31,20 33,19 C 37,17 40,24 40,34 L 40,60 C 40,67 35,70 22,70 C 9,70 4,67 4,60 Z'
};

const ROOT_PATH =
  'M 15,68 C 14,74 16,80 17,88 C 17.5,93 20,97 22,97 C 24,97 26.5,93 27,88 C 28,80 30,74 29,68 C 27,71 17,71 15,68 Z';

const NERVE_PATH = 'M 22,22 C 21,40 21,58 22,94';

const Tooth = ({
  chartTooth,
  selected = false,
  hasCondition = false,
  hasTreatment = false
}: ToothProps) => {
  const hasImplant = useMemo(() => {
    return chartTooth?.actions?.some((action: any) => action.imageName === 'Implant');
  }, [chartTooth?.actions]);

  const missing = Boolean(chartTooth?.missing);
  const shapeType = chartTooth?.toothNumber ? getToothShapeType(chartTooth.toothNumber) : 'incisor';

  const crownFill = hasCondition ? COLORS.conditionFill : hasTreatment ? COLORS.treatmentFill : COLORS.normalFill;
  const crownStroke = hasCondition ? COLORS.conditionStroke : hasTreatment ? COLORS.treatmentStroke : COLORS.normalStroke;
  const showSecondaryTreatmentDot = hasCondition && hasTreatment;

  if (missing) {
    return (
      <svg viewBox="0 0 44 104" width="100%" style={{ display: 'block' }}>
        <rect
          x={4}
          y={10}
          width={36}
          height={84}
          rx={9}
          fill="none"
          stroke={COLORS.missingStroke}
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 44 104" width="100%" style={{ display: 'block' }}>
      {selected && (
        <rect
          x={0}
          y={2}
          width={44}
          height={96}
          rx={10}
          fill="none"
          stroke={COLORS.selectedStroke}
          strokeWidth={2.5}
          strokeDasharray="3,3"
        />
      )}
      <path d={ROOT_PATH} fill={COLORS.rootFill} stroke={COLORS.rootStroke} strokeWidth={1.3} />
      <path d={CROWN_PATHS[shapeType]} fill={crownFill} stroke={crownStroke} strokeWidth={1.5} />
      <path d={NERVE_PATH} fill="none" stroke={COLORS.nerveStroke} strokeWidth={1.2} opacity={0.7} />
      {shapeType === 'molar' && !hasImplant && <circle cx={22} cy={40} r={2} fill={crownStroke} opacity={0.6} />}
      {hasImplant && <circle cx={22} cy={66} r={5} fill={COLORS.implantDot} />}
      {showSecondaryTreatmentDot && <circle cx={34} cy={20} r={5} fill={COLORS.treatmentFill} stroke={COLORS.treatmentStroke} strokeWidth={1} />}
    </svg>
  );
};

export default React.memo(Tooth);
