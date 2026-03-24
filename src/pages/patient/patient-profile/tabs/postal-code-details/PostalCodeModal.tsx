import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import PostalTable from './PostalTable';

const PostalCodeModal = ({ open, setOpen, onSelect }) => {
  const ModalContent = (
    <div>
      <PostalTable onRowClick={(row) => {
        onSelect(row.postalCode);
        setOpen(false);
      }} />
    </div>
  );

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Select Postal Code"
      steps={[
        {
          title: 'Postal Selection',
          icon: <FontAwesomeIcon icon={faEye} />
        }
      ]}
      size="60vw"
      position="center"
      actionButtonLabel="Select"
      content={ModalContent}
    />
    </div>
  );
};

export default PostalCodeModal;
