import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  patient?: any;
  encounter?: any;
  handleSave?: any;
  payload?: { patientId?: number; encounterId?: number; orderNumber?: number } | null;
}

const PatientHistorySummaryModal: React.FC<Props> = ({ open, setOpen, handleSave, payload }) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  const [ready, setReady] = useState(false);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="AI Test Order Validation"
      size="70vw"
      bodyheight="75vh"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!ready}
      content={() => (
        <div dir={dir}>
          <PatientHistorySummary
            aiPayload={payload}
            onReadyChange={setReady}
            onContinueWithoutAi={handleSave}
            onEditOrder={() => setOpen(false)}
          />
        </div>
      )}
    />
  );
};

export default PatientHistorySummaryModal;
