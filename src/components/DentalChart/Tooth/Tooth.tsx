import React, { CSSProperties, useEffect, useState } from 'react';
import { Popover, Whisper } from 'rsuite';
import MissingTooth from './images/missing.png';

const Tooth = ({ chartTooth, selected }) => {
  const width = 50;
  const height = chartTooth.toothNumberNumeric < 17 ? 290 : 290;

  const upperToothStyle:CSSProperties = {
    position: 'absolute',
    left: '0',
    bottom: '0px'
  };
  const lowerToothStyle:CSSProperties = {
    position: 'absolute',
    left: '0',
    top: '0px'
  };

  const hasImplant = () => {
    return chartTooth.toothActions.some(action => action.imageName === 'Implant');
  };

  function loadImage(base: boolean, toothNumber: string, actionImageName: string) {
    let imageName = ``;
    try {
      imageName = base ? `./Tooth_${toothNumber}.png` : `./${toothNumber}_${actionImageName}.png`;
      // Use require.context to dynamically import the image
      const context = require.context('./images', true, /\.png$/);
      const imageModule = context(imageName);
      // Use the default export if it exists, or the module itself
      return imageModule.default || imageModule;
    } catch (error) {
      // Handle errors, e.g., image not found
      console.error(`Error loading image: [${imageName}]`, error);
      return './missing.png'; // or a placeholder image
    }
  }

  return (
    <div style={{ display: 'inline-block', position: 'relative', height: height, width: width }}>
      {chartTooth.missing && <img style={chartTooth.toothNumberNumeric < 17 ? upperToothStyle : lowerToothStyle} src={MissingTooth} />}

      {!chartTooth.missing && !hasImplant() && (
        // base tooth image
        <img style={{ maxWidth: "100%"}}
         src={loadImage(true, chartTooth.toothNumber, undefined)} />
      )}

      {!chartTooth.missing &&
        chartTooth.toothActions &&
        chartTooth.toothActions.map(toothAction => {
          return (
            // dental action image
            <img
              key={toothAction.key}
              style={chartTooth.toothNumberNumeric < 17 ? upperToothStyle : lowerToothStyle}
              src={loadImage(false, chartTooth.toothNumber, toothAction.imageName)}
              width={width}
            />
          );
        })}
    </div>
  );
};

export default Tooth;
