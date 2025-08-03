import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form } from 'rsuite';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VitalSigns from '../medical-component/vital-signs/VitalSigns';
import { useSaveContinuousVitalsMutation } from '@/services/RecoveryService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
const AddEditPopup = ({ open, setOpen, observation, setObservation, width ,operation ,refetch}) => {
  const dispatch = useAppDispatch();
  // Mutation hook to save continuous vitals
  const [save ]=useSaveContinuousVitalsMutation();
  // Function to handle save action
  const handleSave = async () => {
    try {
      await save({...observation,operationRequestKey:operation?.key}).unwrap();
      setOpen(false);
      refetch();
      dispatch(notify({msg: 'Saved successfully', sev: 'success'}));
    } catch (error) {
      console.error('Failed to save observation:', error);
      dispatch(notify({msg: 'Failed to save', sev: 'error'}));
    }
  };

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
      actionButtonFunction={handleSave}
      steps={[{ title: 'Observation Info', icon: <FontAwesomeIcon icon={faHeartPulse} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditPopup;
