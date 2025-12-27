import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  patient: any;
  encounter: any;
  edit?: boolean;
  handleSave?: any;
  payload?: any;
}

const PatientHistorySummaryModal: React.FC<Props> = ({
  open,
  setOpen,
  patient,
  encounter,
  edit,
  handleSave,
  payload
}) => {

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Treatment Validation Summary"
      size="70vw"
      bodyheight="75vh"
      actionButtonFunction={handleSave}
      content={() => (
        <PatientHistorySummary
          aiPayload={payload}
        />
      )}
    />
  );
};

export default PatientHistorySummaryModal;
