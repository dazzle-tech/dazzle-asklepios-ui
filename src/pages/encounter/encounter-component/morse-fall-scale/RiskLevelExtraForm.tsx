import MyModal from '@/components/MyModal/MyModal';
import React, { useState } from 'react';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { PlusRound } from '@rsuite/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import MyButton from '@/components/MyButton/MyButton';
import { useLocation } from 'react-router-dom';
const RiskLevelExtraForm = ({ open, setOpen, width, object, setObject, handleSave }) => {
  const [actionType, setActionType] = useState(null);
  const location = useLocation();
  const propsData = location.state;
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();

  // handle add new attachment
  const handleAddNewAttachment = () => {
    setAttachmentsModalOpen(true);
  };

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="fallPreventionPlanTriggered"
              fieldLabel="Fall Prevention Plan Triggered"
              fieldType="checkbox"
              record={object}
              setRecord={setObject}
              disabled={object?.key}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="fallRiskWristbandApplied"
                  fieldLabel="Fall-risk wristband applied"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="bedInLowPosition"
                  fieldLabel="Bed in low position"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="bedAlarmsEnabled"
                  fieldLabel="Bed alarms enabled"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="hourRounding"
                  fieldLabel="2-hour rounding"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="nonSkidFootwear"
                  fieldLabel="Non-skid footwear"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="assistiveDeviceProvided"
                  fieldLabel="Assistive device provided"
                  fieldType="check"
                  record={object}
                  setRecord={setObject}
                  showLabel={false}
                  disabled={object?.key}
                />
              </Col>
            </Row>
            <br />
            <MyInput
                  width="100%"
                  fieldName="assessmentNotes"
                  fieldLabel="Assessment Notes"
                  fieldType="textarea"
                  record={object}
                  setRecord={setObject}
                  disabled={object?.key}
                />
                 <MyInput
                  width="100%"
                  fieldName="nextAssessmentDue"
                  fieldLabel="Next Assessment Due"
                  fieldType="date"
                  record={object}
                  setRecord={setObject}
                  disabled={object?.key}
                />
            <MyButton
              onClick={handleAddNewAttachment}
              disabled={object?.key}
              prefixIcon={() => <PlusRound />}
            >
              New Attachment
            </MyButton>
            <AttachmentModal
              isOpen={attachmentsModalOpen}
              setIsOpen={setAttachmentsModalOpen}
              actionType={actionType}
              setActionType={setActionType}
              attachmentSource={propsData?.patient}
              selectedPatientAttacment={selectedAttachment}
              setSelectedPatientAttacment={setSelectedAttachment}
              requestedPatientAttacment={requestedPatientAttacment}
              setRequestedPatientAttacment={setRequestedPatientAttacment}
              attatchmentType="PATIENT_PROFILE_ATTACHMENT"
              patientKey={propsData?.patient?.key}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={object?.key ? 'Prevention Plan' : 'New Prevention Plan'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      hideActionBtn={object?.key ? true : false}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Prevention Plan', icon: <FontAwesomeIcon icon={faListCheck} /> }]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default RiskLevelExtraForm;
