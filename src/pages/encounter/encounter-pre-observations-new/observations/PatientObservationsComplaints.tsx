import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useState } from 'react';

import './styles.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import type {
  PatientEncounter,
  PatientObservationsComplaints as PatientObservationsComplaintsModel
} from '@/types/model-types-new';
import { newPatientObservationsComplaints } from '@/types/model-types-constructor-new';

import {
  useCreatePatientObservationsComplaintsMutation,
  useGetLatestPatientObservationsComplaintsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';

import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { useEnumOptions } from '@/services/enumsApi';
import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';
import { useGetPatientByIdQuery } from '@/services/patient/patientService';

type PatientObservationsComplaintsProps = {
  patientId: number;
  encounterId: number;
  encounter: PatientEncounter;
  setEncounter: (e: PatientEncounter) => void;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const PatientObservationsComplaints: React.FC<PatientObservationsComplaintsProps> = ({
  patientId,
  encounterId,
  encounter,
  setEncounter,
  disabled = false,
  width = '100%',
  title = 'Nursing Assessment'
}) => {
  const dispatch = useAppDispatch();

  const patientConditions = useEnumOptions('Condition');
  const encounterPriority = useEnumOptions('EncounterPriority');
  const modeOfArrivalOptions = useEnumOptions('ModeOfArrival');
  const bloodGroupOptions = useEnumOptions('BloodGroup', {
    labelOverrides: {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
      UNKNOWN: 'Unknown'
    }
  });

  const [createPatientObservationsComplaints] = useCreatePatientObservationsComplaintsMutation();
  const [updateEncounter] = useUpdateEncounterMutation();

  const { data: latestByEncounter } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  const { data: patientData, refetch: refetchPatient } = useGetPatientByIdQuery(
    { id: patientId },
    { skip: !patientId }
  );

  const [record, setRecord] = useState<PatientObservationsComplaintsModel>({
    ...newPatientObservationsComplaints,
    patientId,
    encounterId
  });


const { data: sourceOfInformationLovQueryResponse } =
  useGetLovValuesByCodeQuery('RELATION');

const sourceOfInformationOptions = useMemo(
  () =>
    (sourceOfInformationLovQueryResponse?.object ?? []).map((item: any) => ({
      ...item,
      key: String(item.key)
    })),
  [sourceOfInformationLovQueryResponse]
);




  const [byPatient, setByPatient] = useState(true);
  const [clearKey, setClearKey] = useState(0);

  // Populate form from latest encounter observations.
  // Blood group and patient conditions are intentionally excluded — they are
  // patient-level data managed by the effects below.
useEffect(() => {
  if (!latestByEncounter) return;

  setByPatient(latestByEncounter.byPatient ?? true);

  setRecord(prev => ({
    ...prev,
    ...latestByEncounter,
    bloodGroup: prev.bloodGroup,
    patientConditions: prev.patientConditions,
    id: undefined,
    patientId,
    encounterId,
    sourceOfInformation:
      latestByEncounter.sourceOfInformation != null
        ? String(latestByEncounter.sourceOfInformation)
        : null,
    isActive:
      typeof latestByEncounter.isActive === 'boolean'
        ? latestByEncounter.isActive
        : true
  }));
}, [latestByEncounter, patientId, encounterId]);

  // Blood group and patient conditions are always driven by the patient record.
  // Both run on initial load and after every save (refetchPatient updates patientData).
  useEffect(() => {
    if (!patientData?.bloodGroup) return;

    setRecord(prev => ({
      ...prev,
      bloodGroup: patientData.bloodGroup ?? null
    }));
  }, [patientData?.bloodGroup]);

  useEffect(() => {
    if (!patientData?.patientConditions) return;

    setRecord(prev => ({
      ...prev,
      patientConditions: patientData.patientConditions ?? null
    }));
  }, [patientData?.patientConditions]);

  const createPayload = useMemo(() => {
    return {
      patientId,
      encounterId,
      reasonOfVisit: record.reasonOfVisit ?? null,
      modeOfArrival: record.modeOfArrival ?? null,

      byPatient,
      sourceOfInformation: byPatient
        ? null
        : record.sourceOfInformation ?? null,
      functionalStatus: record.functionalStatus ?? null,
      patientConditions: record.patientConditions ?? null,
      cognitiveCheck: record.cognitiveCheck ?? null,
      bloodGroup: record.bloodGroup ?? null,
      isActive:
        typeof record.isActive === 'boolean'
          ? record.isActive
          : true
    };
  }, [record, patientId, encounterId, byPatient]);

  const toEncounterPayload = (enc: any): PatientEncounter => ({
    id: Number(enc?.id),
    patientId: Number(enc?.patientId ?? enc?.patient?.id),
    encounterNumber: enc?.encounterNumber ?? null,
    facilityId: Number(enc?.facilityId),
    departmentId: Number(enc?.departmentId),
    practitionerId: enc?.practitionerId ?? null,
    paymentDate: enc?.paymentDate,
    amount: enc?.amount,
    encounterType: enc?.encounterType,
    encounterReason: enc?.encounterReason,
    followUpEncounterId: enc?.followUpEncounterId ?? enc?.followUpEncounter?.id ?? null,
    priorityLevel: enc?.priorityLevel,
    originType: enc?.originType ?? null,
    originName: enc?.originName ?? null,
    notes: enc?.notes ?? null,
    departmentDailySequenceNumber: enc?.departmentDailySequenceNumber ?? null,
    encounterDate: enc?.encounterDate ?? null,
    status: enc?.status,
    chiefComplaint: enc?.chiefComplaint ?? null,
    hasPrescription: Boolean(enc?.hasPrescription),
    hasOrder: Boolean(enc?.hasOrder),
    isObserved: Boolean(enc?.isObserved)
  });

  const normalizeFieldErrorMessage = (message: string) => {
    const m = (message || '').toLowerCase();
    if (m.includes('must not be null')) return 'must not be empty';
    if (m.includes('must not be blank')) return 'must not be empty';
    if (m.includes('size must be between')) return 'length is out of range';
    if (m.includes('must be greater')) return 'value is too small';
    if (m.includes('must be less')) return 'value is too large';
    return message || 'invalid value';
  };

  const showApiError = (error: any) => {
    const data = error?.data ?? {};
    const traceId = data?.traceId || data?.requestId || data?.correlationId;
    const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

    const isValidationError =
      data?.message === 'error.validation' ||
      data?.title === 'Method argument not valid' ||
      (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

    if (isValidationError && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
      const fieldLabels: Record<string, string> = {
        patientId: 'Patient',
        encounterId: 'Encounter',
        reasonOfVisit: 'Reason Of Visit',
        functionalStatus: 'Functional Status',
        patientConditions: 'Patient Conditions',
        cognitiveCheck: 'Cognitive Check',
        isActive: 'Active',
        id: 'Id',
        priorityLevel: 'Priority'
      };

      const lines = data.fieldErrors.map((fe: any) => {
        const label = fieldLabels[fe.field] ?? fe.field;
        return `• ${label}: ${normalizeFieldErrorMessage(fe.message)}`;
      });

      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}` + traceSuffix,
          sev: 'warning'
        })
      );
      return;
    }

    const messageProp: string = data?.message || '';
    const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Patient observations & complaints payload is required.',
      'patient.required': 'Patient id is required.',
      'patient.notfound': 'Patient not found.',
      'encounter.required': 'Encounter id is required.',
      'db.constraint': 'Database constraint violated while saving.',
      'patient.invalid': 'Invalid patient id.',
      notfound: 'No patient observations & complaints found.'
    };

    const humanMsg =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: humanMsg + traceSuffix, sev: 'warning' }));
  };

  const handleSave = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    const missing: string[] = [];
    if (!record.reasonOfVisit?.trim()) missing.push('• Reason Of Visit: must not be empty');
    if (!encounter.priorityLevel) missing.push('• Priority: must not be empty');

    if (missing.length > 0) {
      dispatch(
        notify({ msg: `Please fix the following fields:\n${missing.join('\n')}`, sev: 'warning' })
      );
      return;
    }

    try {
      const created = await createPatientObservationsComplaints(createPayload as any).unwrap();
      setRecord(prev => ({
        ...prev,
        ...created,
        patientId,
        encounterId,
        id: undefined
      }));

      const encounterPayload = toEncounterPayload(encounter);
      const updatedEncounter = await updateEncounter({
        id: encounter.id,
        body: encounterPayload
      }).unwrap();
      setEncounter(updatedEncounter);

      await refetchPatient();

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch (err: any) {
      showApiError(err);
    }
  };

  const handleClear = () => {
    setRecord({
      ...newPatientObservationsComplaints,
      patientId,
      encounterId,
      patientConditions: '' as any,
      sourceOfInformation: null
    });

    setByPatient(true);

    setEncounter({
      ...encounter,
      priorityLevel: null as any
    });

    setClearKey(prev => prev + 1);
  };

  return (
    <SectionContainer
      title={title}
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <MyButton onClick={handleSave} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClear} disabled={disabled}>
            Clear
          </MyButton>
        </div>
      }
      content={
        <div style={width ? { width } : {}}>
          <MyInput
            required
            width="100%"
            fieldName="reasonOfVisit"
            fieldType="textarea"
            record={record}
            setRecord={setRecord}
            disabled={disabled}
          />

          <MyInput
            width="100%"
            fieldLabel="Mode of Arrival"
            fieldType="select"
            fieldName="modeOfArrival"
            record={record}
            setRecord={setRecord}
            selectData={modeOfArrivalOptions}
            selectDataLabel="label"
            selectDataValue="value"
            disabled={disabled}
            searchable={false}
          />


          
            <div className="source-information-row">
          <div className="source-information-col">
<MyInput
  width="100%"
  fieldType="select"
  fieldLabel="Source Of Information"
  selectData={sourceOfInformationOptions}
  selectDataLabel="lovDisplayVale"
  selectDataValue="key"
  fieldName="sourceOfInformation"
  record={record}
  setRecord={setRecord}
  disabled={disabled || byPatient}
  searchable={false}
/>
          </div>

          <div className="source-information-col">
            <MyInput
              width="100%"
              fieldLabel="By Patient"
              fieldType="checkbox"
              fieldName="byPatient"
              record={{ byPatient }}
              setRecord={(value: any) => {
                const nextValue = value?.byPatient ?? true;

                setByPatient(nextValue);

                if (nextValue) {
                  setRecord(prev => ({
                    ...prev,
                    sourceOfInformation: null
                  }));
                }
              }}
              disabled={disabled}
            />
          </div>
            </div>

          <div className="functional-cognitive-row">
            <div className="functional-cognitive-col">
              <MyInput
                width="100%"
                fieldLabel="Functional Status"
                fieldName="functionalStatus"
                fieldType="textarea"
                record={record}
                setRecord={setRecord}
                disabled={disabled}
              />
            </div>

            <div className="functional-cognitive-col">
              <MyInput
                width="100%"
                fieldLabel="Cognitive Check"
                fieldName="cognitiveCheck"
                fieldType="textarea"
                record={record}
                setRecord={setRecord}
                disabled={disabled}
              />
            </div>
          </div>

          {/* <MultiSelectAppender
            key={clearKey}
            label="Patient Conditions"
            options={patientConditions ?? []}
            optionLabel="label"
            optionValue="value"
            object={record.patientConditions ?? ''}
            setObject={(value: string) =>
              setRecord(prev => ({
                ...prev,
                patientConditions: value
              }))
            }
          /> */}

          <MyInput
            width="100%"
            fieldLabel="Blood Group"
            fieldType="select"
            fieldName="bloodGroup"
            selectData={bloodGroupOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={record}
            setRecord={setRecord}
            disabled={disabled}
            searchable={false}
          />

          <MyInput
            required
            width="100%"
            fieldLabel="Priority"
            fieldType="select"
            fieldName="priorityLevel"
            selectData={encounterPriority ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={encounter}
            setRecord={setEncounter}
            disabled={disabled}
            searchable={false}
          />
        </div>
      }
    />
  );
};

export default PatientObservationsComplaints;
