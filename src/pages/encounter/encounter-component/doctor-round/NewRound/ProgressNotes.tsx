import React from 'react';
import { Form } from 'rsuite';
import SpeechToText from '@/components/Speech-to-Text';
const ProgressNotes = ({ doctorRound, setDoctorRound, doctorRoundList }) => {

 
  return (
      <Form>
        <SpeechToText
          width="100%"
          fieldLabel="Initial Note"
          fieldName="initialNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key || (doctorRoundList?.object?.[0]?.initialNote ?? '') !== ''}
        />
        <br/>
        <SpeechToText
          width="100%"
          fieldLabel="Progress Note"
          fieldName="progressNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key}
        />
        <br/>
        <SpeechToText
          width="100%"
          fieldLabel="Special Event Note"
          fieldName="specialEventNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key}
        />
        </Form>
  
  );
};
export default ProgressNotes;
