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
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faCheck, faSave, faUtensils } from '@fortawesome/free-solid-svg-icons';
import PressureUlcerRiskAssessmentModal from '../pressure-ulce-risk-assessment/PressureUlcerRiskAssessmentModal';
const NutritionStateAsssessment = () => {
  const [object, setObject] = useState({});
  const initialSampleData = [
    {
      id: 1,
      totalScore: 21,
      riskLevel: 'No Risk',
      createdBy: 'Dr. Rami',
      createdAt: '2025-07-29 10:30 AM',
      cancelled: false
    },
    {
      id: 2,
      totalScore: 13,
      riskLevel: 'Moderate Risk',
      createdBy: 'Nurse Layla',
      createdAt: '2025-07-25 01:15 PM',
      cancelled: false
    },
    {
      id: 3,
      totalScore: 11,
      riskLevel: 'High Risk',
      createdBy: 'Dr. Ahmad',
      createdAt: '2025-07-10 08:45 AM',
      cancelled: true
    }
  ];
  const [modalOpen, setModalOpen] = useState(false);
  const [sampleData, setSampleData] = useState(initialSampleData);

  // Save handler for new record
  const handleSave = newRecord => {
    const newData = {
      id: sampleData.length + 1,
      totalScore: newRecord.totalScore,
      riskLevel: newRecord.riskLevel,
      createdBy: 'Current User',
      createdAt: new Date().toLocaleString(),
      cancelled: false
    };
    setSampleData(prev => [newData, ...prev]);
    setModalOpen(false);
  };
  return (
    <Row gutter={15} className="d nutrition-state">
      <Row
        style={{
          display: 'flex',
          justifyContent: 'end',
          alignContent: 'end',
          marginRight: '5px',
          marginBottom: 0
        }}
      >
        <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}>save</MyButton>
      </Row>

      <Form fluid>
        <Col md={12}>
          <Row>
            <SectionContainer
              title={<Text>Anthropometric Data</Text>}
              content={<AnthropometricData object={object} setObject={setObject} />}
            />
          </Row>
          <Row>
            <SectionContainer title={<Text>Biochemical</Text>} content={<Biochemical />} />
          </Row>
          <Row>
            <SectionContainer
              title={<Text>Clinical & Functional Assessment</Text>}
              content={<ClinicalAndFunctionalAssessment object={object} setObject={setObject} />}
              button={
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faBed} />}
                  onClick={() => setModalOpen(true)}
                >
                  Pressure Ulcers
                </MyButton>
              }
            />
          </Row>
        </Col>
        <Col md={12}>
          <Row>
            <SectionContainer
              title={<Text>Dietary History / Intake</Text>}
              content={<DietaryHistoryOrIntake object={object} setObject={setObject} />}
            />
          </Row>
          <Row>
            <SectionContainer
              title={<Text>Nutrition Diagnosis</Text>}
              content={<NutritionDiagnosis object={object} setObject={setObject} />}
            />
          </Row>
          <Row>
            <SectionContainer
              title={<Text>Nutrition Intervention Plan</Text>}
              content={<NutritionInterventionPlan object={object} setObject={setObject} />}
              button={
                <MyButton prefixIcon={() => <FontAwesomeIcon icon={faUtensils} />}>
                  Create Diet Order
                </MyButton>
              }
            />
          </Row>
          <Row>
            <SectionContainer
              title={<Text>Follow-up and Monitoring</Text>}
              content={<FollowUpAndMonitoring object={object} setObject={setObject} />}
            />
          </Row>
        </Col>
      </Form>
      <PressureUlcerRiskAssessmentModal
        open={modalOpen}
        setOpen={setModalOpen}
        onSave={handleSave}
      />
    </Row>
  );
};
export default NutritionStateAsssessment;
