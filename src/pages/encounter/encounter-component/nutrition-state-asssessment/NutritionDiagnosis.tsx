
import MyInput from '@/components/MyInput';
import React from 'react';
import { Col, Row } from 'rsuite';
const NutritionDiagnosis = ({ object, setObject }) => {


          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="problem"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput width="100%" fieldName="etiology" record={object} setRecord={setObject} />
        </Col>
      </Row>
          <Row>
           <MyInput width="100%" fieldName="SignsOrSymptoms" fieldType='checkbox' fieldLabel="Signs/Symptoms" record={object} setRecord={setObject} />
           </Row>
    </div>
  );
};
export default NutritionDiagnosis;
