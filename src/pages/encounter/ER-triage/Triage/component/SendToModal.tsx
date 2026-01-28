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
import '../../styles.less'
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useUpdateEmergencyTriageDestinationMutation } from '@/services/encounters/er-triage/emergencyTriageService';

type DestinationEnum = 'ER_WAITING_LIST' | 'REFER_TO_SPECIALIST' | 'SENT_TO_HOMECARE';

const SendToModal = ({ open, setOpen, encounter, triage, refetch = null }) => {
    const dispatch = useAppDispatch();
    const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...newApEncounter });
    const [saveEncounterChanges] = useSaveEncounterChangesMutation();
    const [updateDestination] = useUpdateEmergencyTriageDestinationMutation();
    const [showModal, setShowModal] = useState(false);
    const [emergencyTriage, setEmergencyTriage] = useState<any>({});

    const COMPLETE_TRIAGE_STATUS_KEY = '91109811181900';
    const SENT_TO_ER_STATUS_KEY = '6742317684600328';

    const handleTransfer = async (destination: DestinationEnum) => {
      if (!localEncounter) {
        dispatch(notify({ msg: 'Encounter not found', sev: 'error' }));
        return;
      }

      // 1) Update encounter status ONLY
      const nextStatus =
        destination === 'ER_WAITING_LIST' ? SENT_TO_ER_STATUS_KEY : COMPLETE_TRIAGE_STATUS_KEY;

      try {
        await saveEncounterChanges({
          ...localEncounter,
          encounterStatusLkey: nextStatus
        }).unwrap();
      } catch (e: any) {
        console.error('Error updating encounter status', e);
        dispatch(notify({ msg: 'Failed to update encounter status', sev: 'error' }));
        return;
      }

      // 2) Update destination on NEW emergency triage object
      const triageId = emergencyTriage?.id ?? triage?.id;
      if (!triageId) {
        dispatch(
          notify({
            msg: 'Emergency triage record not found (missing id) - destination not saved',
            sev: 'warn'
          })
        );
      } else {
        try {
          await updateDestination({ id: Number(triageId), destination }).unwrap();
        } catch (e: any) {
          console.error('Error updating emergency triage destination', e);
          dispatch(notify({ msg: 'Failed to update destination', sev: 'error' }));
          // we still continue to close the modal since encounter status is already updated
        }
      }

      const msg =
        destination === 'ER_WAITING_LIST'
          ? 'Patient has been successfully moved to the ER Waiting List'
          : destination === 'REFER_TO_SPECIALIST'
          ? 'Patient has been referred to specialist'
          : 'Patient has been sent to Home Care';

      dispatch(notify({ msg, sev: 'success' }));
      setShowModal(false);
      setOpen(false);
      if (refetch) refetch();
    };
    // Modal Content 
    const content = (
        <Form fluid layout='inline' className="send-to-options-form">
            <MyButton width={300} onClick={() => { handleTransfer('REFER_TO_SPECIALIST') }}>
                Refer to Specialist
            </MyButton>
            <MyButton width={300} onClick={() => { handleTransfer('SENT_TO_HOMECARE') }}>
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
    useEffect(() => {
        if (triage) {
            setEmergencyTriage({ ...triage });
        }
    }, [triage]);
    return (
        <>
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Transfer Options"
                actionButtonFunction={() => {}}
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
                actionButtonFunction={() => { handleTransfer('ER_WAITING_LIST') }}
                confirmationQuestion="Do you want to send the patient to the ER Waiting List?"
            />
        </>
    );
};
export default SendToModal;