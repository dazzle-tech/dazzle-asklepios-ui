import React, { CSSProperties, useMemo } from 'react';

const Tooth = ({ chartTooth }) => {
  const width = 50;

  const upperToothStyle: CSSProperties = {
    position: 'absolute',
    left: '0',
    bottom: '0px'
  };
  const lowerToothStyle: CSSProperties = {
    position: 'absolute',
    left: '0',
    top: '0px'
  };

  const isUpper = chartTooth.toothNumberNumeric < 17;

  const hasImplant = useMemo(() => {
    return chartTooth.toothActions?.some(action => action.imageName === 'Implant');
  }, [chartTooth.toothActions]);

  function loadImage(base: boolean, toothNumber: string, actionImageName?: string) {
    let imageName = '';
    try {
      imageName = base ? `./Tooth_${toothNumber}.png` : `./${toothNumber}_${actionImageName}.png`;

      const context = require.context('./images', true, /\.png$/);
      const imageModule = context(imageName);
      return (imageModule as any).default || imageModule;
    } catch (error) {
      console.warn(`Could not load image: ${imageName}`, error);
      return null;
    }
  }

  const baseToothImage =
    !chartTooth.missing && !hasImplant ? loadImage(true, chartTooth.toothNumber) : null;

  return (
    <div style={{ display: 'inline-block', position: 'relative', width }}>

      {baseToothImage && (
        <img
          src={baseToothImage}
          style={{ maxWidth: '100%' }}
          alt={`Tooth ${chartTooth.toothNumber}`}
        />
      )}

      {!chartTooth.missing &&
        chartTooth.toothActions?.map(toothAction => {
          const actionImage = loadImage(false, chartTooth.toothNumber, toothAction.imageName);
          if (!actionImage) return null;

          return (
            <img
              key={toothAction.key}
              src={actionImage}
              style={isUpper ? upperToothStyle : lowerToothStyle}
              width={width}
              alt={toothAction.imageName}
            />
          );
        })}
    </div>
  );
};

export default Tooth;
