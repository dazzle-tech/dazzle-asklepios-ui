import React from 'react';
import { Divider, Text } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import Section from '@/components/Section';

const IntakeOutputs = ({ patient }) => {
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
      key: 'amount',
      title: 'Amount',
      render: (rowData: any) => <Text>h</Text>
    },
    {
      key: 'dateTime',
      title: 'Date Time',
      render: (rowData: any) => <Text>h</Text>
    }
  ];
  return (
    <Section
      title="Intake Outputs"
      content={<MyTable data={[]} columns={orderColumns} height={250} onRowClick={rowData => {}} />}
      rightLink="Full view"
      setOpen={() => {}}
      openedContent=""
    />
  );
};
export default IntakeOutputs;
