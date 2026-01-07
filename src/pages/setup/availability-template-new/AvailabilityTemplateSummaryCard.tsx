
import React, { useState } from 'react';
import { CiSquareMinus } from "react-icons/ci";
import { FaRegEdit } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { Tooltip, Whisper } from 'rsuite';

type DepartmentPoolCardProps = {
  title: string;
  type: string;
  capacity: string;
  services: string[];
  onSettingsClick?: () => void;
  backgroundColor?: string;
};

const AvailabilityTemplateSummaryCard: React.FC<DepartmentPoolCardProps> = ({
  title,
  type,
  capacity,
  services,
  onSettingsClick,
  backgroundColor = "#6982F0"
}) => {
  const [showServicesPopup, setShowServicesPopup] = useState(false);

  function hexToRGBA(hex: string, opacity = 0.2) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return (
    <div
      className="availability-template-summary-card"
      style={{ backgroundColor: hexToRGBA(backgroundColor, 0.2) }}
    >
      {/* Header */}
      <div
        className="header-of-availability-template-summary-card"
        style={{ backgroundColor }}
      >
        <span style={styles.title}>{title}</span>

        <div style={{ display: 'flex', gap: '5px' }}>
          <IoSettingsSharp onClick={onSettingsClick} />
          <CiSquareMinus />
          <FaRegEdit />
        </div>
      </div>

      {/* Body */}
      <div className="body-of-availability-template-summary-card">
        <div>
          <strong>Type:</strong> {type}
        </div>

        <div>
          <strong>Capacity:</strong> {capacity}
        </div>

 <Whisper placement="top" trigger="click" speaker={<Tooltip>{services.join(', ')}</Tooltip>}>
            <div  className="services-text">
          <strong>Services allowed:&nbsp;</strong>


          <span
            // className="services-text"
            onClick={() => setShowServicesPopup(true)}
            title="Click to view all services"
          >
            {services.join(', ')}
          </span>
        </div>
          </Whisper>
       
      </div>

    </div>
  );
};

export default AvailabilityTemplateSummaryCard;

/* ---------- styles ---------- */

const styles: { [key: string]: React.CSSProperties } = {
  title: {
    fontWeight: 600,
  },
};
