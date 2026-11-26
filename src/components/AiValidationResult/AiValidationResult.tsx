import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  LuAlertCircle,
  LuAlertOctagon,
  LuAlertTriangle,
  LuArrowRight,
  LuCheckCircle2,
  LuChevronDown,
  LuChevronUp,
  LuCloudOff,
  LuInfo,
  LuSparkle
} from 'react-icons/lu';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import AiTooltip from '@/components/AiTooltip/AiTooltip';
import type { ValidationResponseDTO } from '@/types/model-types-new';
import './styles.less';

// Sparkle icon from the AI validation prototype
const SparkIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 3l1.7 4.8L16.5 9.5l-4.8 1.7L10 16l-1.7-4.8L3.5 9.5l4.8-1.7L10 3Z" fill="currentColor" />
    <path d="M18.5 14l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" fill="currentColor" />
  </svg>
);

type Props = {
  // RTK Query mutation result of the validation call
  validation: { data?: unknown; isLoading: boolean; isError: boolean };
  onRetry: () => void;
  // Tells the modal whether Save can be pressed (acknowledgment given when there are serious findings)
  onReadyChange?: (ready: boolean) => void;
  onContinueWithoutAi?: () => void;
  // Closes the popup so the user edits the draft and submits again, which runs a new validation
  onEdit?: () => void;
  editLabel?: string;
  loadingLabel?: string;
  noIssuesText?: string;
  unavailableText?: string;
};

type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info';
type Finding = {
  index: number;
  item: string;
  severity: Severity;
  issue: string;
  recommendation: string;
  evidence: string;
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'moderate', 'low', 'info'];
const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  info: 'Info'
};
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#d32f2f',
  high: '#c2410c',
  moderate: '#8a5a00',
  low: '#1d4ed8',
  info: '#0779ab'
};
// Same icons as the prototype's severity pills
const SEVERITY_ICON: Record<Severity, React.ElementType> = {
  critical: LuAlertOctagon,
  high: LuAlertTriangle,
  moderate: LuAlertCircle,
  low: LuInfo,
  info: LuInfo
};
const STATUS_VIEW: Record<string, { kind: string; label: string; Icon: React.ElementType }> = {
  SAFE: { kind: 'safe', label: 'No concerns found', Icon: LuCheckCircle2 },
  CAUTION: { kind: 'caution', label: 'Review suggested', Icon: LuAlertTriangle },
  CONTRAINDICATED: { kind: 'contra', label: 'Needs attention', Icon: LuAlertOctagon }
};
const VISIBLE_ALTERNATIVES = 3;

const normalizeSeverity = (value: unknown): Severity => {
  const severity = String(value ?? '')
    .trim()
    .toLowerCase();
  if (severity === 'critical') return 'critical';
  if (severity === 'high') return 'high';
  if (severity === 'moderate' || severity === 'medium') return 'moderate';
  if (severity === 'low') return 'low';
  return 'info';
};

// The service has no category field, so it is read from the issue text
const categoryOf = (issue: string) => {
  const text = issue.toLowerCase();
  if (text.includes('allerg')) return 'Allergy';
  if (text.includes('interact')) return 'Interaction';
  if (text.includes('duplicat')) return 'Duplicate therapy';
  if (text.includes('contraindicat')) return 'Contraindication';
  if (text.includes('dose') || text.includes('dosing')) return 'Dosing';
  return null;
};

const AiValidationResult: React.FC<Props> = ({
  validation,
  onRetry,
  onReadyChange,
  onContinueWithoutAi,
  onEdit,
  editLabel = 'Edit',
  loadingLabel = 'AI is validating',
  noIssuesText = 'Everything looks appropriate for this patient.',
  unavailableText = 'Your draft is saved. You can continue.'
}) => {
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [openEvidence, setOpenEvidence] = useState<Set<number>>(new Set());
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [showAllAlternatives, setShowAllAlternatives] = useState(false);
  const [ackRecord, setAckRecord] = useState({ acknowledged: false });
  const acknowledged = ackRecord.acknowledged;

  const response = validation.data as ValidationResponseDTO | undefined;

  const findings = useMemo<Finding[]>(
    () =>
      (response?.detailed_validations ?? [])
        .map((d: any, index: number) => ({
          index,
          item: d?.item ?? '',
          severity: normalizeSeverity(d?.severity),
          issue: d?.issue ?? '',
          recommendation: d?.recommendation ?? '',
          evidence: d?.evidence ?? ''
        }))
        .sort(
          (a, b) =>
            SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
            a.index - b.index
        ),
    [response]
  );

  const alternatives = response?.recommended_alternatives ?? [];
  const needsAcknowledgment = findings.some(
    f => f.severity === 'critical' || f.severity === 'high'
  );

  useEffect(() => {
    // Serious findings block Save until the user confirms they reviewed them
    onReadyChange?.(!validation.isLoading && (!needsAcknowledgment || acknowledged));
  }, [validation.isLoading, needsAcknowledgment, acknowledged, onReadyChange]);

  const toggle = (set: Set<number>, value: number) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  if (validation.isLoading) {
    return (
      <div className="mv-loading" role="status" aria-label={loadingLabel} aria-busy="true">
        <span className="mv-loading__progress" />
        <div className="mv-orb">
          <span className="mv-orb__core">
            <SparkIcon size={40} />
          </span>
          <span className="mv-orb__mini mv-orb__mini--1">
            <SparkIcon size={18} />
          </span>
          <span className="mv-orb__mini mv-orb__mini--2">
            <SparkIcon size={14} />
          </span>
        </div>
        <div className="mv-sk-banner">
          <span className="mv-sk-circle mv-shim" />
          <div className="mv-sk-lines">
            <span className="mv-sk-bar mv-shim" style={{ width: '28%' }} />
            <span className="mv-sk-bar mv-shim" style={{ width: '80%' }} />
          </div>
        </div>
        {[0, 1].map(i => (
          <div key={i} className="mv-sk-card">
            <div className="mv-sk-row">
              <span className="mv-sk-pill mv-shim" />
              <span className="mv-sk-bar mv-shim" style={{ width: '42%' }} />
            </div>
            <span className="mv-sk-bar mv-shim" style={{ width: '92%' }} />
            <span className="mv-sk-bar mv-shim" style={{ width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (validation.isError) {
    return (
      <div className="mv-state mv-state--error">
        <span className="mv-state__icon">
          <LuCloudOff size={24} />
        </span>
        <h3>
          <Translate>AI validation is temporarily unavailable</Translate>
        </h3>
        <p>
          <Translate>{unavailableText}</Translate>
        </p>
        <div className="mv-state__actions">
          <MyButton onClick={onRetry}>Retry</MyButton>
          {onContinueWithoutAi && (
            <MyButton appearance="ghost" onClick={onContinueWithoutAi}>
              Continue without AI
            </MyButton>
          )}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="mv-state">
        <Translate>No validation result available</Translate>
      </div>
    );
  }

  const status =
    STATUS_VIEW[String(response.quick_summary?.overall_status ?? '').toUpperCase()] ??
    STATUS_VIEW.CAUTION;
  const confidence = Math.round(Number(response.confidence_score ?? 0) * 100);
  const counts = SEVERITY_ORDER.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: findings.filter(f => f.severity === s).length }),
    { all: findings.length }
  );
  const shownFindings = filter === 'all' ? findings : findings.filter(f => f.severity === filter);
  const shownAlternatives = showAllAlternatives
    ? alternatives
    : alternatives.slice(0, VISIBLE_ALTERNATIVES);
  const StatusIcon = status.Icon;

  return (
    <div className="mv">
      <div className={`mv-banner mv-banner--${status.kind}`}>
        <span className="mv-banner__icon">
          <StatusIcon size={20} />
        </span>
        <div className="mv-banner__text">
          <div className="mv-banner__label">
            <Translate>{status.label}</Translate>
          </div>
          <p>{response.quick_summary?.top_priority}</p>
        </div>
        <div className="mv-confidence">
          <AiTooltip
            title="AI confidence"
            body="How sure the AI model is about this result. It is model confidence, not clinical certainty. Always apply your own judgment."
          >
            <span className="mv-confidence__label">
              <Translate>AI confidence</Translate> <b>{confidence}%</b>
              <span className="mv-info">i</span>
            </span>
          </AiTooltip>
          <span
            className="mv-meter"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={confidence}
          >
            <i style={{ width: `${confidence}%` }} />
          </span>
        </div>
      </div>

      <section>
        <div className="mv-section-head">
          <h3>
            <Translate>Findings</Translate> ({findings.length})
          </h3>
          {findings.length > 0 && (
            <div className="mv-filters">
              {(['all', ...SEVERITY_ORDER] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  disabled={key !== 'all' && !counts[key]}
                  onClick={() => setFilter(key)}
                >
                  <Translate>{key === 'all' ? 'All' : SEVERITY_LABEL[key]}</Translate>{' '}
                  <b>{counts[key]}</b>
                </button>
              ))}
            </div>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="mv-none">
            <LuCheckCircle2 size={28} />
            <div>
              <b>
                <Translate>No issues found</Translate>
              </b>
              <span>
                <Translate>{noIssuesText}</Translate>
              </span>
            </div>
          </div>
        ) : (
          <div className="mv-findings">
            {shownFindings.map(finding => {
              const category = categoryOf(finding.issue);
              const evidenceOpen = openEvidence.has(finding.index);
              return (
                <article
                  key={finding.index}
                  className={`mv-finding mv-finding--${finding.severity}`}
                >
                  <div className="mv-finding__top">
                    <MyBadgeStatus
                      color={SEVERITY_COLOR[finding.severity]}
                      contant={SEVERITY_LABEL[finding.severity]}
                      icon={React.createElement(SEVERITY_ICON[finding.severity], { size: 12 })}
                    />
                    <span className="mv-finding__item">{finding.item}</span>
                    {category && (
                      <span className="mv-finding__category">
                        <MyBadgeStatus color="var(--rs-text-secondary)" contant={category} />
                      </span>
                    )}
                  </div>
                  <dl className="mv-finding__grid">
                    <dt>
                      <Translate>Issue</Translate>
                    </dt>
                    <dd>{finding.issue}</dd>
                    <dt>
                      <Translate>Recommendation</Translate>
                    </dt>
                    <dd>{finding.recommendation}</dd>
                  </dl>
                  {finding.evidence && (
                    <>
                      <MyButton
                        appearance="link"
                        prefixIcon={evidenceOpen ? LuChevronUp : LuChevronDown}
                        onClick={() => setOpenEvidence(prev => toggle(prev, finding.index))}
                      >
                        {evidenceOpen ? 'Hide evidence' : 'Show evidence'}
                      </MyButton>
                      {evidenceOpen && (
                        <div className="mv-evidence">
                          <b>
                            <Translate>Evidence</Translate>:
                          </b>{' '}
                          {finding.evidence}
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {alternatives.length > 0 && (
        <section>
          <div className="mv-section-head">
            <h3>
              <Translate>Recommended alternatives</Translate> ({alternatives.length})
            </h3>
          </div>
          <div className="mv-alternatives">
            {shownAlternatives.map((alternative: any, index: number) => {
              const isDismissed = dismissed.has(index);
              return (
                <article key={index} className={`mv-alternative${isDismissed ? ' dismissed' : ''}`}>
                  <div className="mv-alternative__flow">
                    <span className="from">{alternative?.original_item}</span>
                    <LuArrowRight size={14} className="arrow" />
                    <span className="to">{alternative?.alternative}</span>
                    {isDismissed && (
                      <span className="mv-alternative__dismissed">
                        <Translate>Dismissed</Translate>
                        <MyButton
                          appearance="link"
                          onClick={() => setDismissed(prev => toggle(prev, index))}
                        >
                          Undo
                        </MyButton>
                      </span>
                    )}
                  </div>
                  {!isDismissed && (
                    <>
                      {alternative?.rationale && (
                        <p className="mv-alternative__why">
                          <b>
                            <Translate>Why</Translate>:
                          </b>{' '}
                          {alternative.rationale}
                        </p>
                      )}
                      <div className="mv-alternative__actions">
                        {onEdit && (
                          <MyButton appearance="ghost" onClick={onEdit}>
                            {editLabel}
                          </MyButton>
                        )}
                        <MyButton
                          appearance="subtle"
                          onClick={() => setDismissed(prev => toggle(prev, index))}
                        >
                          Dismiss
                        </MyButton>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
          {alternatives.length > VISIBLE_ALTERNATIVES && (
            <MyButton appearance="link" onClick={() => setShowAllAlternatives(v => !v)}>
              {showAllAlternatives ? 'Show fewer' : 'Show all'}
            </MyButton>
          )}
        </section>
      )}

      <div className="mv-foot">
        <span className="mv-foot__disclaimer">
          <LuSparkle size={13} />
          <Translate>AI suggestions support, not replace, clinical judgment.</Translate>
        </span>
        {response.timestamp && (
          <span>
            <Translate>Generated</Translate> {dayjs(response.timestamp).format('HH:mm')}
          </span>
        )}
      </div>

      {needsAcknowledgment && (
        <Form className={`mv-ack${acknowledged ? ' done' : ''}`}>
          <MyInput
            fieldName="acknowledged"
            fieldType="check"
            fieldLabel="I have reviewed the AI findings"
            showLabel={false}
            record={ackRecord}
            setRecord={setAckRecord}
          />
        </Form>
      )}
    </div>
  );
};

export default AiValidationResult;
