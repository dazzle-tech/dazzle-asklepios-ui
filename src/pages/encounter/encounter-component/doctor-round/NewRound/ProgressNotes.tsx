import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
const ProgressNotes = ({ doctorRound, setDoctorRound, doctorRoundList, ...props }) => {
  return (
    <Form>
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
