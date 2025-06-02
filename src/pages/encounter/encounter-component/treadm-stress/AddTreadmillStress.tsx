import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveTreadmillStresseMutation } from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { newApTreadmillStress } from '@/types/model-types-constructor';
import { ApTreadmillStress } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { faPersonRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './styles.less';
import clsx from 'clsx';
const AddTreadmillStress = ({ open, setOpen, treadmillStressObject, patient, encounter, refetch,edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [treadmillStress, setTreadmillStress] = useState<ApTreadmillStress>(treadmillStressObject);
    const [saveTreadmillStress] = useSaveTreadmillStresseMutation();
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterTreadmillStressStatusClose, setIsEncounterTreadmillStressStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const dispatch = useAppDispatch()

    // Fetch LOV data for various fields
    const { data: baselineECGFindingsLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ECG_FINDINGS');
    const { data: numbersLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
    const { data: cardiacLovQueryResponse } = useGetLovValuesByCodeQuery('CARDIAC_ST_CHANGES');
    const { data: arrythmiasLovQueryResponse } = useGetLovValuesByCodeQuery('ARRYTHMIAS');
    const { data: treadmillLovQueryResponse } = useGetLovValuesByCodeQuery('TREADMILL_OUTCOMES');

    // Handle Save Treadmill Stress Function
    const handleSave = async () => {
        //TODO convert key to code
        try {
            if (treadmillStress.key === undefined) {
                //TODO convert key to code
                await saveTreadmillStress({ ...treadmillStress, patientKey: patient.key, encounterKey: encounter.key, statusLkey: "9766169155908512", createdBy: authSlice.user.key }).unwrap();
                dispatch(notify({msg:'Patient Treadmill Stress Added Successfully',sev:'success'}));
                //TODO convert key to code
                setTreadmillStress({ ...newApTreadmillStress, statusLkey: "9766169155908512" })
            } else {
                await saveTreadmillStress({ ...treadmillStress, patientKey: patient.key, encounterKey: encounter.key, updatedBy: authSlice.user.key }).unwrap();
                dispatch(notify({msg:'Patient Treadmill Stress Updated Successfully',sev:'success'}));
            }
            await refetch();
            handleClearField();
            setOpen(false);
        } catch (error) {
            console.error("Error saving Treadmill Stress:", error);
            dispatch(notify({msg:'Failed to save Treadmill Stress',sev:'error'}));
        }
    };

    // Handle Clear Fields Function
    const handleClearField = () => {
        setTreadmillStress({
            ...newApTreadmillStress,
            baselineEcgFindingsLkey: null,
            bruceProtocolStageLkey: null,
            segmentChangeLkey: null,
            typeLkey: null,
            statusLkey: null,
            testOutcomeLkey: null,
            arrhythmiaNoted: false
        });
    };

    // Effects
    useEffect(() => {
        setTreadmillStress({ ...treadmillStressObject });
    }, [treadmillStressObject]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (treadmillStress?.statusLkey === '3196709905099521') {
            setIsEncounterTreadmillStressStatusClose(true);
        } else {
            setIsEncounterTreadmillStressStatusClose(false);
        }
    }, [treadmillStress?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900') {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterTreadmillStressStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterTreadmillStressStatusClose]);

    // Modal Content
    const content = (
         <div  className={clsx('', {'disabled-panel': edit})}>
        <Form fluid layout='inline' >
            <MyInput
                width={200}
                column
                fieldLabel="Test Indication"
                fieldName="indication"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <MyInput
                column
                width={200}
                fieldLabel="Baseline ECG Findings"
                fieldType="select"
                fieldName="baselineEcgFindingsLkey"
                selectData={baselineECGFindingsLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
                searchable={false}
            />
            <div className="bp-input-group" >
                <div>
                    <MyInput
                        column
                        width={200}
                        fieldLabel="Pre-Test Blood Pressure"
                        fieldName="preTestSystolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        disabled={isDisabledField}
                    />
                </div>
                <div className='slash'>/</div>
                <div>
                    <MyInput
                        column
                        width={200}
                        fieldName="preTestDiastolicBp"
                        fieldType="number"
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        showLabel={false}
                        disabled={isDisabledField}
                    />
                </div>
            </div>
            <MyInput
                column
                width={200}
                fieldLabel="Bruce Protocol Stage "
                fieldType="select"
                fieldName="bruceProtocolStageLkey"
                selectData={numbersLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
                searchable={false}
            />
            <MyInput
                column
                width={200}
                fieldLabel="ST Segment Change"
                fieldType="select"
                fieldName="segmentChangeLkey"
                selectData={cardiacLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
                searchable={false}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Arrhythmia Noted"
                fieldType="checkbox"
                fieldName="arrhythmiaNoted"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Type"
                fieldType="select"
                fieldName="typeLkey"
                selectData={arrythmiasLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField || !treadmillStress?.arrhythmiaNoted}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Test Outcome "
                fieldType="select"
                fieldName="testOutcomeLkey"
                selectData={treadmillLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
                searchable={false}
            />
            <MyInput
                width={120}
                rightAddonwidth={80}
                column
                fieldLabel="Exercise Duration"
                fieldType="number"
                fieldName="exerciseDuration"
                rightAddon="Minutes"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <MyInput
                width={150}
                rightAddonwidth={50}
                column
                fieldLabel="Maximum Heart Rate Achieved"
                fieldType="number"
                fieldName="maximumHeartRateAchieved"
                rightAddon="BPM"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <MyInput
                width={90}
                rightAddonwidth={110}
                column
                fieldLabel="Target Heart Rate"
                fieldType="number"
                fieldName="targetHeartRate"
                rightAddon="% of Max HR"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <div className="bp-input-group">
                <div>
                    <MyInput
                        column
                        width={200}
                        fieldLabel="Post-Test BP"
                        fieldName="postTestSystolicBp"
                        fieldType='number'
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        disabled={isDisabledField} />

                </div>
                <div className='slash'>/</div>
                <div>
                    <MyInput
                        column
                        width={200}
                        fieldName="postTestDiastolicBp"
                        fieldType='number'
                        record={treadmillStress}
                        setRecord={setTreadmillStress}
                        showLabel={false}
                        disabled={isDisabledField} />
                </div></div>
            <MyInput
                width={120}
                rightAddonwidth={80}
                column
                fieldLabel="Recovery Time"
                fieldType="number"
                fieldName="recoveryTime"
                rightAddon="Minutes"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
            <MyInput
                width={200}
                column
                fieldLabel="Cardiologist Notes"
                fieldType="textarea"
                fieldName="cardiologistNotes"
                rightAddon="Minutes"
                record={treadmillStress}
                setRecord={setTreadmillStress}
                disabled={isDisabledField}
            />
        </Form> </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Treadmill Stress"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit?isDisabledField:true}
            size='32vw'
            steps={[{
                title: "Treadmill Stress",
                icon: <FontAwesomeIcon icon={faPersonRunning}/>,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddTreadmillStress;