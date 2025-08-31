// pages/EchoSections/DopplerValves.tsx

import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
}

const DopplerValves: React.FC<Props> = ({ record, setRecord }) => {
  return (
    <Section
      title="Doppler – Valves"
      content={
        <div className="handle-inputs-positions-size">
          <div className="for-right-adons-position-align">
            <MyInput fieldLabel="Aortic Valve Peak Velocity" fieldName="aorticValvePeakVelocity" fieldType="number" rightAddon="m/s" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Aortic Valve Mean Gradient" fieldName="aorticValveMeanGradient" fieldType="number" rightAddon="mmHg" width={180} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Aortic Valve Area" fieldName="aorticValveArea" fieldType="number" rightAddon="cm²" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Mitral Valve E Velocity" fieldName="mitralValveEVelocity" fieldType="number" rightAddon="m/s" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Mitral Valve A Velocity" fieldName="mitralValveAVelocity" fieldType="number" rightAddon="m/s" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="E/A Ratio" fieldName="eaRatio" fieldType="number" rightAddon="ratio" width={200} record={record} setRecord={setRecord} />
            <MyInput fieldLabel="Mitral Valve Deceleration Time" fieldName="mitralValveDecelerationTime" fieldType="number" rightAddon="ms" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Mitral Valve Area" fieldName="mitralValveArea" fieldType="number" rightAddon="cm²" width={200} record={record} setRecord={setRecord} />
            <MyInput fieldLabel="Tricuspid Regurgitation Peak Velocity" fieldName="tricuspidRegurgitationPeakVelocity" fieldType="number" rightAddon="m/s" width={200} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Estimated PASP" fieldName="estimatedPASP" fieldType="number" rightAddon="mmHg" width={180} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
            <MyInput fieldLabel="Pulmonic Valve Peak Velocity" fieldName="pulmonicValvePeakVelocity" fieldType="number" rightAddon="m/s" width={480} record={record} setRecord={setRecord} rightAddonwidth={'auto'} />
          </div>
        </div>
      }
    />
  );
};

export default DopplerValves;
