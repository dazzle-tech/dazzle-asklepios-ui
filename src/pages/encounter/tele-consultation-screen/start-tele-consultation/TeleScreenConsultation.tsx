// TeleScreenConsultation.tsx
import React, { useState } from 'react';
import Details from '../../encounter-component/consultation/Details';
import { newApConsultationOrder } from '@/types/model-types-constructor';

const TeleScreenConsultation = ({ open, onClose, patient, encounter, refetch }) => {
  const [consultationOrder, setConsultationOrder] = useState({ ...newApConsultationOrder });

  return (
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
  );
};

export default TeleScreenConsultation;
