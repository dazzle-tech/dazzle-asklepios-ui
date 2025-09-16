import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import React, { useState } from 'react';
import { Col, Divider, Radio, RadioGroup, Row, Text } from 'rsuite';
import './styles.less';
import PressureUlcerRiskAssessmentModal from '../pressure-ulce-risk-assessment/PressureUlcerRiskAssessmentModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed } from '@fortawesome/free-solid-svg-icons';
const ClinicalAndFunctionalAssessment = ({ object, setObject }) => {
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
      <br />
      <Row>
        {/* <Divider></Divider>
        <div className="container-of-add-new-button-pre">
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faBed} />}
            onClick={() => setModalOpen(true)}
          >
            Pressure Ulcers
          </MyButton>
        </div> */}
      </Row>

      <PressureUlcerRiskAssessmentModal
        open={modalOpen}
        setOpen={setModalOpen}
        onSave={handleSave}
      />
    </div>
  );
};
export default ClinicalAndFunctionalAssessment;
