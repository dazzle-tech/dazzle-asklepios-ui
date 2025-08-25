import React, { useEffect } from 'react';
import Section from '@/components/Section';
import MyInput from '@/components/MyInput';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
  usersList: Array<any>;
  currentUserId?: string; // لو حابب تمرر الآي دي تبع المستخدم الحالي للتعبئة التلقائية
}

const Conclusion: React.FC<Props> = ({ record, setRecord, usersList, currentUserId }) => {
  // 🧠 إذا ما تم اختيار طبيب، عبيه تلقائيًا بأول تحميل (مرة وحدة)
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
        <div className="handle-inputs-positions-size">
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
          />
        </div>
      }
    />
  );
};

export default Conclusion;
