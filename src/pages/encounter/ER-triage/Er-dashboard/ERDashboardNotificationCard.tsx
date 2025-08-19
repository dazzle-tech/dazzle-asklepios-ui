import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faCircleExclamation, faBell } from '@fortawesome/free-solid-svg-icons';

const ERDashboardNotificationCard = () => {
  return (
    <div className="ER-dashboard-notification-card-main-box">
      <div className="ER-notification-item">
        <FontAwesomeIcon icon={faClock} className="ER-notification-icon" />
        <span>Patient 1021 is waiting for too long</span>
      </div>
      <div className="ER-notification-item">
        <FontAwesomeIcon icon={faCircleExclamation} className="ER-notification-icon" />
        <span>Bed 07 Vitals instable</span>
      </div>
      <div className="ER-notification-item">
        <FontAwesomeIcon icon={faBell} className="ER-notification-icon" />
        <span>STAT Aspirin Dose Required Bed 10</span>
      </div>
    </div>
  );
};

export default ERDashboardNotificationCard;
