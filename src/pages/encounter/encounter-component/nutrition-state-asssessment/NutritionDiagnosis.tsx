
import MyInput from '@/components/MyInput';
import React from 'react';
import { Col, Divider, Row, Text } from 'rsuite';
const NutritionDiagnosis = ({ object, setObject }) => {

  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Nutrition Diagnosis</Text>
      </div>
      <Divider />
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
