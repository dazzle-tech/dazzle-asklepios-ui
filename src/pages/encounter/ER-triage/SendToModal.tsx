import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { newApEncounter } from '@/types/model-types-constructor';
import { ApEncounter } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './styles.less'
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const SendToModal = ({ open, setOpen, encounter }) => {
    const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...newApEncounter });
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const [showModal, setShowModal] = useState(false);

    // Handle Save Encounter
    const handleSave = () => {
        if (localEncounter && localEncounter.patientKey) {
            saveEncounter({
                ...localEncounter,
                encounterStatusLkey: "6742317684600328",
            }).unwrap().then(() => {
                dispatch(notify({ msg: 'Patient has been successfully moved from the ER Waiting List' }));
                setShowModal(false);
                setOpen(false);
            }).catch((e) => {

                if (e.status === 422) {
                    console.log("Validation error: Unprocessable Entity", e);

                } else {
                    console.log("An unexpected error occurred", e);
                    dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
                }
            });
        } else {
            dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
        }
    };
    // handle Complete Encounter Function
    const handleCompleteEncounter = async () => {
        try {
            await completeEncounter(localEncounter).unwrap();
            dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
        } catch (error) {
            console.error("Encounter completion error:", error);
            dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
        }
    };
    // Modal Content 
    const content = (
        <Form fluid layout='inline' className="send-to-options-form">
            <MyButton width={300} onClick={handleCompleteEncounter}>
                Refer to Specialist
            </MyButton>
            <MyButton width={300} onClick={handleCompleteEncounter}>
                Send to Home Care
            </MyButton>
            <MyButton width={300} onClick={() => { setShowModal(true) }}>
                ER Waiting List
            </MyButton>
        </Form>
    )

    //Effects
    useEffect(() => {
        if (encounter) {
            setLocalEncounter({ ...encounter });
        }
    }, [encounter]);
    return (
        <>
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Transfer Options"
                actionButtonFunction={handleSave}
                position='center'
                hideActionBtn={true}
                hideCancel={true}
                size='32vw'
                bodyheight='50vh'
                steps={[{
                    title: "Transfer Options",
                    icon: <FontAwesomeIcon icon={faPaperPlane} />
                },]}
                content={content}
            ></MyModal>
            <DeletionConfirmationModal
                open={showModal}
                setOpen={setShowModal}
                actionType="confirm"
                actionButtonFunction={handleSave}
                confirmationQuestion="Do you want to send the patient to the ER Waiting List?"
            />
        </>
    );
};
export default SendToModal;