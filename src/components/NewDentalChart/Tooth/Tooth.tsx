import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

interface ToothProps {
  chartTooth: any;
  selected?: boolean;
  type?: 'condition' | 'treatment';
  hasCondition?: boolean;
  hasTreatment?: boolean;
}

const Tooth = ({
  chartTooth,
  selected = false,
  type,
  hasCondition = false,
  hasTreatment = false
}: ToothProps) => {
  const [overlayImage, setOverlayImage] = useState<string | null>(null);

  const hasImplant = useMemo(() => {
    return chartTooth?.toothActions?.some((action: any) => action.imageName === 'Implant');
  }, [chartTooth?.toothActions]);

  const loadBaseImage = (toothNumber: string): string | undefined => {
    try {
      const context = require.context('./images', true, /\.png$/);
      const imageModule = context(`./Tooth_${toothNumber}_vertical.png`);
      return imageModule.default || imageModule;
    } catch (error) {
      console.error(`Error loading image for Tooth_${toothNumber}_vertical.png`, error);
      return undefined;
    }
  };

  const createColorOverlay = async (
    imageUrl: string,
    condition: boolean,
    treatment: boolean,
    isSelected: boolean
  ) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = img.width;
    overlayCanvas.height = img.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    let fillStyle: string | CanvasGradient = 'rgba(34, 100, 229, 0.6)'; // Default blue

    if (!isSelected) {
      if (condition && treatment) {
        const gradient = overlayCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(244, 67, 54, 0.6)');
        gradient.addColorStop(1, 'rgba(69, 184, 135, 0.6)');
        fillStyle = gradient;
      } else if (condition) {
        fillStyle = 'rgba(244, 67, 54, 0.6)';
      } else if (treatment) {
        fillStyle = 'rgba(69, 184, 135, 0.6)';
      }
    }

    overlayCtx.fillStyle = fillStyle;
    overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    overlayCtx.globalCompositeOperation = 'destination-in';
    overlayCtx.drawImage(img, 0, 0);

    if (isSelected) {
      overlayCtx.globalCompositeOperation = 'source-over';
      overlayCtx.fillStyle = 'rgba(0, 123, 255, 0.3)';
      overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      overlayCtx.globalCompositeOperation = 'destination-in';
      overlayCtx.drawImage(img, 0, 0);
    }

    setOverlayImage(overlayCanvas.toDataURL());
  };

  useEffect(() => {
    const baseImage = loadBaseImage(chartTooth?.toothNumber);
    if (!chartTooth?.missing && !hasImplant && baseImage) {
      if (hasCondition || hasTreatment || selected || chartTooth?.toothActions?.length > 0) {
        createColorOverlay(baseImage, hasCondition, hasTreatment, selected);
      } else {
        setOverlayImage(null);
      }
    } else {
      setOverlayImage(null);
    }
  }, [chartTooth, hasImplant, hasCondition, hasTreatment, selected]);

  const baseToothImage = loadBaseImage(chartTooth?.toothNumber);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {!chartTooth?.missing && !hasImplant && (
        <>
          <img
            src={baseToothImage || '/placeholder.svg'}
            alt={`Tooth ${chartTooth?.toothNumber}`}
            className={clsx({
              treatment: type === 'treatment',
              condition: type === 'condition',
              selected
            })}
            style={{ display: 'block' }}
          />
          {overlayImage && (
            <img
              src={overlayImage}
              alt="Overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(Tooth);
