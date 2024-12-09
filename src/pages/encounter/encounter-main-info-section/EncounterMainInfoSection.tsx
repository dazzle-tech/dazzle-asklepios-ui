import MyInput from '@/components/MyInput';
import { useAppSelector } from '@/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { ApPatientObservationSummary } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetObservationSummariesQuery } from '../../../services/observationService'
import {
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { Form, Input,Text } from 'rsuite';
import 'react-tabs/style/react-tabs.css';

import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';

const EncounterMainInfoSection = ({ patient, encounter }) => {
  const [PatientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>({ ...newApPatientObservationSummary, latestweight: null, latestheight: null, latestheadcircumference: null, latestbmi: null });
  const { data: encounterStatusLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: encounterPymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');
  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
  console.log(patient.key);
  console.log(encounter.key);
 
  const { data: patirntObservationlist } = useGetObservationSummariesQuery({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: "patient_key",
        operator: "match",
        value: patient.key,
      },
      {
        fieldName: "visit_key ",
        operator: "match",
        value:encounter.key,
      }
    ],

  });
  console.log(patirntObservationlist?.object);

  return (
    <Form disabled style={{ zoom: 0.70 }} layout="inline" fluid>
      <MyInput width={150} column fieldLabel="MRN" fieldName={'patientMrn'} record={patient} />
      <MyInput width={150} column fieldLabel="Patient Name" fieldName={'patientFullName'} record={encounter} />
      <MyInput width={150} column fieldName={'documentNo'} record={patient} />
      <MyInput
        width={150}
        column
        fieldLabel="Document Type"
        fieldType="select"
        fieldName="documentTypeLkey"
        selectData={docTypeLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={patient}

        disabled={true}
      />
      <MyInput width={150} column fieldLabel="Age" fieldName={'age'} record={patirntObservationlist?.object[0]} />
      <MyInput
        width={150}
        column
        fieldLabel="Sex at Birth"
        fieldType="select"
        fieldName="genderLkey"
        selectData={genderLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={patient}

        disabled={true}
      />
      <MyInput width={150} column fieldLabel="Weight" fieldName={'latestweight'} record={patirntObservationlist?.object[0]} />
      <MyInput width={150} column fieldLabel="Height" fieldName={'latestheight'} record={patirntObservationlist?.object[0]} />
      <MyInput width={150} column fieldLabel="H.C" fieldName={'latestheadcircumference'} record={patirntObservationlist?.object[0]} />
      <MyInput width={150} column fieldLabel="BMI" fieldName={'latestbmi'} record={patirntObservationlist?.object[0]} />
      <MyInput width={150} column fieldLabel="Blood Group" fieldName={'patientFullName'} record={patirntObservationlist?.object[0]} />
     <div style={{display:'flex',flexDirection:'column'}}>
      <Text>BSA</Text>
      <Input disabled value={Math.sqrt((patirntObservationlist?.object?.[0]?.latestweight *patirntObservationlist?.object?.[0]?. latestheight) / 3600).toFixed(2)}  style={{ width: 150 }}/>
      </div>
      

    

      <br />
      <MyInput
        column
        width={150}
        fieldLabel="Visit Date"
        fieldType="date"
        fieldName="plannedStartDate"
        record={encounter}
      />

      {//when add booking date field in database add it here
      }
      <MyInput
        column
        width={150}
        fieldLabel="Booking source"
        fieldName="bookingsource"
        record={encounter}
      />
      <MyInput
        column
        width={150}
        fieldLabel="Booking Date"
        fieldType="date"
        fieldName="plannedStartDate"
        record={encounter}
      />

      <MyInput
        column
        width={150}
        fieldType="select"
        fieldLabel="Visit Type"
        fieldName="encounterTypeLkey"
        selectData={encounterTypeLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={encounter}
      />
      <MyInput
        width={150}
        column
        fieldType="select"
        fieldLabel="Priority"
        fieldName="encounterPriorityLkey"
        selectData={encounterPriorityLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={encounter}
      />
      <MyInput
        width={150}
        column
        fieldType="select"
        fieldLabel="Reason"
        fieldName="encounterReasonLkey"
        selectData={encounterReasonLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={encounter}
      />
      <MyInput
        width={150}
        column
        fieldType="select"
        fieldLabel="Payment Type"
        fieldName="paymentTypeLkey"
        selectData={encounterPymentMethodLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={encounter}
      />

    </Form>
  );
};

export default EncounterMainInfoSection;
