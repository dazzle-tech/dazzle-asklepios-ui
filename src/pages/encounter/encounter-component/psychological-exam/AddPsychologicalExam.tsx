import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less'
import { faBrain } from "@fortawesome/free-solid-svg-icons";
import { newApPsychologicalExam } from '@/types/model-types-constructor';
import { ApPsychologicalExam } from '@/types/model-types';
import MyModal from '@/components/MyModal/MyModal';
import { Form } from 'rsuite';
import { useSavePsychologicalExamsMutation, useGetPsychologicalExamsQuery } from '@/services/encounterService';
const AddPsychologicalExam = ({
    open,
    setOpen,
    patient,
    encounter,
    encounterPsychologicalExam
}) => {
    const authSlice = useAppSelector(state => state.auth);
    const [psychologicalExam, setPsychologicalExam] = useState<ApPsychologicalExam>({ ...encounterPsychologicalExam });
    const [savePsychologicalExam] = useSavePsychologicalExamsMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [isEncounterPsychologicalExamStatusClose, setIsEncounterPsychologicalExamStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [isDisabledField, setIsDisabledField] = useState(false);
    const dispatch = useAppDispatch()
    // Fetch LOV data for various fields
    const { data: testTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PSYCH_TEST_TYPES');
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: scoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: severityLovQueryResponse } = useGetLovValuesByCodeQuery('SEVERITY');
    // Initialize List Request Filters
    const [psychologicalExamListRequest, setPsychologicalExamListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });

    //List Responses
    // ReFetch the list of psychological exams 
    const { refetch: refetchPsychologicalExam } = useGetPsychologicalExamsQuery(psychologicalExamListRequest);

    //handle Clear Fields
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setPsychologicalExam({
            ...newApPsychologicalExam,
            testTypeLkey: null,
            unitLkey: null,
            scoreLkey: null,
            resultInterpretationLkey: null,
            statusLkey: null,
            requireFollowUp: false
        });
    };
    //handle Save Psychological Exam
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (psychologicalExam.key === undefined) {
                await savePsychologicalExam({ ...psychologicalExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: psychologicalExam?.followUpDate ? new Date(psychologicalExam.followUpDate).getTime() : 0, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap();
                dispatch(notify('Patient Psychological Exam Added Successfully'));
                setPsychologicalExam({ ...newApPsychologicalExam, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await savePsychologicalExam({ ...psychologicalExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: psychologicalExam?.followUpDate ? new Date(psychologicalExam.followUpDate).getTime() : 0, updatedBy: authSlice.user.key }).unwrap();
                dispatch(notify('Patient Psychological Exam Updated Successfully'));
                setOpen(false);
            }
            await refetchPsychologicalExam();
            handleClearField();
        } catch (error) {
            console.error("Error saving Psychological Exam:", error);
            dispatch(notify('Failed to save Psychological Exam'));
        }
    };

    // Effects
    useEffect(() => {
        setPsychologicalExamListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        setPsychologicalExam({ ...encounterPsychologicalExam });
    }, [encounterPsychologicalExam]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (psychologicalExam?.statusLkey === '3196709905099521') {
            setIsEncounterPsychologicalExamStatusClose(true);
        } else {
            setIsEncounterPsychologicalExamStatusClose(false);
        }
    }, [psychologicalExam?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterPsychologicalExamStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterPsychologicalExamStatusClose]);
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Psychology Exam"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={isDisabledField}
            size='700px'
            steps={[{
                title: "Psychology Exam",
                icon: faBrain,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={<Form fluid layout='inline'>
                <MyInput
                    column
                    fieldLabel="Test Type"
                    fieldType="select"
                    fieldName="testTypeLkey"
                    selectData={testTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldLabel="Reason"
                    fieldName="reason"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    fieldType="number"
                    fieldLabel="Test Duration"
                    column
                    fieldName="testDuration"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldLabel="Unit"
                    fieldType="select"
                    fieldName="unitLkey"
                    selectData={unitLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldLabel="Score"
                    fieldType="select"
                    fieldName="scoreLkey"
                    selectData={scoreLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldLabel="Result Interpretation"
                    fieldType="select"
                    fieldName="resultInterpretationLkey"
                    selectData={severityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldLabel="Require Follow-up"
                    fieldType="checkbox"
                    fieldName="requireFollowUp"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldType="date"
                    fieldLabel="Require Follow-up"
                    fieldName="followUpDate"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField || !psychologicalExam?.requireFollowUp}
                />
                <MyInput
                    column
                    fieldType="textarea"
                    fieldLabel="Clinical Observations"
                    fieldName="clinicalObservations"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                    rows={4}
                />
                <MyInput
                    column
                    fieldType="textarea"
                    fieldLabel="Treatment Plan"
                    fieldName="treatmentPlan"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                    rows={4}
                />
                <MyInput
                    column
                    fieldType="textarea"
                    fieldLabel="Additional Notes"
                    fieldName="additionalNotes"
                    record={psychologicalExam}
                    setRecord={setPsychologicalExam}
                    disabled={isDisabledField}
                    rows={4}
                />
            </Form>}
        ></MyModal>
    );
};
export default AddPsychologicalExam;