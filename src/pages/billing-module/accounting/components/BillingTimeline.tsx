import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

import type { BillingTimelineEvent } from '../utils/billingAccountingUtils';
import { formatBillingTimestamp } from '../utils/billingAccountingUtils';

const DEFAULT_VISIBLE_EVENTS = 5;

type BillingTimelineProps = {
  events: BillingTimelineEvent[];
  loading?: boolean;
};

const dotClassForType = (type: BillingTimelineEvent['type']): string => {
  if (type === 'TREATMENT_STARTED' || type === 'CHARGE_OPENED') {
    return ' billing-accounting__timeline-dot--success';
  }
  if (type === 'PRE_AUTH_REJECTED') {
    return ' billing-accounting__timeline-dot--warning';
  }
  return '';
};

const BillingTimeline: React.FC<BillingTimelineProps> = ({
  events,
  loading = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const eventsSignature = useMemo(
    () => `${events.length}:${events[0]?.id ?? ''}:${events[events.length - 1]?.id ?? ''}`,
    [events]
  );

  useEffect(() => {
    setExpanded(false);
  }, [eventsSignature]);

  if (loading) {
    return <div className="billing-accounting__empty">Building billing timeline...</div>;
  }

  if (!events.length) {
    return (
      <div className="billing-accounting__empty">
        Select an encounter to view treatment and charge events.
      </div>
    );
  }

  const hasMore = events.length > DEFAULT_VISIBLE_EVENTS;
  const visibleEvents =
    expanded || !hasMore ? events : events.slice(0, DEFAULT_VISIBLE_EVENTS);
  const hiddenCount = events.length - DEFAULT_VISIBLE_EVENTS;

  return (
    <div
      className={`billing-accounting__timeline-wrap${
        hasMore && !expanded ? ' billing-accounting__timeline-wrap--collapsed' : ''
      }`}
    >
      <div className="billing-accounting__timeline">
        {visibleEvents.map(event => (
          <div key={event.id} className="billing-accounting__timeline-item">
            <span
              className={`billing-accounting__timeline-dot${dotClassForType(event.type)}`}
            />
            <div className="billing-accounting__timeline-label">{event.label}</div>
            <div className="billing-accounting__timeline-time">
              {formatBillingTimestamp(event.timestamp)}
            </div>
            {event.detail && (
              <div className="billing-accounting__timeline-detail">{event.detail}</div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          className="billing-accounting__timeline-toggle"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
        >
          <span className="billing-accounting__timeline-toggle-text">
            {expanded
              ? 'Show less'
              : `Show ${hiddenCount} more event${hiddenCount === 1 ? '' : 's'}`}
          </span>
          <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
        </button>
      )}
    </div>
  );
};

export default BillingTimeline;
