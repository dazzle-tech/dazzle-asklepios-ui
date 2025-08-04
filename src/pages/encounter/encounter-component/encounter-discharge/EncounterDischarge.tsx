import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApEncounter } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import './styles.less'
import { useDischargeEncounterMutation } from '@/services/encounterService';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
const EncounterDischarge = ({ open, setOpen, encounter, refetch = null }) => {
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...newApEncounter });
    const [dischargeEncounter] = useDischargeEncounterMutation();

    // Fetch discharge type LOV
    const { data: dischargeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DC_TYPES');
    // Function to handle the discharge of the encounter
    const handleCompleteEncounter = async () => {
        try {
            await dischargeEncounter({ ...localEncounter, dischargeAt: (new Date()).getTime() }).unwrap();
            dispatch(notify({ msg: ' Encounter Discharge Successfully', sev: 'success' }));
            setOpen(false);
            if (refetch) {
                refetch();
            }
        }
        catch (error) {
            console.error("Encounter completion error:", error);
            dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
        }
    };
    // Modal Content 
    const content = (
        <Form fluid layout='inline' className='encounter-discharge-form'>
            <MyInput
                column
                width={300}
                fieldLabel="Discharge Type"
                fieldType="select"
                fieldName="dischargeTypeLkey"
                selectData={dischargeTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                searchable={false} />
            <MyInput
                column
                width={300}
                fieldLabel="Discharge Type"
                fieldType="textarea"
                fieldName="diagnosis"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={true} />
        </Form>
    )

    //Effects
    useEffect(() => {
        if (encounter) {
            setLocalEncounter({ ...encounter });
        }
    }, [encounter]);

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Discharge Encounter"
            actionButtonFunction={handleCompleteEncounter}
            position='center'
            size='28vw'
            bodyheight='60vh'
            steps={[{
                title: "Discharge Encounter",
                icon: <FontAwesomeIcon icon={faSignOutAlt} />
            },]}
            content={content}
        ></MyModal>
    );
};
export default EncounterDischarge;