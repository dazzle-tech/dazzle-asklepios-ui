import React from 'react';

import type { BillingTimelineEvent } from '../utils/billingAccountingUtils';
import { formatBillingTimestamp } from '../utils/billingAccountingUtils';

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

  return (
    <div className="billing-accounting__timeline">
      {events.map(event => (
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
  );
};

export default BillingTimeline;
