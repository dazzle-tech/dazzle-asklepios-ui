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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { calculateAgeFormat } from '@/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';

const QuickPatient = ({ open, setOpen, setPatient = null }) => {
  const dispatch = useAppDispatch();
  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });

  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();

  const [localEncounter, setLocalEncounter] = useState({
    ...newApEncounter,
    visitTypeLkey: '2041082245699228',
    patientKey: localPatient.key,
    plannedStartDate: new Date(),
    patientAge: calculateAgeFormat(localPatient.dob),
    discharge: false
  });
 const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const pageCode = useSelector((state: RootState) => state.div?.pageCode);

  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  useEffect(() => {
    if (localPatient?.dob) {
      const ageFormatted = calculateAgeFormat(localPatient.dob);
      setLocalPatient(
        prev =>
          ({
            ...(prev as any),
            ageDisplay: ageFormatted
          } as ApPatient)
      );
    } else {
      setLocalPatient(
        prev =>
          ({
            ...(prev as any),
            ageDisplay: ''
          } as ApPatient)
      );
    }
  }, [localPatient.dob]);

  // Handle Save
  const handleSave = async () => {
    try {
      // Remove ageDisplay before sending to backend
      const { ageDisplay, ...patientToSave } = (localPatient as any) || {};

      // 1. Save patient
      const savedPatient = await savePatient({
        ...(patientToSave as ApPatient),
        skipValidation: isUnknown,
        incompletePatient: true,
        unknownPatient: isUnknown
      }).unwrap();

      // 2. Save encounter (ER only)
      if (pageCode === 'ER_Triage') {
        await saveEncounter({
          ...localEncounter,
          patientKey: savedPatient.key,
          plannedStartDate: new Date(),
          encounterStatusLkey: '8890456518264959',
          patientAge: calculateAgeFormat(savedPatient.dob),
          visitTypeLkey: '2041082245699228',
          resourceTypeLkey: 'EMERGENCY',
          facilityKey: selectedFacility?.id,
          resourceKey: '5006'
        });
        dispatch(setRefetchEncounter(true));
      }
      setLocalPatient(savedPatient);
      if (setPatient != null) {
        setPatient(savedPatient);
      }
      setOpen(false);

      // 4. Cleanup
      handleClearModal();
      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
      setValidationResult(undefined);
    } catch (error) {
      if (error?.data?.validationResult) {
        setValidationResult(error.data.validationResult);
      }
    }
  };

  // Clear all fields
  const handleClearModal = () => {
    setIsUnknown(undefined);
    setLocalPatient(newApPatient);
  };

  // Modal content UI
  const quickPatientContent = (
    <Form layout="inline" fluid>
      {/* First Name */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldType="text"
        fieldName="firstName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
        required
      />

      {/* Last Name */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldType="text"
        fieldName="lastName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
        required
      />

      {/* Gender */}
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
        required
      />

      {/* DOB + AGE (Y M D) using MyInput for Age, read-only */}
      <div style={{ display: 'flex', gap: 10 }}>
        <MyInput
          width={200}
          vr={validationResult}
          column
          fieldType="date"
          fieldLabel="DOB"
          fieldName="dob"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={isUnknown}
          required
        />

        <MyInput
          width={150}
          vr={validationResult}
          column
          fieldType="text"
          fieldLabel="Age"
          fieldName="ageDisplay"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={true} 
        />
      </div>

      {/* Mobile */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldType="text"
        fieldName="mobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />

      <div>
        Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
      </div>
    </Form>
  );

  // Reset fields when modal closes
  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newApPatient });
      setLocalEncounter({
        ...newApEncounter,
        visitTypeLkey: '2041082245699228',
        patientKey: localPatient.key,
        plannedStartDate: new Date(),
        patientAge: calculateAgeFormat(localPatient.dob),
        discharge: false
      });
    }
  }, [open]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Quick Patient"
      steps={[{ title: 'Basic Information', icon: <FontAwesomeIcon icon={faBoltLightning} /> }]}
      size="xs"
      position="right"
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      content={quickPatientContent}
    />
  );
};

export default QuickPatient;
