// TeleScreenConsultation.tsx
import React, { useState } from 'react';
// import Details from '../../encounter-component/consultation/Details';
import Details from '../../encounter-component/consultation-new/Details';
import { newApConsultationOrder } from '@/types/model-types-constructor';

const TeleScreenConsultation = ({ open, onClose, patient, encounter, refetch }) => {
  const [consultationOrder, setConsultationOrder] = useState({ ...newApConsultationOrder });

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <Details
        open={open}
        setOpen={onClose}
        patient={patient}
        encounter={encounter}
        consultationOrders={consultationOrder}
        setConsultationOrder={setConsultationOrder}
        refetchCon={refetch}
        editing={false}
        edit={false}
      />
    </div>
  );
};

export default TeleScreenConsultation;
