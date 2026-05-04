import React from "react";

type SlotCardProps = {
  time: string;
  slotsCount: string;
  backgroundColor?: string;
  badgeLabel?: string;
};

const SlotCard: React.FC<SlotCardProps> = ({
  time,
  slotsCount,
  backgroundColor = "#6982F0",
  badgeLabel = "slots",
}) => {
  const lightenColor = (hexColor: string, lightenFactor: number): string => {
    const sanitizedHex = hexColor.replace("#", "");

    const red = parseInt(sanitizedHex.substring(0, 2), 16);
    const green = parseInt(sanitizedHex.substring(2, 4), 16);
    const blue = parseInt(sanitizedHex.substring(4, 6), 16);

    const lightenChannel = (channel: number) =>
      Math.min(255, Math.floor(channel + (255 - channel) * lightenFactor));

    const newRed = lightenChannel(red);
    const newGreen = lightenChannel(green);
    const newBlue = lightenChannel(blue);

    return `rgb(${newRed}, ${newGreen}, ${newBlue})`;
  };

  const badgeBackgroundColor = lightenColor(backgroundColor, 0.7);
  const badgeText = `${slotsCount} ${badgeLabel} available`;

  return (
    <div
      className="time-slot"
      style={{ backgroundColor }}
    >
      <span className="time-text">{time}</span>

      <span
        className="slots-badge"
        style={{
          backgroundColor: badgeBackgroundColor,
          color: backgroundColor,
        }}
      >
        {badgeText}
      </span>
    </div>
  );
};

export default SlotCard;