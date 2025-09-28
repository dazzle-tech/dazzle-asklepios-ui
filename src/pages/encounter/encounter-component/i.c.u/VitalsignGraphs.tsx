import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import MyTable from '@/components/MyTable';
import './style.less';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const sampleData = [
  { date: '2025-09-01', heartRate: 92, bloodPressure: 120, respRate: 18, temperature: 37.1, spO2: 97, pain: 2 },
  { date: '2025-09-02', heartRate: 94, bloodPressure: 118, respRate: 17, temperature: 37.2, spO2: 96, pain: 3 },
  { date: '2025-09-03', heartRate: 90, bloodPressure: 117, respRate: 16, temperature: 37.0, spO2: 97, pain: 2 },
  { date: '2025-09-04', heartRate: 91, bloodPressure: 119, respRate: 18, temperature: 37.1, spO2: 98, pain: 3 },
  { date: '2025-09-05', heartRate: 93, bloodPressure: 121, respRate: 19, temperature: 37.3, spO2: 96, pain: 4 },
];

const metricMap = {
  heartRate: 'Heart Rate',
  bloodPressure: 'Blood Pressure',
  respRate: 'Resp Rate',
  temperature: 'Temperature',
  spO2: 'SpO₂',
  pain: 'Pain',
};

interface VitalsignGraphsProps {
  tableView?: boolean;
  selectedMetric?: string | null;
}

const VitalsignGraphs: React.FC<VitalsignGraphsProps> = ({
  tableView = true,
  selectedMetric: selectedMetricProp = null,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(selectedMetricProp);

  React.useEffect(() => {
    setSelectedMetric(selectedMetricProp);
  }, [selectedMetricProp]);

  const columns = [
    { key: 'date', title: 'Date', dataKey: 'date' },
    ...Object.entries(metricMap).map(([key, label]) => ({
      key,
      dataKey: key,
      title: tableView ? (
        <span
          className="clickable-column"
          style={{ color: '#007bff', cursor: 'pointer' }}
          onClick={() => setSelectedMetric(key)}
        >
          {label}
        </span>
      ) : (
        label
      ),
    })),
  ];

  const chartData = useMemo(() => {
    if (!selectedMetric) return null;
    return {
      labels: sampleData.map((row) => row.date),
      datasets: [
        {
          label: metricMap[selectedMetric],
          data: sampleData.map((row) => row[selectedMetric]),
          borderColor: '#36a2eb',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [selectedMetric]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: selectedMetric ? metricMap[selectedMetric] : 'Value' } },
    },
  };

  return (
    <div className="vitalsign-graph-page">
      {tableView && (
        <MyTable
          data={sampleData}
          columns={columns}
          rowsPerPage={5}
          page={0}
          totalCount={sampleData.length}
          height={500}
          filters={null}
          onPageChange={() => { }}
          onRowsPerPageChange={() => { }}
        />
      )}

      {selectedMetric && (
        <div className="graph-container" style={{ marginTop: 40 }}>
          <h4>{metricMap[selectedMetric]} Trend</h4>
          <Line
            data={chartData!}
            options={{
              ...chartOptions,
              maintainAspectRatio: false,
            }}
            height={300}
          />
        </div>
      )}
    </div>
  );
};

export default VitalsignGraphs;
