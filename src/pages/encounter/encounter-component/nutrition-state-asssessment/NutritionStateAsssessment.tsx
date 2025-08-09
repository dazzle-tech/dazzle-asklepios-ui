import React, { useState } from 'react';
import { Col, Form, Row } from 'rsuite';
import AnthropometricData from './AnthropometricData';
import ClinicalAndFunctionalAssessment from './ClinicalAndFunctionalAssessment';
import DietaryHistoryOrIntake from './DietaryHistoryOrIntake';
import NutritionDiagnosis from './NutritionDiagnosis';
import NutritionInterventionPlan from './NutritionInterventionPlan';
import FollowUpAndMonitoring from './FollowUpAndMonitoring';
import Biochemical from './Biochemical';
const NutritionStateAsssessment = () => {
  const [object, setObject] = useState({});
   return (
        <Row gutter={15} className="d">
          <Form fluid>
            <Col md={12}>
              <Row>
                <AnthropometricData />
              </Row>
               <Row>
                <Biochemical/>
              </Row>
              <Row>
                <ClinicalAndFunctionalAssessment object={object} setObject={setObject} />
              </Row>
            </Col>
            <Col md={12}>
              <Row>
                <DietaryHistoryOrIntake object={object} setObject={setObject} />
              </Row>
              <Row>
                <NutritionDiagnosis object={object} setObject={setObject}/>
              </Row>
              <Row>
                <NutritionInterventionPlan object={object} setObject={setObject}/>
              </Row>
              <Row>
                <FollowUpAndMonitoring object={object} setObject={setObject}/>
              </Row>
             
            </Col>
          </Form>
        </Row>
     
  );
  
};
export default NutritionStateAsssessment;
