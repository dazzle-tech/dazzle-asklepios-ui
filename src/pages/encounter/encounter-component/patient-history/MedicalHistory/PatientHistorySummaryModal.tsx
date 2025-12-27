import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';
import { useGetPatientSummaryQuery } from '@/services/encounterService'; 

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  patient: any;
  encounter: any;
  edit?: boolean;
  handleSave?: any;
  lang?: string; 
}

const PatientHistorySummaryModal: React.FC<Props> = ({
  open,
  setOpen,
  patient,
  encounter,
  edit,
  handleSave,
  lang = 'en'
}) => {
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient History Summary"
      size="70vw"
      bodyheight="75vh"
      hideActionBtn={true}
      content={() => (
        (
            <PatientHistorySummary
              patient={patient}
              encounter={encounter}
              edit={edit}
            />
          )
      )}
    />
  );
};

export default PatientHistorySummaryModal;
