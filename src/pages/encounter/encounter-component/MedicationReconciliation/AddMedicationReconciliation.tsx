import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveMedicationReconciliationMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApMedicationReconciliation } from '@/types/model-types-constructor';
import { ApMedicationReconciliation } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest } from '@/types/types';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import './styless.less';
import { useGetActiveIngredientQuery } from '@/services/medicationsSetupService';
const AddMedicationReconciliation = ({ open, setOpen, patient, encounter, medicationReconciliationObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [medicationReconciliation, setMedicationReconciliation] = useState<ApMedicationReconciliation>({ ...newApMedicationReconciliation });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [saveMedicationReconciliation] = useSaveMedicationReconciliationMutation();
    const dispatch = useAppDispatch();
    const { data: activeIngredientListResponse, refetch: activeIngredientRefetch } = useGetActiveIngredientQuery(initialListRequest);

    // Fetch LOV data for various fields
    const { data: dosageLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
    const { data: roaLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
    const { data: durationLovQueryResponse } = useGetLovValuesByCodeQuery('MED_DURATION');

    // Handle Save Medication Reconciliation
    const handleSave = async () => {
        //  TODO convert key to code
        try {
            if (medicationReconciliation.key === undefined) {
                await saveMedicationReconciliation({
                    ...medicationReconciliation,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "164797574082125",
                    createdBy: authSlice.user.key,
                    lastDoseTaken: medicationReconciliation.lastDoseTaken ? new Date(medicationReconciliation?.lastDoseTaken)?.getTime() : null,
                    startDate: medicationReconciliation.startDate ? new Date(medicationReconciliation?.startDate)?.getTime() : null,


                }).unwrap();

                dispatch(notify({ msg: 'Medication Reconciliationt Successfully', sev: 'success' }));
                //TODO convert key to code
                setMedicationReconciliation({ ...medicationReconciliation, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await saveMedicationReconciliation({
                    ...medicationReconciliation,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key,

                }).unwrap();
                dispatch(notify({ msg: 'Medication Reconciliationt Updated Successfully', sev: 'success' }));
                setOpen(false);
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving Medication Reconciliationt", error);
            dispatch(notify({ msg: 'Failed to Save Medication Reconciliationt', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setMedicationReconciliation({
            ...newApMedicationReconciliation,
            dosageLkey: null,
            routeLkey: null,
            frequencyLkey: null,
        });
    };

    // Effects
    useEffect(() => {
        setMedicationReconciliation({ ...medicationReconciliationObj });
    }, [medicationReconciliationObj]);

    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed]);

    // Modal Content 
    const content = (
        <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid layout='inline' disabled={edit} className='fields-container'>
                <MyInput
                    column
                    width={400}
                    fieldLabel="Medication Name"
                    fieldType="select"
                    fieldName="activeIngredientKey"
                    selectData={activeIngredientListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Dosage"
                    fieldType="number"
                    fieldName="dosage"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                    searchable={false} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Dosage Form"
                    fieldType="select"
                    fieldName="dosageLkey"
                    selectData={dosageLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"    
                    selectDataValue="key"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                    
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Route"
                    fieldType="select"
                    fieldName="routeLkey"
                    selectData={roaLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                    searchable={false}
                />
               
                <Form fluid layout='inline' className='fields-container-flex-end'>
                <MyInput
                    column
                    width={90}
                    fieldLabel="Every"
                    fieldType="number"
                    fieldName="frequencyValue"        
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                />
                <MyInput
                    column
                    width={100}
                    fieldLabel=" "
                    fieldType="select"
                    fieldName="frequencyLkey"
                    selectData={durationLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField}
                    searchable={false}
                /></Form>
                <MyInput
                    column
                    width={200}
                    fieldLabel="Start Date"
                    fieldType="date"
                    fieldName="startDate"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Last Dose Taken"
                    fieldType="datetime"
                    fieldName="lastDoseTaken"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Indication"
                    fieldName="indication"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Source of Info"
                    fieldName="sourceOfInfo"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />

                <MyInput
                    column
                    width={200}
                    fieldLable="Medication Available with Patient?"
                    fieldName="medicationAvailableWithPatient"
                    fieldType="checkbox"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Continue in Hospital?"
                    fieldName="continueInHospital"
                    fieldType="checkbox"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLable="Discrepancy Identified?"
                    fieldName="discrepancyIdentified"
                    fieldType="checkbox"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField} />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Action Taken"
                    fieldName="actionTaken"
                    record={medicationReconciliation}
                    setRecord={setMedicationReconciliation}
                    disabled={isDisabledField || !medicationReconciliation?.discrepancyIdentified} />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Medication Reconciliation"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='34vw'
            steps={[{
                title: "medication Reconciliation",
                icon: <FontAwesomeIcon icon={faClipboardCheck} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddMedicationReconciliation;