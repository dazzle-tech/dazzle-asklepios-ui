import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import Section from '@/components/Section';
import { useGetPreviousClosedEncounterQuery } from '@/services/encounters/patientEncounterService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetPrimaryByEncounterIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useGetIcdDiagnosisByIdQuery } from '@/services/setup/icdTreeService';
import Translate from '@/components/Translate';
const PreviuosVisitData = ({ patient, encounter }) => {
  

  const {
  data: previousEncounter,
} = useGetPreviousClosedEncounterQuery(
  { encounterId: encounter?.id as number },
  { skip: !encounter?.id }
);

const {
    data: primaryDiagnosisForPreviousVisit,
  } = useGetPrimaryByEncounterIdQuery(
    { encounterId: previousEncounter?.id as number },
    { skip: !previousEncounter?.id }
  );

  const {
    data: diagnosisObject,
  } = useGetIcdDiagnosisByIdQuery(
    { id: primaryDiagnosisForPreviousVisit?.diagnosisId as number },
    { skip: !primaryDiagnosisForPreviousVisit?.diagnosisId }
  );
  
  const  encounterReasonEnumQueryResponse = useEnumOptions('EncounterReason');
  
  return (
    <Section
      title={<Translate>Previous Visit</Translate>}
      content={
        <Form disabled layout="inline" fluid>
          <MyInput
            column
            width={140}
            fieldLabel="Visit Date"
            fieldType="date"
            fieldName="encounterDate"
            record={previousEncounter || {}}
          />
          <MyInput
            column
            width={140}
            fieldType="select"
            fieldLabel="Reason  "
            fieldName="encounterReason"
            selectData={encounterReasonEnumQueryResponse ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={previousEncounter || {}}
          />
          

          <MyInput
            column
            width={140}
            fieldLabel="Diagnosis Description"
            fieldName="icdShortDescription"
            record={diagnosisObject || {}}
          />
        </Form>
      }
      setOpen={() => {}}
      rightLink=""
      openedContent=""
    />
  );
};
export default PreviuosVisitData;
