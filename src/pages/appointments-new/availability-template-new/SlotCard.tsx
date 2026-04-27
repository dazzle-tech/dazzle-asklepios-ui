
import React from 'react';

type SlotCardProps = {
  time: string;
  slots: string;
  backgroundColor?: string;
  badgeLabel?: string;
};

const SlotCard: React.FC<SlotCardProps> = ({
  time,
  slots,
  backgroundColor = "#6982F0",
  badgeLabel = "slots available",
}) => {
  function lightenHexColor(hex: string, percent: number) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));

    return `rgb(${r},${g},${b})`;
  }

  const badgeColor = lightenHexColor(backgroundColor, 0.7);
  const badgeText = `${slots} ${badgeLabel} available`;

  return (
      <div className="time-slot"
        style={{ backgroundColor: backgroundColor }}
      >
        <span className="time-text">{time}</span>
        <span className="slots-badge"
          style={{ backgroundColor: badgeColor, color: backgroundColor }}
        >
          {badgeText}
        </span>
      </div>
  );
};

export default SlotCard;

