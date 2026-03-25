import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
const ProgressNotes = ({ doctorRound, setDoctorRound, doctorRoundList, ...props }) => {
          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Form dir={dir}> 
      <MyInput
        width="100%"
        fieldLabel="Initial Note"
        fieldName="initialNote"
        record={doctorRound}
        setRecord={setDoctorRound}
        disabled={
          !doctorRound?.key ||
          (doctorRoundList?.object?.[0]?.initialNote ?? '') !== '' ||
          props.view
        }
        fieldType="textarea"
      />
      <br />
      <MyInput
        width="100%"
        fieldLabel="Progress Note"
        fieldName="progressNote"
        record={doctorRound}
        setRecord={setDoctorRound}
        disabled={!doctorRound?.key || props.view}
        fieldType="textarea"
      />
      <br />
      <MyInput
        width="100%"
        fieldLabel="Special Event Note"
        fieldName="specialEventNote"
        record={doctorRound}
        setRecord={setDoctorRound}
        disabled={!doctorRound?.key || props.view}
        fieldType="textarea"
      />
    </Form>
  );
};
export default ProgressNotes;
