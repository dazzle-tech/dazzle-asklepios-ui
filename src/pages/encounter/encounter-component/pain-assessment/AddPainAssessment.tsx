import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSavePainAssessmentMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApPainAssessment } from '@/types/model-types-constructor';
import { ApPainAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import { faFaceFrownOpen } from '@fortawesome/free-solid-svg-icons';
import './styles.less'
import clsx from 'clsx';
const AddPainAssessment = ({ open, setOpen, patient, encounter, painAssessmentObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [painAssessment, setPainAssessment] = useState<ApPainAssessment>({ ...newApPainAssessment });
    const [associatedSymptoms, setAssociatedSymptoms] = useState({ associatedSymptomsLkey: '' });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterPainAssessmentStatusClose, setIsEncounterPainAssessmentStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [tags, setTags] = React.useState([]);
    const [relievingFactorsTag, setRelievingFactorsTag] = React.useState([]);
    const [savePainAssessment] = useSavePainAssessmentMutation();
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: painDegreeLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
    const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: painScoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: adversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    // Handle Save Pain Assessment
    const handleSave = async () => {
        try {
            const tagAggravating = joinValuesFromArray(tags);
            const tagRelieving = joinValuesFromArray(relievingFactorsTag);
            //  TODO convert key to code
            if (painAssessment.key === undefined) {
                await savePainAssessment({
                    ...painAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    aggravatingFactors: tagAggravating,
                    relievingFactors: tagRelieving,
                    createdBy: authSlice.user.key
                }).unwrap();

                dispatch(notify({ msg: 'Pain Assessment Added Successfully', sev: 'success' }));
                setTags([]);
                setRelievingFactorsTag([]);
                //TODO convert key to code
                setPainAssessment({ ...painAssessment, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await savePainAssessment({
                    ...painAssessment,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    aggravatingFactors: tagAggravating,
                    relievingFactors: tagRelieving,
                    updatedBy: authSlice.user.key
                }).unwrap();
                dispatch(notify({ msg: 'Pain Assessment Updated Successfully', sev: 'success' }));
                setOpen(false);
                handleClearField();
                setTags([]);
                setRelievingFactorsTag([]);
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving Pain Assessment:", error);
            dispatch(notify({ msg: 'Failed to Save Pain Assessment', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setPainAssessment({
            ...newApPainAssessment,
            painDegreeLkey: null,
            painLocationLkey: null,
            painPatternLkey: null,
            onsetLkey: null,
            painScoreLkey: null,
            durationUnitLkey: null,
            statusLkey: null,
            aggravatingFactors: "",
            relievingFactors: "",
            impactOnFunction: false,
        });
        setAssociatedSymptoms({ associatedSymptomsLkey: null });
        setTags([]);
        setRelievingFactorsTag([]);
    };
    const joinValuesFromArray = (values) => {
        return values?.filter(Boolean).join(', ');
    };
    // Effects
    useEffect(() => {
        if (associatedSymptoms.associatedSymptomsLkey != null) {
            const foundItemKey = adversLovQueryResponse?.object?.find(
                item => item.key === associatedSymptoms.associatedSymptomsLkey
            );
            const foundItem = foundItemKey?.lovDisplayVale || '';;
            setPainAssessment(prevComplaintSymptoms => ({
                ...prevComplaintSymptoms,
                associatedSymptoms: prevComplaintSymptoms.associatedSymptoms
                    ? prevComplaintSymptoms.associatedSymptoms.includes(foundItem)
                        ? prevComplaintSymptoms.associatedSymptoms
                        : `${prevComplaintSymptoms.associatedSymptoms}, ${foundItem}`
                    : foundItem
            }));
        }
    }, [associatedSymptoms.associatedSymptomsLkey]);
    useEffect(() => {
        if (painAssessment.key != null) {
            setTags(painAssessment?.aggravatingFactors?.split(","));
            setRelievingFactorsTag(painAssessment?.relievingFactors?.split(","));
        }

    }, [painAssessment]);
    useEffect(() => {
        if (associatedSymptoms.associatedSymptomsLkey != null) {
            const foundItemKey = adversLovQueryResponse?.object?.find(
                item => item.key === associatedSymptoms.associatedSymptomsLkey
            );
            const foundItem = foundItemKey?.lovDisplayVale || '';;
            setPainAssessment(prevPainAssessment => ({
                ...prevPainAssessment,
                associatedSymptoms: prevPainAssessment.associatedSymptoms
                    ? prevPainAssessment.associatedSymptoms.includes(foundItem)
                        ? prevPainAssessment.associatedSymptoms
                        : `${prevPainAssessment.associatedSymptoms}, ${foundItem}`
                    : foundItem
            }));
        }
    }, [associatedSymptoms.associatedSymptomsLkey]);
    useEffect(() => {
        setPainAssessment({ ...painAssessmentObj });
    }, [painAssessmentObj]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (painAssessment?.statusLkey === '3196709905099521') {
            setIsEncounterPainAssessmentStatusClose(true);
        } else {
            setIsEncounterPainAssessmentStatusClose(false);
        }
    }, [painAssessment?.statusLkey]);
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
                    fieldLabel="Pain Degree"
                    fieldType="select"
                    fieldName="painDegreeLkey"
                    selectData={painDegreeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Pain Location"
                    fieldType="select"
                    fieldName="painLocationLkey"
                    selectData={bodyPartsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Pain Pattern"
                    fieldType="select"
                    fieldName="painPatternLkey"
                    selectData={painPatternLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />

                <MyInput
                    column
                    width={200}
                    fieldLabel="Onset"
                    fieldType="select"
                    fieldName="onsetLkey"
                    selectData={onsetLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <Form fluid layout='inline' disabled={edit}>
                    <MyInput
                        column
                        width={130}
                        fieldLabel="Pain Score"
                        fieldType="select"
                        fieldName="painScoreLkey"
                        selectData={painScoreLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={painAssessment}
                        setRecord={setPainAssessment}
                        disabled={isDisabledField}
                        searchable={false}
                    />
                    <MyInput
                        column
                        width={130}
                        fieldType="number"
                        fieldLabel="Duration"
                        fieldName="duration"
                        record={painAssessment}
                        setRecord={setPainAssessment}
                        disabled={isDisabledField}
                    />
                    <MyInput
                        column
                        width={130}
                        fieldLabel="Unit"
                        fieldType="select"
                        fieldName="durationUnitLkey"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={painAssessment}
                        setRecord={setPainAssessment}
                        disabled={isDisabledField}
                        searchable={false}
                    />
                </Form>
                <MyTagInput tags={tags} setTags={setTags} labelText="Aggravating Factors" />
                <MyTagInput tags={relievingFactorsTag} setTags={setRelievingFactorsTag} labelText="Relieving Factors" />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Associated Symptoms"
                    fieldType="select"
                    fieldName="associatedSymptomsLkey"
                    selectData={adversLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={associatedSymptoms}
                    setRecord={setAssociatedSymptoms}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Pain Management Given"
                    fieldName="painManagementGiven"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    fieldType="textarea"
                    fieldName="associatedSymptoms"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                    showLabel={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldType='checkbox'
                    fieldLabel="Impact on Function / Sleep"
                    fieldName="impactOnFunction"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={200}
                    fieldType='checkbox'
                    fieldLabel="Pain Reassessment Required"
                    fieldName="painReassessmentRequired"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Pain Assessment"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            steps={[{
                title: "Pain Assessment",
                icon: <FontAwesomeIcon icon={faFaceFrownOpen} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddPainAssessment;