import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartbeat,
  faVial,
  faSyringe,
  faDroplet,
  faUserMd,
  faProcedures,
  faXRay,
  faPills,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faPause,
  faStop,
  faFastForward,
  faBackward,
  faCalendarCheck,
  faNotesMedical
} from '@fortawesome/free-solid-svg-icons';

const MedicalTimeline = ({ patient, encounter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [viewMode, setViewMode] = useState('all'); 
  const intervalRef = useRef(null);

  const firstVisitDate = patient?.firstVisitDate
    ? new Date(patient.firstVisitDate)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); 
  const currentTime = new Date();
  const totalDuration = currentTime.getTime() - firstVisitDate.getTime();

  // Initialize time range
  useEffect(() => {
    setTimeRange({
      start: firstVisitDate,
      end: currentTime
    });
    setCurrentPlayTime(firstVisitDate);
  }, [patient]);

  const patientHistoricalData = [
    {
      id: 1,
      type: 'visits',
      title: 'Visits',
      icon: faCalendarCheck,
      color: '#6f42c1',
      items: [
        {
          name: 'Initial Visit - Cardiology',
          time: new Date(firstVisitDate.getTime()),
          type: 'first-visit'
        },
        {
          name: 'Follow-up - Cardiology',
          time: new Date(firstVisitDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Emergency Visit',
          time: new Date(firstVisitDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          urgent: true
        },
        {
          name: 'Routine Check-up',
          time: new Date(firstVisitDate.getTime() + 120 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Specialist Consultation',
          time: new Date(firstVisitDate.getTime() + 180 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Current Visit',
          time: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000),
          type: 'current'
        }
      ]
    },
    {
      id: 2,
      type: 'vitals',
      title: 'Vital Signs Trends',
      icon: faHeartbeat,
      color: '#e74c3c',
      items: [
        {
          name: 'BP: 160/95',
          time: new Date(firstVisitDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          status: 'high',
          value: '160/95'
        },
        {
          name: 'BP: 145/88',
          time: new Date(firstVisitDate.getTime() + 35 * 24 * 60 * 60 * 1000),
          status: 'high',
          value: '145/88'
        },
        {
          name: 'BP: 135/82',
          time: new Date(firstVisitDate.getTime() + 65 * 24 * 60 * 60 * 1000),
          status: 'borderline',
          value: '135/82'
        },
        {
          name: 'BP: 125/78',
          time: new Date(firstVisitDate.getTime() + 95 * 24 * 60 * 60 * 1000),
          status: 'normal',
          value: '125/78'
        },
        {
          name: 'Weight: 85kg',
          time: new Date(firstVisitDate.getTime() + 125 * 24 * 60 * 60 * 1000),
          status: 'normal',
          value: '85kg'
        },
        {
          name: 'BP: 120/75',
          time: new Date(currentTime.getTime() - 1 * 60 * 60 * 1000),
          status: 'normal',
          value: '120/75'
        }
      ]
    },
    {
      id: 3,
      type: 'lab',
      title: 'Laboratory Results',
      icon: faVial,
      color: '#3498db',
      items: [
        {
          name: 'Initial Labs',
          time: new Date(firstVisitDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          value: 'Complete Panel'
        },
        {
          name: 'HbA1c: 8.2%',
          time: new Date(firstVisitDate.getTime() + 37 * 24 * 60 * 60 * 1000),
          status: 'high',
          value: '8.2%'
        },
        {
          name: 'Cholesterol Panel',
          time: new Date(firstVisitDate.getTime() + 67 * 24 * 60 * 60 * 1000),
          value: 'LDL: 165'
        },
        {
          name: 'HbA1c: 7.1%',
          time: new Date(firstVisitDate.getTime() + 127 * 24 * 60 * 60 * 1000),
          status: 'borderline',
          value: '7.1%'
        },
        {
          name: 'Kidney Function',
          time: new Date(firstVisitDate.getTime() + 157 * 24 * 60 * 60 * 1000),
          status: 'normal',
          value: 'Normal'
        },
        {
          name: 'HbA1c: 6.8%',
          time: new Date(currentTime.getTime() - 3 * 60 * 60 * 1000),
          status: 'normal',
          value: '6.8%'
        }
      ]
    },
    {
      id: 4,
      type: 'medications',
      title: 'Medication History',
      icon: faPills,
      color: '#27ae60',
      items: [
        {
          name: 'Metformin 500mg',
          time: new Date(firstVisitDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          action: 'started'
        },
        {
          name: 'Lisinopril 5mg',
          time: new Date(firstVisitDate.getTime() + 40 * 24 * 60 * 60 * 1000),
          action: 'started'
        },
        {
          name: 'Atorvastatin 20mg',
          time: new Date(firstVisitDate.getTime() + 70 * 24 * 60 * 60 * 1000),
          action: 'started'
        },
        {
          name: 'Metformin 850mg',
          time: new Date(firstVisitDate.getTime() + 100 * 24 * 60 * 60 * 1000),
          action: 'increased'
        },
        {
          name: 'Lisinopril 10mg',
          time: new Date(firstVisitDate.getTime() + 130 * 24 * 60 * 60 * 1000),
          action: 'increased'
        },
        {
          name: 'Aspirin 75mg',
          time: new Date(firstVisitDate.getTime() + 160 * 24 * 60 * 60 * 1000),
          action: 'started'
        }
      ]
    },
    {
      id: 5,
      type: 'procedures',
      title: 'Procedures & Tests',
      icon: faProcedures,
      color: '#f39c12',
      items: [
        {
          name: 'ECG',
          time: new Date(firstVisitDate.getTime() + 15 * 24 * 60 * 60 * 1000),
          result: 'Normal'
        },
        {
          name: 'Chest X-Ray',
          time: new Date(firstVisitDate.getTime() + 45 * 24 * 60 * 60 * 1000),
          result: 'Clear'
        },
        {
          name: 'Echocardiogram',
          time: new Date(firstVisitDate.getTime() + 75 * 24 * 60 * 60 * 1000),
          result: 'Mild LVH'
        },
        {
          name: 'Stress Test',
          time: new Date(firstVisitDate.getTime() + 105 * 24 * 60 * 60 * 1000),
          result: 'Negative'
        },
        {
          name: 'CT Angiogram',
          time: new Date(firstVisitDate.getTime() + 135 * 24 * 60 * 60 * 1000),
          result: 'Normal'
        },
        {
          name: '24h Holter Monitor',
          time: new Date(firstVisitDate.getTime() + 165 * 24 * 60 * 60 * 1000),
          result: 'Pending'
        }
      ]
    }
  ];

  const getTimePosition = time => {
    if (!timeRange.start || !timeRange.end) return 0;
    const totalRange = timeRange.end.getTime() - timeRange.start.getTime();
    const itemOffset = time.getTime() - timeRange.start.getTime();
    return Math.max(0, Math.min(100, (itemOffset / totalRange) * 100));
  };

  const formatTime = time => {
    return time.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = ms => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      const remainingMonths = Math.floor((days % 365) / 30);
      return `${years}y ${remainingMonths}m`;
    } else if (months > 0) {
      const remainingDays = days % 30;
      return `${months}m ${remainingDays}d`;
    } else {
      return `${days} days`;
    }
  };

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      const timeStep = (totalDuration / 600) * playbackSpeed;
      intervalRef.current = setInterval(() => {
        setCurrentPlayTime(prev => {
          if (!prev || !timeRange.end) return prev;
          const nextTime = new Date(prev.getTime() + timeStep * playbackSpeed);
          if (nextTime >= timeRange.end) {
            setIsPlaying(false);
            return timeRange.end;
          }
          return nextTime;
        });
      }, 100);
    } else {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentPlayTime(timeRange.start);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSpeedChange = speed => {
    setPlaybackSpeed(speed);
  };

  const changeViewMode = mode => {
    setViewMode(mode);
    const now = new Date();
    let newStart;

    switch (mode) {
      case 'year':
        newStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'month':
        newStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      default:
        newStart = firstVisitDate;
    }

    setTimeRange({ start: newStart, end: now });
    setCurrentPlayTime(newStart);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!timeRange.start) return null;

  return (
    <div style={{ position: 'relative', overflowX: 'auto', whiteSpace: 'nowrap' }}>
      <div
        style={{
          padding: '65px',
          paddingTop: '10px',
          paddingRight: '45px',
          paddingBottom: '10px',
          backgroundColor: '#ffffffff',
          borderRadius: '8px',
          margin: '16px 0',
          border: '1px solid #e9ecef'
        }}
      >
        {/* Timeline Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '16px', fontWeight: '600' }}>
              Patient Medical History Timeline - {patient?.name || 'Patient'} (
              {formatDuration(currentTime.getTime() - firstVisitDate.getTime())})
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
              Complete medical history from {formatTime(firstVisitDate)} to{' '}
              {formatTime(currentTime)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* View Mode Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                overflow: 'hidden'
              }}
            >
              {[
                { key: 'all', label: 'All Time' }
                // { key: 'year', label: 'Last Year' },
                // { key: 'month', label: '6 Months' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => changeViewMode(mode.key)}
                  style={{
                    background: viewMode === mode.key ? '#007bff' : 'white',
                    color: viewMode === mode.key ? 'white' : '#007bff',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Playback Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}
            >
              <button
                onClick={handlePlay}
                style={{
                  background: isPlaying ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px'
                }}
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={handleStop}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px'
                }}
              >
                <FontAwesomeIcon icon={faStop} />
                Reset
              </button>

              {/* Speed Controls */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                {[0.5, 1, 2, 5].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    style={{
                      background: playbackSpeed === speed ? '#007bff' : 'white',
                      color: playbackSpeed === speed ? 'white' : '#007bff',
                      border: '1px solid #007bff',
                      borderRadius: '3px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Container */}
        <div style={{ position: 'relative', minHeight: '350px' }}>
          {' '}
          {/*  */}
          {/* Time axis */}
          <div
            style={{
              position: 'absolute',
              top: '330px',
              left: '0',
              right: '0',
              height: '2px',
              backgroundColor: '#34495e',
              borderRadius: '1px'
            }}
          >
            {/* Time & date markers */}
            {Array.from({ length: 6 }, (_, i) => {
              const totalRange = timeRange.end.getTime() - timeRange.start.getTime();
              const markerTime = new Date(timeRange.start.getTime() + (i * totalRange) / 5);
              const position = (i / 5) * 100;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    top: '-6px',
                    width: '2px',
                    height: '14px',
                    backgroundColor: '#34495e'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      color: '#6c757d',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatTime(markerTime)}
                  </span>
                </div>
              );
            })}

            {/* Current playback time indicator */}
            {currentPlayTime && (
              <div
                style={{
                  position: 'absolute',
                  left: `${getTimePosition(currentPlayTime)}%`,
                  top: '-12px',
                  width: '3px',
                  height: '26px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '1.5px',
                  zIndex: 10
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#e74c3c',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'white',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    border: '1px solid #e74c3c'
                  }}
                >
                  {formatTime(currentPlayTime)}
                </div>
              </div>
            )}
          </div>
          {/* Timeline categories */}
          {patientHistoricalData.map((category, categoryIndex) => (
            <div
              key={category.id}
              style={{
                position: 'relative',
                marginBottom: '16px',

                minHeight: `${Math.max(65, category.items.length * 30)}px`
              }}
            >
              {/* Category label */}
              <div
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '180px',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: `2px solid ${category.color}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: category.color,
                  zIndex: 5,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <FontAwesomeIcon icon={category.icon} />
                {category.title}
              </div>

              {/* Category items */}
              {category.items.map((item, itemIndex) => {
                const position = getTimePosition(item.time);
                const isVisible = !currentPlayTime || item.time <= currentPlayTime;

                if (position < 0 || position > 100) return null;

                return (
                  <div
                    key={itemIndex}
                    style={{
                      position: 'absolute',
                      left: `${position}%`,
                      top: `${40 + itemIndex * 22}px`,
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                    //   paddingLeft: '120px',
                      alignItems: 'center',
                      zIndex: 3,
                      opacity: isVisible ? 1 : 0.3,
                      transition: 'opacity 0.3s ease'
                    }}
                  >
                    {/* Item icon/dot */}
                    <div
                      style={{
                        width: item.type === 'current' ? '20px' : '16px',
                        height: item.type === 'current' ? '20px' : '16px',
                        borderRadius: '50%',
                        backgroundColor: item.urgent
                          ? '#dc3545'
                          : item.type === 'current'
                          ? '#28a745'
                          : item.type === 'first-visit'
                          ? '#6f42c1'
                          : item.status === 'high'
                          ? '#e74c3c'
                          : item.status === 'borderline'
                          ? '#f39c12'
                          : item.action === 'started'
                          ? '#28a745'
                          : item.action === 'increased'
                          ? '#17a2b8'
                          : category.color,
                        border: `3px solid white`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.type === 'current' && (
                        <FontAwesomeIcon
                          icon={faCalendarCheck}
                          style={{ fontSize: '10px', color: 'white' }}
                        />
                      )}
                    </div>

                    {/* Item label */}
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: `1px solid ${category.color}`,
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: category.color,
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        maxWidth: '140px',
                        textAlign: 'center'
                      }}
                    >
                      <div>{item.name}</div>
                      {item.value && (
                        <div
                          style={{
                            fontWeight: '600',
                            color:
                              item.status === 'high'
                                ? '#e74c3c'
                                : item.status === 'borderline'
                                ? '#f39c12'
                                : category.color,
                            marginTop: '2px'
                          }}
                        >
                          {item.value}
                        </div>
                      )}
                      {item.result && (
                        <div
                          style={{
                            fontSize: '9px',
                            color: '#6c757d',
                            marginTop: '1px'
                          }}
                        >
                          {item.result}
                        </div>
                      )}
                      {item.action && (
                        <div
                          style={{
                            fontSize: '8px',
                            color: item.action === 'started' ? '#28a745' : '#17a2b8',
                            marginTop: '1px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.action}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend & Statistics */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #e9ecef',
            fontSize: '11px',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {patientHistoricalData.map(category => (
              <div
                key={category.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: category.color,
                  fontWeight: '500'
                }}
              >
                <FontAwesomeIcon icon={category.icon} />
                <span>{category.title}</span>
                <span style={{ color: '#6c757d' }}>({category.items.length})</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              fontSize: '10px',
              color: '#6c757d'
            }}
          >
            <span>● Current Visit</span>
            <span>● Emergency</span>
            <span>● High Risk</span>
            <span>● Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;
