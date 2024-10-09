import React, { useEffect, useState } from 'react';
import { Modal, Button, Placeholder, Form, InputGroup, Input, Toggle } from 'rsuite';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';

import MyInput from '@/components/MyInput';
import { ApPatient } from '@/types/model-types';

import { useSavePatientMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatient } from '@/types/model-types-constructor';
const QuickPatient = ({ open, onClose }) => {
  const dispatch = useAppDispatch();

  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      handleClearModal();
      dispatch(notify('Patient added successfully'));
      dispatch(setPatient(savePatientMutation.data));
      setValidationResult(undefined);
    } else if (savePatientMutation && savePatientMutation.status === 'rejected') {
      console.log('rejected');
      setValidationResult(savePatientMutation.error['data'].validationResult);
    }
  }, [savePatientMutation]);

  const handleSave = async () => {
    savePatient({
      ...localPatient,
      skipValidation: isUnknown,
      incompletePatient: true,
      unknownPatient: isUnknown
    }).unwrap();

 
  };

  const handleClearModal = () => {
    onClose();
    setIsUnknown(undefined);
    setLocalPatient(newApPatient)
  };

  return (
    <div>
      <Modal size={'sm'} open={open} onClose={handleClearModal}>
        <Modal.Header>
          <Modal.Title>Quick Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div style={{padding: 15}}>
          <Form layout="inline" fluid>
            <MyInput
              width={250}
              vr={validationResult}
              column
              fieldName="firstName"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={isUnknown}
            />
            <MyInput
              width={250}
              vr={validationResult}
              column
              fieldLabel="Gender"
              fieldType="select"
              fieldName="genderLkey"
              selectData={genderLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={isUnknown}
            />
            <MyInput
              width={250}
              vr={validationResult}
              column
              fieldName="mobileNumber"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={isUnknown}
            />
            <MyInput
              width={250}
              vr={validationResult}
              column
              fieldType="date"
              fieldName="dob"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={isUnknown}
              allowNull
            />
            Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
          </Form>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClearModal} appearance="subtle">
            Cancel
          </Button>
          <Button onClick={handleSave} appearance="primary">
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuickPatient;
