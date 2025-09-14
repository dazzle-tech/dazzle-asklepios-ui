import React from 'react';
import { Divider, Text } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import Section from '@/components/Section';

const RecentTestResults = ({ patient }) => {
  // Table Columns
  const orderColumns = [
    {
      key: 'type',
      title: 'TYPE',
      render: (rowData: any) => <Text>h</Text>
    },
    {
      key: 'name',
      title: 'NAME',
      render: (rowData: any) => <Text>h</Text>
    },
    {
      key: 'resultvalue',
      title: 'Result Value',
      render: (rowData: any) => <Text>h</Text>
    },
    {
      key: 'marker',
      title: 'Marker',
      render: (rowData: any) => <Text>h</Text>
    }
  ];
  return (
    <Section
      isContainOnlyTable
      title="Recent Test Results"
      content={<MyTable data={[]} columns={orderColumns} height={250} onRowClick={rowData => {}} />}
      rightLink="Full view"
      setOpen={() => {}}
      openedContent=""
    />
  );
};
export default RecentTestResults;
