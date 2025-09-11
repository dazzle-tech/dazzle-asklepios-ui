import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { Divider } from 'rsuite';

const SectionSummary = ({ title, content, icon = faClipboardList }) => {
  return (
    <div className="medical-container-div">
      <div className="medical-header-div">
        <div className="patient-history-title">
          <FontAwesomeIcon icon={icon} className="patient-history-icon" />
          <span>{title}</span>
        </div>
      </div>
      <Divider className="divider-line" />
      <div className="medical-table-div-2">
        <div className="patient-history-card">
          <div className="patient-history-blue-line"></div>
          <div className="patient-history-content">
            <div className="patient-history-text">{content}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionSummary;
