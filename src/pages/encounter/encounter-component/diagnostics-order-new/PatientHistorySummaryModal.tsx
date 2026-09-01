import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  patient?: any;
  encounter?: any;
  handleSave?: any;
  payload?: { patientId?: number; encounterId?: number, orderNumber?: number } | null;
}

const PatientHistorySummaryModal: React.FC<Props> = ({ open, setOpen, handleSave, payload }) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Treatment Validation Summary"
      size="70vw"
      bodyheight="75vh"
      actionButtonFunction={handleSave}
      content={() => (
        <div dir={dir}>
          <PatientHistorySummary title="Tests Validation" aiPayload={payload} mode="tests" />
        </div>
      )}
    />
  );
};

export default PatientHistorySummaryModal;