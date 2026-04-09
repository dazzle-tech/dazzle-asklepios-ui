import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  useCreateEncounterPlanMutation,
  useUpdateEncounterPlanMutation,
  useGetLatestEncounterPlanQuery,
}from '@/services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';
import type { EncounterPlan, Patient ,PatientEncounter } from '@/types/model-types-new';
import './styles.less';

const normalizeLine = (s: string) => s.trim().replace(/\s+/g, ' ');

const appendUniqueLine = (text: string | null | undefined, line: string) => {
  const current = (text ?? '').trim();
  const newLine = line.trim();
  if (!newLine) return current;

  const lines = current ? current.split('\n') : [];
  const set = new Set(lines.map(normalizeLine));

  if (set.has(normalizeLine(newLine))) return current;
  return current ? `${current}\n${newLine}` : newLine;
};

type PatientPlanProps = {
  patient: Patient;
  localEncounter: PatientEncounter;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
};

const PatientPlan: React.FC<PatientPlanProps> = ({
  patient,
  localEncounter,
  disabled = false,
  title = 'Patient Plan',
  width = '100%',
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null =
    patient?.id ? Number(patient.id) : null;

  const encounterIdNumber: number | null =
    localEncounter?.id ? Number(localEncounter?.id) : null;
  
  const { data: planLovQueryResponse } =
    useGetLovValuesByCodeQuery('VISIT_CAREPLAN_OPT');

  const {
    data: latestPlan,
    isFetching: isFetchingLatest,
    refetch,
    error: latestError,
  } = useGetLatestEncounterPlanQuery(
    { encounterId: encounterIdNumber as any },
    { skip: !encounterIdNumber }
  );

  const [createEncounterPlan, { isLoading: isSavingCreate }] =
    useCreateEncounterPlanMutation();

  const [updateEncounterPlan, { isLoading: isSavingUpdate }] =
    useUpdateEncounterPlanMutation();

  const isSaving = isSavingCreate || isSavingUpdate;

  const [planInstructionsLkey, setPlanInstructionsLkey] =
    useState<any>(null);

  const [planInstructionsNote, setPlanInstructionsNote] =
    useState<string>('');

  useEffect(() => {
    setPlanInstructionsLkey(null);
    setPlanInstructionsNote(latestPlan?.planInstructions ?? '');
  }, [latestPlan?.id, encounterIdNumber]);

  useEffect(() => {
    const list = planLovQueryResponse?.object ?? [];
    if (!planInstructionsLkey || list.length === 0) return;

    const selected = list.find(
      (item: any) => item.key === planInstructionsLkey
    );
    if (!selected) return;

    setPlanInstructionsNote(prev =>
      appendUniqueLine(prev, selected.lovDisplayVale)
    );
    setPlanInstructionsLkey(null);
  }, [planInstructionsLkey, planLovQueryResponse]);

  const showApiError = (error: any) => {
    const data = error?.data ?? {};

    // handle validation errors
    if (data?.errors?.length) {
      dispatch(
        notify({
          msg: data.errors[0]?.defaultMessage || 'Validation error',
          sev: 'error',
        })
      );
      return;
    }

    const messageProperty: string = data?.message || '';
    const errorKey = messageProperty.startsWith('error.')
      ? messageProperty.substring(6)
      : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Encounter plan payload is required.',
      'encounterId.required': 'Encounter id is required.',
      'notfound': 'No encounter plan found for this encounter.',
      'fk.patient': 'Invalid patient (patient does not exist).',
      'required.fields': 'Required fields are missing.',
      'duplicate.record':
        'Plan already exists for this patient and encounter.',
      'db.constraint':
        'Database constraint violated while saving encounter plan.',
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      error?.error ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage, sev: 'error' }));
  };

  useEffect(() => {
    const status = (latestError as any)?.status;
    if (status === 404) return;
    if (latestError) showApiError(latestError);
  }, [latestError]);

  const payload: EncounterPlan = useMemo(() => {
    return {
      id: latestPlan?.id ?? undefined,
      patientId: patientIdNumber,
      encounterId: encounterIdNumber,
      planInstructions: (planInstructionsNote ?? '').trim(),
    } as any;
  }, [
    latestPlan?.id,
    patientIdNumber,
    encounterIdNumber,
    planInstructionsNote,
  ]);

  const handleSave = async () => {
    if (!payload.patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.planInstructions?.trim()) {
      dispatch(
        notify({
          msg: 'Plan instruction cannot be empty.',
          sev: 'warning',
        })
      );
      return;
    }

    try {
      if (latestPlan?.id) {
        await updateEncounterPlan({
          id: latestPlan.id,
          data: payload,
        }).unwrap();
      } else {
        await createEncounterPlan(payload as any).unwrap();
      }

      dispatch(
        notify({ msg: 'Plan saved successfully', sev: 'success' })
      );
      refetch();
    } catch (error: any) {
      showApiError(error);
    }
  };

  return (
    <SectionContainer
      title={title}
      action={
        <Form fluid layout="inline">
          <MyButton
            onClick={handleSave}
            disabled={disabled || isFetchingLatest || isSaving}
          >
            Save
          </MyButton>
        </Form>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldType="select"
              selectData={planLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="planInstructionsLkey"
              record={{ planInstructionsLkey }}
              setRecord={(r: any) =>
                setPlanInstructionsLkey(r?.planInstructionsLkey)
              }
              fieldLabel="Plan Instruction"
              disabled={disabled}
            />

            <MyInput
              width="100%"
              fieldType="textarea"
              fieldName="planInstructionsNote"
              record={{ planInstructionsNote }}
              setRecord={(r: any) =>
                setPlanInstructionsNote(r?.planInstructionsNote ?? '')
              }
              showLabel={false}
              disabled={disabled}
            />
          </Form>
        </div>
      }
    />
  );
};

export default PatientPlan;