import React, { useState } from 'react';
import DetailsModal from '../../encounter-component/drug-order/DetailsModal';

const TeleScreenMedicationOrder = ({ open, onClose, patient, encounter, medicRefetch }) => {
  // هنا تحكم حالة فتح المودال داخل الصفحة نفسها
  const [orderMedication, setOrderMedication] = useState({});
  const [drugKey, setDrugKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openToAdd, setOpenToAdd] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <>
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
    </>
  );
};

export default TeleScreenMedicationOrder;
