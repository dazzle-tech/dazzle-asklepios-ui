import React, { useEffect, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { ApPatient } from '@/types/model-types';
import MyModal from '@/components/MyModal/MyModal';
import { useSavePatientMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatient } from '@/types/model-types-constructor';
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const QuickPatient = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [savePatient, savePatientMutation] = useSavePatientMutation();

  // Fetch LOV data for various fields
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  //handle Save Patient 
  const handleSave = async () => {
    try {
      const savedPatient = await savePatient({
        ...localPatient, 
        skipValidation: isUnknown,   
        incompletePatient: true,  
        unknownPatient: isUnknown
      }).unwrap();

      // Update local patient with saved data
      setLocalPatient(savedPatient);
      
      // Navigate with the saved patient data
      setOpen(false);
      const privatePatientPath = '/patient-profile';
      navigate(privatePatientPath, { state: { patient: savedPatient } });
      
      // Clear form and show success message
      handleClearModal();
      dispatch(notify({msg:'Patient added successfully',sev: 'success'}));
      setValidationResult(undefined);
    } catch (error) {
      console.log('rejected');
      if (error?.data?.validationResult) {
        setValidationResult(error.data.validationResult);
      }
    }
  };

  // Handle Clear Modal Fields
  const handleClearModal = () => {
    setIsUnknown(undefined);
    setLocalPatient(newApPatient)
  };

  // Quick Patient Modal Content
  const quickPatientContent = (
    <Form layout="inline" fluid>
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldName="firstName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />
      <MyInput
        width={350}
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
        searchable={false}
      />
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldName="mobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldType="date"
        fieldLabel="DOB"
        fieldName="dob"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
        allowNull
      />
      <div>
        Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
      </div>
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Quick Patient"
      steps={[{ title: "Basic Information", icon: <FontAwesomeIcon icon={faBoltLightning }/>}]}
      size="xs"
      position='right'
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      content={quickPatientContent}
    />
  );
};

export default QuickPatient;
