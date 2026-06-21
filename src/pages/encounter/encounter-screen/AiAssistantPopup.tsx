import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import PatientHistorySummary from './PatientHistorySummary';
import { Patient, PatientEncounter } from '@/types/model-types-new';

interface AiAssistantPopupProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  encounter?: PatientEncounter;
  patient?: Patient;
}

const AiAssistantPopup: React.FC<AiAssistantPopupProps> = ({
  open,
  setOpen,
  encounter,
  patient
}) => {
  const handleCancel = () => setOpen(false);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Clinical Recommendations"
      size="md"
      bodyheight="80vh"
      hideActionBtn={true}
      handleCancelFunction={handleCancel}
      content={
        <PatientHistorySummary
          title="Clinical Recommendations"
          patientId={patient?.id}
          encounterId={encounter?.id}
        />
      }
    />
  );
};

export default AiAssistantPopup;