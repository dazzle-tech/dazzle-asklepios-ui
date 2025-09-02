import React, { useState } from 'react';
import { Slider, Checkbox } from 'rsuite';
import Section from '@/components/Section';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './style.less';
import MyLabel from '@/components/MyLabel';
import SectionContainer from '@/components/SectionsoContainer';

// Functional communication level options
const functionalCommLevelOptions = [
  { value: 'Independent', label: 'Independent' },
  { value: 'Minimal assistance', label: 'Minimal assistance' },
  { value: 'Moderate assistance', label: 'Moderate assistance' },
  { value: 'Dependent', label: 'Dependent' }
];
// Assessment tools options
const assessmentToolsOptions = [
  { value: 'GFTA', label: 'GFTA' },
  { value: 'CELF', label: 'CELF' },
  { value: 'Western Aphasia Battery', label: 'Western Aphasia Battery' },
  { value: 'Boston Naming Test', label: 'Boston Naming Test' },
  { value: 'Other', label: 'Other' }
];

const AssessmentSection = () => {
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
  const getSwallowingLabel = value => {
    switch (value) {
      case 0:
        return 'Normal';
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Severe';
      default:
        return 'Normal';
    }
  };

  // Fetch LOV (List of Values) from backend
  const { data: communicationModeLovQueryResponse } =
    useGetLovValuesByCodeQuery('COMMUNICATION_MODE');
  const { data: speechIntellLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_INTELL');
  const { data: voiceQualityLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_VOICE_QUALITY');
  const { data: fluencyLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_FLUENCY');

  return (
    <SectionContainer
      title={
        <div className="title-div">
          <FontAwesomeIcon icon={faComments} className="font-small title-div-s" />
          <p className="font-small title-div-p">Initial Assessment</p>
        </div>
      }
      content={
        <>
          <div className="goals-container goal">
            <MyInput
              fieldName="dateOfAssessment"
              fieldType="date"
              fieldLabel="Date of Assessment"
              record={planData}
              setRecord={setPlanData}
              width={200}
            />
            <MyInput
              fieldName="primaryCommunicationMode"
              fieldType="select"
              fieldLabel="Primary Communication Mode"
              record={planData}
              setRecord={setPlanData}
              selectData={communicationModeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={230}
              searchable={false}
            />
            <MyInput
              fieldName="speechIntelligibility"
              fieldType="select"
              fieldLabel="Speech Intelligibility"
              record={planData}
              setRecord={setPlanData}
              selectData={speechIntellLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={200}
              searchable={false}
            />
            <MyInput
              fieldName="voiceQuality"
              fieldType="select"
              fieldLabel="Voice Quality"
              record={planData}
              setRecord={setPlanData}
              selectData={voiceQualityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={200}
              searchable={false}
            />
            <MyInput
              fieldName="fluency"
              fieldType="select"
              fieldLabel="Fluency"
              record={planData}
              setRecord={setPlanData}
              selectData={fluencyLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              width={200}
              searchable={false}
            />
          </div>

          <div className="goals-container">
            <div className="language-assessment goal">
              <MyLabel label={<p className="bolddd">Language Assessment</p>} />

              <div className="toggles-container goal">
                <MyInput
                  fieldName="languageReceptive"
                  fieldType="checkbox"
                  checkedLabel="normal"
                  unCheckedLabel="impaired"
                  fieldLabel="Receptive"
                  record={planData}
                  setRecord={setPlanData}
                  width={90}
                />
                <MyInput
                  fieldName="languageExpressive"
                  fieldType="checkbox"
                  checkedLabel="normal"
                  unCheckedLabel="impaired"
                  fieldLabel="Expressive"
                  record={planData}
                  setRecord={setPlanData}
                  width={90}
                />

                {/* Swallowing Function Slider */}
                <div className="slider-container margin-1">
                  <MyLabel label={<p className="bolddd">Swallowing Function</p>} />
                  <div className="custom-slider">
                    <Slider
                      value={planData.swallowingFunction}
                      onChange={value =>
                        setPlanData(prev => ({ ...prev, swallowingFunction: value }))
                      }
                      min={0}
                      max={3}
                      step={1}
                      progress
                    />
                    <div
                      className="sliders-class"
                      style={{
                        top: '3px',
                        width: `${(planData.swallowingFunction / 3) * 100}%`,
                        backgroundColor: getSwallowingColor(planData.swallowingFunction)
                      }}
                    />
                    <span className="slider-label">
                      {getSwallowingLabel(planData.swallowingFunction)}
                    </span>
                  </div>
                </div>

                <MyInput
                  fieldName="functionalCommunicationLevel"
                  fieldType="select"
                  fieldLabel="Functional Communication Level"
                  record={planData}
                  setRecord={setPlanData}
                  selectData={functionalCommLevelOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  width={200}
                  searchable={false}
                />
                <MyInput
                  fieldName="articulation"
                  fieldType="textarea"
                  fieldLabel="Articulation"
                  record={planData}
                  setRecord={setPlanData}
                  width={200}
                  height={40}
                />
                <MyInput
                  fieldName="patientFamilyConcerns"
                  fieldType="textarea"
                  fieldLabel="Patient/Family Concerns"
                  record={planData}
                  setRecord={setPlanData}
                  width={200}
                  height={40}
                />
              </div>
            </div>
          </div>

          <div className="goals-container">
            <div className="assessment-tools">
              <MyLabel label={<p className="bolddd">Assessment Tools Used</p>} />

              <div className="checkbox-item">
                {assessmentToolsOptions.map(option => (
                  <div key={option.value}>
                    <Checkbox
                      checked={planData.assessmentTools.includes(option.value)}
                      onChange={(value, checked) => {
                        if (checked) {
                          setPlanData(prev => ({
                            ...prev,
                            assessmentTools: [...prev.assessmentTools, option.value]
                          }));
                        } else {
                          setPlanData(prev => ({
                            ...prev,
                            assessmentTools: prev.assessmentTools.filter(
                              item => item !== option.value
                            )
                          }));
                        }
                      }}
                    >
                      {option.label}
                    </Checkbox>
                  </div>
                ))}
                {planData.assessmentTools.includes('Other') && (
                  <MyInput
                    fieldName="otherAssessmentTool"
                    fieldType="text"
                    fieldLabel=""
                    record={planData}
                    setRecord={setPlanData}
                    width={300}
                    className="margin-buttom-2"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

export default AssessmentSection;
