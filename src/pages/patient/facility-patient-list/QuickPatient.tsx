import React, { useEffect, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';
import { notify } from '@/utils/uiReducerActions';

import type { Patient, PatientEncounter } from '@/types/model-types-new';
import { newPatient, newPatientEncounter } from '@/types/model-types-constructor-new';
import {
  useAddPatientMutation,
  useAddUnknownPatientMutation
} from '@/services/patient/patientService';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateEncounterMutation } from '@/services/encounters/patientEncounterService';

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const errorKey = data?.errorKey;
  const title = data?.title || '';
  const detail = data?.detail || '';
  const message = data?.message || '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId}`
      : '';

  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const lines = fieldErrors.map((e: any) => {
      const label = fieldLabels[e.field] || e.field;
      return `• ${label}: ${e.message}`;
    });
    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  if (errorKey === 'payload.required') return 'Patient payload is required.' + traceId;
  if (errorKey === 'notfound') return (detail || 'Patient not found.') + traceId;
  if (errorKey === 'unique.medical_record_number')
    return 'A patient with the same medical record number already exists.' + traceId;

  // NEW: backend message you got
  if (message === 'error.required.when.not.unknown')
    return 'Required fields are missing. Turn on "Unknown Patient" or fill First Name, Last Name, Gender and DOB.' + traceId;

  if (errorKey === 'db.constraint')
    return (detail || 'Database constraint violated while saving or updating patient.') + traceId;

  return (detail || title || message || 'Unexpected server error occurred.') + traceId;
};

const QuickPatient = ({ open, setOpen, setPatient = null }) => {
  const dispatch = useAppDispatch();

const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({});
  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });
  const [addPatient] = useAddPatientMutation();
  const [addUnknownPatient] = useAddUnknownPatientMutation();
  const [createEncounter] = useCreateEncounterMutation();

  const pageCode = useSelector((state: RootState) => state.div?.pageCode);
  const genderEnum = useEnumOptions('Gender');

  const handleSave = async () => {
    try {
      let savedPatient: Patient;

      if (isUnknown) {
        const payload: Patient = {
          ...localPatient,
          isUnknown: true,
          isVerified: false,
          isCompletedPatient: false,
          lastName: null as any,
          firstName: null as any,
          sexAtBirth: null as any,
          dateOfBirth: null as any,
          primaryMobileNumber: null as any,
          securityAccessLevel:
            localPatient.securityAccessLevel !== undefined ? localPatient.securityAccessLevel : null
        };

        savedPatient = await addUnknownPatient().unwrap();
      } else {
        const payload: Patient = {
          ...localPatient,
          isCompletedPatient: false,
          lastName: localPatient.lastName || '.',
          isUnknown: false,
          securityAccessLevel:
            localPatient.securityAccessLevel !== undefined ? localPatient.securityAccessLevel : null
        };

        savedPatient = await addPatient(payload).unwrap();
      }

      if (pageCode === 'ER_Triage') {

        const selectedDepartment = JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
        const departmentId = Number(selectedDepartment?.departmentId ?? 0);
        const facilityId = Number(selectedDepartment?.facilityId ?? 0);

        if (!departmentId || !facilityId) {
          dispatch(
            notify({
              msg: 'Missing logged-in department. Please select a department then try again.',
              sev: 'error'
            })
          );
          return;
        }

        const encounterBody: PatientEncounter = {
          ...newPatientEncounter,
          id: 0,
          patientId: Number(savedPatient.id ?? 0),
          facilityId,
          departmentId,
          encounterType: 'EMERGENCY',
          encounterReason: 'URGENT_VISIT',
          status: 'WAITING_TRIAGE',
          encounterDate: new Date(),
          paymentDate: new Date().toISOString(),
          amount: 0
        };

        await createEncounter({ body: encounterBody }).unwrap();

        dispatch(setRefetchEncounter(true));
      }

      setLocalPatient(savedPatient);

      if (typeof setPatient === 'function') {
        setPatient(savedPatient);
      }

      setOpen(false);
      handleClearModal();
      setValidationResult(undefined);

      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Sex At Birth',
        nationality: 'Nationality'
      });

      dispatch(notify({ msg, sev: 'error' }));

      if (err?.data?.validationResult) {
        setValidationResult(err.data.validationResult);
      }
    }
  };

  const handleClearModal = () => {
    setIsUnknown(false);
    setLocalPatient({ ...newPatient });
  };

  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newPatient });
         }
  }, [open]);

 const quickPatientContent = (
  <Form
    fluid
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }}
  >
    <MyInput
      required
      vr={validationResult}
      column
      fieldName="firstName"
      record={localPatient}
      setRecord={setLocalPatient}
      disabled={isUnknown}
      width={200}
    />

    <MyInput
      required
      vr={validationResult}
      column
      fieldName="lastName"
      record={localPatient}
      setRecord={setLocalPatient}
      disabled={isUnknown}
            width={200}

    />

    <MyInput
      required
      vr={validationResult}
      column
      fieldLabel="Gender"
      fieldType="select"
      fieldName="sexAtBirth"
      selectData={genderEnum ?? []}
      selectDataLabel="label"
      selectDataValue="value"
      record={localPatient}
      setRecord={setLocalPatient}
      disabled={isUnknown}
      searchable={false}
      width={200}
    />

    <MyInput
      required
      vr={validationResult}
      column
      fieldName="primaryMobileNumber"
      record={localPatient}
      setRecord={setLocalPatient}
      disabled={isUnknown}
      width={200}
    />

    <MyInput
      required
      vr={validationResult}
      column
      fieldName="email"
      record={localPatient}
      setRecord={setLocalPatient}
      width={200}
    />

    <MyInput
      required
      vr={validationResult}
      column
      fieldType="date"
      fieldLabel="DOB"
      fieldName="dateOfBirth"
      record={localPatient}
      setRecord={setLocalPatient}
      disabled={isUnknown}
      width={200}
    />

    {/* سطر كامل */}
    <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
      Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
    </div>
  </Form>
);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Quick Patient"
      steps={[
        {
          title: 'Basic Information',
          icon: <FontAwesomeIcon icon={faBoltLightning} />
        }
      ]}
      size="28vw"
      position="right"
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      content={quickPatientContent}
    />
  );
};

export default QuickPatient;