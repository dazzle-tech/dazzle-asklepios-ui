import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import { RadioGroup, Radio } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import '../style.less';
import SectionContainer from '@/components/SectionsoContainer';

interface Props {
  record: any;
  setRecord: (value: any) => void;
}

const TechnicalQuality: React.FC<Props> = ({ record, setRecord }) => {
  const { data: patientPositionLov } = useGetLovValuesByCodeQuery('PAT_POSITION');

  return (

    <SectionContainer
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
    />);
};

export default TechnicalQuality;
