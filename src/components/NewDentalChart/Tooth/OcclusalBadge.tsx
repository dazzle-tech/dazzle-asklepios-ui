import React, { useMemo } from 'react';
import { ToothShapeType } from './toothShape';

interface OcclusalBadgeProps {
  shapeType: ToothShapeType;
  // e.g. { MESIAL: 'condition', DISTAL: 'treatment' } -- one entry per
  // surface that has an active (non-cancelled) action on this tooth.
  surfaceStates: Record<string, 'condition' | 'treatment'>;
}

const COLORS = {
  normalFill: '#F5F0E8',
  normalStroke: '#C9C2B5',
  conditionFill: '#F44336',
  conditionStroke: '#C62828',
  treatmentFill: '#45B887',
  treatmentStroke: '#2E8B63'
};

type Zone = 'mesial' | 'distal' | 'buccal' | 'lingual';

// incisor/canine only mark mesial/distal (no distinct buccal/lingual cusps
// worth charting); premolar/molar mark all four. Anything that doesn't map
// to a specific zone (OCCLUSAL/INCISAL/WHOLE_TOOTH) colors the whole badge.
const ZONE_SURFACES: Record<Zone, string[]> = {
  mesial: ['MESIAL'],
  distal: ['DISTAL'],
  buccal: ['BUCCAL', 'FACIAL'],
  lingual: ['LINGUAL']
};
const WHOLE_SURFACES = ['OCCLUSAL', 'INCISAL', 'WHOLE_TOOTH'];

const stateColor = (state?: 'condition' | 'treatment') => {
  if (state === 'condition') return { fill: COLORS.conditionFill, stroke: COLORS.conditionStroke };
  if (state === 'treatment') return { fill: COLORS.treatmentFill, stroke: COLORS.treatmentStroke };
  return { fill: COLORS.normalFill, stroke: COLORS.normalStroke };
};

const OcclusalBadge: React.FC<OcclusalBadgeProps> = ({ shapeType, surfaceStates }) => {
  const wholeState = useMemo(() => {
    if (WHOLE_SURFACES.some(s => surfaceStates[s] === 'condition')) return 'condition' as const;
    if (WHOLE_SURFACES.some(s => surfaceStates[s] === 'treatment')) return 'treatment' as const;
    return undefined;
  }, [surfaceStates]);

  const zoneState = (zone: Zone): 'condition' | 'treatment' | undefined => {
    if (wholeState) return wholeState;
    const surfaces = ZONE_SURFACES[zone];
    if (surfaces.some(s => surfaceStates[s] === 'condition')) return 'condition';
    if (surfaces.some(s => surfaceStates[s] === 'treatment')) return 'treatment';
    return undefined;
  };

  const mesial = stateColor(zoneState('mesial'));
  const distal = stateColor(zoneState('distal'));

  // Anterior teeth (incisor/canine): flat edge or single pointed cusp --
  // only mesial/distal halves are meaningful.
  if (shapeType === 'incisor' || shapeType === 'canine') {
    const isIncisor = shapeType === 'incisor';
    const left = isIncisor
      ? 'M 17,11 C 11,11 6,13 6,17 C 6,21 11,23 17,23 Z'
      : 'M 17,6 C 12,8 8,13 8,17 C 8,21 12,26 17,28 Z';
    const right = isIncisor
      ? 'M 17,11 C 23,11 28,13 28,17 C 28,21 23,23 17,23 Z'
      : 'M 17,6 C 22,8 26,13 26,17 C 26,21 22,26 17,28 Z';
    const [topY, bottomY] = isIncisor ? [11, 23] : [6, 28];

    return (
      <svg viewBox="0 0 34 34" width="100%" style={{ display: 'block' }}>
        <path d={left} fill={mesial.fill} stroke={mesial.stroke} strokeWidth={1} />
        <path d={right} fill={distal.fill} stroke={distal.stroke} strokeWidth={1} />
        <line x1={17} y1={topY} x2={17} y2={bottomY} stroke={COLORS.normalStroke} strokeWidth={1} />
        <circle cx={17} cy={17} r={2} fill={COLORS.normalStroke} />
      </svg>
    );
  }

  // Posterior teeth (premolar/molar): four cusp zones. Premolar uses a
  // narrower/oval footprint, molar a broader/squarer one.
  const buccal = stateColor(zoneState('buccal'));
  const lingual = stateColor(zoneState('lingual'));
  const petals =
    shapeType === 'premolar'
      ? {
          buccal: 'M 17,17 C 13,14 11,8 17,5 C 23,8 21,14 17,17 Z',
          distal: 'M 17,17 C 19,13 25,11 28,17 C 25,23 19,21 17,17 Z',
          lingual: 'M 17,17 C 21,20 23,26 17,29 C 11,26 13,20 17,17 Z',
          mesial: 'M 17,17 C 15,21 9,23 6,17 C 9,11 15,13 17,17 Z'
        }
      : {
          buccal: 'M 17,17 C 11,14 9,6 17,3 C 25,6 23,14 17,17 Z',
          distal: 'M 17,17 C 20,11 28,9 31,17 C 28,25 20,23 17,17 Z',
          lingual: 'M 17,17 C 23,20 25,28 17,31 C 9,28 11,20 17,17 Z',
          mesial: 'M 17,17 C 14,23 6,25 3,17 C 6,9 14,11 17,17 Z'
        };

  return (
    <svg viewBox="0 0 34 34" width="100%" style={{ display: 'block' }}>
      <path d={petals.buccal} fill={buccal.fill} stroke={buccal.stroke} strokeWidth={1} />
      <path d={petals.distal} fill={distal.fill} stroke={distal.stroke} strokeWidth={1} />
      <path d={petals.lingual} fill={lingual.fill} stroke={lingual.stroke} strokeWidth={1} />
      <path d={petals.mesial} fill={mesial.fill} stroke={mesial.stroke} strokeWidth={1} />
      <circle cx={17} cy={17} r={2} fill={COLORS.normalStroke} />
    </svg>
  );
};

export default React.memo(OcclusalBadge);
