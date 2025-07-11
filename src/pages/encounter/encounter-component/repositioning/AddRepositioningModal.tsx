import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useSaveNewPositionMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { newApRepositioning } from '@/types/model-types-constructor';
import { ApRepositioning } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import'./styles.less';
const AddRepositioningModal = ({ open, setOpen, patient, encounter, positionObj, refetch, edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [position, setPosition] = useState<ApRepositioning>({ ...newApRepositioning });
    const [isDisabledField, setIsDisabledField] = useState(false);
    const [isEncounterRepositioningStatusClose, setIsEncounterRepositioningStatusClose] = useState(false);
    const [isEncounterStatusClosed, setIsEncounterStatusClosed] = useState(false);
    const [savePosition] = useSaveNewPositionMutation();
    const dispatch = useAppDispatch();

    // Fetch LOV data for various fields
    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: positionLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_POSITION');

    // Handle Save New Position
    const handleSave = async () => {
        try {
            //  TODO convert key to code
            if (position.key === undefined) {
                await savePosition({
                    ...position,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "9766169155908512",
                    createdBy: authSlice.user.key
                }).unwrap();
                dispatch(notify({ msg: 'New Position Added Successfully', sev: 'success' }));
                //TODO convert key to code
                setPosition({ ...newApRepositioning, statusLkey: "9766169155908512" });
                setOpen(false);
            } else {
                await savePosition({
                    ...position,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    updatedBy: authSlice.user.key
                }).unwrap();
                dispatch(notify({ msg: 'Psition Updated Successfully', sev: 'success' }));
                setOpen(false);
            }
            await refetch();
            handleClearField();
        } catch (error) {
            console.error("Error saving Position:", error);
            dispatch(notify({ msg: 'Failed to Save Position', sev: 'error' }));
        }
    };

    // Handle Clear Fields
    const handleClearField = () => {
        setPosition({
            ...newApRepositioning,
            newPositionLkey: null,
            timeUnitLkey: null,
        });
    };
    // Effects
    useEffect(() => {
        setPosition({ ...positionObj });
    }, [positionObj]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (position?.statusLkey === '3196709905099521') {
            setIsEncounterRepositioningStatusClose(true);
        } else {
            setIsEncounterRepositioningStatusClose(false);
        }
    }, [position?.statusLkey]);
    useEffect(() => {
        // TODO update status to be a LOV value
        if (encounter?.encounterStatusLkey === '91109811181900' || encounter?.discharge) {
            setIsEncounterStatusClosed(true);
        }
    }, [encounter?.encounterStatusLkey]);
    useEffect(() => {
        if (isEncounterStatusClosed || isEncounterRepositioningStatusClose) {
            setIsDisabledField(true);
        } else {
            setIsDisabledField(false);
        }
    }, [isEncounterStatusClosed, isEncounterRepositioningStatusClose]);
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
                    fieldLabel="New Position"
                    fieldType="select"
                    fieldName="newPositionLkey"
                    selectData={positionLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={position}
                    setRecord={setPosition}
                    disabled={isDisabledField}
                    searchable={false}
                />
                <MyInput
                    column
                    width={200}
                    fieldLabel="Position Change Successful?"
                    fieldType="checkbox"
                    fieldName="positionChangeSuccessful"
                    record={position}
                    setRecord={setPosition}
                    disabled={isDisabledField}
                />
                <div className='repositioning-container'>
                    <MyInput
                        column
                        width={200}
                        fieldLabel="Expected Next Repositioning"
                        fieldType="number"
                        fieldName="expectedNextRepositioning"
                        record={position}
                        setRecord={setPosition}
                        disabled={isDisabledField}
                    />

                    <MyInput
                        column
                        width={200}
                        fieldLabel=" "
                        fieldType="select"
                        fieldName="timeUnitLkey"
                        selectData={unitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={position}
                        setRecord={setPosition}
                        disabled={isDisabledField}
                        showLabel={false}
                        searchable={false}
                    />
                </div>

                <MyInput
                    column
                    width={400}
                    fieldType='textarea'
                    fieldLabel="Notes"
                    fieldName="notes"
                    record={position}
                    setRecord={setPosition}
                    disabled={isDisabledField}
                />
            </Form>
        </div>
    )
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add/Edit Repositioning"
            actionButtonFunction={handleSave}
            position='right'
            isDisabledActionBtn={!edit ? isDisabledField : true}
            size='32vw'
            steps={[{
                title: "Repositioning",
                icon: <FontAwesomeIcon icon={faSyncAlt} />,
                footer: <MyButton appearance='ghost' onClick={handleClearField} >Clear</MyButton>
            },]}
            content={content}
        ></MyModal>
    );
};
export default AddRepositioningModal;