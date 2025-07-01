import React from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
const AddEditCheckList = ({ open, setOpen, checklist, setChecklist, width }) => {
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldLabel="Operation"
              fieldName="operationName"
              fieldType="select"
              selectData={[]}
              selectDataLabel=""
              selectDataValue=""
              record={checklist}
              setRecord={setChecklist}
            />
            <MyInput
              width="100%"
              fieldLabel="Checklist"
              fieldName="checkListName"
              record={checklist}
              setRecord={setChecklist}
            />
          </Form>
        );
    }
  };
  // Effects

  return (
    <MyModal
      actionButtonLabel={checklist?.key ? 'Save' : 'Create'}
      //   actionButtonFunction={}
      open={open}
      setOpen={setOpen}
      position="right"
      title={checklist?.key ? 'Edit CheckList' : 'New CheckList'}
      content={conjureFormContentOfMainModal}
      steps={[
        {
          title: 'Basic Info',
          icon: <GrTestDesktop />
        }
      ]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditCheckList;
