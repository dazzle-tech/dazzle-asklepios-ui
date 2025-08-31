// pages/EchoSections/OtherFindings.tsx

import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import { RadioGroup, Radio, Slider } from 'rsuite';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
  rwmaOptions: Array<any>;
}

const getDiastolicDysfunctionColor = (grade: number): string => {
  switch (grade) {
    case 0:
      return '#28a745';
    case 1:
      return '#FFD700';
    case 2:
      return '#FFA500';
    case 3:
      return '#FF0000';
    default:
      return 'transparent';
  }
};

const OtherFindings: React.FC<Props> = ({ record, setRecord, rwmaOptions }) => {
  return (
    <Section
      title="Other Findings"
      content={
        <div className="handle-other-findings-positions-sort">
          <RadioGroup
            name="pericardialEffusion"
            value={record?.pericardialEffusion ?? ''}
            onChange={value => setRecord({ ...record, pericardialEffusion: value })}
          >
            <label>Pericardial Effusion</label>
            <div className="radio-buttons-position-handle">
              <Radio value="None">None</Radio>
              <Radio value="Small">Small</Radio>
              <Radio value="Moderate">Moderate</Radio>
              <Radio value="Large">Large</Radio>
            </div>
          </RadioGroup>

          <MyInput
            width="100%"
            fieldType="checkPicker"
            fieldName="rwma"
            record={record}
            setRecord={setRecord}
            fieldLabel="RWMA"
            selectData={rwmaOptions}
            selectDataLabel="RwmaValue"
            selectDataValue="value"
            searchable={false}
          />

          <div style={{ position: 'relative', marginLeft: '1.5vw' }}>
            <label style={{ fontWeight: 'bold' }}>LV Diastolic Dysfunction Grade</label>
            <Slider
              min={0}
              max={3}
              step={1}
              value={record.diastolicDysfunctionGrade ?? 0}
              onChange={value => setRecord({ ...record, diastolicDysfunctionGrade: value })}
              progress
            />
            <div
              style={{
                position: 'absolute',
                top: '24%',
                left: 0,
                height: '7px',
                width: `${((record.diastolicDysfunctionGrade ?? 0) / 3) * 100}%`,
                backgroundColor: getDiastolicDysfunctionColor(record.diastolicDysfunctionGrade ?? 0),
                transform: 'translateY(-50%)',
                zIndex: 1,
                borderRadius: '4px'
              }}
            />
            <div style={{ marginTop: '8px', fontStyle: 'italic', color: getDiastolicDysfunctionColor(record.diastolicDysfunctionGrade ?? 0) }}>
              {
                ['Normal', 'Grade I', 'Grade II', 'Grade III'][record.diastolicDysfunctionGrade ?? 0]
              }
            </div>
          </div>

          <MyInput fieldLabel="Additional Notes" fieldName="additionalNotes" fieldType="textarea" rows={4} width="100%" record={record} setRecord={setRecord} />
        </div>
      }
    />
  );
};

export default OtherFindings;
