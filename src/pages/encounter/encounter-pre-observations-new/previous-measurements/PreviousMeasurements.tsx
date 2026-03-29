import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './styles.less';

import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form, Panel } from 'rsuite';

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { formatDate } from '@/utils';

// BODY APIs
import {
  useGetBodyMeasurementsBetweenDatesByPatientIdQuery,
  useLazyGetWeightListByPatientBetweenDatesQuery,
  useLazyGetHeightListByPatientBetweenDatesQuery,
  type BodyMeasurementsResponseVM,
  type WeightResponseVM,
  type HeightResponseVM,
} from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';

// VITAL APIs
import {
  useGetVitalSignsBetweenDatesByPatientIdQuery,
  useLazyGetTemperatureListByPatientBetweenDatesQuery,
  useLazyGetPulseRateListByPatientBetweenDatesQuery,
  useLazyGetRespiratoryRateListByPatientBetweenDatesQuery,
  useLazyGetOxygenSaturationListByPatientBetweenDatesQuery,
  useLazyGetBloodPressureListByPatientBetweenDatesQuery,
  type VitalSignsResponseVM,
  type TemperatureResponseVM,
  type PulseRateResponseVM,
  type RespiratoryRateResponseVM,
  type OxygenSaturationResponseVM,
  type BloodPressureResponseVM,
} from '@/services/medicalsheetsEncounter/observations/vitalSignsService';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface PreviousMeasurementsProps {
  patient?: { id?: number };
}

type BodyMetricKey = 'weight' | 'height';
type VitalMetricKey =
  | 'temperature'
  | 'pulseRate'
  | 'respiratoryRate'
  | 'oxygenSaturation'
  | 'bloodPressure';

type SelectedMetric =
  | { source: 'body'; key: BodyMetricKey }
  | { source: 'vital'; key: VitalMetricKey };

// -------- date helpers (IMPORTANT: include entire day) --------
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};


const toInstantIso = (date: Date) => date.toISOString();

//  date+time formatter (uses your existing formatDate and adds time)
const formatDateTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PreviousMeasurements: React.FC<PreviousMeasurementsProps> = ({ patient: patientProp }) => {
  const location = useLocation();
  const patientFromLocation = (location.state as any)?.patient;
  const patient = patientProp ?? patientFromLocation;

  const patientId = Number(patient?.id);

  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);

    return {
      fromDate: startOfDay(from),
      toDate: endOfDay(now),
    };
  });

  const fromIso = useMemo(() => toInstantIso(startOfDay(dateFilter.fromDate)), [dateFilter.fromDate]);

  const toIso = useMemo(() => toInstantIso(endOfDay(dateFilter.toDate)), [dateFilter.toDate]);

  // ------------------ BODY TABLE (Page) ------------------
  const [bodyTableReq, setBodyTableReq] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc',
  });

  const {
    data: bodyPage,
    isLoading: bodyLoading,
    isFetching: bodyFetching,
  } = useGetBodyMeasurementsBetweenDatesByPatientIdQuery(
    patientId
      ? {
          patientId,
          from: fromIso,
          to: toIso,
          page: bodyTableReq.page,
          size: bodyTableReq.size,
          sort: bodyTableReq.sort,
        }
      : (undefined as any),
    { skip: !patientId }
  );

// BODY
const bodyRows: BodyMeasurementsResponseVM[] =
  Array.isArray(bodyPage) ? bodyPage : bodyPage?.content ?? [];

const bodyTotal =
  Array.isArray(bodyPage) ? bodyPage.length : bodyPage?.totalElements ?? 0;

  // ------------------ VITAL TABLE (Page) ------------------
  const [vitalTableReq, setVitalTableReq] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc',
  });

  const {
    data: vitalPage,
    isLoading: vitalLoading,
    isFetching: vitalFetching,
  } = useGetVitalSignsBetweenDatesByPatientIdQuery(
    patientId
      ? {
          patientId,
          from: fromIso,
          to: toIso,
          page: vitalTableReq.page,
          size: vitalTableReq.size,
          sort: vitalTableReq.sort,
        }
      : (undefined as any),
    { skip: !patientId }
  );

// VITAL
const vitalRows: VitalSignsResponseVM[] =
  Array.isArray(vitalPage) ? vitalPage : vitalPage?.content ?? [];

const vitalTotal =
  Array.isArray(vitalPage) ? vitalPage.length : vitalPage?.totalElements ?? 0;
  // ------------------ Chart metric selection ------------------
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetric | null>(null);

  const [triggerWeightList, weightListRes] = useLazyGetWeightListByPatientBetweenDatesQuery();
  const [triggerHeightList, heightListRes] = useLazyGetHeightListByPatientBetweenDatesQuery();

  const [triggerTempList, tempListRes] = useLazyGetTemperatureListByPatientBetweenDatesQuery();
  const [triggerPulseList, pulseListRes] = useLazyGetPulseRateListByPatientBetweenDatesQuery();
  const [triggerRespList, respListRes] = useLazyGetRespiratoryRateListByPatientBetweenDatesQuery();
  const [triggerOxyList, oxyListRes] = useLazyGetOxygenSaturationListByPatientBetweenDatesQuery();
  const [triggerBpList, bpListRes] = useLazyGetBloodPressureListByPatientBetweenDatesQuery();

  useEffect(() => {
    if (!patientId || !selectedMetric) return;

    const args = { patientId, from: fromIso, to: toIso };

    if (selectedMetric.source === 'body') {
      if (selectedMetric.key === 'weight') triggerWeightList(args);
      if (selectedMetric.key === 'height') triggerHeightList(args);
    } else {
      if (selectedMetric.key === 'temperature') triggerTempList(args);
      if (selectedMetric.key === 'pulseRate') triggerPulseList(args);
      if (selectedMetric.key === 'respiratoryRate') triggerRespList(args);
      if (selectedMetric.key === 'oxygenSaturation') triggerOxyList(args);
      if (selectedMetric.key === 'bloodPressure') triggerBpList(args);
    }
  }, [
    patientId,
    selectedMetric,
    fromIso,
    toIso,
    triggerWeightList,
    triggerHeightList,
    triggerTempList,
    triggerPulseList,
    triggerRespList,
    triggerOxyList,
    triggerBpList,
  ]);

  // ------------------ filters UI ------------------
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="From"
        fieldName="fromDate"
        record={dateFilter}
        setRecord={setDateFilter}
      />
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="To"
        fieldName="toDate"
        record={dateFilter}
        setRecord={setDateFilter}
      />
    </Form>
  );

  const clickableHeader = (metric: SelectedMetric, label: string) => (
    <span
      className="link"
      style={{ cursor: 'pointer', color: '#007bff' }}
      onClick={() => setSelectedMetric(metric)}
    >
      {label}
    </span>
  );

  // ------------------ BODY TABLE columns ------------------
  const bodyColumns = [
    {
      key: 'createdAt',
      title: 'CREATED AT',
      render: (row: any) => {
        const v = row?.createdAt ?? row?.createdDate;
        return v ? formatDateTime(new Date(v)) : '';
      },
    },
    {
      key: 'weight',
      title: clickableHeader({ source: 'body', key: 'weight' }, 'WEIGHT (kg)'),
      dataKey: 'weight',
    },
    {
      key: 'height',
      title: clickableHeader({ source: 'body', key: 'height' }, 'HEIGHT (cm)'),
      dataKey: 'height',
    },
  ];

  // ------------------ VITAL TABLE columns ------------------
  const vitalColumns = [
    {
      key: 'createdAt',
      title: 'CREATED AT',
      render: (row: any) => {
        const v = row?.createdAt ?? row?.createdDate;
        return v ? formatDateTime(new Date(v)) : '';
      },
    },
    {
      key: 'temperature',
      title: clickableHeader({ source: 'vital', key: 'temperature' }, 'TEMPERATURE (C)'),
      dataKey: 'temperature',
    },
    {
      key: 'pulseRate',
      title: clickableHeader({ source: 'vital', key: 'pulseRate' }, 'PULSE RATE (bpm)'),
      dataKey: 'pulseRate',
    },
    {
      key: 'respiratoryRate',
      title: clickableHeader(
        { source: 'vital', key: 'respiratoryRate' },
        'RESPIRATORY RATE (bpm)'
      ),
      dataKey: 'respiratoryRate',
    },
    {
      key: 'bloodPressure',
      title: clickableHeader(
        { source: 'vital', key: 'bloodPressure' },
        'BLOOD PRESSURE (mmHg) (X\\Y)'
      ),
      render: (row: VitalSignsResponseVM) => {
        if (row.bloodPressureSystolic == null || row.bloodPressureDiastolic == null) return '';
        return `${row.bloodPressureSystolic}/${row.bloodPressureDiastolic}`;
      },
    },
    {
      key: 'oxygenSaturation',
      title: clickableHeader({ source: 'vital', key: 'oxygenSaturation' }, 'OXYGEN SATURATION (%)'),
      dataKey: 'oxygenSaturation',
    },
  ];

  // ------------------ Chart data (x=createdAt, y=value) ------------------
  const chartData = useMemo(() => {
    if (!selectedMetric) return null;

    const makeLabels = (arr: { createdAt: string }[]) =>
      arr.map(x => formatDateTime(new Date(x.createdAt)));

    if (selectedMetric.source === 'body') {
      if (selectedMetric.key === 'weight') {
        const list = (weightListRes.data ?? []) as WeightResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Weight (kg)',
              data: list.map(x => x.weight ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }
      if (selectedMetric.key === 'height') {
        const list = (heightListRes.data ?? []) as HeightResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Height (cm)',
              data: list.map(x => x.height ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }
    } else {
      if (selectedMetric.key === 'temperature') {
        const list = (tempListRes.data ?? []) as TemperatureResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Temperature (C)',
              data: list.map(x => x.temperature ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }

      if (selectedMetric.key === 'pulseRate') {
        const list = (pulseListRes.data ?? []) as PulseRateResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Pulse Rate (bpm)',
              data: list.map(x => x.pulseRate ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }

      if (selectedMetric.key === 'respiratoryRate') {
        const list = (respListRes.data ?? []) as RespiratoryRateResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Respiratory Rate (bpm)',
              data: list.map(x => x.respiratoryRate ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }

      if (selectedMetric.key === 'oxygenSaturation') {
        const list = (oxyListRes.data ?? []) as OxygenSaturationResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Oxygen Saturation (%)',
              data: list.map(x => x.oxygenSaturation ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }

      if (selectedMetric.key === 'bloodPressure') {
        const list = (bpListRes.data ?? []) as BloodPressureResponseVM[];
        return {
          labels: makeLabels(list),
          datasets: [
            {
              label: 'Systolic (mmHg)',
              data: list.map(x => x.systolic ?? null),
              tension: 0.3,
              fill: true,
            },
            {
              label: 'Diastolic (mmHg)',
              data: list.map(x => x.diastolic ?? null),
              tension: 0.3,
              fill: true,
            },
          ],
        };
      }
    }

    return null;
  }, [
    selectedMetric,
    weightListRes.data,
    heightListRes.data,
    tempListRes.data,
    pulseListRes.data,
    respListRes.data,
    oxyListRes.data,
    bpListRes.data,
  ]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { title: { display: true, text: 'Created At' } },
      y: { title: { display: true, text: 'Reading' } },
    },
  };

  useEffect(() => {
    setBodyTableReq(prev => ({ ...prev, page: 0 }));
    setVitalTableReq(prev => ({ ...prev, page: 0 }));
  }, [fromIso, toIso]);


  // ------------------ render ------------------

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      {filters()}

      <div className="pm-grid margin-top-20">
        <div className="pm-col">
          <h4 className="font-size-14">Body Measurements</h4>
          <MyTable
            height={280}
            data={bodyRows}
            columns={bodyColumns}
            loading={bodyLoading || bodyFetching}
            page={bodyTableReq.page}
            rowsPerPage={bodyTableReq.size}
            totalCount={bodyTotal}
            onPageChange={(_, newPage: number) =>
              setBodyTableReq(prev => ({ ...prev, page: Math.max(0, newPage) }))
            }
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newSize = parseInt(e.target.value, 10) || 5;
              setBodyTableReq(prev => ({ ...prev, size: newSize, page: 0 }));
            }}
            sortColumn={undefined}
            sortType={undefined}
            onSortChange={() => {}}
          />
        </div>

        <div className="pm-col">
          <h4 className="font-size-14">Vital Signs</h4>
          <MyTable
            height={280}
            data={vitalRows}
            columns={vitalColumns}
            loading={vitalLoading || vitalFetching}
            page={vitalTableReq.page}
            rowsPerPage={vitalTableReq.size}
            totalCount={vitalTotal}
            onPageChange={(_, newPage: number) =>
              setVitalTableReq(prev => ({ ...prev, page: Math.max(0, newPage) }))
            }
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newSize = parseInt(e.target.value, 10) || 5;
              setVitalTableReq(prev => ({ ...prev, size: newSize, page: 0 }));
            }}
            sortColumn={undefined}
            sortType={undefined}
            onSortChange={() => {}}
          />
        </div>
      </div>

      {selectedMetric && chartData && (
        <div className="margin-top-100">
          <h4 className="font-size-14">
            {selectedMetric.source === 'vital' && selectedMetric.key === 'bloodPressure'
              ? 'Blood Pressure Trend'
              : `${selectedMetric.source === 'body' ? 'Body' : 'Vital'} - ${selectedMetric.key} Trend`}
          </h4>

          <Line
            data={chartData as any}
            options={{ ...chartOptions, maintainAspectRatio: false } as any}
            height={'300px'}
          />
        </div>
      )}
    </Panel>
  );
};

export default PreviousMeasurements;