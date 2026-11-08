import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import React from 'react';
import { Form, Text } from 'rsuite';

type ProcedureVitalsFieldsProps = {
  title: string;
  record: any;
  setRecord: (record: any) => void;
};

const FIELDS = [
  { fieldName: 'bloodPressureSystolic', fieldLabel: 'BP Systolic', rightAddon: 'mmHg' },
  { fieldName: 'bloodPressureDiastolic', fieldLabel: 'BP Diastolic', rightAddon: 'mmHg' },
  { fieldName: 'heartRate', fieldLabel: 'Heart Rate', rightAddon: 'bpm' },
  { fieldName: 'temperature', fieldLabel: 'Temperature', rightAddon: '°C', allowDecimal: true },
  { fieldName: 'oxygenSaturation', fieldLabel: 'SpO2', rightAddon: '%' }
];

const ProcedureVitalsFields: React.FC<ProcedureVitalsFieldsProps> = ({
  title,
  record,
  setRecord
}) => (
  <SectionContainer
    title={<Text>{title}</Text>}
    content={
      <Form fluid>
        <div className="procedure-field-grid is-vitals">
          {FIELDS.map(field => (
            <MyInput
              key={field.fieldName}
              width="100%"
              fieldType="number"
              record={record}
              setRecord={setRecord}
              {...field}
            />
          ))}
        </div>
        <div className="procedure-hint">Saved with this step using Save at the bottom.</div>
      </Form>
    }
  />
);

export default ProcedureVitalsFields;
