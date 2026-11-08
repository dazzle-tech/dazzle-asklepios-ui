import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useAddProcedureVitalMonitoringMutation,
  useDeleteProcedureVitalMonitoringMutation,
  useGetProcedureVitalMonitoringQuery
} from '@/services/patients/patientProcedureService';
import { notify } from '@/utils/uiReducerActions';
import { faClock, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, Form, Text } from 'rsuite';
import { isClosedStatus, toTimeValue } from '../procedureHelpers';
import ProcedureVitalChart from './ProcedureVitalChart';

const FIELDS = [
  { fieldName: 'heartRate', fieldLabel: 'Heart Rate', rightAddon: 'bpm' },
  { fieldName: 'oxygenSaturation', fieldLabel: 'SpO2', rightAddon: '%' },
  { fieldName: 'bloodPressureSystolic', fieldLabel: 'BP Systolic', rightAddon: 'mmHg' },
  { fieldName: 'bloodPressureDiastolic', fieldLabel: 'BP Diastolic', rightAddon: 'mmHg' },
  { fieldName: 'respiratoryRate', fieldLabel: 'Resp. Rate', rightAddon: 'bpm' },
  { fieldName: 'temperature', fieldLabel: 'Temperature', rightAddon: '°C', allowDecimal: true },
  { fieldName: 'etco2', fieldLabel: 'EtCO2', rightAddon: 'mmHg' },
  { fieldName: 'fluidsGiven', fieldLabel: 'Fluids Given', rightAddon: 'mL' },
  { fieldName: 'urineOutput', fieldLabel: 'Urine Output', rightAddon: 'mL' }
];

const hasValue = (value: any) => value !== null && value !== undefined && value !== '';

const LiveClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="procedure-clock">
      <FontAwesomeIcon icon={faClock} />
      {toTimeValue(now.toISOString())}
    </span>
  );
};

/** Readings taken during the procedure; each one is stamped and saved when it is added. */
const ProcedureVitalMonitoring = ({ procedure }) => {
  const dispatch = useAppDispatch();
  const [reading, setReading] = useState<any>({});
  const [view, setView] = useState<'table' | 'chart'>('table');

  const { data: readings = [] } = useGetProcedureVitalMonitoringQuery(procedure?.id, {
    skip: !procedure?.id
  });
  const [addReading, { isLoading }] = useAddProcedureVitalMonitoringMutation();
  const [deleteReading] = useDeleteProcedureVitalMonitoringMutation();

  const newestFirst = readings.map((row, index) => ({ ...row, order: index + 1 })).reverse();
  const isOpen = !isClosedStatus(procedure?.status);
  const canAdd = FIELDS.some(({ fieldName }) => hasValue(reading[fieldName]));

  const handleAdd = async () => {
    try {
      await addReading({
        id: procedure.id,
        body: { ...reading, recordedAt: new Date().toISOString() }
      }).unwrap();
      setReading({});
    } catch {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  const handleDelete = async (row: any) => {
    try {
      await deleteReading({ id: procedure.id, readingId: row.id }).unwrap();
    } catch {
      dispatch(notify({ msg: 'Delete failed', sev: 'error' }));
    }
  };

  const columns = [
    {
      key: 'order',
      title: <Translate>#</Translate>,
      render: (rowData: any) => <span className="procedure-order">{rowData.order}</span>
    },
    {
      key: 'recordedAt',
      title: <Translate>Time</Translate>,
      render: (rowData: any) => toTimeValue(rowData.recordedAt)
    },
    {
      key: 'heartRate',
      title: <Translate>HR (bpm)</Translate>,
      render: (rowData: any) => rowData.heartRate
    },
    {
      key: 'oxygenSaturation',
      title: <Translate>SpO2 (%)</Translate>,
      render: (rowData: any) => rowData.oxygenSaturation
    },
    {
      key: 'bloodPressure',
      title: <Translate>BP (mmHg)</Translate>,
      render: (rowData: any) =>
        `${rowData.bloodPressureSystolic ?? '-'} / ${rowData.bloodPressureDiastolic ?? '-'}`
    },
    {
      key: 'respiratoryRate',
      title: <Translate>RR (bpm)</Translate>,
      render: (rowData: any) => rowData.respiratoryRate
    },
    {
      key: 'temperature',
      title: <Translate>Temp (°C)</Translate>,
      render: (rowData: any) => rowData.temperature
    },
    {
      key: 'etco2',
      title: <Translate>EtCO2 (mmHg)</Translate>,
      render: (rowData: any) => rowData.etco2
    },
    {
      key: 'fluidsGiven',
      title: <Translate>Fluids (mL)</Translate>,
      render: (rowData: any) => rowData.fluidsGiven
    },
    {
      key: 'urineOutput',
      title: <Translate>Urine (mL)</Translate>,
      render: (rowData: any) => rowData.urineOutput
    },
    {
      key: 'delete',
      title: <Translate>Delete</Translate>,
      render: (rowData: any) => (
        <FontAwesomeIcon
          icon={faTrash}
          color="red"
          style={{ cursor: 'pointer' }}
          onClick={() => handleDelete(rowData)}
        />
      )
    }
  ];

  return (
    <SectionContainer
      title={<Text>Vital Monitoring</Text>}
      action={isOpen && <LiveClock />}
      content={
        <>
          {isOpen && (
            <Form fluid>
              <div className="procedure-field-grid is-compact">
                {FIELDS.map(field => (
                  <MyInput
                    key={field.fieldName}
                    width="100%"
                    fieldType="number"
                    record={reading}
                    setRecord={setReading}
                    {...field}
                  />
                ))}
              </div>
              <div className="procedure-section-action">
                <span className="procedure-hint">
                  Each reading is saved with the clock time when you add it.
                </span>
                <MyButton
                  appearance="ghost"
                  disabled={!canAdd}
                  loading={isLoading}
                  onClick={handleAdd}
                >
                  Add Reading
                </MyButton>
              </div>
            </Form>
          )}
          {readings.length > 0 && (
            <>
              <div className="procedure-view-toggle">
                <ButtonGroup size="sm">
                  <Button active={view === 'table'} onClick={() => setView('table')}>
                    Table
                  </Button>
                  <Button active={view === 'chart'} onClick={() => setView('chart')}>
                    Chart
                  </Button>
                </ButtonGroup>
              </div>
              {view === 'table' ? (
                <MyTable height="25vh" data={newestFirst} columns={columns} />
              ) : (
                <ProcedureVitalChart readings={readings} />
              )}
            </>
          )}
        </>
      }
    />
  );
};

export default ProcedureVitalMonitoring;
