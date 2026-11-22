import React from 'react';
import { Form, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import {
  ChartSet,
  Coverage,
  SelectionRules,
  SEX_OPTIONS,
  UNIT_OPTIONS,
  MISSING_SEX_OPTIONS,
  buildCoverage,
  formatMonths
} from './model';

type Props = {
  charts: ChartSet[];
  rules: SelectionRules;
  onCharts: (charts: ChartSet[]) => void;
  onRules: (rules: SelectionRules) => void;
};

const coverageTicks = (scaleMax: number) => {
  if (scaleMax === 240) return [0, 24, 72, 120, 180, 240];
  const years = Math.ceil(scaleMax / 12);
  const step = years > 20 ? 5 : 2;
  const ticks: number[] = [];
  for (let year = 0; year <= years; year += step) ticks.push(year * 12);
  if (ticks[ticks.length - 1] !== years * 12) ticks.push(years * 12);
  return ticks;
};

const tickLabel = (months: number) => {
  if (months === 0) return '0';
  if (months % 12 === 0) {
    const years = months / 12;
    return years === 2 ? '2 yr' : String(years);
  }
  return formatMonths(months);
};

const AgeCoverage = ({ coverage }: { coverage: Coverage }) => {
  const ticks = coverageTicks(coverage.scaleMax);
  return (
    <Panel bordered header={<Translate>Age coverage check</Translate>} className="cgs-card">
      <div className="cgs-coverage-head">
        <span className={`cgs-badge ${coverage.clear ? 'cgs-badge--ok' : 'cgs-badge--warn'}`}>
          <Translate>{coverage.clear ? 'No gaps or overlaps' : 'Gaps or overlaps'}</Translate>
        </span>
      </div>
      {coverage.rows.map(row => (
        <div className="cgs-coverage-row" key={row.sex}>
          <span className="cgs-coverage-sex">
            <Translate>{row.label}</Translate>
          </span>
          <div className="cgs-coverage-track">
            {row.segments.map((segment, index) => {
              const left = (segment.from / coverage.scaleMax) * 100;
              const width = ((segment.to - segment.from) / coverage.scaleMax) * 100;
              return (
                  <div
                    key={segment.id}
                    className={`cgs-segment${index % 2 ? ' cgs-segment--alt' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={segment.detail}
                  >
                    {width > 8 ? segment.short : ''}
                    {width > 28 ? ` ${segment.detail.replace(segment.short, '').trim()}` : ''}
                  </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="cgs-coverage-axis">
        {ticks.map((tick, index) => {
          const atStart = index === 0;
          const atEnd = index === ticks.length - 1;
          return (
            <span
              key={tick}
              style={{
                left: atEnd ? undefined : `${(tick / coverage.scaleMax) * 100}%`,
                right: atEnd ? 0 : undefined,
                transform: atStart || atEnd ? 'none' : 'translateX(-50%)'
              }}
            >
              {tickLabel(tick)}
            </span>
          );
        })}
      </div>
      {!coverage.clear && (
        <ul className="cgs-issues">
          {coverage.issues.map(issue => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const ChartTypesStep = ({ charts, rules, onCharts, onRules }: Props) => {
  const coverage = buildCoverage(charts);

  return (
    <>
      <div className="cgs-layout">
        <Panel
          bordered
          header={<Translate>Chart sets: who and what age each chart applies to</Translate>}
          className="cgs-card"
        >
          <div className="cgs-table-scroll">
            <div className="cgs-chart cgs-chart--head">
              <span>
                <Translate>Chart</Translate>
              </span>
              <span>
                <Translate>Sex</Translate>
              </span>
              <span>
                <Translate>Age from</Translate>
              </span>
              <span>
                <Translate>Age to</Translate>
              </span>
              <span>
                <Translate>Unit</Translate>
              </span>
              <span>
                <Translate>Enabled</Translate>
              </span>
            </div>
            <Form fluid>
              {charts.map(chart => (
                <div className="cgs-chart" key={chart.id}>
                  <div className="cgs-chart-name">
                    <strong>{chart.name}</strong>
                    <span>{chart.description}</span>
                  </div>
                  <MyInput
                    fieldName="sex"
                    fieldType="select"
                    selectData={SEX_OPTIONS}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={chart}
                    setRecord={(next: ChartSet) =>
                      onCharts(charts.map(item => (item.id === chart.id ? next : item)))
                    }
                    showLabel={false}
                    searchable={false}
                    cleanable={false}
                    width="100%"
                  />
                  <MyInput
                    fieldName="ageFrom"
                    fieldType="number"
                    record={chart}
                    setRecord={(next: ChartSet) =>
                      onCharts(charts.map(item => (item.id === chart.id ? next : item)))
                    }
                    showLabel={false}
                    disabled={!chart.enabled}
                    placeholder={chart.enabled ? '' : '-'}
                    min={0}
                    showZero
                    width="100%"
                  />
                  <MyInput
                    fieldName="ageTo"
                    fieldType="number"
                    record={chart}
                    setRecord={(next: ChartSet) =>
                      onCharts(charts.map(item => (item.id === chart.id ? next : item)))
                    }
                    showLabel={false}
                    disabled={!chart.enabled}
                    placeholder={chart.enabled ? '' : '-'}
                    min={0}
                    showZero
                    width="100%"
                  />
                  <MyInput
                    fieldName="unit"
                    fieldType="select"
                    selectData={UNIT_OPTIONS}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={chart}
                    setRecord={(next: ChartSet) =>
                      onCharts(charts.map(item => (item.id === chart.id ? next : item)))
                    }
                    showLabel={false}
                    searchable={false}
                    cleanable={false}
                    width="100%"
                  />
                  <MyInput
                    fieldName="enabled"
                    fieldType="checkbox"
                    record={chart}
                    setRecord={(next: ChartSet) =>
                      onCharts(charts.map(item => (item.id === chart.id ? next : item)))
                    }
                    showLabel={false}
                    checkedLabel="On"
                    unCheckedLabel="Off"
                    width={88}
                  />
                </div>
              ))}
            </Form>
          </div>
        </Panel>

        <Panel bordered header={<Translate>Selection rules</Translate>} className="cgs-card">
          <Form fluid className="cgs-stack">
            <MyInput
              fieldName="missingSex"
              fieldLabel="When sex is not recorded"
              fieldType="select"
              selectData={MISSING_SEX_OPTIONS}
              selectDataLabel="label"
              selectDataValue="value"
              record={rules}
              setRecord={onRules}
              searchable={false}
              cleanable={false}
              width="100%"
            />
            <MyInput
              fieldName="correctedAgeUntilMonths"
              fieldLabel="Use corrected age until (months)"
              fieldType="number"
              record={rules}
              setRecord={onRules}
              min={0}
              showZero
              width="100%"
            />
            <MyInput
              fieldName="allowOverride"
              fieldLabel="Allow clinicians to override the chart"
              fieldType="checkbox"
              record={rules}
              setRecord={onRules}
              checkedLabel="On"
              unCheckedLabel="Off"
            />
            <MyInput
              fieldName="showInParentPortal"
              fieldLabel="Show charts in the parent portal"
              fieldType="checkbox"
              record={rules}
              setRecord={onRules}
              checkedLabel="On"
              unCheckedLabel="Off"
            />
          </Form>
          <p className="cgs-note">
            <Translate>
              Sex and age are matched automatically to each child. Saved as configuration values at
              the scope chosen above; facility values override the organization default.
            </Translate>
          </p>
        </Panel>
      </div>
      <AgeCoverage coverage={coverage} />
    </>
  );
};

export default ChartTypesStep;
