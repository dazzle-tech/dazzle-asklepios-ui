import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { GrTestDesktop } from 'react-icons/gr';
import { LuTestTubes } from 'react-icons/lu';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
const LinkCheckList = ({ open, setOpen, checklist, setChecklist, width }) => {
  const dispatch = useAppDispatch();

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
            <MyInput
              width="100%"
              fieldName=""
              record=""
              setRecord=""
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
      title={checklist?.key ? 'Edit Diagnostic Test' : 'New Diagnostic Test'}
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
export default LinkCheckList;
