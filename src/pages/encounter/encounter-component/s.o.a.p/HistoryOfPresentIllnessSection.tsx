import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { SaveableSectionHandle } from '@/types/saveableSection';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import { useUpdateHistoryOfPresentIllnessMutation } from '@/services/encounters/patientEncounterService';

type HistoryOfPresentIllnessSectionProps = {
  encounter: any;
  setEncounter?: React.Dispatch<React.SetStateAction<any>>;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
  onShowHistory?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Text to start from instead of the saved one (e.g. an ambient draft) */
  prefill?: string | null;
  /** Called after a successful save (e.g. the ambient draft popup marks the section saved) */
  onSaved?: () => void;
  /** More buttons next to Save (e.g. Reject in the ambient draft popup) */
  extraActions?: React.ReactNode;
};

const HistoryOfPresentIllnessSection = forwardRef<SaveableSectionHandle, HistoryOfPresentIllnessSectionProps>(({
  encounter,
  setEncounter,
  disabled = false,
  title = <Translate>History Of Present Illness</Translate>,
  width = '100%',
  onShowHistory,
  collapsible = true,
  defaultCollapsed = false,
  prefill = null,
  onSaved,
  extraActions
}, ref) => {
  const dispatch = useAppDispatch();

  const encounterId = encounter?.id ? Number(encounter.id) : null;

  const [saveHistoryOfPresentIllness, { isLoading: isSaving }] =
    useUpdateHistoryOfPresentIllnessMutation();

  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');

  useEffect(() => {
    // A prefill replaces the saved text
    if (prefill) {
      setHistoryOfPresentIllness(prefill);
      return;
    }
    setHistoryOfPresentIllness(encounter?.historyOfPresentIllness ?? '');
  }, [encounter?.id, encounter?.historyOfPresentIllness, prefill]);

  const handleSave = async (silent = false): Promise<boolean> => {
    if (!encounterId) {
      if (!silent) {
        dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      }
      return false;
    }

    if (!historyOfPresentIllness?.trim()) {
      if (!silent) {
        dispatch(
          notify({
            msg: 'History of present illness cannot be empty.',
            sev: 'warning',
          })
        );
      }
      return false;
    }

    // Don't resave if no changes (already saved)
    if (historyOfPresentIllness.trim() === (encounter?.historyOfPresentIllness ?? '').trim()) {
      return true;
    }

    try {
      const updatedEncounter = await saveHistoryOfPresentIllness({
        id: encounterId,
        historyOfPresentIllness: historyOfPresentIllness.trim(),
      }).unwrap();

      setEncounter?.(updatedEncounter);

      dispatch(
        notify({
          msg: 'History of present illness saved successfully',
          sev: 'success',
        })
      );
      onSaved?.();
      return true;
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.detail || e?.data?.message || 'Unexpected error',
          sev: 'error',
        })
      );
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ save: () => handleSave(false) }));

  return (
    <SectionContainer
      title={title}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      content={
        <div style={width ? { width } : {}}>
          <Form fluid>
            <MyInput
              width="100%"
              showLabel={false}
              fieldType="textarea"
              fieldName="historyOfPresentIllness"
              record={{ historyOfPresentIllness }}
              setRecord={(r: any) =>
                setHistoryOfPresentIllness(r?.historyOfPresentIllness ?? '')
              }
              disabled={disabled}
              onBlur={() => {
                if (!disabled) {
                  handleSave(true);
                }
              }}
            
            />
          </Form>
        </div>
      }
      action={
        <>
        <MyButton
          size="small"
          onClick={onShowHistory}
        >
           History
        </MyButton>
        <MyButton
          size="small"
          onClick={() => handleSave(false)}
          disabled={disabled || isSaving}
        >
          Save
        </MyButton>
        {extraActions}
        </>
      }
    />
  );
});

HistoryOfPresentIllnessSection.displayName = 'HistoryOfPresentIllnessSection';

export default HistoryOfPresentIllnessSection;
