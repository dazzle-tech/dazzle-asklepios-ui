// pages/EchoSections/Conclusion.tsx

import React from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
  usersList: Array<any>;
}

const Conclusion: React.FC<Props> = ({ record, setRecord, usersList }) => {
  return (
    <Section
      title="Conclusion"
      content={
        <div className="handle-inputs-positions-size">
          <MyInput fieldLabel="Final Impression" fieldName="finalImpression" fieldType="textarea" rows={4} width="100%" record={record} setRecord={setRecord} />
          <MyInput fieldLabel="Recommendation" fieldName="recommendation" fieldType="textarea" rows={4} width="100%" record={record} setRecord={setRecord} />
          <MyInput
            width={300}
            fieldType="select"
            fieldLabel="Cardiologist Name & Signature"
            fieldName="cardiologistName"
            selectData={usersList}
            selectDataLabel="fullName"
            selectDataValue="id"
            record={record}
            setRecord={setRecord}
          />
        </div>
      }
    />
  );
};

export default Conclusion;
