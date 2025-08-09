
import MyInput from '@/components/MyInput';
import React from 'react';
import { Col, Row } from 'rsuite';
const NutritionDiagnosis = ({ object, setObject }) => {

  return (
    <div>
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
