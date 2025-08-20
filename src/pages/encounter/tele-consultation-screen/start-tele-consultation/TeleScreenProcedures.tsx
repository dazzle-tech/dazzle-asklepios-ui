import React, { useState, useEffect } from 'react';
import Details from '../../encounter-component/procedure/Details';
import { newApProcedure } from '@/types/model-types-constructor';

const TeleScreenProcedures = ({ open = false, onClose }) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(open);
  const [procedure, setProcedure] = useState(newApProcedure);

  const dummyPatient = { key: '123', name: 'John Doe' };
  const dummyEncounter = { key: '456', editable: true };

  useEffect(() => {
    setOpenDetailsModal(open);
  }, [open]);

  return (
    <div>
      <Details
        patient={dummyPatient}
        encounter={dummyEncounter}
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
        proRefetch={() => console.log('Refetch procedures')}
      />
    </div>
  );
};

export default TeleScreenProcedures;
