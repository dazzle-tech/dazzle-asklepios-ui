import React from 'react';
import { Panel } from 'rsuite';
import { Line } from 'react-chartjs-2';
import Translate from '@/components/Translate';

interface FluidBalanceChartProps {
  chartData: { x: string; y: number }[];
  title?: string;
  maxValue?: number;
}

const FluidBalanceChart: React.FC<FluidBalanceChartProps> = ({ chartData, title = 'Balance Change', maxValue }) => {
  const data = {
    labels: chartData.map(d => d.x),
    datasets: [
      {
        label: title,
        data: chartData.map(d => d.y),
        fill: true,
        backgroundColor: 'rgba(66, 135, 245, 0.2)',
        borderColor: '#4287f5',
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { display: true },
      title: { display: true, text: title }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: maxValue || undefined
      }
    }
  };

  return (
    <Panel bordered style={{ height: 400 }} header={<Translate>Total Balance Change per Date</Translate>}>
      <div style={{ height: '100%', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
    </Panel>
  );
};

export default FluidBalanceChart;
