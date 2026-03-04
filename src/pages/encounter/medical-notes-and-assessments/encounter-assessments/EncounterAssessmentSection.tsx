import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useCreateEncounterAssessmentMutation,
  useUpdateEncounterAssessmentMutation,
  useGetLatestEncounterAssessmentQuery,
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';
import type { EncounterAssessment } from '@/types/model-types-new';

type EncounterAssessmentSectionProps = {
  patient: any;
  encounterId: number | string;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
};

const EncounterAssessmentSection: React.FC<EncounterAssessmentSectionProps> = ({
  patient,
  encounterId,
  disabled = false,
  title = <>Assessment</>,
  width = '100%',
}) => {
  const dispatch = useAppDispatch();

  const authSlice = useAppSelector(state => state.auth);
  const userIdNumber: number | null =
    authSlice?.user?.id ? Number(authSlice.user.id) : null;

  const patientIdNumber: number | null =
    patient?.key ? Number(patient.key) : null;

  const encounterIdNumber: number | null =
    encounterId ? Number(encounterId) : null;

  const {
    data: latestAssessment,
    isFetching: isFetchingLatest,
    refetch,
    error: latestError,
  } = useGetLatestEncounterAssessmentQuery(
    { encounterId: encounterIdNumber as any, userId: userIdNumber as any },
    { skip: !encounterIdNumber || !userIdNumber }
  );

  const [createEncounterAssessment, { isLoading: isSavingCreate }] =
    useCreateEncounterAssessmentMutation();

  const [updateEncounterAssessment, { isLoading: isSavingUpdate }] =
    useUpdateEncounterAssessmentMutation();

  const isSaving = isSavingCreate || isSavingUpdate;

  const [assessmentText, setAssessmentText] = useState<string>('');

  useEffect(() => {
    setAssessmentText(latestAssessment?.assessment ?? '');
  }, [latestAssessment?.id, encounterIdNumber, userIdNumber]);

  const showApiError = (error: any) => {
    const data = error?.data ?? {};

    // handle bean validation errors
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
      'userId.required': 'User id is required.',
      'notfound': 'No assessment found for this encounter.',
      'fk.patient': 'Invalid patient (patient does not exist).',
      'fk.user': 'Invalid user.',
      'required.fields': 'Required fields are missing.',
      'duplicate.record': 'Assessment already exists for this encounter.',
      'db.constraint': 'Database constraint violated while saving assessment.',
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
      patientId: patientIdNumber,
      userId: userIdNumber,
      encounterId: encounterIdNumber,
      assessment: (assessmentText ?? '').trim(),
    } as any;
  }, [
    latestAssessment?.id,
    patientIdNumber,
    userIdNumber,
    encounterIdNumber,
    assessmentText,
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

    if (!payload.userId) {
      dispatch(notify({ msg: 'User id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.assessment?.trim()) {
      dispatch(
        notify({
          msg: 'Assessment cannot be empty.',
          sev: 'warning',
        })
      );
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

      dispatch(
        notify({
          msg: 'Assessment saved successfully',
          sev: 'success',
        })
      );

      refetch();
    } catch (error: any) {
      showApiError(error);
    }
  };

  return (
    <SectionContainer
      title={title}
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              width="100%"
              showLabel={false}
              placeholder="Only you can see this Assessment"
              fieldType="textarea"
              fieldName="assessment"
              record={{ assessment: assessmentText }}
              setRecord={(r: any) =>
                setAssessmentText(r?.assessment ?? '')
              }
              disabled={disabled}
            />
          </Form>
        </div>
      }
      action={
        <MyButton
          size="small"
          onClick={handleSave}
          disabled={disabled || isFetchingLatest || isSaving}
        >
          Save
        </MyButton>
      }
    />
  );
};

export default EncounterAssessmentSection;