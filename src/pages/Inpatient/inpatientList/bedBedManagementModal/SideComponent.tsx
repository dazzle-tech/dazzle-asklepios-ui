import React from 'react';
import { Tag, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faTimes, faUser, faWrench } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import './bedcard.less';

const statusStyles = {
  empty: { tagColor: 'tag-style-green', bg: '#e6f4ea', text: 'Empty' },
  occupied: { tagColor: 'tag-style-blue', bg: '#cce5ff', text: 'Occupied' },
  'in cleaning': { tagColor: 'tag-style-orange', bg: '#ffe5cc', text: 'In Cleaning' },
  'out of service': { tagColor: 'tag-style-red', bg: '#f8d7da', text: 'Out of Service' }
};

const BedDetailSidebar = ({
  selectedBed = null,
  patientInfo = null,
  vitals = [],
  equipment = [],
  onClose = null,
  onPatientAction,
  onEquipmentAction = null
}) => {
  if (!selectedBed) {
    return (
      <div className="bed-detail-sidebar">
        <div className="default-sidebar-content">
          <div className="bed-icon-large">
            <FontAwesomeIcon icon={faBed} size="4x" color="var(--gray-dark)" />
          </div>
          <h6>Select a Bed</h6>
          <p>Click on any bed in the layout to view detailed information and patient data.</p>
        </div>
      </div>
    );
  }

  const status = (selectedBed.status || 'empty').toLowerCase();
  const style = statusStyles[status] || statusStyles.empty;
  const roomNumber = selectedBed.room?.roomNumber || 'Room 1';

  return (
    <div className="bed-detail-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <div className="bed-info">
            <FontAwesomeIcon icon={faBed} />
            <span>Bed : {selectedBed.bedNumber}</span>
          </div>
          <Tag className={style.tagColor}>{style.text}</Tag>
        </div>
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="bed-location">
        <span className="bed-text">{roomNumber}</span>
      </div>

      {/* Patient Info */}
      {patientInfo && status === 'occupied' && (
        <div className="patient-section">
          <div className="section-header-equipment">
            <FontAwesomeIcon icon={faUser} />
            <h6>Patient Information</h6>
          </div>

          <div className="patient-details">
            {Object.entries(patientInfo).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="label">{key}:</span>
                <span className="value">{value}</span>
              </div>
            ))}
          </div>

          {/* Vital Signs */}
          {vitals.length > 0 && (
            <div className="vital-signs">
              <h6>Current Vital Signs</h6>
              <div className="vitals-grid">
                {vitals.map((vital, index) => (
                  <div key={index} className="vital-item">
                    <span className="vital-icon">{vital.label}</span>
                    <span className="vital-value">{vital.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {onPatientAction && (
            <div className="action-buttons">
              <MyButton className="primary-btn" onClick={() => onPatientAction(selectedBed)}>
                📋 View Patient Chart
              </MyButton>
            </div>
          )}
        </div>
      )}

      {/* Empty Bed Content */}
      {status === 'empty' && (
        <div className="empty-bed-content">
          <div className="empty-icon">
            <FontAwesomeIcon icon={faUser} size="4x" color="var(--icon-gray)" />
          </div>
          <Text className="bed-text">Bed Available</Text>
          <p className="bed-text">This bed is ready for patient admission.</p>

          <MyButton className="admit-btn">👤 Admit Patient</MyButton>
        </div>
      )}

      {/* Out of Service Content */}
      {(status === 'out of service' || status === 'in cleaning') && (
        <div className="maintenance-content-detail">
          <div className="maintenance-icon">
            <FontAwesomeIcon icon={faWrench} size="4x" color="var(--icon-gray)" />
          </div>
          <Text className="bed-text">Out of Service</Text>
          <p className="bed-text">
            This bed is currently out of service and is not available for patients.
          </p>
        </div>
      )}

      {/* Equipment */}
      <div className="equipment-section">
        <div className="section-header-equipment">
          <FontAwesomeIcon icon={faWrench} />
          <h6>Equipment</h6>
        </div>
        <div className="equipment-list">
          {equipment.length > 0 ? (
            equipment.map((eq, i) => (
              <div key={i} className="equipment-item">
                <span>{eq.name}</span>
                {eq.status && <span className={`status-dot ${eq.status}`}></span>}
              </div>
            ))
          ) : (
            <div className="equipment-item">
              <span>No equipment assigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BedDetailSidebar;
