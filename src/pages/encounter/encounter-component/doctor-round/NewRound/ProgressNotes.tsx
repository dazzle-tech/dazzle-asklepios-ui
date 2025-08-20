import React from 'react';
import { Form } from 'rsuite';
import SpeechToText from '@/components/Speech-to-Text';
const ProgressNotes = ({ doctorRound, setDoctorRound, doctorRoundList, ...props }) => {

 
  return (
      <Form>
        <SpeechToText
          width="100%"
          fieldLabel="Initial Note"
          fieldName="initialNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key || (doctorRoundList?.object?.[0]?.initialNote ?? '') !== '' || props.view}
        />
        <br/>
        <SpeechToText
          width="100%"
          fieldLabel="Progress Note"
          fieldName="progressNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key || props.view}
        />
        <br/>
        <SpeechToText
          width="100%"
          fieldLabel="Special Event Note"
          fieldName="specialEventNote"
          record={doctorRound}
          setRecord={setDoctorRound}
          disabled={!doctorRound?.key || props.view}
        />
        </Form>
  
  );
};
export default ProgressNotes;
