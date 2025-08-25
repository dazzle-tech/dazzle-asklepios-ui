// pages/EchoSections/TechnicalQuality.tsx

import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import { RadioGroup, Radio } from 'rsuite';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
  patientPositionLov?: { object: Array<any> };
}

const TechnicalQuality: React.FC<Props> = ({ record, setRecord, patientPositionLov }) => {
  return (
    <Section
      title="Technical Quality"
      content={
        <div className="handle-inputs-positions-size-coulmn">
          <MyInput
            width={300}
            fieldType="select"
            fieldLabel="Patient Position"
            fieldName="patientPosition"
            selectData={patientPositionLov?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
          />
          <RadioGroup
            name="imageQuality"
            value={record?.imageQuality ?? ''}
            onChange={value => setRecord({ ...record, imageQuality: value })}
          >
            <label>Image Quality</label>
            <div className="radio-buttons-position-handle">
              <Radio value="Excellent">Excellent</Radio>
              <Radio value="Good">Good</Radio>
              <Radio value="Fair">Fair</Radio>
              <Radio value="Poor">Poor</Radio>
            </div>
          </RadioGroup>
        </div>
      }
    />
  );
};

export default TechnicalQuality;
