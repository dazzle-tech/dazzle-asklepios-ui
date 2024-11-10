import MyInput from '@/components/MyInput';
import { useAppSelector } from '@/hooks';
import React from 'react';
import { Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';

const EncounterMainInfoSection = ({ patient, encounter }) => {
  const { data: encounterStatusLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });

  return (
    <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid>
      <MyInput width={100} column fieldLabel="MRN" fieldName={'patientMrn'} record={patient} />
      <MyInput column fieldLabel="Patient Name" fieldName={'patientFullName'} record={encounter} />
      <MyInput width={150} column fieldName={'documentNo'} record={patient} />
      <MyInput width={60} column fieldLabel="Age" fieldName={'patientAge'} record={encounter} />
      <MyInput
        width={100}
        column
        fieldLabel="Gender"
        fieldName={patient.genderLvalue ? 'lovDisplayVale' : 'genderLkey'}
        record={patient.genderLvalue ? patient.genderLvalue : patient}
      />
      <MyInput
        column
        width={150}
        fieldLabel="Visit Date"
        fieldType="date"
        fieldName="plannedStartDate"
        record={encounter}
      />
      <MyInput
        width={150}
        column
        fieldType="select"
        fieldLabel="Status"
        fieldName="encounterStatusLkey"
        selectData={encounterStatusLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
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
        width={200}
        column
        fieldType="select"
        fieldName="departmentKey"
        selectData={departmentListResponse?.object ?? []}
        selectDataLabel="name"
        selectDataValue="key"
        record={encounter}
      />
    </Form>
  );
};

export default EncounterMainInfoSection;
