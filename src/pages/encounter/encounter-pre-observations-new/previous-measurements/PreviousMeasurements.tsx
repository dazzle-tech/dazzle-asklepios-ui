import React, { useState, useMemo, useEffect } from 'react';
import './styles.less';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const PreviousMeasurements = ({ patient }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMetric, setSelectedMetric] = useState(null);

  const sampleData = [
    {
      date: '2025-09-01',
      weight: 65,
      height: 170,
      temperature: 36.5,
      pulseRate: 78,
      bloodPressure: 120,
      bloodGlucose: 95,
      oxygenSaturation: 98
    },
    {
      date: '2025-09-02',
      weight: 65.2,
      height: 170,
      temperature: 36.6,
      pulseRate: 79,
      bloodPressure: 121,
      bloodGlucose: 96,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-03',
      weight: 65.1,
      height: 170,
      temperature: 36.7,
      pulseRate: 77,
      bloodPressure: 119,
      bloodGlucose: 95,
      oxygenSaturation: 98
    },
    {
      date: '2025-09-04',
      weight: 65.3,
      height: 170,
      temperature: 36.8,
      pulseRate: 80,
      bloodPressure: 122,
      bloodGlucose: 97,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-05',
      weight: 66,
      height: 170,
      temperature: 36.8,
      pulseRate: 80,
      bloodPressure: 118,
      bloodGlucose: 97,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-06',
      weight: 65.7,
      height: 170,
      temperature: 36.9,
      pulseRate: 81,
      bloodPressure: 120,
      bloodGlucose: 98,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-07',
      weight: 65.8,
      height: 170,
      temperature: 37.0,
      pulseRate: 82,
      bloodPressure: 121,
      bloodGlucose: 99,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-08',
      weight: 65.5,
      height: 170,
      temperature: 37.0,
      pulseRate: 82,
      bloodPressure: 122,
      bloodGlucose: 99,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-09',
      weight: 65.6,
      height: 170,
      temperature: 36.9,
      pulseRate: 81,
      bloodPressure: 123,
      bloodGlucose: 100,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-10',
      weight: 65.9,
      height: 170,
      temperature: 37.1,
      pulseRate: 83,
      bloodPressure: 124,
      bloodGlucose: 101,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-11',
      weight: 66,
      height: 170,
      temperature: 37.0,
      pulseRate: 82,
      bloodPressure: 122,
      bloodGlucose: 100,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-12',
      weight: 66.1,
      height: 170,
      temperature: 36.9,
      pulseRate: 81,
      bloodPressure: 121,
      bloodGlucose: 99,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-13',
      weight: 66.2,
      height: 170,
      temperature: 37.0,
      pulseRate: 82,
      bloodPressure: 123,
      bloodGlucose: 100,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-14',
      weight: 66.3,
      height: 170,
      temperature: 37.1,
      pulseRate: 83,
      bloodPressure: 124,
      bloodGlucose: 101,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-15',
      weight: 66.4,
      height: 170,
      temperature: 37.0,
      pulseRate: 82,
      bloodPressure: 122,
      bloodGlucose: 100,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-16',
      weight: 66.5,
      height: 170,
      temperature: 37.1,
      pulseRate: 83,
      bloodPressure: 123,
      bloodGlucose: 101,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-17',
      weight: 66.6,
      height: 170,
      temperature: 37.2,
      pulseRate: 84,
      bloodPressure: 124,
      bloodGlucose: 102,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-18',
      weight: 66.7,
      height: 170,
      temperature: 37.1,
      pulseRate: 83,
      bloodPressure: 123,
      bloodGlucose: 101,
      oxygenSaturation: 96
    },
    {
      date: '2025-09-19',
      weight: 66.8,
      height: 170,
      temperature: 37.2,
      pulseRate: 84,
      bloodPressure: 125,
      bloodGlucose: 102,
      oxygenSaturation: 97
    },
    {
      date: '2025-09-20',
      weight: 66.9,
      height: 170,
      temperature: 37.3,
      pulseRate: 85,
      bloodPressure: 126,
      bloodGlucose: 103,
      oxygenSaturation: 96
    }
  ];

  const filteredData = useMemo(() => {
    if (!fromDate && !toDate) return sampleData;
    return sampleData.filter(row => {
      const rowDate = new Date(row.date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    });
  }, [fromDate, toDate, sampleData]);

  // pagination state — zero-based page index
  const [pageIndex, setPageIndex] = useState(5); // 0 = first page
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ensure current page is valid if data length or rowsPerPage changes
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredData.length / rowsPerPage) - 1);
    if (pageIndex > maxPage) setPageIndex(0);
  }, [filteredData.length, rowsPerPage, pageIndex]);

  // slice for current page
  const paginatedData = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, pageIndex, rowsPerPage]);

  // handlers matching MyTable expectations
  const handlePageChange = (_event, newPage) => {
    setPageIndex(newPage); // newPage is zero-based
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0); // go back to first page when page size changes
  };

  const filters = () => {
    return (
      <Form layout="inline" fluid>
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="From"
          fieldName="fromDate"
          record={fromDate}
          setRecord={setFromDate}
        />
        <MyInput
          column
          width={180}
          fieldType="date"
          fieldLabel="To"
          fieldName="toDate"
          record={toDate}
          setRecord={setToDate}
        />
      </Form>
    );
  };

  const clickableHeader = (key, label) => (
    <span
      className="link"
      style={{ cursor: 'pointer', color: '#007bff' }}
      onClick={() => setSelectedMetric(key)}
    >
      {label}
    </span>
  );

  const columns = [
    { key: 'date', title: 'Date', dataKey: 'date' },
    { key: 'weight', title: clickableHeader('weight', 'Weight'), dataKey: 'weight' },
    { key: 'height', title: clickableHeader('height', 'Height'), dataKey: 'height' },
    {
      key: 'temperature',
      title: clickableHeader('temperature', 'Temperature'),
      dataKey: 'temperature'
    },
    { key: 'pulseRate', title: clickableHeader('pulseRate', 'Pulse Rate'), dataKey: 'pulseRate' },
    {
      key: 'bloodPressure',
      title: clickableHeader('bloodPressure', 'Blood Pressure'),
      dataKey: 'bloodPressure'
    },
    {
      key: 'bloodGlucose',
      title: clickableHeader('bloodGlucose', 'Blood Glucose'),
      dataKey: 'bloodGlucose'
    },
    {
      key: 'oxygenSaturation',
      title: clickableHeader('oxygenSaturation', 'Oxygen Saturation'),
      dataKey: 'oxygenSaturation'
    }
  ];

  const chartData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: selectedMetric,
        data: filteredData.map(d => d[selectedMetric]),
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

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

  return (
    <div>
      <MyTable
        height={600}
        filters={filters()}
        data={paginatedData}
        columns={columns}
        page={pageIndex} // zero-based
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length} // total (for pager)
        onPageChange={handlePageChange} // (_ , newPage)
        onRowsPerPageChange={handleRowsPerPageChange} // (event)
      />

      {selectedMetric && (
        <div className="margin-top-100">
          <h4 className="font-size-14">{selectedMetric} Trend</h4>
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
    </div>
  );
};

export default PreviousMeasurements;
