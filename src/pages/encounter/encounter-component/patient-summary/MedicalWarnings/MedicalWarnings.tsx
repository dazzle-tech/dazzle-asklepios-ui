import React from 'react';
import { Divider } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { useGetWarningsQuery } from '@/services/observationService';
import { initialListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
const MedicalWarnings = ({ patient }) => {
  // Define filters to retrieve warnings for a specific patient with a certain status
  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patient?.key // Filter warnings by the selected patient key
    },
    {
      fieldName: 'status_lkey',
      operator: 'Match', // Filter warnings by a specific status key
      value: '9766169155908512'
    }
  ];

  // Fetch warnings based on the defined filters
  const { data: warningsListResponse, isLoading: isLoading } = useGetWarningsQuery({
    ...initialListRequest,
    filters
  });

  // Table Columns
  const warningsColumns = [
    {
      key: 'warningType',
      title: 'Warning Type',
      render: (rowData: any) => rowData.warningTypeLvalue?.lovDisplayVale || ''
    },
    {
      key: 'warning',
      title: 'Warning',
      render: (rowData: any) => rowData.warning || ''
    },
    ,
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    }
  ];
  return (
    <Section
      isContainOnlyTable
      title="Medical Warnings"
      content={
        <MyTable
          data={warningsListResponse?.object || []}
          columns={warningsColumns}
          height={250}
          loading={isLoading}
          onRowClick={rowData => {}}
        />
      }
      rightLink=""
      setOpen={() => {}}
      openedContent=""
    />
  );
};
export default MedicalWarnings;
