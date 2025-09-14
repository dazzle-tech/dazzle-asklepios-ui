import React, { useState } from 'react';
import { Divider, Text } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { useGetPatientDiagnosisQuery } from '@/services/encounterService';
import { initialListRequest } from '@/types/types';
import FullViewTable from './FullViewTable';
import Section from '@/components/Section';
const PatientMajorProblem = ({ patient }) => {
  const [open, setOpen] = useState(false);

  // Define a list request state with pagination, sorting, and filters to fetch major diagnoses for a patient
  const [listRequest] = useState({
    ...initialListRequest,
    pageSize: 100, // Limit the number of results to 100
    timestamp: new Date().getMilliseconds(), // Use current timestamp to prevent caching
    sortBy: 'createdAt', // Sort results by creation date
    sortType: 'desc', // Show the most recent first
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key // Filter by the current patient
      },
      {
        fieldName: 'is_major',
        operator: 'match',
        value: true // Only include major diagnoses
      }
    ]
  });

  // Fetch major diagnoses based on the defined request
  const { data: majorDiagnoses } = useGetPatientDiagnosisQuery(listRequest);
  // Extract the diagnoses list from the response
  const majorDiagnosesCodes = majorDiagnoses?.object.map(diagnose => diagnose);
  // Table Columns
  const diagnosesColumns = [
    {
      key: 'icdCode',
      title: 'PROBLEM CODE',
      render: (rowData: any) => rowData.diagnosisObject?.icdCode || ''
    },
    {
      key: 'description',
      title: 'DESCRIPTION',
      render: (rowData: any) => rowData.diagnosisObject?.description || ''
    }
  ];
  return (
    <Section
      isContainOnlyTable
      title="Patient Major Problem"
      content={
        <MyTable
          data={majorDiagnosesCodes ?? []}
          columns={diagnosesColumns}
          height={250}
          onRowClick={rowData => {}}
        />
      }
      setOpen={setOpen}
      rightLink="Full View"
      openedContent={<FullViewTable open={open} setOpen={setOpen} data={majorDiagnosesCodes} />}
    />
  );
};
export default PatientMajorProblem;
