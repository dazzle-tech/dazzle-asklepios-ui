import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { GrScheduleNew } from 'react-icons/gr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import WoundCare from './WoundCare';
const WoundCareModal = ({ open, setOpen, object, setObject, width }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return <WoundCare object={object} setObject={setObject} />;
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Tracking"
      position="center"
      content={conjureFormContent}
      hideActionBtn
      steps={[
        {
          title: 'Tracking',
          icon: (
            <FontAwesomeIcon
              icon={faEye}
            />
          )
        }
      ]}
      size={width > 600 ? '70vw' : '90vw'}
    />
  );
};
export default WoundCareModal;
