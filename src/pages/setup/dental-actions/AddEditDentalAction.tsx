import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import { FaTooth } from "react-icons/fa";
const AddEditDentalAction = ({ open, setOpen, width, dentalAction, setDentalAction, handleSave }) => {
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput width="100%" fieldName="description" record={dentalAction} setRecord={setDentalAction} />
            <MyInput
            width="100%"
              fieldName="type"
              fieldType="select"
              selectData={[
                { label: 'Treatment', value: 'treatment' },
                { label: 'Condition', value: 'condition' }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
              record={dentalAction}
              setRecord={setDentalAction}
            />
            <MyInput width="100%" fieldName="imageName" record={dentalAction} setRecord={setDentalAction} />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={dentalAction?.key ? 'Edit Dental Action' : 'New Dental Action'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={dentalAction?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Dental Action Info', icon: <FaTooth /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditDentalAction;
