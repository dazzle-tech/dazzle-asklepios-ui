// TimeSlot.tsx
import React from 'react';
// import './TimeSlot.css';

const SlotCard = ({ time, slots }) => {
  return (
    <div className="time-slot">
      <span className="time-text">{time}</span>
      <span className="slots-badge">{slots} slots available</span>
    </div>
  );
};

export default SlotCard;
