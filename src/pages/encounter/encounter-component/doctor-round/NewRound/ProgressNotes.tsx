import React from 'react';
import { Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
const ProgressNotes = ({ doctorRound, setDoctorRound, doctorRoundList }) => {
  return (
    <Row gutter={30}>
      <Form fluid>
        <MyInput
          width="100%"
          fieldLabel="Initial Note"
          fieldName="initialNote"
          fieldType="textarea"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key || (doctorRoundList?.object?.[0]?.initialNote ?? '') !== ''}
        />
        <MyInput
          width="100%"
          fieldLabel="Progress Note"
          fieldName="progressNote"
          fieldType="textarea"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key}
        />
        <MyInput
          width="100%"
          fieldLabel="Special Event Note"
          fieldName="specialEventNote"
          fieldType="textarea"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key}
        />
      </Form>
    </Row>
  );
};
export default ProgressNotes;
