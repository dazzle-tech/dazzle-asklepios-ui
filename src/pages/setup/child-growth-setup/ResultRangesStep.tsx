import React from 'react';
import { Form, Panel } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import {
  ALERTED_OPTIONS,
  AlertRules,
  EntryLimits,
  INDICATORS,
  IndicatorId,
  SAMPLE_SERIES,
  SAMPLE_Z,
  StatusBand,
  asNumber,
  bandAt,
  outerLimitNote,
  sampleCaption
} from './model';

type Props = {
  indicator: IndicatorId;
  onIndicator: (id: IndicatorId) => void;
  bands: StatusBand[];
  onBands: (bands: StatusBand[]) => void;
  limits: EntryLimits;
  onLimits: (limits: EntryLimits) => void;
  alerts: AlertRules;
  onAlerts: (alerts: AlertRules) => void;
};

const VIEW_MIN = -2.5;
const VIEW_MAX = 2.5;
const PLOT_W = 360;
const PLOT_H = 220;
const AXIS = 36;
const RIGHT = 72;

const yOf = (z: number) => ((VIEW_MAX - z) / (VIEW_MAX - VIEW_MIN)) * PLOT_H;

const toneColor = (tone: StatusBand['tone']) => {
  if (tone === 'action') return 'var(--rs-red-500, #e57373)';
  if (tone === 'watch') return 'var(--rs-orange-500, #ffb74d)';
  return 'var(--rs-green-500, #81c784)';
};

const LivePreview = ({ bands }: { bands: StatusBand[] }) => {
  const current = bandAt(SAMPLE_Z, bands);
  const plotRight = PLOT_W - RIGHT;
  const points = SAMPLE_SERIES.map((z, index) => {
    const x = AXIS + ((index + 0.35) / SAMPLE_SERIES.length) * (plotRight - AXIS - 8);
    return `${x},${yOf(z)}`;
  });
  const lastX = AXIS + ((SAMPLE_SERIES.length - 1 + 0.35) / SAMPLE_SERIES.length) * (plotRight - AXIS - 8);

  return (
    <Panel bordered header={<Translate>Live preview</Translate>} className="cgs-card">
      <div className="cgs-preview">
        <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} className="cgs-preview-svg" role="img" aria-label="Sample child z-score">
          {bands.map(band => {
            const min = asNumber(band.min);
            const max = asNumber(band.max);
            if (min === null || max === null) return null;
            const topZ = Math.min(max, VIEW_MAX);
            const bottomZ = Math.max(min, VIEW_MIN);
            if (topZ <= bottomZ) return null;
            const y = yOf(topZ);
            const height = yOf(bottomZ) - y;
            return (
              <g key={band.id}>
                <rect x={AXIS} y={y} width={plotRight - AXIS} height={height} fill={toneColor(band.tone)} opacity={0.35} />
                <text x={PLOT_W - 8} y={y + height / 2 + 4} textAnchor="end" className="cgs-preview-tag">
                  {band.tone === 'action' ? 'Action' : band.tone === 'watch' ? 'Watch' : 'Normal'}
                </text>
              </g>
            );
          })}
          {[-2, -1, 0, 1, 2].map(z => (
            <g key={z}>
              <line x1={AXIS} x2={plotRight} y1={yOf(z)} y2={yOf(z)} className="cgs-preview-grid" />
              <text x={AXIS - 8} y={yOf(z) + 4} textAnchor="end" className="cgs-preview-axis">
                {z > 0 ? `+${z}` : z}
              </text>
            </g>
          ))}
          <polyline points={points.join(' ')} className="cgs-preview-line" />
          <circle cx={lastX} cy={yOf(SAMPLE_Z)} r={5} className="cgs-preview-dot" />
        </svg>
        <p className="cgs-note">
          <Translate>{sampleCaption(current)}</Translate>
        </p>
      </div>
    </Panel>
  );
};

const ResultRangesStep = ({
  indicator,
  onIndicator,
  bands,
  onBands,
  limits,
  onLimits,
  alerts,
  onAlerts
}: Props) => {
  const replace = (next: StatusBand) => onBands(bands.map(band => (band.id === next.id ? next : band)));

  return (
    <>
      <div className="cgs-indicators">
        {INDICATORS.map(item => (
          <MyButton
            key={item.id}
            appearance={item.id === indicator ? 'primary' : 'ghost'}
            onClick={() => onIndicator(item.id)}
          >
            {item.label}
          </MyButton>
        ))}
      </div>
      <div className="cgs-layout">
        <div className="cgs-stack">
          <Panel bordered header={<Translate>Status bands (z-score)</Translate>} className="cgs-card">
            <div className="cgs-table-scroll">
              <div className="cgs-band cgs-band--head">
                <span>
                  <Translate>Status</Translate>
                </span>
                <span>
                  <Translate>Min</Translate>
                </span>
                <span>
                  <Translate>Max</Translate>
                </span>
                <span>
                  <Translate>≈ Percentile</Translate>
                </span>
                <span>
                  <Translate>Who is alerted</Translate>
                </span>
              </div>
              <Form fluid>
                {bands.map(band => (
                  <div className="cgs-band" key={band.id}>
                    <span className={`cgs-pill cgs-pill--${band.tone}`}>{band.label}</span>
                    <MyInput
                      fieldName="min"
                      fieldType="number"
                      record={band}
                      setRecord={replace}
                      showLabel={false}
                      allowDecimal
                      allowNegative
                      showZero
                      width="100%"
                    />
                    <MyInput
                      fieldName="max"
                      fieldType="number"
                      record={band}
                      setRecord={replace}
                      showLabel={false}
                      allowDecimal
                      allowNegative
                      showZero
                      width="100%"
                    />
                    <span className="cgs-muted">{band.percentile}</span>
                    <MyInput
                      fieldName="alerted"
                      fieldType="checkPicker"
                      record={band}
                      setRecord={replace}
                      selectData={ALERTED_OPTIONS}
                      selectDataLabel="label"
                      selectDataValue="value"
                      showLabel={false}
                      searchable={false}
                      placeholder="No alert"
                      width="100%"
                    />
                  </div>
                ))}
              </Form>
            </div>
            <p className="cgs-note">
              <Translate>{outerLimitNote(bands)}</Translate>
            </p>
          </Panel>

          <Panel bordered header={<Translate>Entry limits (catch typos before saving)</Translate>} className="cgs-card">
            <Form fluid className="cgs-limits">
              <MyInput fieldName="weightMinKg" fieldLabel="Weight min kg" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
              <MyInput fieldName="weightMaxKg" fieldLabel="Weight max kg" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
              <MyInput fieldName="lengthMinCm" fieldLabel="Length min cm" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
              <MyInput fieldName="lengthMaxCm" fieldLabel="Length max cm" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
              <MyInput fieldName="headMinCm" fieldLabel="Head min cm" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
              <MyInput fieldName="headMaxCm" fieldLabel="Head max cm" fieldType="number" record={limits} setRecord={onLimits} allowDecimal showZero min={0} width="100%" />
            </Form>
          </Panel>
        </div>

        <div className="cgs-stack">
          <LivePreview bands={bands} />
          <Panel bordered header={<Translate>Alert rules</Translate>} className="cgs-card">
            <Form fluid className="cgs-stack">
              <MyInput
                fieldName="consecutiveVisits"
                fieldLabel="Alert after consecutive visits outside Normal"
                fieldType="number"
                record={alerts}
                setRecord={onAlerts}
                min={1}
                showZero
                width="100%"
              />
              <MyInput
                fieldName="channelsCrossed"
                fieldLabel="Percentile channels crossed to raise Watch"
                fieldType="number"
                record={alerts}
                setRecord={onAlerts}
                min={1}
                showZero
                width="100%"
              />
            </Form>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default ResultRangesStep;
