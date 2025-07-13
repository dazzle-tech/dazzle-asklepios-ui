import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form } from 'rsuite';
import "./styles.less";
const ShowStatusChange = ({
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
      title="Status Change"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default ShowStatusChange;
