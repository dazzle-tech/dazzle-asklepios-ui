import React, { useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import 'chart.js/auto';
import { Button } from 'rsuite';
import { useSelector } from 'react-redux';
import Translate from '@/components/Translate';

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

  const mode = useSelector((state: any) => state.ui.mode);
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const [data, setData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });

  const updateData = () => {
    setData({
      labels: chartData.map(d => d.label),
      datasets: [
        {
          data: chartData.map(d => d.value),
          backgroundColor:
            colors || ['#2264E5', '#93C6FA', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: mode === 'dark' ? '#565656ff' : '#fff',
          borderWidth: 2
        }
      ]
    });
  };

  useEffect(() => {
    updateData();
  }, [chartData, colors, mode]);

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    locale: isRTL ? 'ar' : 'en',
    plugins: {
      title: {
        display: !!title,
        text: title,
        align: isRTL ? 'end' : 'start'
      },
      legend: {
        display: true,
        position: 'top',
        rtl: isRTL,
        labels: {
          textAlign: isRTL ? 'right' : 'left'
        }
      }
    },
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedSegment({
          label: data.labels?.[index] as string,
          value: data.datasets[0].data[index] as number
        });
      }
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <span className="font-12"><Translate>Current patient allocation</Translate></span>

      {selectable && (
        <div style={{ marginBottom: 10 }}>
          {selectedSegment ? (
            <span>
              {selectedSegment.label}:{' '}
              <b style={{ color: 'rebeccapurple' }}>
                {selectedSegment.value}
              </b>
            </span>
          ) : (
            <span><Translate>Click on a segment to select</Translate></span>
          )}
        </div>
      )}

      <div style={{ width, height, margin: '0 auto' }}>
        <Pie
          data={data}
          options={chartOptions}
          ref={chartRef}
        />
      </div>

      {refreshButton && (
        <Button
          appearance="primary"
          style={{ marginTop: 10 }}
          onClick={updateData}
        >
          Refresh Data
        </Button>
      )}
    </div>
  );
};

export default DynamicPieChart;
