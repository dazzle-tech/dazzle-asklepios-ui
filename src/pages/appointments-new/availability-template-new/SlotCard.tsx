import React from 'react';

const lightenHex = (hex: string, percent: number): string => {
  const clean = hex.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * percent));
  const g = Math.min(255, Math.floor(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * percent));
  const b = Math.min(255, Math.floor(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * percent));
  return `rgb(${r},${g},${b})`;
};

type Props = {
  time: string;
  slots: string;
  backgroundColor?: string;
  badgeLabel?: string;
};

const SlotCard: React.FC<Props> = ({ time, slots, backgroundColor = '#6982F0', badgeLabel = 'slots available' }) => {
  const badgeColor = lightenHex(backgroundColor, 0.7);

  return (
    <div className="time-slot" style={{ backgroundColor }}>
      <span className="time-text">{time}</span>
      <span className="slots-badge" style={{ backgroundColor: badgeColor, color: backgroundColor }}>
        {slots} {badgeLabel} available
      </span>
    </div>
  );
};

export default SlotCard;
