import React, { useState, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import 'chart.js/auto';
import { Button } from 'rsuite';

// Original single-column data type
type BarChartDataPoint = {
  label: string;
  value: number;
};

// New multi-column data type
type MultiColumnDataPoint = {
  label: string;
  [key: string]: string | number; // Dynamic keys for multiple metrics
};

interface DynamicBarChartProps {
  title?: string;
  chartData: BarChartDataPoint[] | MultiColumnDataPoint[];
  color?: string;
  colors?: string[]; // Array of colors for multi-column charts
  selectable?: boolean;
  refreshButton?: boolean;
  horizontal?: boolean;
  multiColumns?: boolean; // New prop to enable multi-column mode
}

const DynamicBarChart: React.FC<DynamicBarChartProps> = ({
  title,
  chartData,
  color = '#3498db',
  colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
  selectable,
  refreshButton,
  horizontal = false,
  multiColumns = false
}) => {
  const chartRef = useRef<any>(null);
  const [selectedBar, setSelectedBar] = useState<{
    label: string;
    value: number;
    dataset?: string;
  } | null>(null);

  const [data, setData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });

  const updateData = () => {
    if (multiColumns && chartData.length > 0) {
      // Multi-column mode
      const multiData = chartData as MultiColumnDataPoint[];
      const labels = multiData.map(d => d.label);

      // Get all metric keys (excluding 'label')
      const metricKeys = Object.keys(multiData[0]).filter(key => key !== 'label');

      // Create datasets for each metric
      const datasets = metricKeys.map((key, index) => ({
        label: key,
        data: multiData.map(item => Number(item[key])),
        backgroundColor: colors[index % colors.length],
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }));

      setData({
        labels,
        datasets
      });
    } else {
      // Single-column mode
      const singleData = chartData as BarChartDataPoint[];
      const labels = singleData.map(d => d.label);
      const values = singleData.map(d => d.value);

      setData({
        labels,
        datasets: [
          {
            label: title || 'Values',
            data: values,
            backgroundColor: color,
            borderColor: '#fff',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      });
    }
  };

  useEffect(() => {
    updateData();
  }, [chartData, color, colors, multiColumns]);

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16
        }
      },
      legend: {
        display: multiColumns, // Show legend for multi-column charts
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: context => {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        }
      },
      y: {
        grid: {
          color: '#eee'
        },
        ticks: {
          color: '#666'
        },
        beginAtZero: true
      }
    },
    onClick: (_event, elements) => {
      if (elements.length > 0 && selectable) {
        const element = elements[0];
        const index = element.index;
        const datasetIndex = element.datasetIndex;
        const label = data.labels?.[index] as string;
        const value = data.datasets[datasetIndex].data[index] as number;
        const dataset = data.datasets[datasetIndex].label;

        setSelectedBar({ label, value, dataset });
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {selectable && (
        <div style={{ marginBottom: 10 }}>
          {selectedBar ? (
            <span style={{ fontSize: 'large' }}>
              {selectedBar.dataset ? `${selectedBar.dataset} - ` : ''}
              {selectedBar.label}: <b style={{ color: 'rebeccapurple' }}>{selectedBar.value}</b>
            </span>
          ) : (
            <span>Click on a bar to select</span>
          )}
        </div>
      )}

      <Bar data={data} options={chartOptions} ref={chartRef} style={{ maxHeight: '400px' }} />

      {refreshButton && (
        <Button appearance="primary" style={{ marginTop: 10 }} onClick={updateData}>
          Refresh Data
        </Button>
      )}
    </div>
  );
};

export default DynamicBarChart;
