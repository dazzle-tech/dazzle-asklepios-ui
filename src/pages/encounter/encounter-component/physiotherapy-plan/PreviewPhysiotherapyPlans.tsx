import React from 'react';
import { Row, Slider, Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faClipboardList,
  faFileAlt,
  faPaperclip
} from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import AddProgressNotes from '../progress-notes/AddProgressNotes';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';

const PreviewPhysiotherapyPlans = ({
  planData,
  progressNotes,
  propsData,
  refetchAttachmentList,
  setRefetchAttachmentList,
  therapyTypeLovQueryResponse,
  frequencyLovQueryResponse,
  statusTableLovQueryResponse,
  mobilityImprovementLovQueryResponse
}) => {
  return (
    <Form fluid>
      {/* Treatment Goals */}
      <Row>
        <SectionContainer
          title={
            <div>
              <FontAwesomeIcon icon={faBullseye} className="font-small title-div-s" />
              Treatment Goals
            </div>
          }
          content={
            <div className="goals-container">
              <MyInput
                disabled
                fieldName="shortTermGoals"
                fieldType="textarea"
                fieldLabel="Short-term Goals"
                record={planData}
                setRecord={() => {}}
                width={350}
              />
              <MyInput
                disabled
                fieldName="longTermGoals"
                fieldType="textarea"
                fieldLabel="Long-term Goals"
                record={planData}
                setRecord={() => {}}
                width={350}
              />
              <MyInput
                disabled
                fieldName="expectedOutcome"
                fieldType="textarea"
                fieldLabel="Expected Outcome"
                record={planData}
                setRecord={() => {}}
                width={350}
              />
            </div>
          }
        />
      </Row>

      {/* Physiotherapy Plan Details */}
      <Row>
        <SectionContainer
          title={
            <div>
              <FontAwesomeIcon icon={faClipboardList} className="font-small title-div-s" />
              Physiotherapy Plan Details
            </div>
          }
          content={
            <>
              <div className="goals-container">
                <MyInput
                  disabled
                  fieldName="therapyType"
                  fieldType="select"
                  fieldLabel="Therapy Type"
                  record={planData}
                  setRecord={() => {}}
                  selectData={therapyTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={200}
                  searchable={false}
                />

                <div className="flex-class">
                  <MyInput
                    disabled
                    fieldName="frequencyNumber"
                    fieldType="number"
                    fieldLabel="Frequency"
                    record={planData}
                    setRecord={() => {}}
                    width={120}
                  />
                  <div className="margin-class">
                    <MyInput
                      disabled
                      fieldName="frequency"
                      fieldType="select"
                      fieldLabel=""
                      record={planData}
                      setRecord={() => {}}
                      selectData={frequencyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      width={120}
                      searchable={false}
                    />
                  </div>
                </div>

                <MyInput
                  disabled
                  fieldName="timeUnit"
                  fieldType="select"
                  fieldLabel="Time Unit"
                  record={planData}
                  setRecord={() => {}}
                  selectData={statusTableLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  width={120}
                  searchable={false}
                />

                <MyInput
                  disabled
                  fieldName="durationPerSession"
                  fieldType="number"
                  fieldLabel="Duration per Session"
                  record={planData}
                  setRecord={() => {}}
                  width={200}
                  rightAddon={'min'}
                  rightAddonwidth={50}
                />

                <div className="flex-class">
                  <MyInput
                    disabled
                    fieldName="totalPlanDuration"
                    fieldType="number"
                    fieldLabel="Total Plan Duration"
                    record={planData}
                    setRecord={() => {}}
                    width={120}
                  />
                  <div className="margin-class">
                    <MyInput
                      disabled
                      fieldName="totalPlanDuration"
                      fieldType="select"
                      fieldLabel=""
                      record={planData}
                      setRecord={() => {}}
                      selectData={frequencyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      width={120}
                      searchable={false}
                    />
                  </div>
                </div>
              </div>

              <div className="goals-container">
                <MyInput
                  disabled
                  fieldName="specificExercises"
                  fieldType="textarea"
                  fieldLabel="Specific Exercises / Procedures"
                  record={planData}
                  setRecord={() => {}}
                  rows={4}
                  width={550}
                />
                <MyInput
                  disabled
                  fieldName="precautions"
                  fieldType="textarea"
                  fieldLabel="Precautions"
                  record={planData}
                  setRecord={() => {}}
                  rows={3}
                  width={550}
                />
                <MyInput
                  disabled
                  fieldName="assistiveDevicesRequired"
                  fieldType="checkbox"
                  fieldLabel="Assistive Devices Required"
                  record={planData}
                  setRecord={() => {}}
                />
                {planData.assistiveDevicesRequired && (
                  <MyInput
                    disabled
                    fieldName="assistiveDevicesText"
                    fieldType="text"
                    fieldLabel="Specify Devices"
                    record={planData}
                    setRecord={() => {}}
                    width={400}
                  />
                )}
              </div>
            </>
          }
        />
      </Row>
    </Form>
  );
};

export default PreviewPhysiotherapyPlans;
