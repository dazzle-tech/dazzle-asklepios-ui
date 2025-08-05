import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScissors } from '@fortawesome/free-solid-svg-icons';
const AddEditKits = ({ open, setOpen, width, surgicalKits, setSurgicalKits, handleSave }) => {
  
  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="code"
              record={surgicalKits}
              setRecord={setSurgicalKits}
            />
           <MyInput
              width="100%"
              fieldName="name"
              record={surgicalKits}
              setRecord={setSurgicalKits}
            />
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={surgicalKits?.key ? 'Edit Surgical Kits' : 'New Surgical Kits'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={surgicalKits?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'Surgical Kits Info', icon: <FontAwesomeIcon icon={faScissors} /> }]} 
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditKits;
