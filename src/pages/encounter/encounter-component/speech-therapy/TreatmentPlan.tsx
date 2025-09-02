import React, { useState } from 'react';
import { Slider, Checkbox } from 'rsuite';
import Section from '@/components/Section';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './style.less';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';

// Therapy type options
const therapyTypeOptions = [
  { value: 'Articulation', label: 'Articulation' },
  { value: 'Language', label: 'Language' },
  { value: 'Voice', label: 'Voice' },
  { value: 'Fluency', label: 'Fluency' },
  { value: 'Cognitive-communication', label: 'Cognitive-communication' },
  { value: 'Swallowing', label: 'Swallowing' }
];
// Assistive devices options
const assistiveDevicesOptions = [
  { value: 'AAC device', label: 'AAC device' },
  { value: 'Communication board', label: 'Communication board' },
  { value: 'Voice amplifier', label: 'Voice amplifier' },
  { value: 'Other', label: 'Other' }
];
// Therapy techniques options
const therapyTechniquesOptions = [
  { value: 'Oral motor exercises', label: 'Oral motor exercises' },
  { value: 'Breath support', label: 'Breath support' },
  { value: 'Phonation drills', label: 'Phonation drills' },
  { value: 'AAC training', label: 'AAC training' },
  { value: 'Swallowing maneuvers', label: 'Swallowing maneuvers' },
  { value: 'Voice therapy', label: 'Voice therapy' }
];

const TreatmentPlan = () => {
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

  // Fetch LOV (List of Values) from backend
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  return (
    <>
      <SectionContainer
        title={
          <div className="title-div">
            <FontAwesomeIcon icon={faClipboardList} className="font-small title-div-s" />
            <p className="font-small title-div-p">Treatment Plan</p>
          </div>
        }
        content={
          <>
            <div className="goals-container">
              <div className="therapy-type">
                <label>
                  <Translate>Therapy Type</Translate>
                </label>
                <div className="checkbox-item">
                  {therapyTypeOptions.map(option => (
                    <div key={option.value}>
                      <Checkbox
                        checked={planData.therapyType.includes(option.value)}
                        onChange={(value, checked) => {
                          if (checked) {
                            setPlanData(prev => ({
                              ...prev,
                              therapyType: [...prev.therapyType, option.value]
                            }));
                          } else {
                            setPlanData(prev => ({
                              ...prev,
                              therapyType: prev.therapyType.filter(item => item !== option.value)
                            }));
                          }
                        }}
                      >
                        {option.label}
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </div>

              <MyInput
                fieldName="durationPerSession"
                fieldType="number"
                fieldLabel="Duration per Session"
                record={planData}
                setRecord={setPlanData}
                width={200}
                rightAddon={'min'}
                rightAddonwidth={50}
              />

              <div className="flexs-class-no-gap">
                <MyInput
                  fieldName="totalPlanDuration"
                  fieldType="number"
                  fieldLabel="Total Plan Duration"
                  record={planData}
                  setRecord={setPlanData}
                  width={120}
                />
                <div className="margin-class">
                  <MyInput
                    fieldName="totalPlanDurationUnit"
                    fieldType="select"
                    fieldLabel=""
                    record={planData}
                    setRecord={setPlanData}
                    selectData={timeUnitLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width={120}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="flexs-class-no-gap">
                <MyInput
                  fieldName="sessionFrequencyNumber"
                  fieldType="number"
                  fieldLabel="Session Frequency"
                  record={planData}
                  setRecord={setPlanData}
                  width={120}
                />
                <div className="margin-class">
                  <MyInput
                    fieldName="sessionFrequency"
                    fieldType="select"
                    fieldLabel=""
                    record={planData}
                    setRecord={setPlanData}
                    selectData={timeUnitLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    width={120}
                    searchable={false}
                  />
                </div>
              </div>
            </div>

            <div className="goals-container">
              <div className="goals-container">
                <div className="therapy-techniques">
                  <label>
                    <Translate>Therapy Techniques</Translate>
                  </label>
                  <div className="checkbox-item">
                    {therapyTechniquesOptions.map(option => (
                      <div key={option.value}>
                        <Checkbox
                          checked={planData.therapyTechniques.includes(option.value)}
                          onChange={(value, checked) => {
                            if (checked) {
                              setPlanData(prev => ({
                                ...prev,
                                therapyTechniques: [...prev.therapyTechniques, option.value]
                              }));
                            } else {
                              setPlanData(prev => ({
                                ...prev,
                                therapyTechniques: prev.therapyTechniques.filter(
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
                  </div>
                </div>
              </div>
              <div className="goals-container">
                <div className="assistive-devices">
                  <label>
                    <Translate>Assistive Devices Needed</Translate>
                  </label>

                  <div className="checkbox-item">
                    {assistiveDevicesOptions.map(option => (
                      <div key={option.value}>
                        <Checkbox
                          checked={planData.assistiveDevices.includes(option.value)}
                          onChange={(value, checked) => {
                            if (checked) {
                              setPlanData(prev => ({
                                ...prev,
                                assistiveDevices: [...prev.assistiveDevices, option.value]
                              }));
                            } else {
                              setPlanData(prev => ({
                                ...prev,
                                assistiveDevices: prev.assistiveDevices.filter(
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

                    {planData.assistiveDevices.includes('Other') && (
                      <MyInput
                        fieldName="otherAssistiveDevice"
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

              <MyInput
                fieldName="patientCaregiverEducationPlan"
                fieldType="textarea"
                fieldLabel="Patient/Caregiver Education Plan"
                record={planData}
                setRecord={setPlanData}
                width={500}
                rows={4}
              />

              <MyInput
                fieldName="homeExercises"
                fieldType="textarea"
                fieldLabel="Home Exercises"
                record={planData}
                setRecord={setPlanData}
                width={500}
                rows={4}
              />
            </div>
          </>
        }
      />
    </>
  );
};

export default TreatmentPlan;
