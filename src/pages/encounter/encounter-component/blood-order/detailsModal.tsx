import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
const DetailsModal = ({
  open,
  setOpen,
  width,
}) => {

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
          
          </Form>
        );
    }
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Details"
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      hideActionBtn
      steps={[{ title: 'Details', icon:<FontAwesomeIcon icon={faCircleInfo} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default DetailsModal;
