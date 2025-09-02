// pages/EchoSections/ColorDopplerFindings.tsx

import React, { useState } from 'react';
import Section from '@/components/Section';
import { Slider } from 'rsuite';
import '../style.less';
import SectionContainer from '@/components/SectionsoContainer';

const ColorDopplerFindings = () => {
  const [regurgitation, setRegurgitation] = useState({
    aortic: 0,
    mitral: 0,
    tricuspid: 0,
    pulmonic: 0
  });

  const getRegurgitationColor = (value: number): string => {
    switch (value) {
      case 0: return '#28a745';
      case 1: return '#FFD700';
      case 2: return '#FFA500';
      case 3: return '#FF8C00';
      case 4: return '#FF0000';
      default: return 'transparent';
    }
  };

  const renderSlider = (label: string, valve: keyof typeof regurgitation) => (
    <div className="slider-wrapper" key={valve}>
      <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>{label}</label>
      <Slider
        min={0}
        max={4}
        step={1}
        value={regurgitation[valve]}
        onChange={value => setRegurgitation(prev => ({ ...prev, [valve]: value }))}
        progress
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          height: '7px',
          width: `${(regurgitation[valve] / 4) * 100}%`,
          backgroundColor: getRegurgitationColor(regurgitation[valve]),
          transform: 'translateY(-50%)',
          zIndex: 1,
          transition: 'background-color 0.2s ease',
          borderRadius: '4px'
        }}
      />
      <div
        style={{
          marginTop: '8px',
          fontStyle: 'italic',
          color: getRegurgitationColor(regurgitation[valve])
        }}
      >
        {['None', 'Trace', 'Mild', 'Moderate', 'Severe'][regurgitation[valve]]}
      </div>
    </div>
  );

  return (
    <SectionContainer
      title="Color Doppler Findings"
      content={
        <div className="color-dopler-findings-position">
          {renderSlider('Aortic Regurgitation Severity', 'aortic')}
          {renderSlider('Mitral Regurgitation Severity', 'mitral')}
          {renderSlider('Tricuspid Regurgitation Severity', 'tricuspid')}
          {renderSlider('Pulmonic Regurgitation Severity', 'pulmonic')}
        </div>
      }
    />
  );
};

export default ColorDopplerFindings;
