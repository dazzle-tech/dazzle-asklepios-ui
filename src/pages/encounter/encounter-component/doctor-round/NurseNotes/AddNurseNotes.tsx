import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveNurseNotesMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApNurseNotes } from '@/types/model-types-constructor';
import { ApNurseNotes } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
const AddNurseNotes = ({ open, setOpen, patient, encounter, nurseNotesObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [nurseNotes, setNurseNotes] = useState<ApNurseNotes>({ ...newApNurseNotes });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterPainAssessmentStatusClose, setIsEncounterPainAssessmentStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveNurseNotes] = useSaveNurseNotesMutation();
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
    const { data: nurseNoteTypeLovQueryResponse } = useGetLovValuesByCodeQuery('NURSE_NOTE_TYPE');

    // Handle Save Nurse Notes
    const handleSave = async () => {
        try {
            //  TODO convert key to code
            if (newApNurseNotes.key === undefined) {
                await saveNurseNotes({
                    ...nurseNotes,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    createdBy: authSlice.user.key
                }).unwrap();

                dispatch(notify({ msg: 'Nurse Notes Added Successfully', sev: 'success' }));
                //TODO convert key to code
                setNurseNotes({ ...newApNurseNotes });
                setOpen(false);
            } else {
                await saveNurseNotes({
                    ...nurseNotes,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key
                }).unwrap();
                dispatch(notify({ msg: 'Nurse Notes Updated Successfully', sev: 'success' }));
                setOpen(false);
                handleClearField();
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving Nurse Notes:", error);
            dispatch(notify({ msg: 'Failed to Save Nurse Notes', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setNurseNotes({
            ...newApNurseNotes,
            shiftLkey: null,
            noteTypeLkey: null,
        });
    };

    // Effects

    useEffect(() => {
        setNurseNotes({ ...nurseNotesObj });
    }, [nurseNotesObj]);

    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterPainAssessmentStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterPainAssessmentStatusClose]);
    useEffect(() => {
        if (!open) {
            handleClearField();
        }
    }, [open]);
    // Modal Content 
    const content = (
        <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid layout='inline' disabled={edit} >
                <MyInput
                    column
                    width={200}
                    fieldLabel="Shift"
                    fieldType="select"
                    fieldName="shiftLkey"
                    selectData={shiftsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={nurseNotes}
                    setRecord={setNurseNotes}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Note Type"
                    fieldType="select"
                    fieldName="noteTypeLkey"
                    selectData={nurseNoteTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={nurseNotes}
                    setRecord={setNurseNotes}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={400}
                    fieldType="textarea"
                    fieldName="nurseNote"
                    record={nurseNotes}
                    setRecord={setNurseNotes}
                    disabled={isDisabledField}
                />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Nurse Notes"
            actionButtonFunction={handleSave}
            position='center'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            bodyheight='50vh'
            steps={[{
                title: "Nurse Notes",
                icon: <FontAwesomeIcon icon={faNotesMedical} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddNurseNotes;