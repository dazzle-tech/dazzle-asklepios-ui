import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import React from 'react';
import { Col, Radio, RadioGroup, Row, Text } from 'rsuite';
import "./styles.less";
const ClinicalAndFunctionalAssessment = ({ object, setObject }) => {
  return (
    <div>
      <Row>
      <Text>Appetite Status</Text>
      <RadioGroup inline>
        <Radio value="good">Good</Radio>
        <Radio value="reduced">Reduced</Radio>
        <Radio value="npo">NPO</Radio>
      </RadioGroup>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="isChewingOrSwallowingIssues"
            fieldLabel="Chewing Or Swallowing Issues"
            fieldType="checkbox"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          {object?.isChewingOrSwallowingIssues && (
            <MyInput
              width="100%"
              fieldName="chewingOrSwallowingIssues"
              record={object}
              setRecord={setObject}
            />
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldLabel="GI Symptoms (N/V/D/Constipation)"
            fieldName="isGiSymptoms"
            fieldType="checkbox"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          {object?.isGiSymptoms && (
            <MyInput width="100%" fieldName="giSymptoms" record={object} setRecord={setObject} />
          )}
        </Col>
      </Row>
      <Row>
        <div className="container-of-cdt-nutrition">
          <Icd10Search
            object={object}
            setOpject={setObject}
            label="Diagnosis Impacting Nutrition"
            fieldName="diagnosisImpactingNutrition"
          />
        </div>
      </Row>
      <br/>
      <Row>
        <div className='container-of-add-new-button'>
      <MyButton>Pressure Ulcers</MyButton>
      </div>
      </Row>
    </div>
  );
};
export default ClinicalAndFunctionalAssessment;
