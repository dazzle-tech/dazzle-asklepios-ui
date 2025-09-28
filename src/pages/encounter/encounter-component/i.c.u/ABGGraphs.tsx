import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const sampleData = [
  { date: '2025-09-01', pH: 7.38, PaCO2: 42, PaO2: 88, PFRatio: 196 },
  { date: '2025-09-02', pH: 7.39, PaCO2: 43, PaO2: 90, PFRatio: 198 },
  { date: '2025-09-03', pH: 7.40, PaCO2: 41, PaO2: 87, PFRatio: 195 },
  { date: '2025-09-04', pH: 7.37, PaCO2: 44, PaO2: 89, PFRatio: 197 },
  { date: '2025-09-05', pH: 7.36, PaCO2: 45, PaO2: 86, PFRatio: 192 },
];

interface ABGGraphsProps {
  selectedMetric?: string | null;
  tableView?: boolean;
}

const ABGGraphs: React.FC<ABGGraphsProps> = ({
  selectedMetric: selectedMetricProp = null,
  tableView = true,
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(selectedMetricProp);

  useEffect(() => {
    setSelectedMetric(selectedMetricProp);
  }, [selectedMetricProp]);

  const renderHeader = (key: string, labelOverride?: string) => {
    if (!tableView) return labelOverride || key;

    return (
      <span
        className="link"
        style={{ cursor: 'pointer', color: '#007bff' }}
        onClick={() => setSelectedMetric(key)}
      >
        {labelOverride || key}
      </span>
    );
  };

  const columns = [
    { key: 'date', title: 'Date', dataKey: 'date' },
    { key: 'pH', title: renderHeader('pH'), dataKey: 'pH' },
    { key: 'PaCO2', title: renderHeader('PaCO2', 'PaCO₂'), dataKey: 'PaCO2' },
    { key: 'PaO2', title: renderHeader('PaO2', 'PaO₂'), dataKey: 'PaO2' },
    { key: 'PFRatio', title: renderHeader('PFRatio', 'P/F Ratio'), dataKey: 'PFRatio' },
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
  }, [fromDate, toDate]);

  const filters = () => (
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

  const chartData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: selectedMetric,
        data: selectedMetric ? filteredData.map(d => d[selectedMetric as keyof typeof d]) : [],
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: selectedMetric || 'Value' } },
    },
  };

  return (
    <div>
      {tableView && (
        <MyTable
          height={500}
          filters={filters()}
          data={filteredData}
          columns={columns}
          page={0}
          rowsPerPage={10}
          totalCount={filteredData.length}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      )}

      {selectedMetric && (
        <div style={{ marginTop: 40 }}>
          <h4>{selectedMetric} Trend</h4>
          <div style={{ height: 300 }}>
            <Line
              data={chartData}
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ABGGraphs;
