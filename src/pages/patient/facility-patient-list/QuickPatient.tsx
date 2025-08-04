import React, { useEffect, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import { ApPatient } from '@/types/model-types';
import MyModal from '@/components/MyModal/MyModal';
import { useSavePatientMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { calculateAgeFormat } from '@/utils';
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';

const QuickPatient = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob), discharge: false });
  const pageCode = useSelector((state: RootState) => state.div?.pageCode);

  // Fetch LOV data for various fields
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  //handle Save Patient 
  const handleSave = async () => {
    try {
      // 1. Save patient and wait for the result
      const savedPatient = await savePatient({
        ...localPatient,
        skipValidation: isUnknown,
        incompletePatient: true,
        unknownPatient: isUnknown
      }).unwrap();

      // 2. Save encounter using saved patient key
      // 2. Save encounter using saved patient key
      if (pageCode === 'ER_Triage') {
        await saveEncounter({
          ...localEncounter,
          patientKey: savedPatient.key,
          plannedStartDate: new Date(),
          encounterStatusLkey: "8890456518264959",
          patientAge: calculateAgeFormat(savedPatient.dob),
          visitTypeLkey: '2041082245699228',
          resourceTypeLkey: '6743167799449277',
          resourceKey: '7101086042442391',
        });
        dispatch(setRefetchEncounter(true));
      }

      // 3. Update state and navigate
      setLocalPatient(savedPatient);
      setOpen(false);
      { pageCode !== 'ER_Triage' && navigate('/patient-profile', { state: { patient: savedPatient } }) };

      // 4. Clean up
      handleClearModal();
      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
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
  // Effects
  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newApPatient });
      setLocalEncounter({ ...newApEncounter, visitTypeLkey: '2041082245699228', patientKey: localPatient.key, plannedStartDate: new Date(), patientAge: calculateAgeFormat(localPatient.dob), discharge: false });
    }
  }, [open]);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Quick Patient"
      steps={[{ title: "Basic Information", icon: <FontAwesomeIcon icon={faBoltLightning} /> }]}
      size="xs"
      position='right'
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      content={quickPatientContent}
    />
  );
};

export default QuickPatient;
