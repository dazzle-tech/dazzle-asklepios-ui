import React from 'react';
import MyInput from '@/components/MyInput';
import "./styles.less";
const BloodCardQuestions = ({ bloodorder, setBloodOrder }) => {
  return (
    <div className='container-of-blood-card-questions'>
        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel="Is it a Scheduled Transfusion"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="transfused"
          fieldType="check"
          fieldLabel="Has been transfused in the past"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="historyOfTransplants"
          fieldType="check"
          fieldLabel="Has a History of Transplants"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="haemolyticNeonatalDisease"
          fieldType="check"
          fieldLabel="Has Haemolytic Neonatal Disease"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="takingAntiRhesusGlobulin"
          fieldType="check"
          fieldLabel="Is taking Anti-Rhesus Globulin"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="hadReactions"
          fieldType="check"
          fieldLabel="Had Reactions"
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
    </div>
  );
};
export default BloodCardQuestions;
