import React from 'react';
import MyInput from '@/components/MyInput';
import "./styles.less";
import Translate from '@/components/Translate';
const BloodCardQuestions = ({ bloodorder, setBloodOrder }) => {

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div className='container-of-blood-card-questions' dir={dir}>
        <MyInput
          fieldName="scheduledTransfusion"
          fieldType="check"
          fieldLabel={<Translate>Is it a Scheduled Transfusion</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="transfused"
          fieldType="check"
          fieldLabel={<Translate>Has been transfused in the past</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="historyOfTransplants"
          fieldType="check"
          fieldLabel={<Translate>Has a History of Transplants</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="haemolyticNeonatalDisease"
          fieldType="check"
          fieldLabel={<Translate>Has Haemolytic Neonatal Disease</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="takingAntiRhesusGlobulin"
          fieldType="check"
          fieldLabel={<Translate>Is taking Anti-Rhesus Globulin</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
        <MyInput
          fieldName="hadReactions"
          fieldType="check"
          fieldLabel={<Translate>Had Reactions</Translate>}
          showLabel={false}
          record={bloodorder}
          setRecord={setBloodOrder}
        />
    </div>
  );
};
export default BloodCardQuestions;
