import React, { useState, useEffect } from 'react';
import Details from '../../encounter-component/procedure-new/Details';
import { newApProcedure } from '@/types/model-types-constructor';

const TeleScreenProcedures = ({ open = false, onClose, patient, encounter}) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(open);
  // const [procedure, setProcedure] = useState(newApProcedure);
   const [procedure, setProcedure] = useState<any>({
      ...newApProcedure,
      encounterKey: encounter?.key,
      patientKey: patient?.key,
      currentDepartment: true
    });

  useEffect(() => {
    setOpenDetailsModal(open);
  }, [open]);


        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <Details
        patient={patient}
        encounter={encounter}
        edit={false}
        procedure={procedure}
        setProcedure={setProcedure}
        openDetailsModal={openDetailsModal}
        setOpenDetailsModal={(val) => {
          setOpenDetailsModal(val);
          if (!val && onClose) {
            onClose();
          }
        }}
        proRefetch={() => {}}
      />
    </div>
  );
};

export default TeleScreenProcedures;
