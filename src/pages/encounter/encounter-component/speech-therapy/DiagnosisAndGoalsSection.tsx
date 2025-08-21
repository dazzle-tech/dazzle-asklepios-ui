import React, { useState } from 'react';
import { Slider } from 'rsuite';
import Section from '@/components/Section';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import './style.less';
import MyLabel from '@/components/MyLabel';

const DiagnosisAndGoalsSection = () => {
  // Speech therapy plan form data
  const [planData, setPlanData] = useState({
    // Initial Assessment
    dateOfAssessment: '',
    primaryCommunicationMode: '',
    speechIntelligibility: '',
    voiceQuality: '',
    fluency: '',
    languageReceptive: false,
    languageExpressive: false,
    articulation: '',
    swallowingFunction: 0,
    cognitiveCommunication: 0,
    assessmentTools: [],
    otherAssessmentTool: '',
    functionalCommunicationLevel: '',
    patientFamilyConcerns: '',

    // Diagnosis & Goals
    shortTermGoals: '',
    longTermGoals: '',
    prognosis: 0,

    // Treatment Plan
    therapyType: [],
    sessionFrequencyNumber: '',
    sessionFrequency: '',
    durationPerSession: '',
    totalPlanDuration: '',
    totalPlanDurationUnit: '',
    therapyTechniques: [],
    otherTherapyTechnique: '',
    assistiveDevices: [],
    otherAssistiveDevice: '',
    patientCaregiverEducationPlan: '',
    homeExercises: '',

    // Session Tracking
    activitiesPerformed: '',
    patientResponse: '',
    progressTowardGoals: '',
    sessionNotes: '',
    nextSessionPlan: ''
  });

  // Custom slider color functions
  const getSwallowingColor = value => {
    switch (value) {
      case 0:
        return '#28a745';
      case 1:
        return '#ffc107';
      case 2:
        return '#fd7e14';
      case 3:
        return '#dc3545';
      default:
        return '#28a745';
    }
  };

  const getPrognosisLabel = value => {
    switch (value) {
      case 0:
        return 'Excellent';
      case 1:
        return 'Good';
      case 2:
        return 'Fair';
      case 3:
        return 'Poor';
      default:
        return 'Excellent';
    }
  };

  return (
      <Section
        title={
          <>
            <FontAwesomeIcon icon={faBullseye} className="font-small" />
            <p className="font-small">Diagnosis & Goals</p>
          </>
        }
        content={
            <div className="goals-container">
              <MyInput
                fieldName="shortTermGoals"
                fieldType="textarea"
                fieldLabel="Short-Term Goals"
                record={planData}
                setRecord={setPlanData}
                width={400}
                rows={4}
              />
              <MyInput
                fieldName="longTermGoals"
                fieldType="textarea"
                fieldLabel="Long-Term Goals"
                record={planData}
                setRecord={setPlanData}
                width={400}
                rows={4}
              />

              {/* Prognosis Slider */}
              <div className="slider-container">
                <MyLabel label={<p className="bolddd">Prognosis</p>} />
                <div className="custom-slider">
                  <Slider
                    value={planData.prognosis}
                    onChange={value => setPlanData(prev => ({ ...prev, prognosis: value }))}
                    min={0}
                    max={3}
                    step={1}
                    progress
                  />
                  <div
                    className="sliders-class"
                    style={{
                      top: '3px',
                      width: `${(planData.prognosis / 3) * 100}%`,
                      backgroundColor: getSwallowingColor(planData.prognosis)
                    }}
                  />
                  <span className="slider-label">{getPrognosisLabel(planData.prognosis)}</span>
                </div>
              </div>
            </div>
        }
      />
  );
};

export default DiagnosisAndGoalsSection;
