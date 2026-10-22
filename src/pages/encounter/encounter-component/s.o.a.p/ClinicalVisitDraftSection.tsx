import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useUpdateEncounterMutation } from '@/services/encounters/patientEncounterService';
import { SaveableSectionHandle } from '@/types/saveableSection';
import { toEncounterPayload } from './encounterPayload';

type Props = {
  encounter: any;
  setEncounter?: (encounter: any) => void;
  prefill?: { chiefComplaint?: string | null; physicalExaminationSummery?: string | null } | null;
  disabled?: boolean;
  /** Called after a successful save (e.g. the ambient draft popup marks the section saved) */
  onSaved?: () => void;
  /** More buttons next to Save (e.g. Reject in the ambient draft popup) */
  extraActions?: React.ReactNode;
};

/**
 * Chief Complaint and Physical Examination Summary of the SOAP sheet, prefilled from an ambient draft.
 * Both are encounter fields, so one encounter update saves them together.
 */
const ClinicalVisitDraftSection = forwardRef<SaveableSectionHandle, Props>(
  ({ encounter, setEncounter, prefill = null, disabled = false, onSaved, extraActions }, ref) => {
    const dispatch = useAppDispatch();
    const [updateEncounter, { isLoading: isSaving }] = useUpdateEncounterMutation();

    const [record, setRecord] = useState({
      chiefComplaint: '',
      physicalExaminationSummery: ''
    });

    // The draft text, or what the encounter already has
    useEffect(() => {
      setRecord({
        chiefComplaint: prefill?.chiefComplaint || encounter?.chiefComplaint || '',
        physicalExaminationSummery:
          prefill?.physicalExaminationSummery || encounter?.physicalExaminationSummery || ''
      });
    }, [prefill, encounter?.id]);

    const handleSave = async (): Promise<boolean> => {
      if (!record.chiefComplaint?.trim()) {
        dispatch(notify({ msg: 'Chief Complaint cannot be empty.', sev: 'warning' }));
        return false;
      }

      const payload = {
        ...toEncounterPayload(encounter),
        chiefComplaint: record.chiefComplaint.trim(),
        physicalExaminationSummery: record.physicalExaminationSummery?.trim() || null
      };

      if (!payload.id || !payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: 'Missing required fields: encounter / patientId / facilityId / departmentId',
            sev: 'error'
          })
        );
        return false;
      }

      try {
        const updatedEncounter = await updateEncounter({ id: payload.id, body: payload }).unwrap();
        setEncounter?.(updatedEncounter);
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
        onSaved?.();
        return true;
      } catch (e: any) {
        dispatch(notify({ msg: e?.data?.detail || e?.data?.message || 'Save Failed', sev: 'error' }));
        return false;
      }
    };

    useImperativeHandle(ref, () => ({ save: handleSave }));

    const saveButton = (
      <>
        <MyButton size="small" onClick={() => handleSave()} disabled={disabled || isSaving}>
          Save
        </MyButton>
        {extraActions}
      </>
    );

    return (
      <>
        <SectionContainer
          collapsible
          title={<Translate>Chief Complaint </Translate>}
          content={
            <Form fluid>
              <MyInput
                width="100%"
                height={95}
                showLabel={false}
                fieldType="textarea"
                fieldName="chiefComplaint"
                record={record}
                setRecord={setRecord}
                disabled={disabled}
              />
            </Form>
          }
          action={saveButton}
        />

        <SectionContainer
          collapsible
          title={<Translate>Physical Examination Summary </Translate>}
          content={
            <Form fluid>
              <MyInput
                width="100%"
                height={120}
                showLabel={false}
                fieldType="textarea"
                fieldName="physicalExaminationSummery"
                record={record}
                setRecord={setRecord}
                disabled={disabled}
              />
            </Form>
          }
          action={saveButton}
        />
      </>
    );
  }
);

ClinicalVisitDraftSection.displayName = 'ClinicalVisitDraftSection';

export default ClinicalVisitDraftSection;
