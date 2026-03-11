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
import { useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

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

  // Encounter type and department state for ER Triage
  const [encounterType, setEncounterType] = useState<string>('EMERGENCY');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [deptPage, setDeptPage] = useState(0);
  const deptSize = 20;
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  const EncounterTypeEnum = useEnumOptions('EncounterType');

  const [triggerDepartments, { data: deptList, isFetching: isDepartmentsFetching }] =
    useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

  // Get selected facility from auth or selectedDepartment
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(0);

  useEffect(() => {
    try {
      const selectedDepartment = JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
      setSelectedFacilityId(Number(selectedDepartment?.facilityId ?? 0));
    } catch {
      setSelectedFacilityId(0);
    }
  }, [open]);

  // Fetch departments when encounter type is EMERGENCY and facility is available (only for ER_Triage)
  useEffect(() => {
    if (pageCode !== 'ER_Triage') {
      setAllDepartments([]);
      return;
    }

    if (!selectedFacilityId || encounterType !== 'EMERGENCY') {
      setAllDepartments([]);
      return;
    }

    if (deptPage === 0) {
      setAllDepartments([]);
    }

    triggerDepartments({
      facilityId: selectedFacilityId,
      encounterType: 'EMERGENCY',
      page: deptPage,
      size: deptSize,
      sort: 'id,asc'
    });
  }, [pageCode, selectedFacilityId, encounterType, deptPage, triggerDepartments]);

  // Accumulate department results
  useEffect(() => {
    const rows = deptList?.data ?? [];
    if (!rows.length) return;

    setAllDepartments(previousDepartments => {
      const seenIds = new Set(previousDepartments.map((department: any) => Number(department.id)));
      const merged = [...previousDepartments];
      rows.forEach((department: any) => {
        if (!seenIds.has(Number(department.id))) merged.push(department);
      });
      return merged;
    });
  }, [deptList]);

  const deptHasMore = Boolean(deptList?.links?.next);

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
        const facilityId = selectedFacilityId;
        const departmentId = selectedDepartmentId;

        if (!departmentId || !facilityId) {
          dispatch(
            notify({
              msg: 'Please select a department before saving.',
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
    setEncounterType('EMERGENCY');
    setSelectedDepartmentId(null);
    setDeptPage(0);
    setAllDepartments([]);
  };

  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newPatient });
      setEncounterType('EMERGENCY');
      setSelectedDepartmentId(null);
      setDeptPage(0);
      setAllDepartments([]);
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

    {pageCode === 'ER_Triage' && (
      <>
        <MyInput
          column
          width={200}
          required
          fieldLabel="Encounter Type"
          fieldType="select"
          fieldName="encounterType"
          selectData={EncounterTypeEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={{ encounterType }}
          setRecord={(record: any) => {
            if (record.encounterType) {
              setEncounterType(record.encounterType);
            }
          }}
          disabled={true}
          searchable={false}
        />

        <MyInput
          width={200}
          required
          column
          fieldType="selectPagination"
          fieldLabel="Department"
          fieldName="departmentId"
          selectData={allDepartments}
          selectDataLabel="name"
          selectDataValue="id"
          record={{ departmentId: selectedDepartmentId }}
          setRecord={(record: any) => {
            if (record.departmentId !== undefined) {
              setSelectedDepartmentId(record.departmentId);
            }
          }}
          searchable
          disabled={!selectedFacilityId || encounterType !== 'EMERGENCY'}
          loading={isDepartmentsFetching}
          hasMore={deptHasMore}
          onFetchMore={() => {
            if (deptList?.links?.next) {
              const { page } = extractPaginationFromLink(deptList.links.next);
              setDeptPage(page);
            }
          }}
        />
      </>
    )}
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