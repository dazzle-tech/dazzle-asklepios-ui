import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

const Tooth = ({ chartTooth, selected, type = undefined }) => {
  const [coloredImage, setColoredImage] = useState<string | null>(null);

  const hasImplant = () => {
    return chartTooth.toothActions.some(action => action.imageName === 'Implant');
  };

  const loadBaseImage = (toothNumber: string): string | undefined => {
    try {
      const context = require.context('./images', true, /\.png$/);
      const imageModule = context(`./Tooth_${toothNumber}_vertical.png`);
      return (imageModule as any).default || imageModule;
    } catch (error) {
      console.error(`Error loading base image: Tooth_${toothNumber}_vertical.png`, error);
      return null;
    }
  };

  const fillWhitePartsOnly = (imageUrl: string, fillColor: string, selected: boolean) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const fillRGB = hexToRGB(fillColor);
      const blueRGB = { r: 0, g: 123, b: 255 };

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2],
          a = data[i + 3];

        // Only fill white pixels (tolerance optional)
        if (r > 240 && g > 240 && b > 240 && a > 0 && !selected) {
          data[i] = fillRGB.r;
          data[i + 1] = fillRGB.g;
          data[i + 2] = fillRGB.b;
        }

        // Optional: overlay blue tint if selected (on all visible pixels)
        if (selected && a > 0) {
          data[i] = (data[i] + blueRGB.r * 0.4) / 1.4;
          data[i + 1] = (data[i + 1] + blueRGB.g * 0.4) / 1.4;
          data[i + 2] = (data[i + 2] + blueRGB.b * 0.4) / 1.4;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setColoredImage(canvas.toDataURL());
    };
  };

  const hexToRGB = (hex: string) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  useEffect(() => {
    const baseImage = loadBaseImage(chartTooth.toothNumber);
    if (!chartTooth.missing && !hasImplant() && (chartTooth.toothActions?.length > 0 || selected)) {
      const fillColor =
        type === 'condition' ? '#FF0000' : type === 'treatment' ? '#00AA00' : '#60afff';
      if (baseImage) fillWhitePartsOnly(baseImage, fillColor, selected);
    } else {
      setColoredImage(null);
    }
  }, [chartTooth, type, selected]);

  const baseToothImage = loadBaseImage(chartTooth.toothNumber);

  return (
    <>
      {!chartTooth.missing && !hasImplant() && !coloredImage && (
        <img
          src={baseToothImage}
          className={clsx({
            treatment: type === 'treatment',
            condition: type === 'condition',
            selected
          })}
        />
      )}

      {!chartTooth.missing && coloredImage && <img src={coloredImage} />}
    </>
  );
};

export default Tooth;
