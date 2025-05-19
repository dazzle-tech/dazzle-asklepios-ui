import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form } from 'rsuite';
import './styles.less';
const AddEditUom = ({
  open,
  setOpen,
  uom,
  width
 
}) => {
  
  
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout='inline'>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={uom?.key ? 'Edit UOM' : 'New UOM'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={uom?.key ? 'Save' : 'Create'}
      size={width > 600 ? '36vw' : '70vw'}
      
    />
  );
};
export default AddEditUom;
