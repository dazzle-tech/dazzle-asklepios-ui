
import React, { useEffect, useState } from 'react';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import { notify } from '@/utils/uiReducerActions';
import { Panel, Form } from 'rsuite';
import { newApGeneralAssessment } from '@/types/model-types-constructor';
import { ApGeneralAssessment } from '@/types/model-types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useSaveGeneralAssessmentMutation, useGetGeneralAssessmentsQuery } from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
const GeneralAssessmentTriage = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [generalAssessment, setGeneralAssessment] = useState<ApGeneralAssessment>({ ...newApGeneralAssessment });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterGeneralAssessmentStatusClose, setIsEncounterGeneralAssessmentStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [tags, setTags] = React.useState([]);
    const [saveGeneralAssessment] = useSaveGeneralAssessmentMutation();
    const dispatch = useAppDispatch();
    // Initialize list request with default filters
    const [generalAssessmentListRequest, setGeneralAssessmentListRequest] = useState<ListRequest>({
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
    // Fetch the list of General Assessment based on the provided request, and provide a refetch function
    const { data: generalAssessmentResponse, refetch, isLoading } = useGetGeneralAssessmentsQuery(generalAssessmentListRequest);

    // Fetch LOV data for various fields
    const { data: positionStatusLovQueryResponse } = useGetLovValuesByCodeQuery('POSITION_STATUS');
    const { data: bodyMovementLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_MOVEMENT');
    const { data: levelOfConscLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
    const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
    const { data: speechAssLovQueryResponse } = useGetLovValuesByCodeQuery('SPEECH_ASSESSMENT');
    const { data: moodLovQueryResponse } = useGetLovValuesByCodeQuery('MOOD_BEHAVIOR');

    // Handle Save General Assessment
    const handleSave = async () => {
        const tagField = joinValuesFromArray(tags);
        //  TODO convert key to code
        try {
            if (generalAssessment.key === undefined) {
                await saveGeneralAssessment({
                    ...generalAssessment,
                    patientKey: patient.key,
                    supportingMembers: tagField,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key,

                }).unwrap();

                dispatch(notify({ msg: 'General Assessment Successfully', sev: 'success' }));
                setTags([]);

                //TODO convert key to code
                setGeneralAssessment({ ...generalAssessment, statusLkey: "9766169155908512" });
            } else {
                await saveGeneralAssessment({
                    ...generalAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    supportingMembers: tagField,
                    updatedBy: authSlice.user.key,

                }).unwrap();
                dispatch(notify({ msg: 'General Assessment Updated Successfully', sev: 'success' }));
                setTags([]);

            }
        } catch (error) {
            console.error("Error saving General Assessment:", error);
            dispatch(notify({ msg: 'Failed to Save General Assessment', sev: 'error' }));
        }
    };
    const joinValuesFromArray = (values) => {
        return values?.filter(Boolean).join(', ');
    };
    // Effects
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
    useEffect(() => {
        if (generalAssessment.key != null) {
            setTags(generalAssessment?.supportingMembers?.split(","));
        }

    }, [generalAssessment]);
    useEffect(() => {
        if (generalAssessmentResponse?.object?.length === 1) {
            setGeneralAssessment(generalAssessmentResponse.object[0]);
        }
    }, [generalAssessmentResponse]);

    return (
        <Panel header="General Assessment">
            <Form fluid layout='inline' className="form-inline-wrap">
                <MyInput
                    column
                    width={170}
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
                    width={170}
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
                    width={170}
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
                    width={170}
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
                    width={170}
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
                    width={170}
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
                <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={handleSave}
                    className="button-bottom-align"
                >
                    <Translate>  Save </Translate>
                </MyButton>
            </Form>
             
            </Panel>
    );
};

export default GeneralAssessmentTriage;