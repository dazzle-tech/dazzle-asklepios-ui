import React, { useEffect, useMemo, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '@/hooks';
import { RootState } from '@/store';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';

import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { setRefetchEncounter } from '@/reducers/refetchEncounterState';
import { notify } from '@/utils/uiReducerActions';

import type { Patient } from '@/types/model-types-new';
import { newPatient } from '@/types/model-types-constructor-new';
import * as modelTypes from '@/types/model-types-new';

import {
  useAddPatientMutation,
  useAddUnknownPatientMutation
} from '@/services/patient/patientService';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateQuickAppointmentMutation } from '@/services/appointment/appointmentService';
import { useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery } from '@/services/security/departmentService';
import { useLazyGetPractitionersByDepartmentQuery } from '@/services/setup/practitioner/PractitionerDepartmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { PhoneNumberInput } from '@/components';

const ENCOUNTER_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Encounter data is required.',
  'patient.invalid': 'Invalid patient id.',
  'patient.notfound': 'Patient not found.',
  'followUpEncounter.invalid': 'Invalid follow-up encounter id.',
  'followUpEncounter.notfound': 'Follow-up encounter not found.',
  'encounterNumber.duplicate': 'Encounter number already exists.',
  'id.notfound': 'Encounter record not found.',
  notfound: 'Encounter record not found.',
  'followUpEncounter.required.followup':
    'Follow-up Encounter is required when Reason is Follow up.',
  'followUpEncounter.required.byReason':
    'Follow-up Encounter is required when Reason is Follow up (and must be empty otherwise).',
  'department.date.sequence.duplicate':
    'Daily sequence number already exists for this department and date. Please try again.',
  'patient.emergency.notAllowed.withOngoing':
    'Patient currently treated by another doctor',
  duplicate: 'Duplicate record.',
  'facility.invalid': 'Invalid facility id.',
  'department.invalid': 'Invalid department id.',
  'practitioner.invalid': 'Invalid practitioner id.',
  'db.constraint': 'Database constraint violation while saving encounter.'
};

const ENCOUNTER_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  facilityId: 'Facility',
  departmentId: 'Department',
  practitionerId: 'Practitioner',
  encounterType: 'Encounter Type',
  encounterReason: 'Reason',
  followUpEncounterId: 'Follow-up Encounter',
  priorityLevel: 'Priority',
  originType: 'Origin Type',
  originName: 'Origin Name',
  notes: 'Notes',
  status: 'Status',
  encounterDate: 'Date',
  departmentDailySequenceNumber: 'Department Daily Sequence'
};

const QUICK_PATIENT_REQUIRED_FIELDS: Array<{ key: keyof Patient; label: string }> = [
  { key: 'firstName', label: 'First Name' },
  { key: 'secondName', label: 'Second Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'sexAtBirth', label: 'Gender' },
  { key: 'primaryMobileNumber', label: 'Primary Mobile Number' },
  { key: 'dateOfBirth', label: 'DOB' }
];

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? err ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size')) return 'length is out of range';
    if (m.includes('greater')) return 'value is too small';
    if (m.includes('less')) return 'value is too large';
    return msg || 'invalid value';
  };

  const toLabel = (field: string) => ENCOUNTER_FIELD_LABELS[field] ?? field;

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map(
      (fe: any) => `• ${toLabel(fe.field)}: ${normalizeMsg(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey =
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

const toHumanBackendError = (err: any, fieldLabels: Record<string, string> = {}): string => {
  const data = err?.data ?? {};
  const errorKeyRaw = data?.errorKey || data?.message || data?.properties?.message || '';
  const errorKey = String(errorKeyRaw).replace(/^error\./, '');

  const title = data?.title || '';
  const detail = data?.detail && data.detail !== 'null' ? data.detail : '';
  const message = data?.message || '';
  const fieldErrors = data?.fieldErrors;

  const traceId =
    data?.traceId || data?.correlationId || data?.requestId
      ? `\nTrace ID: ${data?.traceId || data?.correlationId || data?.requestId}`
      : '';

  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const lines = fieldErrors.map((e: any) => {
      const label = fieldLabels[e.field] || e.field;
      return `• ${label}: ${e.message}`;
    });

    return `Please fix the following fields:\n${lines.join('\n')}${traceId}`;
  }

  const keyMap: Record<string, string> = {
    'payload.required': 'Patient payload is required.',
    notfound: 'Patient not found.',
    'unique.medical_record_number': 'A patient with the same medical record number already exists.',
    'unique.document_id': 'A patient with the same document ID already exists.',
    'required.fields': 'Required patient fields are missing.',
    'required.fields.when.not.unknown':
      'Required patient fields are missing: first name, last name, gender, date of birth, primary mobile number, and email are required unless the patient is marked as unknown.',
    'mrn.not.generated': 'Medical record number was not generated by the database.',
    'created_by.required': 'Created by is required while saving patient.',
    'is_unknown.required': 'Unknown patient flag is required.',
    'is_verified.required': 'Verified patient flag is required.',
    'is_completed_patient.required': 'Completed patient flag is required.',
    'db.constraint':
      'Could not save patient. A value may already exist or a required field is invalid. Check names, mobile number, document ID, and document details, then try again.'
  };

  if (keyMap[errorKey]) {
    return keyMap[errorKey] + traceId;
  }

  return (detail || title || message || 'Unexpected server error occurred.') + traceId;
};

type QuickPatientProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  setPatient?: ((patient: Patient) => void) | null;
};

const QuickPatient = ({ open, setOpen, setPatient = null }: QuickPatientProps) => {
  const dispatch = useAppDispatch();

  const pageCode = useSelector((state: RootState) => state.div?.pageCode);
  const selectedDepartmentFromStore = useSelector(
    (state: RootState) => (state as any).auth?.selectedDepartment
  );

  const genderEnum = useEnumOptions('Gender');
  const EncounterTypeEnum = useEnumOptions('EncounterType');

  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({});
  const [localPatient, setLocalPatient] = useState<Patient>({ ...newPatient });

  const [addPatient] = useAddPatientMutation();
  const [addUnknownPatient] = useAddUnknownPatientMutation();
  const [createQuickAppointment] = useCreateQuickAppointmentMutation();

  const [encounterType, setEncounterType] = useState<string>('EMERGENCY');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<number | null>(null);

  const [deptPage, setDeptPage] = useState(0);
  const deptSize = 20;
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(0);

  const [practPage, setPractPage] = useState(0);
  const practSize = 20;
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);

  const [triggerDepartments, { data: deptList, isFetching: isDepartmentsFetching }] =
    useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery();

  const [
    triggerPractitionersByDept,
    { data: practitionersList, isFetching: isPractitionersFetching }
  ] = useLazyGetPractitionersByDepartmentQuery();

  const deptHasMore = Boolean(deptList?.links?.next);
  const practHasMore = Boolean(practitionersList?.links?.next);

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const resetPractitionersState = () => {
    setSelectedPractitionerId(null);
    setPractPage(0);
    setAllPractitioners([]);
  };

  const resetDepartmentsState = () => {
    setSelectedDepartmentId(null);
    setDeptPage(0);
    setAllDepartments([]);
    resetPractitionersState();
  };

  const handleClearModal = () => {
    setIsUnknown(false);
    setValidationResult({});
    setLocalPatient({ ...newPatient });
    setEncounterType('EMERGENCY');
    resetDepartmentsState();
  };

  useEffect(() => {
    const facilityFromStore = Number(selectedDepartmentFromStore?.facilityId ?? 0);

    if (facilityFromStore > 0) {
      setSelectedFacilityId(facilityFromStore);
      return;
    }

    try {
      const selectedDepartment = JSON.parse(localStorage.getItem('selectedDepartment') || 'null');
      setSelectedFacilityId(Number(selectedDepartment?.facilityId ?? 0));
    } catch {
      setSelectedFacilityId(0);
    }
  }, [open, selectedDepartmentFromStore]);

  const fetchDepartments = async (page = 0) => {
    if (!selectedFacilityId) return;
    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') return;

    try {
      const result = await triggerDepartments({
        facilityId: selectedFacilityId,
        encounterType: 'EMERGENCY',
        page,
        size: deptSize,
        sort: 'id,asc'
      }).unwrap();

      const rows = result?.data ?? [];

      setAllDepartments(prev => {
        if (page === 0) {
          return rows;
        }

        const seenIds = new Set(prev.map((d: any) => Number(d.id)));
        const merged = [...prev];

        rows.forEach((d: any) => {
          if (!seenIds.has(Number(d.id))) {
            merged.push(d);
          }
        });

        return merged;
      });

      if (page === 0) {
        setSelectedDepartmentId(prevSelectedDepartmentId => {
          if (prevSelectedDepartmentId !== null && prevSelectedDepartmentId !== undefined) {
            return prevSelectedDepartmentId;
          }

          const firstDepartmentId = rows?.[0]?.id;
          return firstDepartmentId !== undefined && firstDepartmentId !== null
            ? Number(firstDepartmentId)
            : null;
        });
      }
    } catch (error) {
      console.error('fetchDepartments error:', error);

      if (page === 0) {
        setAllDepartments([]);
      }
    }
  };

  useEffect(() => {
    if (!open) return;

    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') {
      setAllDepartments([]);
      resetPractitionersState();
      return;
    }

    if (!selectedFacilityId) {
      setAllDepartments([]);
      resetPractitionersState();
      return;
    }

    if (encounterType !== 'EMERGENCY') {
      setAllDepartments([]);
      resetPractitionersState();
      return;
    }

    fetchDepartments(deptPage);
  }, [open, pageCode, selectedFacilityId, encounterType, deptPage]);

  useEffect(() => {
    if (open && (pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage')) {
      setDeptPage(0);
      setSelectedDepartmentId(null);
      setAllDepartments([]);
      resetPractitionersState();
    }
  }, [open, pageCode, selectedFacilityId]);

  useEffect(() => {
    if (!open) {
      handleClearModal();
    }
  }, [open]);

  const mergePractitioners = (rows: any[], page: number) => {
    setAllPractitioners(prev => {
      if (page === 0) return rows;

      const seenIds = new Set(prev.map((p: any) => Number(p.id)));
      const merged = [...prev];

      rows.forEach((p: any) => {
        if (!seenIds.has(Number(p.id))) {
          merged.push(p);
        }
      });

      return merged;
    });
  };

  const fetchPractitioners = async (departmentId: number, page = 0) => {
    if (!departmentId) return;
    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') return;

    try {
      const result = await triggerPractitionersByDept({
        departmentId,
        page,
        size: practSize,
        sort: 'id,asc'
      }).unwrap();

      mergePractitioners(result?.data ?? [], page);
    } catch (error) {
      console.error('fetchPractitioners error:', error);

      if (page === 0) {
        setAllPractitioners([]);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') {
      resetPractitionersState();
      return;
    }

    if (!selectedDepartmentId) {
      resetPractitionersState();
      return;
    }

    setSelectedPractitionerId(null);
    setPractPage(0);
    setAllPractitioners([]);
    fetchPractitioners(Number(selectedDepartmentId), 0);
  }, [open, pageCode, selectedDepartmentId]);

  useEffect(() => {
    if (!open) return;
    if (!selectedDepartmentId) return;
    if (practPage === 0) return;
    if (pageCode !== 'ER_Triage' && pageCode !== 'Urgent_Care_Triage') return;

    fetchPractitioners(Number(selectedDepartmentId), practPage);
  }, [practPage]);

  const isPhoneValid = (phone: any) => {
    if (!phone) return false;

    const value = String(phone).trim();

    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return false;

    return true;
  };

  const validateMandatoryFields = () => {
    if (isUnknown) return true;

    const missingFields = QUICK_PATIENT_REQUIRED_FIELDS.filter(({ key }) => {
      const value = (localPatient as any)?.[key];
      if (key === 'primaryMobileNumber') {
        return !isPhoneValid(value);
      }

      if (value === null || value === undefined) return true;
      if (typeof value === 'string' && value.trim() === '') return true;

      return false;
    }).map(({ label }) => label);

    if (missingFields.length > 0) {
      dispatch(
        notify({
          msg: `Please fill all mandatory fields: ${missingFields.join(', ')}`,
          sev: 'warning'
        })
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateMandatoryFields()) {
      return;
    }

    if (pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage') {
      if (!selectedFacilityId || !selectedDepartmentId) {
        dispatch(
          notify({
            msg: 'Please select a department before saving.',
            sev: 'warning'
          })
        );
        return;
      }

      if (!selectedPractitionerId) {
        dispatch(
          notify({
            msg: 'Please select a practitioner before saving.',
            sev: 'warning'
          })
        );
        return;
      }
    }

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

        savedPatient = await addUnknownPatient(payload as any).unwrap();
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

      if (pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage') {
        const facilityId = selectedFacilityId;
        const departmentId = selectedDepartmentId;
        const practitionerId = Number(selectedPractitionerId ?? 0);

        const payload: modelTypes.AppointmentFromTemplateQuickAppointmentDTO = {
          facilityId: Number(facilityId),
          departmentId: Number(departmentId),
          resourceType: 'PRACTITIONER' as modelTypes.TemplateType,
          resourceId: practitionerId,
          patientId: Number(savedPatient.id ?? 0),
          service: 'URGENT_VISIT' as modelTypes.EncounterReason,
          priority: 'NORMAL',
          defaultServiceId: null,
          defaultPractitionerId: practitionerId,
          reason: null,
          note: null,
          followUpEncounterId: null,
          originType: null,
          originName: null
        };

        try {
          await createQuickAppointment(payload).unwrap();
          dispatch(setRefetchEncounter(true));
        } catch (encounterError: any) {
          handleCrudError(encounterError, dispatch, ENCOUNTER_ERROR_MAP);
          return;
        }
      }

      setLocalPatient(savedPatient);

      if (typeof setPatient === 'function') {
        setPatient(savedPatient);
      }

      setOpen(false);
      handleClearModal();

      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
    } catch (err: any) {
      const msg = toHumanBackendError(err, {
        firstName: 'First Name',
        secondName: 'Second Name',
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        primaryMobileNumber: 'Primary Mobile Number',
        sexAtBirth: 'Gender',
        email: 'Email',
        nationality: 'Nationality',
        documentId: 'Document ID',
        medicalRecordNumber: 'Medical Record Number'
      });

      dispatch(notify({ msg, sev: 'warning' }));

      if (err?.data?.validationResult) {
        setValidationResult(err.data.validationResult);
      }
    }
  };

  const quickPatientContent = useMemo(
    () => (
      <Form
        fluid
      >
       <div className="my-modal-responsive-form-handle">
        <MyInput
          required
          vr={validationResult}
          column
          fieldName="firstName"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={isUnknown}
          width={"14vw"}
        />

        <MyInput
          required
          vr={validationResult}
          column
          fieldName="secondName"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={isUnknown}
          width={"14vw"}
        />

        <MyInput
          required
          vr={validationResult}
          column
          fieldName="lastName"
          record={localPatient}
          setRecord={setLocalPatient}
          disabled={isUnknown}
          width={"14vw"}
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
          width={"14vw"}
        />

       <PhoneNumberInput
          required
          column
          fieldName="primaryMobileNumber"
          record={localPatient}
          setRecord={setLocalPatient}
          fieldLabel="Primary Mobile Number" 
          disabled={isUnknown}
          width={"14vw"}
        />

        <MyInput
          vr={validationResult}
          column
          fieldName="email"
          record={localPatient}
          setRecord={setLocalPatient}
          width={"14vw"}
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
          disableFutureDates
          showWarningIfBeforeYear1900
          disabled={isUnknown}
          width={"14vw"}
        />

          <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
          </div>

        {(pageCode === 'ER_Triage' || pageCode === 'Urgent_Care_Triage') && (
          <>
            <MyInput
              column
              width={"14vw"}
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
                  setDeptPage(0);
                  setSelectedDepartmentId(null);
                  setAllDepartments([]);
                  resetPractitionersState();
                }
              }}
              disabled={true}
              searchable={false}
            />

            <MyInput
              width={"14vw"}
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

            <MyInput
              width={"14vw"}
              required
              column
              fieldType="selectPagination"
              fieldLabel="Practitioner"
              fieldName="practitionerId"
              selectData={allPractitioners}
              selectDataLabel={['firstName', 'lastName']}
              selectDataValue="id"
              record={{ practitionerId: selectedPractitionerId }}
              setRecord={(record: any) => {
                if (record.practitionerId !== undefined) {
                  setSelectedPractitionerId(
                    record.practitionerId === null || record.practitionerId === ''
                      ? null
                      : Number(record.practitionerId)
                  );
                }
              }}
              searchable
              disabled={!selectedDepartmentId}
              loading={isPractitionersFetching}
              hasMore={practHasMore}
              onFetchMore={() => {
                if (practitionersList?.links?.next) {
                  const { page } = extractPaginationFromLink(practitionersList.links.next);
                  setPractPage(page);
                }
              }}
            />
          </>
        )}
        </div>
      </Form>
    ),
    [
      validationResult,
      localPatient,
      isUnknown,
      genderEnum,
      pageCode,
      EncounterTypeEnum,
      encounterType,
      allDepartments,
      selectedDepartmentId,
      selectedFacilityId,
      isDepartmentsFetching,
      deptHasMore,
      deptList?.links?.next,
      allPractitioners,
      selectedPractitionerId,
      isPractitionersFetching,
      practHasMore,
      practitionersList?.links?.next
    ]
  );

  return (
    <div dir={dir}>
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
        size="33vw"
        bodyheight="70vh"
        position="right"
        actionButtonLabel="Create"
        actionButtonFunction={handleSave}
        content={<div dir={dir}>{quickPatientContent}</div>}
      />
    </div>
  );
};

export default QuickPatient;