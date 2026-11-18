import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Form } from 'rsuite';
import { LuAlertTriangle, LuSparkle, LuSparkles } from 'react-icons/lu';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import AiTooltip from '@/components/AiTooltip/AiTooltip';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  InterpretationDTO,
  KeyFindingDTO,
  useInterpretLabsMutation
} from '@/services/ai-services/labInterpretationService';
import './LabInterpretationAI.less';

type Props = {
  patientId: number;
};

type Range = { dateFrom: string | null; dateTo: string | null };
type Phase = 'idle' | 'working' | 'empty' | 'error' | 'success';
type SeverityView = { display: string; reason: string; guarded: boolean };

const LATE_AFTER_MS = 20000;
const DISPLAY_DATE = 'DD-MM-YYYY';

const flagKind = (flag?: string) => {
  const value = (flag || '').toLowerCase();
  if (value.includes('critical')) return 'crit';
  if (value.includes('high') || value.includes('upper')) return 'high';
  if (value.includes('low') || value.includes('lower')) return 'low';
  if (value.includes('normal')) return 'ok';
  return 'other';
};

const FLAG_LABEL: Record<string, string> = {
  crit: 'Critical',
  high: 'High',
  low: 'Low',
  ok: 'Normal',
  other: '—'
};
const FLAG_RANK: Record<string, number> = { crit: 0, high: 1, low: 1, other: 2, ok: 3 };
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  review: 'Needs review'
};

// The service can rate the whole set as critical while no listed finding is critical; show "Needs review" then
const resolveSeverity = (interpretation: InterpretationDTO): SeverityView => {
  const findings = interpretation.key_findings ?? [];
  const critical = findings.filter(f => flagKind(f.flag) === 'crit');
  const abnormal = findings.filter(f => ['high', 'low'].includes(flagKind(f.flag)));
  const service = (interpretation.severity || 'low').toLowerCase();

  if ((service === 'critical' || service === 'high') && !critical.length && !abnormal.length) {
    return { display: 'review', reason: '', guarded: true };
  }
  if (critical.length) {
    return {
      display: 'critical',
      reason: `${critical.length} critical (${critical.map(f => f.lab_name).join(', ')})`,
      guarded: false
    };
  }
  if (abnormal.length) {
    return {
      display: service === 'low' ? 'moderate' : service,
      reason: `${abnormal.length} outside the reference range`,
      guarded: false
    };
  }
  return { display: 'low', reason: 'No abnormal values in the listed findings', guarded: false };
};

const toDisplayDate = (value?: string | null) =>
  value && dayjs(value).isValid() ? dayjs(value).format(DISPLAY_DATE) : '—';

const toPlainText = (interpretation: InterpretationDTO, severity: SeverityView) => {
  const lines = [`Lab Interpretation — ${SEVERITY_LABEL[severity.display] ?? severity.display}`];
  if (severity.reason) lines.push(severity.reason);
  lines.push('', 'Key findings:');
  (interpretation.key_findings ?? []).forEach(f =>
    lines.push(
      `- ${f.lab_name}: ${f.value ?? ''} ${f.unit ?? ''} (${f.reference_range ?? ''}) [${
        FLAG_LABEL[flagKind(f.flag)]
      }] ${f.finding ?? ''}`
    )
  );
  (interpretation.patterns ?? []).forEach((p, i) => {
    if (i === 0) lines.push('', 'Patterns:');
    lines.push(`- ${p.label.replace(/_/g, ' ')}: ${p.reason}`);
  });
  (interpretation.trends ?? []).forEach((t, i) => {
    if (i === 0) lines.push('', 'Trends:');
    lines.push(`- ${t.lab_name}: ${t.summary ?? ''}`);
  });
  (interpretation.follow_up_considerations ?? []).forEach((c, i) => {
    if (i === 0) lines.push('', 'Follow-up:');
    lines.push(`- ${c}`);
  });
  return lines.join('\n');
};

const LabInterpretationAI: React.FC<Props> = ({ patientId }) => {
  const dispatch = useAppDispatch();
  const [interpretLabs] = useInterpretLabsMutation();
  const requestRef = useRef<{ abort: () => void } | null>(null);

  const [range, setRange] = useState<Range>({ dateFrom: null, dateTo: null });
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<InterpretationDTO | null>(null);
  const [interpretedRange, setInterpretedRange] = useState<Range | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    if (phase !== 'working') return undefined;
    setIsLate(false);
    const timer = setTimeout(() => setIsLate(true), LATE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const validateRange = (): string | null => {
    if (!range.dateFrom || !range.dateTo) return 'Pick both dates';
    if (dayjs(range.dateFrom).isAfter(dayjs(range.dateTo)))
      return 'From Date must be before To Date';
    return null;
  };

  const handleInterpret = async () => {
    const invalid = validateRange();
    if (invalid) {
      dispatch(notify({ msg: invalid, sev: 'warning' }));
      return;
    }

    setPhase('working');
    const request = interpretLabs({
      patientId,
      dateFrom: dayjs(range.dateFrom).startOf('day').toISOString(),
      dateTo: dayjs(range.dateTo).endOf('day').toISOString()
    });
    requestRef.current = request;

    try {
      const response = await request.unwrap();
      const interpretation = response?.interpretation;
      const hasContent =
        !!interpretation?.key_findings?.length ||
        !!interpretation?.patterns?.length ||
        !!interpretation?.trends?.length;

      setResult(interpretation ?? null);
      setInterpretedRange({ ...range });
      setGeneratedAt(dayjs().format('HH:mm'));
      setPhase(hasContent ? 'success' : 'empty');
    } catch (error: any) {
      // Cancel aborts the request; that is not an error to show
      if (error?.name === 'AbortError') return;
      setPhase('error');
    } finally {
      requestRef.current = null;
    }
  };

  const handleCancel = () => {
    requestRef.current?.abort();
    setPhase(result ? 'success' : 'idle');
  };

  const handleCopy = async (interpretation: InterpretationDTO, severity: SeverityView) => {
    try {
      await navigator.clipboard.writeText(toPlainText(interpretation, severity));
      dispatch(notify({ msg: 'Summary copied', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Could not copy the summary', sev: 'warning' }));
    }
  };

  const isWorking = phase === 'working';
  const isStale =
    phase === 'success' &&
    !!interpretedRange &&
    (interpretedRange.dateFrom !== range.dateFrom || interpretedRange.dateTo !== range.dateTo);

  const renderFinding = (finding: KeyFindingDTO, index: number) => {
    const kind = flagKind(finding.flag);
    return (
      <tr key={`${finding.lab_name}-${index}`}>
        <td>
          <span className="lab-ai__test-name">{finding.lab_name || '—'}</span>
          {finding.timestamp && (
            <span className="lab-ai__test-date" dir="ltr">
              {dayjs(finding.timestamp).isValid()
                ? dayjs(finding.timestamp).format('DD-MM-YYYY HH:mm')
                : finding.timestamp}
            </span>
          )}
        </td>
        <td dir="ltr">
          {finding.value || '—'}
          {finding.unit ? ` ${finding.unit}` : ''}
        </td>
        <td dir="ltr">{finding.reference_range || '—'}</td>
        <td>
          <span className={`lab-ai__flag ${kind}`}>
            <Translate>{FLAG_LABEL[kind]}</Translate>
          </span>
        </td>
        <td>{finding.finding}</td>
      </tr>
    );
  };

  const renderSuccess = (interpretation: InterpretationDTO) => {
    const severity = resolveSeverity(interpretation);
    const findings = [...(interpretation.key_findings ?? [])].sort(
      (a, b) => FLAG_RANK[flagKind(a.flag)] - FLAG_RANK[flagKind(b.flag)]
    );

    return (
      <>
        {isStale && (
          <div className="lab-ai__stale" role="status">
            <LuAlertTriangle size={14} />
            <Translate>The range changed. Interpret again to update.</Translate>
          </div>
        )}

        <div className="lab-ai__meta">
          <span className="lab-ai__chip">
            <LuSparkle size={12} />
            <Translate>AI-generated</Translate>
          </span>
          <span className="lab-ai__muted">
            <Translate>Generated</Translate> {generatedAt}
          </span>
          <span>
            <Translate>Range</Translate> {toDisplayDate(interpretedRange?.dateFrom)} –{' '}
            {toDisplayDate(interpretedRange?.dateTo)}
          </span>
          {isStale && (
            <span className="lab-ai__out-of-date">
              <Translate>Out of date</Translate>
            </span>
          )}
          <div className="lab-ai__actions">
            <button type="button" className="lab-ai__btn sm" onClick={handleInterpret}>
              <Translate>Regenerate</Translate>
            </button>
            <button
              type="button"
              className="lab-ai__btn sm outline"
              onClick={() => handleCopy(interpretation, severity)}
            >
              <Translate>Copy summary</Translate>
            </button>
          </div>
        </div>

        <div className="lab-ai__severity">
          <span className="lab-ai__muted">
            <Translate>Severity</Translate>
          </span>
          <span className={`lab-ai__pill ${severity.display}`}>
            <Translate>{SEVERITY_LABEL[severity.display] ?? severity.display}</Translate>
          </span>
          {severity.reason && <span>{severity.reason}</span>}
          {severity.guarded && (
            <div className="lab-ai__muted lab-ai__full">
              <Translate>Overall rating could not be confirmed from the listed results.</Translate>
            </div>
          )}
        </div>

        {findings.length > 0 && (
          <div className="lab-ai__section">
            <h3>
              <Translate>Key findings</Translate>
            </h3>
            <table className="lab-ai__findings">
              <thead>
                <tr>
                  <th>
                    <Translate>Test</Translate>
                  </th>
                  <th>
                    <Translate>Value</Translate>
                  </th>
                  <th>
                    <Translate>Range</Translate>
                  </th>
                  <th>
                    <Translate>Flag</Translate>
                  </th>
                  <th>
                    <Translate>Note</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>{findings.map(renderFinding)}</tbody>
            </table>
          </div>
        )}

        {!!interpretation.patterns?.length && (
          <div className="lab-ai__section">
            <h3>
              <Translate>Patterns</Translate>
            </h3>
            {interpretation.patterns.map((pattern, index) => (
              <div key={index} className="lab-ai__box">
                <b>{pattern.label.replace(/_/g, ' ')}</b> — {pattern.reason}
              </div>
            ))}
          </div>
        )}

        {!!interpretation.trends?.length && (
          <div className="lab-ai__section">
            <h3>
              <Translate>Trends</Translate>
            </h3>
            {interpretation.trends.map((trend, index) => (
              <div key={index} className="lab-ai__box">
                <b>{trend.lab_name}</b> <Translate>{trend.direction}</Translate>{' '}
                <span dir="ltr">
                  {trend.from_value ?? '—'} → {trend.to_value ?? '—'}
                  {trend.unit ? ` ${trend.unit}` : ''}
                </span>
                {trend.summary && <div className="lab-ai__muted">{trend.summary}</div>}
              </div>
            ))}
          </div>
        )}

        {!!interpretation.follow_up_considerations?.length && (
          <div className="lab-ai__section">
            <h3>
              <Translate>Follow-up considerations</Translate>
            </h3>
            <ul className="lab-ai__follow">
              {interpretation.follow_up_considerations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="lab-ai__disclaimer">
          <Translate>
            AI interpretation supports, but does not replace, clinical judgment. Not a diagnosis.
          </Translate>
        </div>
      </>
    );
  };

  return (
    <section className="lab-ai">
      <div className="lab-ai__header">
        <LuSparkle size={14} className="lab-ai__spark" />
        <h2>
          <Translate>Lab Interpretation</Translate>
        </h2>
        <span className="lab-ai__chip">
          <LuSparkle size={12} />
          AI
        </span>
      </div>

      <div className="lab-ai__body">
        <Form fluid className="lab-ai__filters">
          <MyInput
            fieldName="dateFrom"
            fieldLabel="From Date"
            fieldType="date"
            record={range}
            setRecord={setRange}
            disabled={isWorking}
            width={160}
          />
          <MyInput
            fieldName="dateTo"
            fieldLabel="To Date"
            fieldType="date"
            record={range}
            setRecord={setRange}
            disabled={isWorking}
            width={160}
          />
          <AiTooltip
            title="AI lab interpretation"
            body="AI reads the lab results in the selected period and highlights abnormal values, patterns and trends. It does not diagnose."
            chips={['Abnormal values', 'Patterns', 'Trends']}
            foot="Nothing is saved to the chart."
          >
            <span className="lab-ai__cta-wrap">
              <button
                type="button"
                className={`lab-ai__cta${isWorking ? ' working' : ''}`}
                disabled={isWorking}
                aria-busy={isWorking}
                onClick={handleInterpret}
              >
                <LuSparkles size={16} className="lab-ai__cta-icon" />
                <Translate>{isWorking ? 'Reviewing results...' : 'Interpret with AI'}</Translate>
              </button>
              <span className="lab-ai__cta-badge" aria-hidden="true">
                AI
              </span>
            </span>
          </AiTooltip>
        </Form>
        <p className="lab-ai__muted lab-ai__hint">
          <Translate>
            Pick the period to interpret. This range is separate from the table filter above.
          </Translate>
        </p>

        {phase === 'idle' && (
          <p className="lab-ai__muted">
            <Translate>
              AI reads the results in this period and highlights abnormal values, patterns and
              trends. Not a diagnosis.
            </Translate>
          </p>
        )}

        {isWorking && (
          <div className="lab-ai__working" role="status">
            <div className="lab-ai__working-title">
              <LuSparkle size={14} className="lab-ai__spark spinning" />
              <Translate>AI is reviewing these results</Translate>
            </div>
            <div className="lab-ai__muted">
              <Translate>This can take up to a minute.</Translate>
            </div>
            <div className="lab-ai__progress" aria-hidden="true">
              <i />
            </div>
            <div className="lab-ai__skeleton" aria-hidden="true">
              <div />
              <div />
              <div />
            </div>
            <div className="lab-ai__working-actions">
              <button type="button" className="lab-ai__btn sm outline" onClick={handleCancel}>
                <Translate>Cancel</Translate>
              </button>
              {isLate && (
                <span className="lab-ai__muted">
                  <Translate>Still working. Larger ranges take longer.</Translate>
                </span>
              )}
            </div>
          </div>
        )}

        {phase === 'empty' && (
          <div className="lab-ai__alert empty">
            <strong>
              <Translate>No labs in this date range.</Translate>
            </strong>{' '}
            <Translate>Adjust the dates and try again.</Translate>
          </div>
        )}

        {phase === 'error' && (
          <div className="lab-ai__alert error">
            <strong>
              <Translate>Lab Interpretation is temporarily unavailable.</Translate>
            </strong>{' '}
            <Translate>You can retry or review the results table above.</Translate>
            <div className="lab-ai__actions">
              <button type="button" className="lab-ai__btn sm" onClick={handleInterpret}>
                <Translate>Try again</Translate>
              </button>
            </div>
          </div>
        )}

        {phase === 'success' && result && renderSuccess(result)}
      </div>
    </section>
  );
};

export default LabInterpretationAI;
