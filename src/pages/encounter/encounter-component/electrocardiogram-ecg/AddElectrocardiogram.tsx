import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveElectrocardiogramECGMutation } from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import { faFileWaveform, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { newApElectrocardiogramEcg } from '@/types/model-types-constructor';
import { ApElectrocardiogramEcg } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import SectionContainer from '@/components/SectionsoContainer';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal'; // Import the AttachmentModal component
import './styles.less';
const AddElectrocardiogram = ({
  open,
  setOpen,
  patient,
  encounter,
  electrocardiogramEcgObject,
  refetch,
  edit
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const [electrocardiogramEcg, setElectrocardiogramEcg] = useState<ApElectrocardiogramEcg>(
    electrocardiogramEcgObject
  );
  const [saveElectrocardiogramECG] = useSaveElectrocardiogramECGMutation();
  const [isDisabledField, setIsDisabledField] = useState(false);
  const [
    isEncounterElectrocardiogramECGStatusClose,
    setIsEncounterElectrocardiogramECGStatusClose
  ] = useState(false);
  const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
  const [isAttachmentModalOpen, setAttachmentModalOpen] = useState(false); // State for AttachmentModal
  const dispatch = useAppDispatch();

  // Fetch LOV data for various fields
  const { data: segmentChangesLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ST_CHANGES');
  const { data: waveAbnormalitiesLovQueryResponse } = useGetLovValuesByCodeQuery('TWAVE_ABNORMAL');

  // Handle Save Electrocardiogram ECG Function
  const handleSave = async () => {
    //TODO convert key to code
    try {
      if (electrocardiogramEcg.key === undefined) {
        //TODO convert key to code
        await saveElectrocardiogramECG({
          ...electrocardiogramEcg,
          patientKey: patient.key,
          encounterKey: encounter.key,
          statusLkey: '9766169155908512',
          createdBy: authSlice.user.key
        }).unwrap();
        dispatch(notify({ msg: 'Patient ECG Added Successfully', sev: 'success' }));
        //TODO convert key to code
        setElectrocardiogramEcg({ ...newApElectrocardiogramEcg, statusLkey: '9766169155908512' });
        setOpen(false);
      } else {
        await saveElectrocardiogramECG({
          ...electrocardiogramEcg,
          patientKey: patient.key,
          encounterKey: encounter.key,
          updatedBy: authSlice.user.key
        }).unwrap();
        setOpen(false);
        dispatch(notify({ msg: 'Patient ECG Updated Successfully', sev: 'success' }));
      }

      await refetch();
      handleClearField();
    } catch (error) {
      console.error('Error saving Patient ECG:', error);
      dispatch(notify({ msg: 'Failed to save Patient ECG', sev: 'error' }));
    }
  };

  // Handle Clear Fields Function
  const handleClearField = () => {
    setElectrocardiogramEcg({
      ...newApElectrocardiogramEcg,
      stSegmentChangesLkey: null,
      waveAbnormalitiesLkey: null
    });
  };

  // Effects
  useEffect(() => {
    setElectrocardiogramEcg({ ...electrocardiogramEcgObject });
  }, [electrocardiogramEcgObject]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (electrocardiogramEcg?.statusLkey === '3196709905099521') {
      setIsEncounterElectrocardiogramECGStatusClose(true);
    } else {
      setIsEncounterElectrocardiogramECGStatusClose(false);
    }
  }, [electrocardiogramEcg?.statusLkey]);
  useEffect(() => {
    // TODO update status to be a LOV value
    if (encounter?.encounterStatusLkey === '91109811181900') {
      setIsEncounterStatusClosed(true);
    }
  }, [encounter?.encounterStatusLkey]);
  useEffect(() => {
    if (isEncounterStatusClosed || isEncounterElectrocardiogramECGStatusClose) {
      setIsDisabledField(true);
    } else {
      setIsDisabledField(false);
    }
  }, [isEncounterStatusClosed, isEncounterElectrocardiogramECGStatusClose]);

  // Modal Content
  const content = (
    <div className={clsx('ecg-content-wrapper', { 'disabled-panel': edit })}>
      <SectionContainer
        title="Electrocardiogram (ECG) Details"
        content={
          <Form fluid layout="inline">
            <MyInput
              width={200}
              column
              fieldLabel="Indication"
              fieldName="indication"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              disabled={isDisabledField}
            />
            <MyInput
              width={200}
              column
              fieldLabel="ECG Lead Type"
              fieldName="ecgLeadType"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              disabled={isDisabledField}
            />
          </Form>
        }
      />
      <SectionContainer
        title="ECG Findings"
        content={
          <Form fluid layout="inline">
            <MyInput
              column
              width={200}
              fieldLabel="Segment Changes"
              fieldType="select"
              fieldName="stSegmentChangesLkey"
              selectData={segmentChangesLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={200}
              fieldLabel="T Wave Abnormalities"
              fieldType="select"
              fieldName="waveAbnormalitiesLkey"
              selectData={waveAbnormalitiesLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              disabled={isDisabledField}
              searchable={false}
            />
            <MyInput
              column
              width={200}
              fieldLabel="Rhythm Analysis"
              fieldName="rhythmAnalysis"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              disabled={isDisabledField}
            />
          </Form>
        }
      />

      <SectionContainer
        title="ECG Interpretation"
        content={
          <Form fluid layout="inline">
            <MyInput
              column
              width={150}
              rightAddonwidth={50}
              fieldType="number"
              fieldLabel="Heart Rate"
              fieldName="heartRate"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              rightAddon="BPM"
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={150}
              rightAddonwidth={50}
              fieldType="number"
              fieldLabel="PR Interval"
              fieldName="prInterval"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              rightAddon="ms"
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={150}
              rightAddonwidth={50}
              fieldType="number"
              fieldLabel="QRS Duration"
              fieldName="qrsDuration"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              rightAddon="ms"
              disabled={isDisabledField}
            />
            <MyInput
              column
              width={150}
              rightAddonwidth={50}
              fieldType="number"
              fieldLabel="QT Interval"
              fieldName="qtInterval"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              rightAddon="ms"
              disabled={isDisabledField}
            />
          </Form>
        }
      />
      <SectionContainer
        title="ECG Interpretation Notes"
        content={
          <Form fluid layout="inline">
            <MyInput
              column
              width={400}
              fieldLabel="ECG Interpretation"
              fieldName="ecgInterpretation"
              record={electrocardiogramEcg}
              setRecord={setElectrocardiogramEcg}
              fieldType="textarea"
              disabled={isDisabledField}
              height={60}
            />
          </Form>
        }
      />
    </div>
  );
  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Add/Edit ECG"
        actionButtonFunction={handleSave}
        position="Center"
        isDisabledActionBtn={!edit ? isDisabledField : true}
        size="34vw"
        footerButtons={
          <MyButton onClick={() => setAttachmentModalOpen(true)}>
            <FontAwesomeIcon icon={faPaperclip} /> Attach
          </MyButton>
        }
        steps={[
          {
            title: 'Electrocardiogram',
            icon: <FontAwesomeIcon icon={faFileWaveform} />,
            footer: (
              <MyButton appearance="ghost" onClick={handleClearField}>
                Clear
              </MyButton>
            )
          }
        ]}
        content={content}
      ></MyModal>
      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        setIsOpen={setAttachmentModalOpen}
        attachmentSource={{ key: electrocardiogramEcg.key }}
        attatchmentType="ECG_ATTACHMENT"
        patientKey={patient.key}
        refecthData={refetch}
      />
    </>
  );
};
export default AddElectrocardiogram;
