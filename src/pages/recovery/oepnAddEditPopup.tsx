import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form } from 'rsuite';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VitalSigns from '../medical-component/vital-signs/VitalSigns';
const AddEditPopup = ({ open, setOpen, observation, setObservation, width }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <VitalSigns object={observation} setObject={setObservation} />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={observation?.key ? 'Edit Observation' : 'New Observation'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={observation?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Observation Info', icon: <FontAwesomeIcon icon={faHeartPulse} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditPopup;
