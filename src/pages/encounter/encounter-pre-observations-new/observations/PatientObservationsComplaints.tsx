import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import './styles.less';

import type { PatientEncounter, PatientObservationsComplaints as PatientObservationsComplaintsModel } from '@/types/model-types-new';
import { newPatientObservationsComplaints } from '@/types/model-types-constructor-new';

import {
  useCreatePatientObservationsComplaintsMutation,
  useGetLatestPatientObservationsComplaintsByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import MultiSelectAppender from '@/pages/medical-component/multi-select-appender/MultiSelectAppender';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
type PatientObservationsComplaintsProps = {
  patientId: number;
  encounterId: number;
  encounter?: any;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const PatientObservationsComplaints: React.FC<PatientObservationsComplaintsProps> = ({
  patientId,
  encounterId,
  encounter,
  disabled = false,
  width = '100%',
  title = 'Patient Observations & Complaints'
}) => {
  const dispatch = useAppDispatch();

  // Enums / LOVs
  const patientConditions = useEnumOptions('Condition');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');

  // === API ===
  const [createPatientObservationsComplaints] = useCreatePatientObservationsComplaintsMutation();
  const [updateEncounter] = useUpdateEncounterMutation();

  const { data: latestByEncounter } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  // === Local state ===
  const [record, setRecord] = useState<PatientObservationsComplaintsModel>({
    ...newPatientObservationsComplaints,
    patientId,
    encounterId
  });

  useEffect(() => {
    if (!latestByEncounter) return;

    setRecord((prev) => ({
      ...prev,
      ...latestByEncounter,
      id: undefined,
      patientId,
      encounterId,
      isActive:
        typeof (latestByEncounter as any)?.isActive === 'boolean'
          ? (latestByEncounter as any).isActive
          : true
    }));
  }, [latestByEncounter, patientId, encounterId]);

  /**
   * CREATE payload only (no id / audit fields).
   */
  const createPayload = useMemo(() => {
    return {
      patientId,
      encounterId,
      reasonOfVisit: record.reasonOfVisit ?? null,
      functionalStatus: record.functionalStatus ?? null,
      patientConditions: (record as any).patientConditions ?? null,
      cognitiveCheck: record.cognitiveCheck ?? null,
      isActive: typeof record.isActive === 'boolean' ? record.isActive : true
    };
  }, [record, patientId, encounterId]);

  const normalizeFieldErrorMessage = (message: string) => {
    const m = (message || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
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
        id: 'Id'
      };

      const lines = data.fieldErrors.map((fe: any) => {
        const label = fieldLabels[fe.field] ?? fe.field;
        return `• ${label}: ${normalizeFieldErrorMessage(fe.message)}`;
      });

      dispatch(
        notify({
          msg: `Please fix the following fields:\n${lines.join('\n')}` + traceSuffix,
          sev: 'error'
        })
      );
      return;
    }

    const messageProp: string = data?.message || '';
    const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Patient observations & complaints payload is required.',
      'patient.required': 'Patient id is required.',
      'encounter.required': 'Encounter id is required.',
      notfound: 'No patient observations & complaints found.'
    };

    const humanMsg =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      'Unexpected error';

    dispatch(notify({ msg: humanMsg + traceSuffix, sev: 'error' }));
  };
  const buildEncounterUpdateBody = (row: any) => {
    const body: any = {
      id: row?.id,
      patientId: row?.patientId ?? row?.patient?.id ?? row?.patientObject?.id,
      encounterNumber: row?.encounterNumber ?? null,
      facilityId: row?.facilityId,
      departmentId: row?.departmentId,
      practitionerId: row?.practitionerId ?? null,
      encounterType: row?.encounterType,
      encounterReason: row?.encounterReason,
      followUpEncounterId: row?.followUpEncounterId ?? null,
      priorityLevel: row?.priorityLevel,
      originType: row?.originType ?? null,
      originName: row?.originName ?? null,
      notes: row?.notes ?? null,
      departmentDailySequenceNumber: row?.departmentDailySequenceNumber ?? null,
      encounterDate: row?.encounterDate ?? null,
      status: row?.status,
      chiefComplaint: row?.chiefComplaint ?? null,
      hasPrescription: row?.hasPrescription ?? false,
      hasOrder: row?.hasOrder ?? false,
      isObserved: true
    };

    return body;
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

    try {
      const created = await createPatientObservationsComplaints(
        createPayload as any
      ).unwrap();
      if (encounter && !encounter.isObserved) {
        const updated = await updateEncounter({
          id: encounterId,
          body: {
            id: encounter?.id,
            patientId: encounter?.patientId ?? encounter?.patient?.id ?? encounter?.patientObject?.id,
            encounterNumber: encounter?.encounterNumber ?? null,
            facilityId: encounter?.facilityId ?? null,
            departmentId: encounter?.departmentId ?? null,
            practitionerId: encounter?.practitionerId ?? null,
            encounterType: encounter?.encounterType ?? null,
            encounterReason: encounter?.encounterReason ?? null,
            followUpEncounterId: encounter?.followUpEncounterId ?? null,
            priorityLevel: encounter?.priorityLevel ?? null,
            originType: encounter?.originType ?? null,
            originName: encounter?.originName ?? null,
            notes: encounter?.notes ?? null,
            departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,
            encounterDate: encounter?.encounterDate ?? null,
            status: encounter?.status ?? null,
            chiefComplaint: encounter?.chiefComplaint ?? null,
            hasPrescription: encounter?.hasPrescription ?? false,
            hasOrder: encounter?.hasOrder ?? false,
            isObserved: true
          }
        }).unwrap();

        console.log('Encounter updated to observed:', updated);
      }

      setRecord((prev) => ({
        ...prev,
        ...created,
        patientId,
        encounterId,
        id: undefined
      }));

      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch (err: any) {
      showApiError(err);
    }
  };

  const handleClear = () => {
    setRecord({
      ...newPatientObservationsComplaints,
      patientId,
      encounterId
    } as any);
  };

  return (
    <SectionContainer
      title={title}
      action={
        <Form fluid layout="inline">
          <MyButton onClick={handleSave} disabled={disabled}>
            Save
          </MyButton>
          <MyButton onClick={handleClear} disabled={disabled}>
            Clear
          </MyButton>
        </Form>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldName="reasonOfVisit"
              fieldType="textarea"
              record={record}
              setRecord={setRecord}
              disabled={disabled}
            />

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

            <MultiSelectAppender
              label="Patient Conditions"
              options={(patientConditions as any) ?? []}
              optionLabel="label"
              optionValue="value"
              object={(record as any).patientConditions ?? ''}
              setObject={(value: string) =>
                setRecord((prev) => ({
                  ...(prev as any),
                  patientConditions: value
                }))
              }
            />

            <MyInput
              width="100%"
              fieldLabel="Priority"
              fieldType="select"
              fieldName="priorityLkey"
              selectData={encounterPriorityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={record}
              setRecord={setRecord}
              disabled={disabled}
              searchable={false}
            />
          </Form>
        </div>
      }
    />
  );
};

export default PatientObservationsComplaints;