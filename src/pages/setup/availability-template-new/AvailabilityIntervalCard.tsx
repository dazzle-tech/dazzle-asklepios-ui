import React from 'react';
import './availability-interval-card.less';

interface Props {
  start: string;
  end: string;
  slotLabel: string;
  type?: 'NORMAL' | 'BREAK';
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AvailabilityIntervalCard: React.FC<Props> = ({
  start,
  end,
  slotLabel,
  type = 'NORMAL',
  onEdit,
  onDelete,
  color
}) => {
  return (
    <div
      className={`availability-interval-card ${type === 'BREAK' ? 'break' : ''}`}
    >
      <div
        className="interval-card-header"
        style={{
          backgroundColor: color || '#4f8df7'
        }}
      >
        <span className="interval-time">
          {start} - {end}
        </span>

        <div className="interval-card-actions">
          {onEdit && <button onClick={onEdit}>✎</button>}
          {onDelete && <button onClick={onDelete}>🗑</button>}
        </div>
      </div>

      <div className="interval-card-body">
        <div className="interval-info">
          <span className="label">Slots:</span>
          <div className="slot-label">{slotLabel}</div>
        </div>

        <div
          className="interval-pattern"
          style={{
            background: color
              ? `repeating-linear-gradient(
                  45deg,
                  ${color}22,
                  ${color}22 6px,
                  ${color}11 6px,
                  ${color}11 12px
                )`
              : undefined
          }}
        />
      </div>
    </div>
  );
};

export default AvailabilityIntervalCard;
