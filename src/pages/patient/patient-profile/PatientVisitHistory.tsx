import React, { useState } from 'react';
import { Drawer } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { useCancelEncounterMutation } from '@/services/encounterService';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import './styles.less';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import EncounterDischarge from '@/pages/encounter/encounter-component/encounter-discharge';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';

const PatientVisitHistory = ({
  visitHistoryModel,
  localPatient,
  setVisitHistoryModel,
  quickAppointmentModel,
  setQuickAppointmentModel
}) => {
  const [selectedVisit] = useState(null);
  const [open, setOpen] = useState(false);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  const dispatch = useDispatch();

  // Mutations for encounter actions
  const [cancelEncounter] = useCancelEncounterMutation();
  // Cancel encounter handler
  const handleCancelEncounter = async () => {
    try {
      if (selectedVisit) {
        await cancelEncounter(selectedVisit).unwrap();
        dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
        setOpen(false);
      }
    } catch (error) {
      dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
    }
  };

  return (
    <div className="drawer-container">
      <Drawer
        size="md"
        placement={'right'}
        open={visitHistoryModel}
        onClose={() => setVisitHistoryModel(false)}
      >
        <Drawer.Header>
          <Drawer.Title>{localPatient?.firstName}'s Visits history</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <PatientVisitHistoryTable
            quickAppointmentModel={quickAppointmentModel}
            setQuickAppointmentModel={setQuickAppointmentModel}
            localPatient={localPatient}
          />
        </Drawer.Body>
      </Drawer>
      <DeletionConfirmationModal
        open={open}
        setOpen={setOpen}
        actionButtonFunction={handleCancelEncounter}
        actionType="Deactivate"
        confirmationQuestion="Do you want to cancel this Encounter ?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />
      <EncounterDischarge
        open={openDischargeModal}
        setOpen={setOpenDischargeModal}
        encounter={selectedVisit}
      />
      {quickAppointmentModel ? (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          localPatient={localPatient}
          setQuickAppointmentModel={setQuickAppointmentModel}
          localVisit={selectedVisit}
          isDisabeld={true}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default PatientVisitHistory;
