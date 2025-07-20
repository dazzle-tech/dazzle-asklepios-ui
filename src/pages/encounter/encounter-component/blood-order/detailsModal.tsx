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
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Details"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      steps={[{ title: 'Details', icon:<FontAwesomeIcon icon={faCircleInfo} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default DetailsModal;
