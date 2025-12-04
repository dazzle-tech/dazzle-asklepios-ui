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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { useGetObservationSummariesQuery } from '@/services/observationService';
import { ApPatientObservationSummary } from '@/types/model-types';
import { addFilterToListRequest, formatDate } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface PreviousMeasurementsProps {
  patient?: {
    key?: string;
  };
}

const PreviousMeasurements: React.FC<PreviousMeasurementsProps> = ({ patient: patientProp }) => {
  const location = useLocation();
  const patientFromLocation = (location.state as any)?.patient;

  const patient = patientProp ?? patientFromLocation;

  // ---------- date filter: default = last 1 month ----------
  const [dateFilter, setDateFilter] = useState(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(toDate.getMonth() - 1);
    return { fromDate, toDate };
  });

  // ---------- ListRequest (same pattern as EncounterList) ----------
  const [listRequest, setListRequest] = useState<ListRequest>(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(toDate.getMonth() - 1);
    const formattedFrom = formatDate(fromDate);
    const formattedTo = formatDate(toDate);

    return {
      ...initialListRequest,
      ignore: true,
      pageNumber: 1,
      pageSize: 5,
      filters: [
        {
          fieldName: 'patient_key', // DB column
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'last_date',
          operator: 'between',
          value: `${formattedFrom}_${formattedTo}`
        }
      ]
    };
  });

  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  const {
    data: observationListResponse,
    isLoading,
    isFetching
  } = useGetObservationSummariesQuery(listRequest, {
    skip: !patient?.key
  });

  const dataRows: ApPatientObservationSummary[] = observationListResponse?.object ?? [];

  // ---------- pagination ----------
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = observationListResponse?.extraNumeric ?? 0;

  // ---------- metric selection for chart ----------
  type MetricKey =
    | 'latestweight'
    | 'latestheight'
    | 'latesttemperature'
    | 'latestheartrate'
    | 'latestoxygensaturation'
    | 'bloodPressure'; // synthetic key for BP (systolic/diastolic)

  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);

  // ---------- handlers ----------
  const handleManualSearch = () => {
    if (!patient?.key) return;

    setManualSearchTriggered(true);

    const formattedFromDate = dateFilter.fromDate ? formatDate(dateFilter.fromDate) : undefined;
    const formattedToDate = dateFilter.toDate ? formatDate(dateFilter.toDate) : undefined;

    let req: ListRequest = {
      ...initialListRequest,
      sortBy: listRequest.sortBy,
      sortType: listRequest.sortType,
      pageNumber: 1,
      pageSize: listRequest.pageSize,
      ignore: true,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        }
      ]
    };

    if (formattedFromDate && formattedToDate) {
      req = addFilterToListRequest(
        'last_date',
        'between',
        `${formattedFromDate}_${formattedToDate}`,
        req
      );
    } else if (formattedFromDate) {
      req = addFilterToListRequest('last_date', 'gte', formattedFromDate, req);
    } else if (formattedToDate) {
      req = addFilterToListRequest('last_date', 'lte', formattedToDate, req);
    }

    setListRequest(req);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageNumber: newPage + 1
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10) || 5;
    setManualSearchTriggered(true);
    setListRequest(prev => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1
    }));
  };

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

  const clickableHeader = (key: MetricKey, label: string) => (
    <span
      className="link"
      style={{ cursor: 'pointer', color: '#007bff' }}
      onClick={() => setSelectedMetric(key)}
    >
      {label}
    </span>
  );

  // ---------- table columns ----------
  const columns = [
    {
      key: 'lastDate',
      title: 'DATE',
      render: (row: ApPatientObservationSummary) =>
        row.lastDate ? formatDate(new Date(row.lastDate)) : ''
    },
    {
      key: 'latestweight',
      title: clickableHeader('latestweight', 'WEIGHT'),
      dataKey: 'latestweight'
    },
    {
      key: 'latestheight',
      title: clickableHeader('latestheight', 'HEIGHT'),
      dataKey: 'latestheight'
    },
    {
      key: 'latesttemperature',
      title: clickableHeader('latesttemperature', 'TEMPERATURE'),
      dataKey: 'latesttemperature'
    },
    {
      key: 'latestheartrate',
      title: clickableHeader('latestheartrate', 'PULSE RATE'),
      dataKey: 'latestheartrate'
    },
    {
      key: 'latestbpSystolic',
      dataKey: 'latestbpSystolic',
      title: clickableHeader('bloodPressure', 'BLOOD PRESSURE'),
      render: (row: ApPatientObservationSummary) => {
        const { latestbpSystolic, latestbpDiastolic } = row;
        if (latestbpSystolic == null || latestbpDiastolic == null) return '';
        return `${latestbpSystolic}/${latestbpDiastolic}`;
      }
    },
    {
      key: 'latestoxygensaturation',
      title: clickableHeader('latestoxygensaturation', 'OXYGEN SATURATION'),
      dataKey: 'latestoxygensaturation'
    }
  ];

  // ---------- chart data ----------
  const chartData = useMemo(() => {
    if (!selectedMetric) return null;

    const labels = dataRows.map(row =>
      row.lastDate ? formatDate(new Date(row.lastDate)) : ''
    );

    if (selectedMetric === 'bloodPressure') {
      return {
        labels,
        datasets: [
          {
            label: 'Systolic',
            data: dataRows.map(row => row.latestbpSystolic ?? null),
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78, 115, 223, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Diastolic',
            data: dataRows.map(row => row.latestbpDiastolic ?? null),
            borderColor: '#e74a3b',
            backgroundColor: 'rgba(231, 74, 59, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      };
    }

    const labelMap: Record<Exclude<MetricKey, 'bloodPressure'>, string> = {
      latestweight: 'Weight',
      latestheight: 'Height',
      latesttemperature: 'Temperature',
      latestheartrate: 'Pulse Rate',
      latestoxygensaturation: 'Oxygen Saturation'
    };

    return {
      labels,
      datasets: [
        {
          label: labelMap[selectedMetric as Exclude<MetricKey, 'bloodPressure'>],
          data: dataRows.map(row => (row as any)[selectedMetric] ?? null),
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [dataRows, selectedMetric]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Value' } }
    }
  };

  // ---------- effects ----------
  useEffect(() => {
    if (patient?.key) {
      handleManualSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.fromDate, dateFilter.toDate, patient?.key]);

  useEffect(() => {
    if (!isFetching && manualSearchTriggered) {
      setManualSearchTriggered(false);
    }
  }, [isFetching, manualSearchTriggered]);

  return (
    <Panel header="Previous Measurements">
      <MyTable
        height={600}
        filters={filters()}
        data={dataRows}
        columns={columns}
        loading={isLoading || (manualSearchTriggered && isFetching)}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          setListRequest(prev => ({ ...prev, sortBy, sortType }));
        }}
      />

      {selectedMetric && chartData && (
        <div className="margin-top-100">
          <h4 className="font-size-14">
            {selectedMetric === 'bloodPressure'
              ? 'Blood Pressure Trend'
              : `${selectedMetric} Trend`}
          </h4>
          <Line
            data={chartData}
            options={{
              ...chartOptions,
              maintainAspectRatio: false
            }}
            height={'300px'}
          />
        </div>
      )}
    </Panel>
  );
};

export default PreviousMeasurements;
