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
import DynamicCard from '@/components/DynamicCard';
import BedDetailSidebar from './SideComponent';
import './bedcard.less';

const BedCards = ({ data = [], handleChangeToOutService, handleChangeToReady }) => {
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedBedId, setSelectedBedId] = useState(null);

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
      const rowIndex = Math.floor(index / 4) + startingRowIndex;
      if (!acc[rowIndex]) acc[rowIndex] = [];
      acc[rowIndex].push(item);
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
  const groupedDataArray = Object.values(groupedData);

  const handleBedClick = bedData => {
    const bedId = bedData?.bed?.id || bedData?.bed?.name;
    setSelectedBedId(bedId);
    setSelectedBed(bedData);
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
          color: '#007bff',
          bgColor: '#cce5ff',
          borderColor: '#007bff',
          text: 'Occupied'
        };
      case 'empty':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-green)',
          text: 'Empty'
        };
      case 'in cleaning':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-orange)',
          text: 'In cleaning'
        };
      case 'out of service':
        return {
          color: color,
          bgColor: bgColor,
          borderColor: 'var(--primary-red)',
          text: 'Out of service'
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
    const bedId = item?.bed?.id || bedNumber;
    const patientName = item?.patientName || 'Qais';
    const condition = item?.condition || 'Condition';
    const statusInfo = getStatusInfo(status);

    const isSelected = selectedBedId === bedId;

    // Action buttons component
    const ActionButtons = () => (
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
    );

    // Common styles for all cards
    const commonStyles = {
      borderColor: statusInfo.borderColor,
      backgroundColor: statusInfo.bgColor,
      cursor: 'pointer',
      border: `2px solid ${statusInfo.borderColor}`,
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      position: 'relative',
      minHeight: '150px',
      padding: '15px',
      ...(isSelected && {
        borderWidth: '3px',
        boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
        transform: 'translateY(-2px)'
      })
    };

    if (status.toLowerCase() === 'occupied') {
      const cardData = [
        {
          section: 'left',
          value: (
            <div className="bed-card-content-wrapper">
              {/* Header */}
              <div className="card-headers">
                <div className="bed-number">
                  <FontAwesomeIcon icon={faBed} />
                  <span>{bedNumber}</span>
                </div>
                <Tag className="tag-style-blue">Occupied</Tag>
              </div>

              {/* Patient Info */}
              <div className="patient-info-bed">
                <div className="patient-icon">
                  <FontAwesomeIcon icon={faExclamationTriangle} color="#dc3545" />
                  <span className="patient-name-1">{patientName}</span>
                </div>
                <Text className="condition">{condition}</Text>
              </div>

              {/* Vital Signs */}
              <div className="vital-signs-row">
                <div className="vital">
                  <FontAwesomeIcon icon={faHeart} color="#dc3545" />
                  <span>72</span>
                </div>
                <div className="vital">
                  <div className="vital-separator">O₂</div>
                  <div className="vital">
                    <span>98%</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <ActionButtons />
            </div>
          )
        }
      ];

      return (
        <DynamicCard
          key={index}
          data={cardData}
          width="300px"
          height={'200px'}
          className={`bed-card-dynamic occupied-card ${isSelected ? 'selected' : ''}`}
          style={commonStyles}
          onClick={() => handleBedClick(item)}
        />
      );
    } else if (
      status.toLowerCase() === 'out of service' ||
      status.toLowerCase() === 'in cleaning'
    ) {
      const cardData = [
        {
          section: 'left',
          value: (
            <div className="bed-card-content-wrapper">
              <div className="card-headers">
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
                <FontAwesomeIcon icon={faWrench} size="2x" color="var(--gray-dark)" />
                <span>Out of Service</span>
              </div>

              <ActionButtons />
            </div>
          )
        }
      ];

      return (
        <DynamicCard
          key={index}
          data={cardData}
          width="300px"
          height="200px"
          className={`bed-card-dynamic maintenance-card ${isSelected ? 'selected' : ''}`}
          style={commonStyles}
          onClick={() => handleBedClick(item)}
        />
      );
    } else {
      // Empty beds
      const cardData = [
        {
          section: 'left',
          value: (
            <div className="bed-card-content-wrapper">
              <div className="card-headers">
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

              <div className="available-content">
                <FontAwesomeIcon icon={faUser} size="2x" color="var(--gray-dark)" />
                <span>Empty</span>
              </div>

              <ActionButtons />
            </div>
          )
        }
      ];

      return (
        <DynamicCard
          key={index}
          data={cardData}
          width="300px"
          height="200px"
          className={`bed-card-dynamic available-card ${isSelected ? 'selected' : ''}`}
          style={commonStyles}
          onClick={() => handleBedClick(item)}
        />
      );
    }
  };

  const handlePatientAction = bed => {
    console.log('View Patient Chart for bed:', bed);
  };

  const patientInfo = {
    Name: 'Qais',
    'Patient ID': 'P004',
    Age: '71',
    Condition: 'Stroke with intracranial pressure'
  };

  const vitals = [
    { label: <FontAwesomeIcon icon={faHeart} size="lg" color="red" />, value: ' 68 bpm' },
    { label: '🩸', value: '160/95 mmHg' },
    { label: '🌡️', value: '37°C' },
    { label: '💨', value: '96% O₂' }
  ];

  const equipment = [
    { name: 'ICP Monitor', status: 'active' },
    { name: 'Heart Monitor', status: 'active' },
    { name: 'IV Pump', status: 'active' }
  ];

  return (
    <div className="bedcards-container">
      <div className="icu-floor-plan-wrapper">
        <SectionContainer
          title={''}
          content={
            <div className="icu-floor-plan">
              {groupedDataArray.map((row, rowIndex) => (
                <div key={rowIndex} className="bed-row">
                  <div className="beds-in-row">
                    {row.map((item, bedIndex) => renderBedCard(item, rowIndex * 4 + bedIndex))}
                  </div>
                </div>
              ))}
            </div>
          }
        ></SectionContainer>

        {/* Sidebar */}
        <div className="sidebar-section">
          <BedDetailSidebar
            selectedBed={
              selectedBed
                ? {
                    ...selectedBed,
                    bedNumber: selectedBed?.bed?.name || 'N/A',
                    status: (
                      selectedBed?.bed?.statusLvalue?.lovDisplayVale ||
                      selectedBed?.bed?.statusLkey ||
                      ''
                    ).toLowerCase()
                  }
                : null
            }
            onPatientAction={handlePatientAction}
            patientInfo={patientInfo}
            vitals={vitals}
            equipment={equipment}
            onClose={() => setSelectedBed(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default BedCards;
