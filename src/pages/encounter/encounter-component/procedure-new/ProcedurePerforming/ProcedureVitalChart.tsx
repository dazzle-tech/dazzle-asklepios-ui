import React from 'react';
import { useSelector } from 'react-redux';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toTimeValue } from '../procedureHelpers';

type Series = { key: string; label: string };

// One unit per chart so every panel keeps a single axis; at most three lines each
const PANELS: { title: string; unit: string; series: Series[] }[] = [
  {
    title: 'Blood Pressure',
    unit: 'mmHg',
    series: [
      { key: 'bloodPressureSystolic', label: 'Systolic' },
      { key: 'bloodPressureDiastolic', label: 'Diastolic' }
    ]
  },
  { title: 'Heart Rate', unit: 'bpm', series: [{ key: 'heartRate', label: 'HR' }] },
  { title: 'SpO2', unit: '%', series: [{ key: 'oxygenSaturation', label: 'SpO2' }] },
  { title: 'Respiratory Rate', unit: 'bpm', series: [{ key: 'respiratoryRate', label: 'RR' }] },
  { title: 'EtCO2', unit: 'mmHg', series: [{ key: 'etco2', label: 'EtCO2' }] },
  { title: 'Temperature', unit: '°C', series: [{ key: 'temperature', label: 'Temp' }] },
  {
    title: 'Fluids',
    unit: 'mL',
    series: [
      { key: 'fluidsGiven', label: 'Fluids Given' },
      { key: 'urineOutput', label: 'Urine Output' }
    ]
  }
];

const SERIES_COLORS = ['var(--vital-series-1)', 'var(--vital-series-2)', 'var(--vital-series-3)'];

const toNumber = (value: any) =>
  value === null || value === undefined || value === '' ? null : Number(value);

/** Each vital over the procedure time, oldest reading on the left. */
const ProcedureVitalChart = ({ readings }: { readings: any[] }) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const points = readings.map((row, index) => {
    const point: any = { label: `#${index + 1} ${toTimeValue(row.recordedAt)}` };
    PANELS.forEach(panel =>
      panel.series.forEach(({ key }) => {
        point[key] = toNumber(row[key]);
      })
    );
    return point;
  });

  const panels = PANELS.filter(panel =>
    panel.series.some(({ key }) => points.some(point => point[key] !== null))
  );

  if (!panels.length) return null;

  return (
    <div className={`procedure-vital-charts ${mode === 'dark' ? 'dark' : ''}`}>
      {panels.map(panel => (
        <div key={panel.title} className="procedure-vital-chart">
          <div className="procedure-vital-chart-title">
            {panel.title} <span>({panel.unit})</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="var(--vital-grid)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--vital-axis)' }}
                tickFormatter={(label: string) => label.split(' ')[0]}
                stroke="var(--vital-grid)"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'var(--vital-axis)' }}
                stroke="var(--vital-grid)"
                allowDecimals={panel.unit === '°C'}
              />
              <Tooltip
                formatter={(value: any, name: any) => [`${value} ${panel.unit}`, name]}
                contentStyle={{
                  background: 'var(--vital-surface)',
                  border: '1px solid var(--vital-grid)',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem'
                }}
                labelStyle={{ color: 'var(--vital-text)', fontWeight: 600 }}
              />
              {panel.series.length > 1 && (
                <Legend iconType="plainline" wrapperStyle={{ fontSize: '0.75rem' }} />
              )}
              {panel.series.map((series, index) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={SERIES_COLORS[index]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: 'var(--vital-surface)' }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ProcedureVitalChart;
