import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useCreateEncounterAssessmentMutation,
  useUpdateEncounterAssessmentMutation,
  useGetLatestEncounterAssessmentQuery,
  useGetAssessmentAuditQuery,
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';
import type { EncounterAssessment, Patient } from '@/types/model-types-new';
import Translate from '@/components/Translate';
import FieldAuditHistoryModal from '../../encounter-component/s.o.a.p/FieldAuditHistory';
type EncounterAssessmentSectionProps = {
  patient: Patient;
  encounterId: number | string;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
};

const EncounterAssessmentSection: React.FC<EncounterAssessmentSectionProps> = ({
  patient,
  encounterId,
  disabled = false,
  title = <Translate>Assessment</Translate>,
  width = '100%',
  
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;
  const encounterIdNumber: number | null = encounterId ? Number(encounterId) : null;
   const [auditModalOpen, setAuditModalOpen] = useState(false);
  const { 
    data: latestAssessment,
    isFetching: isFetchingLatest,
    refetch,
    error: latestError,
  } = useGetLatestEncounterAssessmentQuery(
    { encounterId: encounterIdNumber as any },
    { skip: !encounterIdNumber }
  );

   const {
    data: assessmentAudit = []
  } = useGetAssessmentAuditQuery(
    { id: latestAssessment?.id },
    { skip: !latestAssessment?.id }
  );
  const [createEncounterAssessment, { isLoading: isSavingCreate }] =
    useCreateEncounterAssessmentMutation();

  const [updateEncounterAssessment, { isLoading: isSavingUpdate }] =
    useUpdateEncounterAssessmentMutation();

  const isSaving = isSavingCreate || isSavingUpdate;

  const [assessmentText, setAssessmentText] = useState<string>('');

  useEffect(() => {
    setAssessmentText(latestAssessment?.assessment ?? '');
  }, [latestAssessment?.id, encounterIdNumber]);

  const showApiError = (error: any) => {
    const data = error?.data ?? {};

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
      'payload.required': 'Assessment payload is required.',
      'encounterId.required': 'Encounter id is required.',
      'notfound': 'No assessment found for this encounter.',
      'fk.patient': 'Invalid patient (patient does not exist).',
      'required.fields': 'Required fields are missing.',
      'duplicate.record': 'Assessment already exists for this encounter.',
      'db.constraint': 'Database constraint violated while saving assessment.',
      'user.notfound': 'Current user not found.',
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

  const payload: EncounterAssessment = useMemo(() => {
    return {
      id: latestAssessment?.id ?? undefined,
      patientId: patientIdNumber as any,
      encounterId: encounterIdNumber as any,
      assessment: (assessmentText ?? '').trim(),
    } as any;
  }, [latestAssessment?.id, patientIdNumber, encounterIdNumber, assessmentText]);

  const handleSave = async () => {
    if (!payload.patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.assessment?.trim()) {
      dispatch(notify({ msg: 'Assessment cannot be empty.', sev: 'warning' }));
      return;
    }

    try {
      if (latestAssessment?.id) {
        await updateEncounterAssessment({
          id: latestAssessment.id,
          data: payload,
        }).unwrap();
      } else {
        await createEncounterAssessment(payload as any).unwrap();
      }

      dispatch(notify({ msg: 'Assessment saved successfully', sev: 'success' }));

      refetch();
    } catch (error: any) {
      showApiError(error);
    }
  };

  return (
    <>
    <SectionContainer
      title={title}
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              width="100%"
              showLabel={false}
              fieldType="textarea"
              fieldName="assessment"
              record={{ assessment: assessmentText }}
              setRecord={(r: any) => setAssessmentText(r?.assessment ?? '')}
              disabled={disabled}
            />
           
          </Form>
        </div>
      }
      action={
        <>
        <MyButton
                  size="small"
                 onClick={() => setAuditModalOpen(true)}
                >
                   History
                </MyButton>
        <MyButton
          size="small"
          onClick={handleSave}
          disabled={disabled || isFetchingLatest || isSaving}
        >
          Save
        </MyButton>
        </>
      }
    />
    <FieldAuditHistoryModal
            open={auditModalOpen}
            setOpen={setAuditModalOpen}
            audit={assessmentAudit}
            fieldName={'assessment'}
    />
    </>
  );
};

export default EncounterAssessmentSection;