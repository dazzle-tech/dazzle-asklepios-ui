import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import DetailTable from './DetailTable';
import MyModal from '@/components/MyModal/MyModal';
//Component Props
const OpenDetailsTableModal = ({ open, setOpen }) => {

  //Modalcontent
  const ModalContent = (
    <div>
      <DetailTable />
    </div>
  );

  return (
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Order Details"
        steps={[
          {
            title: 'Order Details',
            icon: <FontAwesomeIcon icon={faEye} />
          }
        ]}
        size="90vw"
        position="center"
        actionButtonLabel="Save"
        content={ModalContent}
      />
  );
};

export default OpenDetailsTableModal;
