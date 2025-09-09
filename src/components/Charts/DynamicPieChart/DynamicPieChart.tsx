import React, { useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import 'chart.js/auto';
import { Button } from 'rsuite';

type PieChartDataPoint = {
  label: string;
  value: number;
};

interface DynamicPieChartProps {
  title?: string;
  chartData: PieChartDataPoint[];
  colors?: string[];
  selectable?: boolean;
  refreshButton?: boolean;
  width?: number;
  height?: number;
}

const DynamicPieChart: React.FC<DynamicPieChartProps> = ({
  title,
  chartData,
  colors,
  selectable,
  refreshButton,
  width = 350,
  height = 350
}) => {
  const chartRef = useRef<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<{
    label: string;
    value: number;
  } | null>(null);

  const [data, setData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });

  const updateData = () => {
    const labels = chartData.map(d => d.label);
    const values = chartData.map(d => d.value);

    setData({
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors || ['#2264E5', '#93C6FA', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    });
  };

  useEffect(() => {
    updateData();
  }, [chartData, colors]);

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = data.labels?.[index] as string;
        const value = data.datasets[0].data[index] as number;
        setSelectedSegment({ label, value });
      }
    }
  };

  return (
    <div>
      {selectable && (
        <div style={{ marginBottom: 10 }}>
          {selectedSegment ? (
            <span style={{ fontSize: 'large' }}>
              {selectedSegment.label}:{' '}
              <b style={{ color: 'rebeccapurple' }}>{selectedSegment.value}</b>
            </span>
          ) : (
            <span className="font-12">Current patient allocation</span>
          )}
        </div>
      )}

      <div style={{ width, height, margin: '0 auto' }}>
        <Pie data={data} options={chartOptions} ref={chartRef} style={{ maxHeight: '400px' }} />
      </div>
      {refreshButton && (
        <Button appearance="primary" style={{ marginTop: 10 }} onClick={updateData}>
          Refresh Data
        </Button>
      )}
    </div>
  );
};

export default DynamicPieChart;
