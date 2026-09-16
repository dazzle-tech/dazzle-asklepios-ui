import React, { useEffect, useState } from 'react';
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
};

const HistoryOfPresentIllnessSection: React.FC<HistoryOfPresentIllnessSectionProps> = ({
  encounter,
  setEncounter,
  disabled = false,
  title = <Translate>History Of Present Illness</Translate>,
  width = '100%',
  onShowHistory
}) => {
  const dispatch = useAppDispatch();

  const encounterId = encounter?.id ? Number(encounter.id) : null;

  const [saveHistoryOfPresentIllness, { isLoading: isSaving }] =
    useUpdateHistoryOfPresentIllnessMutation();

  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');

  useEffect(() => {
    setHistoryOfPresentIllness(encounter?.historyOfPresentIllness ?? '');
  }, [encounter?.id, encounter?.historyOfPresentIllness]);

  const handleSave = async (silent = false) => {
    if (!encounterId) {
      if (!silent) {
        dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      }
      return;
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
      return;
    }

    // Don't resave if no changes
    if (historyOfPresentIllness.trim() === (encounter?.historyOfPresentIllness ?? '').trim()) {
      return;
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
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.detail || e?.data?.message || 'Unexpected error',
          sev: 'error',
        })
      );
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
        </>
      }
    />
  );
};

export default HistoryOfPresentIllnessSection;