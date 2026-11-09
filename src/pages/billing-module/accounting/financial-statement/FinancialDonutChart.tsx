import React, { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import { useSelector } from 'react-redux';

import { money, resolveCssColor } from './statementFormatters';

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type FinancialDonutChartProps = {
  title: string;
  centerValue: string;
  centerHint: string;
  slices: DonutSlice[];
  currency?: string;
};

const FinancialDonutChart: React.FC<FinancialDonutChartProps> = ({
  title,
  centerValue,
  centerHint,
  slices,
  currency = 'SAR'
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const isDark = mode === 'dark';

  const chartData = useMemo<ChartData<'doughnut'>>(
    () => ({
      labels: slices.map(slice => slice.label),
      datasets: [
        {
          data: slices.map(slice => Math.max(Number(slice.value) || 0, 0)),
          backgroundColor: slices.map(slice => resolveCssColor(slice.color)),
          borderColor: resolveCssColor('var(--rs-bg-card)'),
          borderWidth: 3,
          hoverOffset: 4
        }
      ]
    }),
    [isDark, slices]
  );

  const [data, setData] = useState(chartData);

  useEffect(() => {
    setData(chartData);
  }, [chartData]);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context =>
            ` ${context.label}: ${money(Number(context.raw ?? 0), currency)}`
        }
      }
    }
  };

  return (
    <div className="pfs-chart">
      <div className="pfs-chart__title">{title}</div>
      <div className="pfs-chart__canvas">
        <Doughnut data={data} options={options} />
        <div className="pfs-chart__center">
          <strong>{centerValue}</strong>
          <span>{centerHint}</span>
        </div>
      </div>
      <div className="pfs-chart__legend">
        {slices.map(slice => (
          <div key={slice.label} className="pfs-chart__legend-item">
            <span className="pfs-chart__swatch" style={{ background: resolveCssColor(slice.color) }} />
            <span>{slice.label}</span>
            <strong>{money(slice.value, currency)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialDonutChart;
