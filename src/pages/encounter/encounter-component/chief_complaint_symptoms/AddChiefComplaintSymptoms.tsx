import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveComplaintSymptomsMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
const AddChiefComplaintSymptoms = ({ open, setOpen, patient, encounter, complaintSymptom, refetch }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [complaintSymptoms, setComplaintSymptoms] = useState<ApComplaintSymptoms>({ ...complaintSymptom });
    const [associatedSymptoms, setAssociatedSymptoms] = useState({ associatedSymptomsLkey: '' });
    const [saveComplaintSymptoms] = useSaveComplaintSymptomsMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterChiefComplaintSymptomsStatusClose, setIsChiefComplaintSymptomsStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const dispatch = useAppDispatch();

  // Fetch LOV data for various fields
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: bodyPartsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_PARTS');
    const { data: adversLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

    // Handle Save Cheif Complaint Symptoms
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (complaintSymptoms.key === undefined) {
                await saveComplaintSymptoms({
                    ...complaintSymptoms,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key
                }).unwrap();

                dispatch(notify('Patient Complaint Symptoms Added Successfully'));
                //TODO convert key to code
                setComplaintSymptoms({ ...complaintSymptoms, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await saveComplaintSymptoms({
                    ...complaintSymptoms,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    onsetDate: complaintSymptoms?.onsetDate ? new Date(complaintSymptoms.onsetDate).getTime() : 0,
                    updatedBy: authSlice.user.key
                }).unwrap();

                dispatch(notify('Patient Complaint Symptom Updated Successfully'));
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving complaint symptoms:", error);
            dispatch(notify('Failed to save complaint symptoms'));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setComplaintSymptoms({
            ...newApComplaintSymptoms,
            unitLkey: null,
            painLocationLkey: null
        });
    };

    // Effects
    useEffect(() => {
        if (associatedSymptoms.associatedSymptomsLkey != null) {
            const foundItemKey = adversLovQueryResponse?.object?.find(
                item => item.key === associatedSymptoms.associatedSymptomsLkey
            );
            const foundItem = foundItemKey?.lovDisplayVale || '';;
            setComplaintSymptoms(prevComplaintSymptoms => ({
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
        setComplaintSymptoms({ ...complaintSymptom });
    }, [complaintSymptom]);
 useEffect(() => {
        // TODO update status to be a LOV value
        if (complaintSymptoms?.statusLkey === '3196709905099521') {
            setIsChiefComplaintSymptomsStatusClose(true);
        } else {
            setIsChiefComplaintSymptomsStatusClose(false);
        }
    }, [complaintSymptoms?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterChiefComplaintSymptomsStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterChiefComplaintSymptomsStatusClose]);
    // Modal Content 
    const content = (
        <Form fluid layout='inline'>
            <MyInput
                column
                width={200}
                fieldType="date"
                fieldLabel="Onset Date"
                fieldName="onsetDate"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldType="number"
                fieldLabel="Duration"
                fieldName="duration"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
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
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Pain Characteristics"
                fieldName="painCharacteristics"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
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
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Radiation"
                fieldName="radiation"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Aggravating Factors"
                fieldName="aggravatingFactors"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
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
                fieldLabel="Chief Complaint"
                fieldType="textarea"
                fieldName='chiefComplaint'
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                fieldLabel="Associated Symptoms"
                fieldType="textarea"
                fieldName="associatedSymptoms"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Relieving Factors"
                fieldName="relievingFactors"
                record={complaintSymptoms}
                setRecord={setComplaintSymptoms}
                disabled={isDisabledField}
            />
        </Form>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Chief Complaint Symptoms"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={isDisabledField}
            bodyheight={550}
            size='500px'
            steps={[{
                title: "Chief Complain",
                icon: faHeartPulse,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddChiefComplaintSymptoms;