import React, { useState } from 'react';
import { Radio, RadioGroup } from 'rsuite';
import Section from '@/components/Section';
import { faBrain } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './style.less';

const SessionTrackingSection = () => {
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

  return (
      <Section
        title={
          <>
            <FontAwesomeIcon icon={faBrain} className="font-small" />
            <p className="font-small">Session Tracking</p>
          </>
        }
        content={
          <>
            <div className="goals-container">
              <MyInput
                fieldName="activitiesPerformed"
                fieldType="text"
                fieldLabel="Activities Performed"
                record={planData}
                setRecord={setPlanData}
                width={400}
                rows={3}
              />

              <div className="radio-group-container">
                <label>
                  <Translate>Patient Response</Translate>
                </label>
                <RadioGroup
                  name="patientResponse"
                  value={planData.patientResponse}
                  onChange={value => setPlanData(prev => ({ ...prev, patientResponse: value }))}
                  inline
                >
                  <Radio value="Good">Good</Radio>
                  <Radio value="Fair">Fair</Radio>
                  <Radio value="Poor">Poor</Radio>
                </RadioGroup>
              </div>

              <div className="radio-group-container">
                <label>
                  <Translate>Progress Toward Goals</Translate>
                </label>
                <RadioGroup
                  name="progressTowardGoals"
                  value={planData.progressTowardGoals}
                  onChange={value => setPlanData(prev => ({ ...prev, progressTowardGoals: value }))}
                  inline
                >
                  <Radio value="On track">On track</Radio>
                  <Radio value="Delayed">Delayed</Radio>
                  <Radio value="Goal met">Goal met</Radio>
                </RadioGroup>
              </div>

              <MyInput
                fieldName="sessionNotes"
                fieldType="textarea"
                fieldLabel="Notes"
                record={planData}
                setRecord={setPlanData}
                width={400}
                rows={4}
              />

              <MyInput
                fieldName="nextSessionPlan"
                fieldType="date"
                fieldLabel="Next Session Plan"
                record={planData}
                setRecord={setPlanData}
                width={200}
              />
            </div>
          </>
        }
      />
  );
};

export default SessionTrackingSection;
