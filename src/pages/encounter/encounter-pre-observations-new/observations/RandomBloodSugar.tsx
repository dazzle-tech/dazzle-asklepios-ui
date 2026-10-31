import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import {
  useCreateRandomBloodSugarMutation,
  useGetLatestRandomBloodSugarByEncounterIdQuery
} from '@/services/medicalsheetsEncounter/observations/randomBloodSugarService';
import { newRandomBloodSugar } from '@/types/model-types-constructor-new';
import type { RandomBloodSugar as RandomBloodSugarModel } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import RandomBloodSugarHistoryModal from './RandomBloodSugarHistoryModal';

type RandomBloodSugarProps = {
  patientId: number;
  encounterId: number;
  disabled?: boolean;
  width?: string;
  title?: React.ReactNode;
};

const RandomBloodSugar: React.FC<RandomBloodSugarProps> = ({
  patientId,
  encounterId,
  disabled = false,
  width = '100%',
  title = 'Random Blood Sugar'
}) => {
  const dispatch = useAppDispatch();
  const [createRandomBloodSugar] = useCreateRandomBloodSugarMutation();
  const [openHistoryModal, setOpenHistoryModal] = useState(false);

  const { data: latestRandomBloodSugar } = useGetLatestRandomBloodSugarByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  const [record, setRecord] = useState<RandomBloodSugarModel>({
    ...newRandomBloodSugar,
    patientId,
    encounterId
  });

  useEffect(() => {
    setRecord(previous => ({
      ...previous,
      patientId,
      encounterId
    }));
  }, [patientId, encounterId]);

  useEffect(() => {
    if (!latestRandomBloodSugar) return;

    setRecord(previous => ({
      ...previous,
      ...latestRandomBloodSugar,
      id: undefined,
      patientId,
      encounterId,
      isActive:
        typeof (latestRandomBloodSugar as any)?.isActive === 'boolean'
          ? (latestRandomBloodSugar as any).isActive
          : true
    }));
  }, [latestRandomBloodSugar, patientId, encounterId]);

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
      const createResponse = await createRandomBloodSugar({
        patientId,
        encounterId,
        randomBloodGlucose: record.randomBloodGlucose ?? null,
        isActive: true
      }).unwrap();

      setRecord(previous => ({
        ...previous,
        ...createResponse,
        patientId,
        encounterId,
        id: undefined
      }));
      dispatch(notify({ msg: 'Random Blood Sugar saved successfully', sev: 'success' }));
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.data?.title ||
        error?.data?.message ||
        'Unexpected error';
      dispatch(notify({ msg: message, sev: 'warning' }));
    }
  };

  const handleClear = () => {
    setRecord(previous => ({
      ...previous,
      randomBloodGlucose: null
    }));
  };

  return (
    <>
      <SectionContainer
        title={title}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <MyButton onClick={() => setOpenHistoryModal(true)} disabled={disabled}>
              History
            </MyButton>
            <MyButton onClick={handleSave} disabled={disabled}>
              Save
            </MyButton>
            <MyButton onClick={handleClear} disabled={disabled}>
              Clear
            </MyButton>
          </div>
        }
        content={
          <Form fluid>
            <div>
              <MyInput
                width="15vw"
                fieldType="number"
                allowDecimal
                fieldLabel="Random Blood Glucose"
                rightAddon="mg/dL"
                fieldName="randomBloodGlucose"
                rightAddonwidth={60}
                record={record}
                setRecord={setRecord}
                disabled={disabled}
              />
            </div>
          </Form>
        }
      />
      <RandomBloodSugarHistoryModal
        open={openHistoryModal}
        setOpen={setOpenHistoryModal}
        encounterId={encounterId}
      />
    </>
  );
};

export default RandomBloodSugar;
