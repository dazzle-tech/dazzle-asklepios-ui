import React, { useState } from 'react';
import { Col, Form, Row, Text } from 'rsuite';
import AnthropometricData from './AnthropometricData';
import ClinicalAndFunctionalAssessment from './ClinicalAndFunctionalAssessment';
import DietaryHistoryOrIntake from './DietaryHistoryOrIntake';
import NutritionDiagnosis from './NutritionDiagnosis';
import NutritionInterventionPlan from './NutritionInterventionPlan';
import FollowUpAndMonitoring from './FollowUpAndMonitoring';
import Biochemical from './Biochemical';
import SectionContainer from '@/components/SectionsoContainer';
import "./styles.less";
const NutritionStateAsssessment = () => {
  const [object, setObject] = useState({});
   return (
        <Row gutter={15} className="d nutrition-state">
          <Form fluid>
            <Col md={12}>
              <Row>
                <SectionContainer title={<Text>Anthropometric Data</Text> } content={<AnthropometricData object={object} setObject={setObject}/>} />
              </Row>
               <Row>
                 <SectionContainer title={<Text>Biochemical</Text> } content={<Biochemical/>} />
              </Row>
              <Row>
                <SectionContainer title={<Text>Clinical & Functional Assessment</Text> } content={<ClinicalAndFunctionalAssessment object={object} setObject={setObject} />} />
              </Row>
            </Col>
            <Col md={12}>
              <Row>
                <SectionContainer title={<Text>Dietary History / Intake</Text> } content={<DietaryHistoryOrIntake object={object} setObject={setObject} />} />
              </Row>
              <Row>
                 <SectionContainer title={<Text>Nutrition Diagnosis</Text> } content={<NutritionDiagnosis object={object} setObject={setObject} />} />
              </Row>
              <Row>
                <SectionContainer title={<Text>Nutrition Intervention Plan</Text> } content={<NutritionInterventionPlan object={object} setObject={setObject} />} />
              </Row>
              <Row>
                <SectionContainer title={<Text>Follow-up and Monitoring</Text> } content={<FollowUpAndMonitoring object={object} setObject={setObject} />} />
              </Row>
             
            </Col>
          </Form>
        </Row>
     
  );
  
};
export default NutritionStateAsssessment;
