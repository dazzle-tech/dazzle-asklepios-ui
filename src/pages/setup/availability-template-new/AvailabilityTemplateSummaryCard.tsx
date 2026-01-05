// import React from 'react';
// import './template-summary-card.less';

// type Props = {
//   name: string;
//   capacity: number;
//   step: number;
//   slotsBefore: number;
//   type?: 'Department Pool' | 'Practitioner' | 'Resource';
//   color?: string;
// };

// const AvailabilityTemplateSummaryCard = ({
//   name,
//   capacity,
//   step,
//   slotsBefore,
//   type = 'Department Pool',
//   color
// }: Props) => {
//   const typeClass = type.replace(' ', '-').toLowerCase();

//   return (
//     <div className={`template-summary-card ${typeClass}`}>
//       <div
//         className="card-header"
//         style={
//           color
//             ? { background: color }
//             : undefined
//         }
//       >
//         <span className="card-title">{name}</span>

//         <div className="card-actions">
//           <button>⚙</button>
//           <button>✎</button>
//           <button>▾</button>
//         </div>
//       </div>

//       <div className="card-body">
//         <div className="card-row type-row">
//           <span className="label">Type:</span>
//           <span className="value">{type}</span>
//         </div>

//         <div className="card-row">
//           <span className="label">Capacity:</span>
//           <span className="value">{capacity} concurrent</span>
//         </div>

//         <div className="card-row muted">
//           <span className="label">Step:</span>
//           <span className="value">{step} mins</span>
//         </div>

//         <div className="card-row muted">
//           <span className="label">Slots before:</span>
//           <span className="value">{slotsBefore} mins</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AvailabilityTemplateSummaryCard;



// import React from 'react';
// import { CiSquareMinus } from "react-icons/ci";
// import { FaRegEdit } from "react-icons/fa";
// import { IoSettingsSharp } from "react-icons/io5";

// type DepartmentPoolCardProps = {
//   title: string;
//   type: string;
//   capacity: string;
//   services: string[];
//   onSettingsClick?: () => void;
//   backgroundColor?: string;
// };

// const AvailabilityTemplateSummaryCard: React.FC<DepartmentPoolCardProps> = ({
//   title,
//   type,
//   capacity,
//   services,
//   onSettingsClick,
//   backgroundColor = "#6982F0"
// }) => {
//   function hexToRGBA(hex, opacity = 0.2) {
//     hex = hex.replace('#', '');
//     let r = parseInt(hex.substring(0, 2), 16);
//     let g = parseInt(hex.substring(2, 4), 16);
//     let b = parseInt(hex.substring(4, 6), 16);

//     return `rgba(${r}, ${g}, ${b}, ${opacity})`;
//   }
//   return (
//     <div className='availability-template-summary-card' style={{backgroundColor: hexToRGBA(backgroundColor, 0.2)}}>
//       {/* Header */}
//       <div className='header-of-availability-template-summary-card' style={{backgroundColor: backgroundColor}}>
//         <span style={styles.title}>{title}</span>
//         <div style={{display: 'flex', gap:'5px'}}>
        
//         <IoSettingsSharp  onClick={onSettingsClick}/>
//         <CiSquareMinus/>
//         <FaRegEdit />

//         </div>
//       </div>

//       {/* Body */}
//       <div className='body-of-availability-template-summary-card'>
//         <div>
//           <strong>Type:</strong> {type}
//         </div>
//         <div>
//           <strong>Capacity:</strong> {capacity}
//         </div>
//         <div>
//           <strong>Services allowed:</strong> {services.join(', ')}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AvailabilityTemplateSummaryCard;

// /* ---------- styles ---------- */

// const styles: { [key: string]: React.CSSProperties } = {
 
//   title: {
//     fontWeight: 600,
//   },
 
 
// };


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
        {/* <div  className="services-text">
          <strong>Services allowed:&nbsp;</strong>


          <span
            // className="services-text"
            onClick={() => setShowServicesPopup(true)}
            title="Click to view all services"
          >
            {services.join(', ')}
          </span>
        </div> */}
      </div>

      {/* Popup */}
      {/* {showServicesPopup && (
        <div className="services-popup" onClick={() => setShowServicesPopup(false)}>
          <div
            className="services-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <strong>Services allowed</strong>

            <ul>
              {services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>

            <button onClick={() => setShowServicesPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )} */}
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
