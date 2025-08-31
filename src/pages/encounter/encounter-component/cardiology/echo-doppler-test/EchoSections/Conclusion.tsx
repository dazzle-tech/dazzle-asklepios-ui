import React, { useEffect } from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
  usersList: Array<any>;
  currentUserId?: string;
}

const Conclusion: React.FC<Props> = ({ record, setRecord, usersList, currentUserId }) => {
  useEffect(() => {
    if (!record?.cardiologistName && currentUserId) {
      setRecord((prev: any) => ({
        ...prev,
        cardiologistName: currentUserId
      }));
    }
  }, [currentUserId, record?.cardiologistName, setRecord]);

  return (
    <Section
      title="Conclusion"
      content={
        <div className="handle-inputs-positions-size conclusion-main-container-positions">
          <MyInput
            fieldLabel="Final Impression"
            fieldName="finalImpression"
            fieldType="textarea"
            rows={4}
            width="100%"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldLabel="Recommendation"
            fieldName="recommendation"
            fieldType="textarea"
            rows={4}
            width="100%"
            record={record}
            setRecord={setRecord}
          />
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
              searchable={false}
          />
        </div>
      }
    />
  );
};

export default Conclusion;
