import React from 'react';
import './availability-interval-card.less';

interface Props {
  start: string;
  end: string;
  slotLabel: string;
  type?: 'NORMAL' | 'BREAK';
  onEdit?: () => void;
  onDelete?: () => void;
   backgroundColor?: string;
}

const AvailabilityIntervalCard: React.FC<Props> = ({
  start,
  end,
  slotLabel,
  type = 'NORMAL',
  onEdit,
  onDelete,
  backgroundColor = "#6982F0"
}) => {
  function hexToRGBA(hex, opacity = 0.2) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return (
       <div className='availability-template-summary-card' style={{backgroundColor: hexToRGBA(backgroundColor, 0.2)}}>
          {/* Header */}
          <div className='header-of-availability-template-summary-card' style={{backgroundColor: backgroundColor}}>
            <span>{start} - {end}</span>
            
          </div>
    
          {/* Body */}
          <div className='body-of-availability-template-summary-card'>
            <div>
              <span>Slots:</span> {slotLabel}
            </div>
          </div>
        </div>
  );
};

export default AvailabilityIntervalCard;


