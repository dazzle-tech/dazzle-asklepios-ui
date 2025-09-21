import React, { useState } from 'react';
import { Tag, Whisper, Tooltip, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faStopCircle,
  faThumbsUp,
  faUser,
  faWrench,
  faTimes,
  faHeart,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';
import './bedcard.less';

const BedCards = ({ data = [], handleChangeToOutService, handleChangeToReady }) => {
  const [selectedBed, setSelectedBed] = useState(null);

  // Sort data to show occupied beds first
  const sortedData = [...data].sort((a, b) => {
    const statusA = a?.bed?.statusLvalue?.lovDisplayVale || a?.bed?.statusLkey || '';
    const statusB = b?.bed?.statusLvalue?.lovDisplayVale || b?.bed?.statusLkey || '';

    if (statusA.toLowerCase() === 'occupied' && statusB.toLowerCase() !== 'occupied') {
      return -1;
    }
    if (statusA.toLowerCase() !== 'occupied' && statusB.toLowerCase() === 'occupied') {
      return 1;
    }
    return 0;
  });

  // Filter beds by status
  const occupiedBeds = sortedData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'occupied';
  });

  const emptyBeds = sortedData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'empty';
  });

  const inCleaningBeds = sortedData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'in cleaning';
  });

  const outOfServiceBeds = sortedData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'out of service';
  });

  // Function to group beds into rows of 4
  const groupBeds = (bedsArray, startingRowIndex = 0) => {
    return bedsArray.reduce((acc, item, index) => {
      const rowIndex = Math.floor(index / 4) + startingRowIndex; // Calculate row index
      if (!acc[rowIndex]) acc[rowIndex] = []; // Initialize row if not exists
      acc[rowIndex].push(item); // Add bed to row
      return acc;
    }, {});
  };

  // Initialize groupedData
  let groupedData = {};

  // Add occupied beds in the first row
  groupedData = { ...groupBeds(occupiedBeds, 0) };

  // Add other beds in subsequent rows by type
  let nextRowIndex = Object.keys(groupedData).length;
  groupedData = { ...groupedData, ...groupBeds(emptyBeds, nextRowIndex) };
  nextRowIndex = Object.keys(groupedData).length;
  groupedData = { ...groupedData, ...groupBeds(inCleaningBeds, nextRowIndex) };
  nextRowIndex = Object.keys(groupedData).length;
  groupedData = { ...groupedData, ...groupBeds(outOfServiceBeds, nextRowIndex) };

  // Convert to array for rendering
  groupedData = Object.values(groupedData);

  const handleBedClick = bedData => {
    setSelectedBed(bedData);
  };

  const closeSidebar = () => {
    setSelectedBed(null);
  };

  // Get text color for status
  const getStatusColor = status => {
    if (!status) return 'var(--primary-gray)';
    switch (status.toLowerCase()) {
      case 'empty':
        return 'var(--primary-green)';
      case 'in cleaning':
        return 'var(--primary-orange)';
      case 'occupied':
        return 'var(--very-deep-blue)';
      case 'out of service':
        return 'var(--primary-red)';
      default:
        return 'var(--primary-gray)';
    }
  };

  // Get background color for status
  const getStatusBackColor = status => {
    if (!status) return 'var(--background-gray)';
    switch (status.toLowerCase()) {
      case 'empty':
        return 'var(--light-green)';
      case 'in cleaning':
        return 'var(--light-orange)';
      case 'occupied':
        return 'var(--light-blue)';
      case 'out of service':
        return 'var(--light-red)';
      default:
        return 'var(--background-gray)';
    }
  };

  const getStatusInfo = status => {
    const color = getStatusColor(status);
    const bgColor = getStatusBackColor(status);

    switch (status.toLowerCase()) {
      case 'occupied':
        return {
          color: '#007bff', // Blue text
          bgColor: '#cce5ff', // Light blue background
          borderColor: '#007bff',
          text: 'occupied'
        };
      case 'empty':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-green)',
          text: 'empty'
        };
      case 'in cleaning':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-orange)',
          text: 'in cleaning'
        };
      case 'out of service':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-red)',
          text: 'out of service'
        };
      default:
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-gray)',
          text: status
        };
    }
  };

  const renderBedCard = (item, index) => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || 'available';
    const bedNumber = item?.bed?.name || `10${index + 1}`;
    const patientName = item?.patientName || 'Patient Name';
    const condition = item?.condition || 'Condition';
    const statusInfo = getStatusInfo(status);

    if (status.toLowerCase() === 'occupied') {
      return (
        <div
          key={index}
          className="bed-card occupied-card"
          style={{
            borderColor: statusInfo.borderColor,
            backgroundColor: statusInfo.bgColor,
            cursor: 'pointer'
          }}
          onClick={() => handleBedClick(item)}
        >
          {/* Header */}
          <div className="card-header">
            <div className="bed-number">
              <FontAwesomeIcon icon={faBed} />
              <span>{bedNumber}</span>
            </div>
            <Tag className="tag-style-blue">occupied</Tag>
            <div className="status-indicator occupied"></div>
          </div>

          {/* Patient Info */}
          <div className="patient-info-bed">
            <div className="patient-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} color="#dc3545" />
              <span className="patient-name-1">{patientName}</span>
            </div>
            <div className="condition">{condition}</div>
          </div>

          {/* Vital Signs */}
          <div className="vital-signs-row">
            <div className="vital">
              <FontAwesomeIcon icon={faHeart} color="#dc3545" />
              <span>72</span>
            </div>
            <div className="vital-separator">O₂</div>
            <div className="vital">
              <span>98%</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="card-actions" onClick={e => e.stopPropagation()}>
            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258243122289092') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Deactivate</Tooltip>}>
                <div>
                  <MyButton size="small" onClick={() => handleChangeToOutService(item.bed)}>
                    <FontAwesomeIcon icon={faStopCircle} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258592140444674') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Ready</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => handleChangeToReady(item.bed)}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </div>
        </div>
      );
    } else if (
      status.toLowerCase() === 'out of service' ||
      status.toLowerCase() === 'in cleaning'
    ) {
      return (
        <div
          key={index}
          className="bed-card maintenance-card"
          style={{
            borderColor: statusInfo.borderColor,
            backgroundColor: statusInfo.bgColor,
            cursor: 'pointer'
          }}
          onClick={() => handleBedClick(item)}
        >
          <div className="card-header">
            <div className="bed-number">
              <FontAwesomeIcon icon={faBed} />
              <span>{bedNumber}</span>
            </div>
            <Tag
              style={{
                backgroundColor: statusInfo.color,
                color: '#fff',
                border: 'none',
                fontSize: '11px'
              }}
            >
              {statusInfo.text}
            </Tag>
          </div>

          <div className="maintenance-content">
            <FontAwesomeIcon icon={faWrench} />
            <span>Out of Service</span>
          </div>

          <div className="card-actions" onClick={e => e.stopPropagation()}>
            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258243122289092') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Deactivate</Tooltip>}>
                <div>
                  <MyButton size="small" onClick={() => handleChangeToOutService(item.bed)}>
                    <FontAwesomeIcon icon={faStopCircle} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258592140444674') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Ready</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => handleChangeToReady(item.bed)}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </div>
        </div>
      );
    } else {
      // Empty beds
      return (
        <div
          key={index}
          className="bed-card available-card"
          style={{
            borderColor: statusInfo.borderColor,
            backgroundColor: statusInfo.bgColor,
            cursor: 'pointer'
          }}
          onClick={() => handleBedClick(item)}
        >
          <div className="card-header">
            <div className="bed-number">
              <FontAwesomeIcon icon={faBed} />
              <span>{bedNumber}</span>
            </div>
            <Tag
              style={{
                backgroundColor: statusInfo.color,
                color: '#fff',
                border: 'none',
                fontSize: '11px'
              }}
            >
              {statusInfo.text}
            </Tag>
            <div className="status-indicator available"></div>
          </div>

          <div className="available-content">
            <FontAwesomeIcon icon={faUser} size="2x" color="#ccc" />
            <span>Empty</span>
          </div>

          <div className="card-actions" onClick={e => e.stopPropagation()}>
            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258243122289092') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Deactivate</Tooltip>}>
                <div>
                  <MyButton size="small" onClick={() => handleChangeToOutService(item.bed)}>
                    <FontAwesomeIcon icon={faStopCircle} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {(item?.bed?.statusLkey === '5258572711068224' ||
              item?.bed?.statusLkey === '5258592140444674') && (
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Ready</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => handleChangeToReady(item.bed)}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </div>
        </div>
      );
    }
  };

  const renderBedDetail = () => {
    if (!selectedBed) {
      // Default view when no bed is selected
      return (
        <div className="bed-detail-sidebar">
          <div className="default-sidebar-content">
            <div className="bed-icon-large">
              <FontAwesomeIcon icon={faBed} size="4x" color="#ccc" />
            </div>
            <h6>Select a Bed</h6>
            <p>Click on any bed in the layout to view detailed information and patient data.</p>
          </div>
        </div>
      );
    }

    const status =
      selectedBed?.bed?.statusLvalue?.lovDisplayVale || selectedBed?.bed?.statusLkey || '';
    const bedNumber = selectedBed?.bed?.name || 'N/A';
    const roomNumber = selectedBed?.room?.roomNumber || 'Room 1';

    if (status.toLowerCase() === 'occupied') {
      return (
        <div className="bed-detail-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-row">
              <div className="bed-info">
                <FontAwesomeIcon icon={faBed} />
                <span>Bed : {bedNumber}</span>
              </div>
              <Tag className="tag-style-blue">occupied</Tag>
            </div>

            <button className="close-btn" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="bed-location">
            <span>{roomNumber}</span>
          </div>

          <div className="patient-section">
            <div className="section-header-equipment">
              <FontAwesomeIcon icon={faUser} />
              <h6>Patient Information</h6>
            </div>

            <div className="patient-details">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">Robert Williams</span>
              </div>
              <div className="detail-row">
                <span className="label">Patient ID:</span>
                <span className="value">P004</span>
              </div>
              <div className="detail-row">
                <span className="label">Age:</span>
                <span className="value">71</span>
              </div>
              <div className="detail-row">
                <span className="label">Condition:</span>
                <span className="value">Stroke with intracranial pressure</span>
              </div>
            </div>

            <div className="vital-signs">
              <h6>Current Vital Signs</h6>
              <div className="vitals-grid">
                <div className="vital-item">
                  <span className="vital-icon">♥</span>
                  <span className="vital-value">68 bpm</span>
                </div>
                <div className="vital-item">
                  <span className="vital-icon">🩸</span>
                  <span className="vital-value">160/95 mmHg</span>
                </div>
                <div className="vital-item">
                  <span className="vital-icon">🌡️</span>
                  <span className="vital-value">37°C</span>
                </div>
                <div className="vital-item">
                  <span className="vital-icon">💨</span>
                  <span className="vital-value">96% O₂</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <MyButton className="primary-btn">📋 View Patient Chart</MyButton>
            </div>
          </div>

          <div className="equipment-section">
            <div className="section-header-equipment">
              <FontAwesomeIcon icon={faWrench} />
              <span>Equipment</span>
            </div>
            <div className="equipment-list">
              <div className="equipment-item">
                <span>ICP Monitor</span>
                <span className="status-dot active"></span>
              </div>
              <div className="equipment-item">
                <span>Heart Monitor</span>
                <span className="status-dot active"></span>
              </div>
              <div className="equipment-item">
                <span>IV Pump</span>
                <span className="status-dot active"></span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (status.toLowerCase() === 'empty') {
      return (
        <div className="bed-detail-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-row">
              <div className="bed-info">
                <FontAwesomeIcon icon={faBed} />
                <span>Bed : {bedNumber}</span>
              </div>
              <Tag className="tag-style-green">Empty</Tag>
            </div>

            <button className="close-btn" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="bed-location">
            <span>{roomNumber}</span>
          </div>

          <div className="empty-bed-content">
            <div className="empty-icon">
              <FontAwesomeIcon icon={faUser} size="4x" color="#ccc" />
            </div>
            <Text>Bed Available</Text>
            <p>This bed is ready for patient admission.</p>

            <MyButton className="admit-btn">👤 Admit Patient</MyButton>
          </div>

          <div className="equipment-section">
            <div className="section-header-equipment">
              <FontAwesomeIcon icon={faWrench} />
              <h6>Equipment</h6>
            </div>
            <div className="equipment-list">
              <div className="equipment-item">
                <span>Heart Monitor</span>
                <span className="status-dot active"></span>
              </div>
              <div className="equipment-item">
                <span>IV Pump</span>
                <span className="status-dot active"></span>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bed-detail-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-row">
              <div className="bed-info">
                <FontAwesomeIcon icon={faBed} />
                <span>Bed : {bedNumber}</span>
              </div>
              <Tag className="tag-style-red">out of service</Tag>
            </div>

            <button className="close-btn" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="bed-location">
            <span>{roomNumber}</span>
          </div>

          <div className="maintenance-content-detail">
            <div className="maintenance-icon">
              <FontAwesomeIcon icon={faWrench} size="4x" color="#6c757d" />
            </div>
            <Text>Out of Service</Text>
            <p>This bed is currently out of service and is not available for patients.</p>
          </div>

          <div className="equipment-section">
            <div className="section-header-equipment">
              <FontAwesomeIcon icon={faWrench} />
              <span>Equipment</span>
            </div>
            <div className="equipment-list">
              <div className="equipment-item">
                <span>No equipment assigned</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bedcards-container">
      <div className="icu-floor-plan-wrapper">
        <SectionContainer
          title={''}
          content={
            <div className="icu-floor-plan">
              {groupedData.map((row, rowIndex) => (
                <div key={rowIndex} className="bed-row">
                  <div className="beds-in-row">
                    {row.map((item, bedIndex) => renderBedCard(item, rowIndex * 4 + bedIndex))}
                  </div>
                </div>
              ))}
            </div>
          }
        ></SectionContainer>

        {/* Fixed Sidebar */}
        <div className="sidebar-section">{renderBedDetail()}</div>
      </div>
    </div>
  );
};

export default BedCards;
