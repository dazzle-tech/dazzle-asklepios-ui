import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useSaveFunctionalAssessmentMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

const AddFunctionalAssessment = ({ open, setOpen, patient, encounter, functionalAssessmentObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({ ...newApFunctionalAssessment });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterFunctionalAssessmentStatusClose, setIsEncounterFunctionalAssessmentStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveFunctionalAssessment] = useSaveFunctionalAssessmentMutation();
    const dispatch = useAppDispatch();

    // Handle Save Functional Assessment
    const handleSave = async () => {
        //  TODO convert key to code
        try {
            if (functionalAssessment.key === undefined) {
                await saveFunctionalAssessment({
                    ...functionalAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key,

                }).unwrap();

                dispatch(notify({ msg: 'Functional Assessment Successfully', sev: 'success' }));
                //TODO convert key to code
                setFunctionalAssessment({ ...newApFunctionalAssessment, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await saveFunctionalAssessment({
                    ...functionalAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key,

                }).unwrap();
                dispatch(notify({ msg: 'Functional Assessment Updated Successfully', sev: 'success' }));
                setOpen(false);
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving Functional Assessment:", error);
            dispatch(notify({ msg: 'Failed to Save Functional Assessment', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setFunctionalAssessment({ ...newApFunctionalAssessment });
    };

    // Effects
    useEffect(() => {
        setFunctionalAssessment({ ...functionalAssessmentObj });
    }, [functionalAssessmentObj]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (functionalAssessment?.statusLkey === '3196709905099521') {
            setIsEncounterFunctionalAssessmentStatusClose(true);
        } else {
            setIsEncounterFunctionalAssessmentStatusClose(false);
        }
    }, [functionalAssessment?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterFunctionalAssessmentStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterFunctionalAssessmentStatusClose]);

    // Modal Content 
    const content = (
        <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid layout='inline' disabled={edit} >
                <MyInput
                    column
                    width={200}
                    fieldLable="Mobility / Ambulation"
                    fieldName="mobilityAmbulation"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Transferring (Bed ↔ Wheelchair)"
                    fieldName="transferringBedChair"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Stair Climbing Ability"
                    fieldName="stairClimbingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Feeding (Eating ability)"
                    fieldName="feeding"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Toileting Ability"
                    fieldName="toiletingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Dressing Ability"
                    fieldName="dressingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Bathing Ability"
                    fieldName="bathingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Grooming Ability"
                    fieldName="groomingAbility"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Walking Distance"
                    fieldName="walkingDistance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Balance (Standing/Sitting)"
                    fieldName="balance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Urinary Continence"
                    fieldName="urinaryContinence"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Bowel Continence"
                    fieldName="bowelContinence"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Use of Assistive Devices"
                    fieldName="useOfAssistiveDevices"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Need for Assistance in ADLs"
                    fieldName="needForAssistance"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Fall History"
                    fieldName="fallHistory"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Pain during Movement"
                    fieldName="painDuringMovement"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Need for Rehab/PT Referral"
                    fieldName="needForRehab"
                    fieldType="checkbox"
                    record={functionalAssessment}
                    setRecord={setFunctionalAssessment}
                    disabled={isDisabledField} />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Functional Assessment"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            steps={[{
                title: "Functional Assessment",
                icon: <FontAwesomeIcon icon={faClipboardList} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddFunctionalAssessment;