import React from 'react';
import BoardIcon from './BoardIcon';
import {
  CTAS_COLOR_VAR,
  CTAS_TARGET_MINUTES,
  formatBoardDuration,
  formatLosOrDash
} from './erBedBoardUtils';
import type { TriageQueueItem } from './useERBedBoardData';
import './triageQueue.less';

type TriageQueueProps = {
  items: TriageQueueItem[];
  filteredItems: TriageQueueItem[];
  waitingOverTarget: number;
  nowMs: number;
  hasError: boolean;
  isLoading: boolean;
  isFetching: boolean;
};

type TriageQueueRowProps = {
  item: TriageQueueItem;
  nowMs: number;
};

const TriageQueueRow = ({
  item,
  nowMs
}: TriageQueueRowProps) => {
  const waitedMs =
    item.arrivalMs != null && Number.isFinite(item.arrivalMs)
      ? Math.max(0, nowMs - item.arrivalMs)
      : null;

  const target =
    item.ctas != null
      ? (CTAS_TARGET_MINUTES[item.ctas] ?? null)
      : null;

  const overMs =
    waitedMs != null && target != null
      ? Math.max(0, waitedMs - target * 60000)
      : null;

  const over = overMs != null && overMs > 0;

  const targetText =
    waitedMs == null
      ? 'Arrival unavailable'
      : target == null
        ? 'Target unavailable'
        : overMs != null && overMs > 0
          ? `Over by ${formatBoardDuration(overMs)}`
          : target === 0
            ? 'See immediately'
            : `Target ${target} min`;

  const patientDetail = [item.initials, item.ageSex]
    .filter(Boolean)
    .join(' · ');

  const levelColor =
    item.ctas != null
      ? CTAS_COLOR_VAR[item.ctas]
      : undefined;

  return (
    <li
      className={`tq-row${over ? ' is-over' : ''}`}
      style={
        {
          '--tq-level':
            levelColor || 'var(--ebb-dim, #91a2b6)'
        } as React.CSSProperties
      }
    >
      <div
        className="tq-level"
        aria-label={`CTAS ${item.ctas ?? 'unavailable'}`}
      >
        <strong>{item.ctas ?? '—'}</strong>
        <span>CTAS</span>
      </div>

      <div className="tq-person">
        <strong
          className="tq-mrn"
          dir="ltr"
          title={item.mrn}
        >
          {item.mrn || '—'}
        </strong>

        <p className="tq-demographics" title={patientDetail}>
          {patientDetail || '—'}
        </p>

        {item.chiefComplaint && (
          <p
            className="tq-complaint"
            title={item.chiefComplaint}
          >
            {item.chiefComplaint}
          </p>
        )}

        {item.encounterNumber && (
          <span
            className="tq-visit"
            title={`Visit No. ${item.encounterNumber}`}
          >
            Visit No.{' '}
            <b dir="ltr">{item.encounterNumber}</b>
          </span>
        )}
      </div>

      <div className="tq-wait">
        <strong dir="ltr">
          {formatLosOrDash(waitedMs)}
        </strong>
        <span>{targetText}</span>
      </div>
    </li>
  );
};

const TriageQueue = ({
  items,
  filteredItems,
  waitingOverTarget,
  nowMs,
  hasError,
  isLoading,
  isFetching
}: TriageQueueProps) => {
  const loading = !items.length && (isLoading || isFetching);

  return (
    <section
      className="ebb-panel ebb-queue-panel tq-panel"
      aria-labelledby="ebb-triage-title"
      aria-busy={isLoading || isFetching}
    >
      <header className="tq-header">
        <div>
          <h2 id="ebb-triage-title">Triage queue</h2>

          <span className="tq-count">
            {hasError || loading ? '—' : filteredItems.length}
          </span>
        </div>

        <span title="Prioritized by CTAS, then arrival">
          by CTAS
        </span>
      </header>

      <ol className="tq-list">
        {hasError ? (
          <li className="tq-empty" role="status">
            <BoardIcon name="alert" />
            <strong>Triage queue unavailable</strong>
            <span>Refresh to try again.</span>
          </li>
        ) : loading ? (
          <li className="tq-empty" role="status">
            <BoardIcon name="refresh" />
            <strong>Loading triage queue…</strong>
            <span>Fetching eligible encounters.</span>
          </li>
        ) : !filteredItems.length ? (
          <li className="tq-empty">
            <BoardIcon name="check" />

            <strong>
              {items.length
                ? 'No matching patients'
                : 'Queue is clear'}
            </strong>

            <span>
              {items.length
                ? 'Try a different search.'
                : 'No patients are currently waiting.'}
            </span>
          </li>
        ) : (
          filteredItems.map(item => (
            <TriageQueueRow
              key={item.id}
              item={item}
              nowMs={nowMs}
            />
          ))
        )}
      </ol>

      <footer className="tq-footer">
        <span>
          <BoardIcon name="shield" />
          Read-only
        </span>

        {!hasError && !loading && (
          <strong
            className={waitingOverTarget ? 'is-over' : ''}
            title="Department-wide count before search filtering"
          >
            {waitingOverTarget} over target
          </strong>
        )}
      </footer>
    </section>
  );
};

export default TriageQueue;