import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { faEarListen } from '@fortawesome/free-solid-svg-icons';
import { Form, Panel, Table } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveAudiometryPuretoneMutation } from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { newApAudiometryPuretone } from '@/types/model-types-constructor';
import { ApAudiometryPuretone } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
const AddAudiometryPuretone = ({ open, setOpen, patient, encounter, audiometryPuretoneObject, refetch }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [audiometryPuretone, setAudiometryPuretone] = useState<ApAudiometryPuretone>(audiometryPuretoneObject);
    const [saveAudiometryPureton] = useSaveAudiometryPuretoneMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterAudiometryPuretonStatusClose, setIsEncounterAudiometryPuretonStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const dispatch = useAppDispatch()

    // Fetch LOV data for various fields
    const { data: earExamFindingsLovQueryResponse } = useGetLovValuesByCodeQuery('EAR_EXAM_FINDINGS');
    const { data: hearingLossTypeLovQueryResponse } = useGetLovValuesByCodeQuery('HEARING_LOSS_TYPES');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');

    // Handle Save Audiometry Puretone Symptoms
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (audiometryPuretone.key === undefined) {
                await saveAudiometryPureton({ ...audiometryPuretone, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap();
                dispatch(notify('Patient Audiometry Pureton Added Successfully'));
                setAudiometryPuretone({ ...newApAudiometryPuretone, statusLkey: "9766169155908512" })
            } else {
                await saveAudiometryPureton({ ...audiometryPuretone, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap();

                dispatch(notify('Patient Audiometry Pureton Updated Successfully'));
            }
            await refetch();
            handleClearField();
            setOpen(false);
        } catch (error) {
            console.error("Error saving Patient Audiometry:", error);
            dispatch(notify('Failed to save Patient Audiometry'));
        }
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setAudiometryPuretone({
            ...newApAudiometryPuretone,
            earExamFindingsLkey: null,
            maskedUsed: false,
            hearingLossTypeLkey: null,
            hearingLossDegreeLkey: null,
        });
    }

    // Effects
    useEffect(() => {
        setAudiometryPuretone({ ...audiometryPuretoneObject });
    }, [audiometryPuretoneObject]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (audiometryPuretone?.statusLkey === '3196709905099521') {
            setIsEncounterAudiometryPuretonStatusClose(true);
        } else {
            setIsEncounterAudiometryPuretonStatusClose(false);
        }
    }, [audiometryPuretone?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterAudiometryPuretonStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterAudiometryPuretonStatusClose]);
    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='fields-container'>
            <MyInput
                width={200}
                column
                fieldLabel="Test Environmen"
                fieldName="testEnvironment"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                fieldLabel="Test Reason"
                width={200}
                column
                fieldName="testReason"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Ear Exam Findings"
                fieldType="select"
                fieldName="earExamFindingsLkey"
                selectData={earExamFindingsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <Panel header={"Right Ear"} bordered>
                <Form fluid layout='inline' className='fields-container'>
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Air Conduction Frequencies"
                        fieldType="number"
                        fieldName="airConductionFrequenciesRight"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={110}
                        fieldLabel="Hearing Thresholds"
                        fieldType="number"
                        fieldName="hearingThresholdsRight"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="dB HL"
                        rightAddonwidth={90}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Bone Conduction Frequencies"
                        fieldType="number"
                        fieldName="boneConductionFrequenciesRight"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Bone Conduction Thresholds"
                        fieldType="number"
                        fieldName="boneConductionThresholdsRight"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                </Form>
            </Panel>
            <Panel bordered header={"Left Ear"} >
                <Form fluid layout='inline' className='fields-container'>
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Air Conduction Frequencies"
                        fieldType="number"
                        fieldName="airConductionFrequenciesLeft"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={110}
                        fieldLabel="Hearing Thresholds"
                        fieldType="number"
                        fieldName="hearingThresholdsLeft"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="dB HL"
                        rightAddonwidth={90}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Bone Conduction Frequencies"
                        fieldType="number"
                        fieldName="boneConductionFrequenciesLeft"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={150}
                        fieldLabel="Bone Conduction Thresholds"
                        fieldType="number"
                        fieldName="boneConductionThresholdsLeft"
                        record={audiometryPuretone}
                        setRecord={setAudiometryPuretone}
                        rightAddon="Hz"
                        rightAddonwidth={50}
                        disabled={isDisabledField}
                    />
                </Form>
            </Panel>
            <MyInput
                width={200}
                column
                fieldLabel="Masked Used"
                fieldType="checkbox"
                fieldName="maskedUsed"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Hearing Loss Type"
                fieldType="select"
                fieldName="hearingLossTypeLkey"
                selectData={hearingLossTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Hearing Loss Degree"
                fieldType="select"
                fieldName="hearingLossDegreeLkey"
                selectData={severityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Recommendations"
                fieldType="textarea"
                fieldName="recommendations"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Additional Notes"
                fieldType="textarea"
                fieldName="additionalNotes"
                record={audiometryPuretone}
                setRecord={setAudiometryPuretone}
                disabled={isDisabledField}
            />
        </Form>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Audiometry Puretone"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={isDisabledField}
            bodyheight={550}
            size='500px'
            steps={[{
                title: "Audiometry Puretone",
                icon: faEarListen,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddAudiometryPuretone;