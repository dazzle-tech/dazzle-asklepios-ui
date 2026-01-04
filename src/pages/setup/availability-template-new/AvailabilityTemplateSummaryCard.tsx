import React from 'react';
import './template-summary-card.less';

type Props = {
  name: string;
  capacity: number;
  step: number;
  slotsBefore: number;
  type?: 'Department Pool' | 'Practitioner' | 'Resource';
  color?: string;
};

const AvailabilityTemplateSummaryCard = ({
  name,
  capacity,
  step,
  slotsBefore,
  type = 'Department Pool',
  color
}: Props) => {
  const typeClass = type.replace(' ', '-').toLowerCase();

  return (
    <div className={`template-summary-card ${typeClass}`}>
      <div
        className="card-header"
        style={
          color
            ? { background: color }
            : undefined
        }
      >
        <span className="card-title">{name}</span>

        <div className="card-actions">
          <button>⚙</button>
          <button>✎</button>
          <button>▾</button>
        </div>
      </div>

      <div className="card-body">
        <div className="card-row type-row">
          <span className="label">Type:</span>
          <span className="value">{type}</span>
        </div>

        <div className="card-row">
          <span className="label">Capacity:</span>
          <span className="value">{capacity} concurrent</span>
        </div>

        <div className="card-row muted">
          <span className="label">Step:</span>
          <span className="value">{step} mins</span>
        </div>

        <div className="card-row muted">
          <span className="label">Slots before:</span>
          <span className="value">{slotsBefore} mins</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTemplateSummaryCard;
