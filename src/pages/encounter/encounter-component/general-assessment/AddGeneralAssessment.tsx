import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveGeneralAssessmentMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApGeneralAssessment } from '@/types/model-types-constructor';
import { ApGeneralAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
const AddGeneralAssessment = ({ open, setOpen, patient, encounter, generalAssessmentObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [generalAssessment, setGeneralAssessment] = useState<ApGeneralAssessment>({ ...newApGeneralAssessment });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterGeneralAssessmentStatusClose, setIsEncounterGeneralAssessmentStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveGeneralAssessment] = useSaveGeneralAssessmentMutation();
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: positionStatusLovQueryResponse } = useGetLovValuesByCodeQuery('POSITION_STATUS');
    const { data: bodyMovementLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_MOVEMENT');
    const { data: levelOfConscLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
    const { data: facialExpLovQueryResponse } = useGetLovValuesByCodeQuery('FACIAL_EXPRESS');
    const { data: speechAssLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_ASSESSMENT');
    const { data: moodLovQueryResponse } = useGetLovValuesByCodeQuery('MOOD_BEHAVIOR');
    
    // Handle Save General Assessment
    const handleSave = async () => {
        //  TODO convert key to code
        try {
            if (generalAssessment.key === undefined) {
                await saveGeneralAssessment({
                    ...generalAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key,

                }).unwrap();

                dispatch(notify({ msg: 'General Assessment Successfully', sev: 'success' }));
                //TODO convert key to code
                setGeneralAssessment({ ...generalAssessment, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await saveGeneralAssessment({
                    ...generalAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key,

                }).unwrap();
                dispatch(notify({ msg: 'General Assessment Updated Successfully', sev: 'success' }));
                setOpen(false);
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving General Assessment:", error);
            dispatch(notify({ msg: 'Failed to Save General Assessment', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setGeneralAssessment({
            ...newApGeneralAssessment,
            positionStatusLkey: null,
            bodyMovementsLkey: null,
            levelOfConsciousnessLkey: null,
            facialExpressionLkey: null,
            speechLkey: null,
            moodBehaviorLkey: null,
        });
    };

    // Effects
    useEffect(() => {
        setGeneralAssessment({ ...generalAssessmentObj });
    }, [generalAssessmentObj]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (generalAssessment?.statusLkey === '3196709905099521') {
            setIsEncounterGeneralAssessmentStatusClose(true);
        } else {
            setIsEncounterGeneralAssessmentStatusClose(false);
        }
    }, [generalAssessment?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterGeneralAssessmentStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterGeneralAssessmentStatusClose]);

    // Modal Content 
    const content = (
        <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid layout='inline' disabled={edit} >
                <MyInput
                    column
                    width={200}
                    fieldLabel="Position Status"
                    fieldType="select"
                    fieldName="positionStatusLkey"
                    selectData={positionStatusLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Body Movements"
                    fieldType="select"
                    fieldName="bodyMovementsLkey"
                    selectData={bodyMovementLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Level of Consciousness"
                    fieldType="select"
                    fieldName="levelOfConsciousnessLkey"
                    selectData={levelOfConscLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Facial Expression"
                    fieldType="select"
                    fieldName="facialExpressionLkey"
                    selectData={levelOfConscLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Speech"
                    fieldType="select"
                    fieldName="speechLkey"
                    selectData={speechAssLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Mood/Behavior"
                    fieldType="select"
                    fieldName="moodBehaviorLkey"
                    selectData={moodLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField}
                    searchable={false} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Memory Remote"
                    fieldName="memoryRemote"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Memory Recent"
                    fieldName="memoryRecent"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Signs of Agitation"
                    fieldName="signsOfAgitation"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Signs of Depression"
                    fieldName="signsOfDepression"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Signs of Suicidal Ideation"
                    fieldName="signsOfSuicidalIdeation"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Signs of Substance Use"
                    fieldName="signsOfSubstanceUse"
                    fieldType="checkbox"
                    record={generalAssessment}
                    setRecord={setGeneralAssessment}
                    disabled={isDisabledField} />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit General Assessment"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            steps={[{
                title: "General Assessment",
                icon: <FontAwesomeIcon icon={faClipboardList} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddGeneralAssessment;