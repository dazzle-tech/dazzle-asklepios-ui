import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

import { RiRefund2Fill } from "react-icons/ri";

const RefundModal = ({
  open,
  setOpen,
//   width,
  record,
  setRecord,
//   handleSave
}) => {

 

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout='inline'>
            Amount&nbsp;:&nbsp;
            <MyInput
              fieldName="amount"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              width={120}
              showLabel={false}
            />
            /&nbsp;&nbsp;
            <MyInput
              fieldName="currency"
              record={record}
              setRecord={setRecord}
              width={120}
              showLabel={false}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Refund"
      position="center"
      content={conjureFormContent}
      actionButtonLabel='Save'
    //   actionButtonFunction={handleSave}
      steps={[{ title: 'Refund', icon: <RiRefund2Fill size={24}/> }]}
    //   size={width > 600 ? '36vw' : '70vw'}
    size='xs'
    bodyheight="30vh"
    />
  );
};
export default RefundModal;
