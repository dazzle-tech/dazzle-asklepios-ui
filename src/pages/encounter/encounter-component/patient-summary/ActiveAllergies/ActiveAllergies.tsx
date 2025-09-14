import React from 'react';
import { Divider } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { useGetAllergensQuery } from '@/services/setupService';
import { useGetAllergiesQuery } from '@/services/observationService';
import { initialListRequest } from '@/types/types';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
const ActiveAllergies = ({ patient }) => {
  // Define filters to fetch allergies specific to a patient and with a certain status
  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patient?.key // Match allergies for the selected patient
    },
    {
      fieldName: 'status_lkey',
      operator: 'Match', // Match allergies with the specified status key
      value: '9766169155908512'
    }
  ];

  // Fetch allergies based on the defined filters
  const { data: allergiesListResponse, isLoading: isLoading } = useGetAllergiesQuery({
    ...initialListRequest,
    filters
  });

  // Fetch the list of all allergens (used to get allergen names)
  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });

  // Table Columns
  const allergyColumns = [
    {
      key: 'allergyType',
      title: 'ALLERGY TYPE',
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale || ''
    },
    {
      key: 'allergen',
      title: 'ALLERGENE',
      render: (rowData: any) => {
        const allergen = allergensListToGetName?.object?.find(
          item => item.key === rowData.allergenKey
        );
        return allergen?.allergenName || '';
      }
    },
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
      title="Active Allergies"
      content={
        <MyTable
          data={allergiesListResponse?.object || []}
          columns={allergyColumns}
          height={250}
          loading={isLoading}
          onRowClick={rowData => {}}
        />
      }
      rightLink=""
      openedContent=""
      setOpen={() => {}}
    />
  );
};
export default ActiveAllergies;
