import React from 'react';
import OcclusalBadge from './OcclusalBadge';
import { getToothShapeType } from './toothShape';
import { getAdultOcclusalSrc } from './colorAssets';

interface AdultOcclusalProps {
  toothNumber: string;
  surfaceStates: Record<string, 'condition' | 'treatment'>;
  selected?: boolean;
}

/**
 * Permanent-tooth occlusal cell: Color artwork base + OcclusalBadge overlay
 * for surface condition/treatment (Color SVGs have no semantic surface zones).
 */
const AdultOcclusal: React.FC<AdultOcclusalProps> = ({ toothNumber, surfaceStates, selected }) => {
  const src = getAdultOcclusalSrc(toothNumber);
  const shapeType = getToothShapeType(toothNumber);

  if (!src) {
    return <OcclusalBadge shapeType={shapeType} surfaceStates={surfaceStates} />;
  }

  return (
    <div className={`adult-occlusal${selected ? ' selected' : ''}`}>
      <img src={src} alt="" draggable={false} className="adult-occlusal-img" />
      <div className="adult-occlusal-zones">
        <OcclusalBadge shapeType={shapeType} surfaceStates={surfaceStates} overlay />
      </div>
    </div>
  );
};

export default React.memo(AdultOcclusal);
