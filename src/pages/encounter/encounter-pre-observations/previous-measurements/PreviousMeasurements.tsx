import React from 'react';
import './styles.less';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
const PreviousMeasurements = ({ patient }) => {
  const [dateFilter, setDateFilter] = React.useState('');

  const filters = () => {
    return (
       <Form layout="inline" fluid >
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="Date"
        fieldName="date"
        record={dateFilter}
        setRecord={setDateFilter}
      />
    </Form>
    );
  };

  const columns = [
    { key: 'date', title: 'Date', dataKey: 'date' },
    { key: 'weight', title: 'Weight', dataKey: 'weight' },
    { key: 'height', title: 'Height', dataKey: 'height' },
    { key: 'temperature', title: 'Temperature', dataKey: 'temperature' },
    { key: 'pulseRate', title: 'Pulse Rate', dataKey: 'pulseRate' },
    { key: 'bloodPressure', title: 'Blood Pressure', dataKey: 'bloodPressure' },
    { key: 'bloodGlucose', title: 'Blood Glucose', dataKey: 'bloodGlucose' },
    { key: 'oxygenSaturation', title: 'Oxygen Saturation', dataKey: 'oxygenSaturation' },
  ];

  return (
    <div>
      <MyTable
        data={[]}
        columns={columns}
        filters={filters()} />
    </div>
  );
};

export default PreviousMeasurements;