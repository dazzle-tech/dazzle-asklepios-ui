import React, { useEffect, useMemo, useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useCreateEncounterPlanMutation,
  useUpdateEncounterPlanMutation,
  useGetLatestEncounterPlanQuery,
  useGetPlanAuditQuery
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';
import type { EncounterPlan, Patient, PatientEncounter } from '@/types/model-types-new';
import './styles.less';
import FieldAuditHistoryModal from '../../encounter-component/s.o.a.p/FieldAuditHistory';

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
  title = 'Plan of Care',
  width = '100%'
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;
  const encounterIdNumber: number | null = localEncounter?.id ? Number(localEncounter?.id) : null;
   const [auditModalOpen, setAuditModalOpen] = useState(false);
   const [selectedAuditField, setSelectedAuditField] = useState('');
  const {
    data: latestPlan,
    isFetching: isFetchingLatest,
    refetch,
    error: latestError
  } = useGetLatestEncounterPlanQuery(
    { encounterId: encounterIdNumber as any },
    { skip: !encounterIdNumber }
  );

  const {
      data: planAudit = []
    } = useGetPlanAuditQuery(
      { id: latestPlan?.id },
      { skip: !latestPlan?.id }
    );
    console.log("planAudit: ", planAudit)

  const [createEncounterPlan, { isLoading: isSavingCreate }] = useCreateEncounterPlanMutation();
  const [updateEncounterPlan, { isLoading: isSavingUpdate }] = useUpdateEncounterPlanMutation();

  const isSaving = isSavingCreate || isSavingUpdate;

  const [goals, setGoals] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<string>('');

  useEffect(() => {
    setGoals(latestPlan?.goals ?? '');
    setTreatmentPlan(latestPlan?.treatmentPlan ?? '');
  }, [latestPlan?.id, encounterIdNumber]);

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
        goals: 'Goals',
        treatmentPlan: 'Treatment Plan / Management'
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
      'payload.required': 'Encounter plan payload is required.',
      'encounterId.required': 'Encounter id is required.',
      notfound: 'No encounter plan found for this encounter.',
      'fk.patient': 'Invalid patient (patient does not exist).',
      'required.fields': 'Required fields are missing.',
      'duplicate.record': 'Plan already exists for this patient and encounter.',
      'db.constraint': 'Database constraint violated while saving encounter plan.'
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      error?.error ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage + traceSuffix, sev: 'warning' }));
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
      goals: (goals ?? '').trim(),
      treatmentPlan: (treatmentPlan ?? '').trim()
    } as any;
  }, [latestPlan?.id, patientIdNumber, encounterIdNumber, goals, treatmentPlan]);

  const handleSave = async () => {
    if (!payload.patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }

    if (!payload.goals?.trim() && !payload.treatmentPlan?.trim()) {
      dispatch(
        notify({
          msg: 'Please fix the following fields:\n• Treatment Plan / Management: must not be empty',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      if (latestPlan?.id) {
        await updateEncounterPlan({ id: latestPlan.id, data: payload }).unwrap();
      } else {
        await createEncounterPlan(payload as any).unwrap();
      }

      dispatch(notify({ msg: 'Plan of Care saved successfully', sev: 'success' }));
      refetch();
    } catch (error: any) {
      showApiError(error);
    }
  };
 const openAuditHistory = (fieldName: string) => {
   setSelectedAuditField(fieldName);
   setAuditModalOpen(true);
  };
  return (
    <>
    <SectionContainer
      title={title}
      action={
        <>
        <MyButton onClick={() => openAuditHistory('treatmentPlan')} disabled={disabled || isFetchingLatest || isSaving}>
          Plan History
           </MyButton>
           <MyButton onClick={() => openAuditHistory('goals')} disabled={disabled || isFetchingLatest || isSaving}>
          Goal History
           </MyButton>
        <MyButton onClick={handleSave} disabled={disabled || isFetchingLatest || isSaving}>
          Save
        </MyButton>
        </>
      }
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="textarea"
              fieldName="treatmentPlan"
              record={{ treatmentPlan }}
              setRecord={(r: any) => setTreatmentPlan(r?.treatmentPlan ?? '')}
              fieldLabel="Treatment Plan / Management"
              disabled={disabled}
              required
            />

            <MyInput
              width="100%"
              fieldType="textarea"
              fieldName="goals"
              record={{ goals }}
              setRecord={(r: any) => setGoals(r?.goals ?? '')}
              fieldLabel="Goals"
              disabled={disabled}
            />
          </Form>
        </div>
      }
    />
    <FieldAuditHistoryModal
                open={auditModalOpen}
                setOpen={setAuditModalOpen}
                audit={planAudit}
                fieldName={selectedAuditField}
        />
    </>
  );
};

export default PatientPlan;
