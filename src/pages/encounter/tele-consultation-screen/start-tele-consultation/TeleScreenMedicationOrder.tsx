import React, { useState } from 'react';
import DetailsModal from '../../encounter-component/drug-order/DetailsModal';

const TeleScreenMedicationOrder = ({ open, onClose, patient, encounter, medicRefetch }) => {
  const [orderMedication, setOrderMedication] = useState({});
  const [drugKey, setDrugKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      {open && (
        <DetailsModal
          open={open}
          setOpen={onClose}
          orderMedication={orderMedication}
          setOrderMedication={setOrderMedication}
          drugKey={drugKey}
          editing={editing}
          patient={patient}
          encounter={encounter}
          medicRefetch={medicRefetch}
          openToAdd={openToAdd}
          isFavorite={isFavorite}
          edit={false}
        />
      )}
    </div>
  );
};

export default TeleScreenMedicationOrder;
