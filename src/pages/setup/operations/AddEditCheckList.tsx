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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      actionButtonLabel={checklist?.key ? 'Save' : 'Create'}
      //   actionButtonFunction={}
      open={open}
      setOpen={setOpen}
      position="right"
      title={checklist?.key ? 'Edit CheckList' : 'New CheckList'}
      content={(stepNumber) => (
        <div dir={dir}>
          {conjureFormContentOfMainModal(stepNumber)}
        </div>
      )}
      steps={[
        {
          title: 'Basic Info',
          icon: <GrTestDesktop />
        }
      ]}
      size={"40vw"}
    />
  );
};
export default AddEditCheckList;
