import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveComplaintSymptomsMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms, ApPainAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import './styles.less'
import clsx from 'clsx';
const AddPainAssessment = ({ open, setOpen, patient, encounter, painAssessmentObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [painAssessment, setPainAssessment] = useState<ApPainAssessment>({ ...painAssessmentObj });
    const [associatedSymptoms, setAssociatedSymptoms] = useState({ associatedSymptomsLkey: '' });
    const [saveComplaintSymptoms] = useSaveComplaintSymptomsMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterChiefComplaintSymptomsStatusClose, setIsChiefComplaintSymptomsStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [tags, setTags] = React.useState([]);
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: painDegreeLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
    const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: painPatternLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_PATTERN');
    const { data: onsetLovQueryResponse } = useGetLovValuesByCodeQuery('ONSET');
    const { data: painScoreLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: adversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
    // Handle Save Cheif Complaint Symptoms
    const handleSave = async () => {
        //TODO convert key to code
        // try {
        //     if (complaintSymptoms.key === undefined) {
        //         await saveComplaintSymptoms({
        //             ...complaintSymptoms,
        //             patientKey: patient.key,
        //             encounterKey: encounter.key,
        //             onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0,
        //             statusLkey: "9766169155908512",
        //             createdBy: authSlice.user.key
        //         }).unwrap();

        //         dispatch(notify({msg:'Patient Complaint Symptoms Added Successfully',sev:'success'}));
        //         //TODO convert key to code
        //         setComplaintSymptoms({ ...complaintSymptoms, statusLkey: "9766169155908512" });
        //         setOpen(false);
        //     } else {
        //         await saveComplaintSymptoms({
        //             ...complaintSymptoms,
        //             patientKey: patient.key,
        //             encounterKey: encounter.key,
        //             onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0,
        //             updatedBy: authSlice.user.key
        //         }).unwrap();
        //         dispatch(notify({msg:'Patient Complaint Symptom Updated Successfully',sev:'success'}));
        //         setOpen(false);
        //     }
        //     await refetch();
        //     handleClearField();
        // } catch (error) {
        //     console.error("Error saving complaint symptoms:", error);
        //     dispatch(notify({msg:'Failed to save complaint symptoms',sev:'error'}));
        // }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        // setComplaintSymptoms({
        //     ...newApComplaintSymptoms,
        //     unitLkey: null,
        //     painLocationLkey: null
        // });
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
    // useEffect(() => {
    //     if (associatedSymptoms.associatedSymptomsLkey != null) {
    //         const foundItemKey = adversLovQueryResponse?.object?.find(
    //             item => item.key === associatedSymptoms.associatedSymptomsLkey
    //         );
    //         const foundItem = foundItemKey?.lovDisplayVale || '';;
    //         setComplaintSymptoms(prevComplaintSymptoms => ({
    //             ...prevComplaintSymptoms,
    //             associatedSymptoms: prevComplaintSymptoms.associatedSymptoms
    //                 ? prevComplaintSymptoms.associatedSymptoms.includes(foundItem)
    //                     ? prevComplaintSymptoms.associatedSymptoms
    //                     : `${prevComplaintSymptoms.associatedSymptoms}, ${foundItem}`
    //                 : foundItem
    //         }));
    //     }
    // }, [associatedSymptoms.associatedSymptomsLkey]);
    // useEffect(() => {
    //     setComplaintSymptoms({ ...complaintSymptom });
    // }, [complaintSymptom]);
    // useEffect(() => {
    //     // TODO update status to be a LOV value
    //     if (complaintSymptoms?.statusLkey === '3196709905099521') {
    //         setIsChiefComplaintSymptomsStatusClose(true);
    //     } else {
    //         setIsChiefComplaintSymptomsStatusClose(false);
    //     }
    // }, [complaintSymptoms?.statusLkey]);
    // useEffect(() => {
    //     // TODO update status to be a LOV value
    //     if (encounter?.encounterStatusLkey === '91109811181900') {
    //         setIsEncounterStatusClosed(true);
    //     }
    // }, [encounter?.encounterStatusLkey]);
    // useEffect(() => {
    //     if (isEncounterStatusClosed || isEncounterChiefComplaintSymptomsStatusClose) {
    //         setIsDisabledField(true);
    //     } else {
    //         setIsDisabledField(false);
    //     }
    // }, [isEncounterStatusClosed, isEncounterChiefComplaintSymptomsStatusClose]);
    // console.log(edit);
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
                <MyInput
                    column
                    width={200}
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
                    width={200}
                    fieldType="number"
                    fieldLabel="Duration"
                    fieldName="duration"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Unit"
                    fieldType="select"
                    fieldName="unitLkey"
                    selectData={unitLovQueryResponse?.object ?? []}
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
                    fieldLabel="Associated Symptoms"
                    fieldType="textarea"
                    fieldName="associatedSymptoms"
                    record={painAssessment}
                    setRecord={setPainAssessment}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={200}
                    fieldType='checkbox'
                    fieldLabel="Impact on Function / Sleep"
                    fieldName="aggravatingFactors"
                    record={painAssessment}
                    setRecord={setPainAssessment}
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
                    width={200}
                    fieldType='checkbox'
                    fieldLabel="Pain Reassessment Required"
                    fieldName="aggravatingFactors"
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
            title="Add/Edit Chief Complaint Symptoms"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            steps={[{
                title: "Chief Complain",
                icon: <FontAwesomeIcon icon={faHeartPulse} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddPainAssessment;