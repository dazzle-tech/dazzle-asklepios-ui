import {
  faCalendarCheck,
  faHeartbeat,
  faPause,
  faPills,
  faPlay,
  faProcedures,
  faStop,
  faVial,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { DatePicker } from 'rsuite';
import './MedicalTimeline.less';

const MedicalTimeline = ({ patient, encounter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [viewMode, setViewMode] = useState('all');
  const [showLegendIcons, setShowLegendIcons] = useState(true);
  const [hideTimeline, setHideTimeline] = useState(false);
  const intervalRef = useRef(null);

  // Get default date range: one month earlier from today
  const getDefaultDateRange = () => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    return { from: oneMonthAgo, to: today };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const firstVisitDate = patient?.firstVisitDate
    ? new Date(patient.firstVisitDate)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const currentTime = new Date();
  const totalDuration = currentTime.getTime() - firstVisitDate.getTime();

  // Initialize time range based on date filter
  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      setTimeRange({
        start: dateRange.from,
        end: dateRange.to
      });
      setCurrentPlayTime(dateRange.from);
    }
  }, [dateRange]);

  const handleFromDateChange = value => {
    if (value) {
      setDateRange(prev => ({ ...prev, from: value }));
      // Reset play time when date range changes
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleToDateChange = value => {
    if (value) {
      setDateRange(prev => ({ ...prev, to: value }));
      // Reset play time when date range changes
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

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
      type: 'examinations',
      title: 'Examinations',
      icon: faHeartbeat,
      color: '#2980b9',
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
      title: 'Labs',
      icon: faVial,
      color: '#8e44ad',
      items: [
        {
          name: 'Complete Panel',
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
      title: 'Meds',
      icon: faPills,
      color: '#16a085',
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
      title: 'Tests',
      icon: faProcedures,
      color: '#d35400',
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

  const formatTime = time =>
    time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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

  const getItemColor = (item, category) => {
    if (item.urgent) return '#8e44ad';
    if (item.type === 'current') return '#2980b9';
    if (item.type === 'first-visit') return '#6f42c1';
    if (item.status === 'high') return '#9b59b6';
    if (item.status === 'borderline') return '#f39c12';
    if (item.action === 'started') return '#16a085';
    if (item.action === 'increased') return '#3498db';
    return category.color || '#2980b9';
  };

  const canStart =
    !!currentPlayTime && !!timeRange.end && currentPlayTime < timeRange.end && !isPlaying;

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!currentPlayTime || !timeRange.end || currentPlayTime >= timeRange.end) return;

    setIsPlaying(true);

    const rangeDuration = timeRange.end.getTime() - timeRange.start.getTime();
    const timeStep = (rangeDuration / 600) * playbackSpeed;

    intervalRef.current = setInterval(() => {
      setCurrentPlayTime(prev => {
        if (!prev || !timeRange.end) return prev;
        const nextTime = new Date(prev.getTime() + timeStep);
        if (nextTime >= timeRange.end) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          return timeRange.end;
        }
        return nextTime;
      });
    }, 100);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentPlayTime(timeRange.start);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSpeedChange = speed => setPlaybackSpeed(speed);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!timeRange.start) return null;

  return (
    <div className="timeline-container">
      <div className="timeline-card">
        {/* Header */}
        <div className="timeline-header">
          <div>
            <h3 className="timeline-title">Patient Story in 60 Seconds</h3>
            {/* Date Range Picker */}
            {!hideTimeline && (
              <div
                style={{ display: 'flex', gap: '10px', marginRight: '20px', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500' }}>From</label>
                  <DatePicker
                    value={dateRange.from}
                    onChange={handleFromDateChange}
                    format="MMM dd, yyyy"
                    style={{ width: '150px' }}
                    cleanable={false}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500' }}>To</label>
                  <DatePicker
                    value={dateRange.to}
                    onChange={handleToDateChange}
                    format="MMM dd, yyyy"
                    style={{ width: '150px' }}
                    cleanable={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="timeline-controls">
            <button
              onClick={handlePlay}
              disabled={!isPlaying && !canStart}
              className={`btn-play ${isPlaying ? 'pause' : ''} ${
                !isPlaying && !canStart ? 'disabled' : ''
              }`}
              title={!isPlaying && !canStart ? 'click reset first ' : ''}
            >
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              <span className="btn-text">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button onClick={handleStop} className="btn-reset">
              <FontAwesomeIcon icon={faStop} />
              <span className="btn-text">Reset</span>
            </button>

            <button
              onClick={() => setHideTimeline(!hideTimeline)}
              className="btn-reset"
              style={{
                background: hideTimeline ? '#249241ff' : '#95a5a6'
              }}
            >
              <FontAwesomeIcon icon={hideTimeline ? faChevronDown : faChevronUp} />
              <span className="btn-text">{hideTimeline ? 'Show' : 'Hide'}</span>
            </button>

            <div className="divider" />

            {[0.5, 1, 4, 10].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`btn-speed ${playbackSpeed === speed ? 'active' : ''}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-body" style={{ display: hideTimeline ? 'none' : 'block' }}>
          <div className="timeline-categories">
            {patientHistoricalData.map((category, cIndex) => (
              <div key={category.id} className="timeline-row">
                <div
                  className="category-label"
                  style={{
                    ['--cat-color']: category.color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0',
                    minWidth: '50px',
                    backgroundColor: 'transparent'
                  }}
                >
                  <FontAwesomeIcon
                    icon={category.icon}
                    className="category-icon"
                    style={{ fontSize: '24px', color: category.color }}
                  />
                </div>

                <div className="timeline-track">
                  <div className="timeline-track-line" />

                  {category.items.map((item, itemIndex) => {
                    const position = getTimePosition(item.time);
                    const isVisible = currentPlayTime && item.time <= currentPlayTime;
                    // Only show items within the selected date range
                    if (item.time < timeRange.start || item.time > timeRange.end) return null;
                    if (position < 0 || position > 100 || !isVisible) return null;
                    const dotColor = getItemColor(item, category);

                    return (
                      <div
                        key={itemIndex}
                        className="timeline-item"
                        style={{
                          ['--pos']: `${position}%`,
                          ['--dot-color']: dotColor
                        }}
                      >
                        <div className="timeline-dot" />
                        <div className="timeline-infobox">
                          <div className="infobox-title">{item.name}</div>
                          {item.value && <div className="infobox-line">{item.value}</div>}
                          {item.result && <div className="infobox-line">Result: {item.result}</div>}
                          {item.action && (
                            <div className="infobox-line capetalize">{item.action}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Time axis */}
          <div className="time-axis-wrapper">
            <div className="time-axis">
              <div className="axis-line">
                {Array.from({ length: 6 }, (_, i) => {
                  const totalRange = timeRange.end.getTime() - timeRange.start.getTime();
                  const markerTime = new Date(timeRange.start.getTime() + (i * totalRange) / 5);
                  const position = (i / 5) * 100;
                  return (
                    <div key={i} className="time-marker" style={{ left: `${position}%` }}>
                      <span className="time-marker-label">{formatTime(markerTime)}</span>
                    </div>
                  );
                })}

                {currentPlayTime && (
                  <div
                    className="playhead"
                    style={{ left: `${getTimePosition(currentPlayTime)}%` }}
                  >
                    <div className="playhead-label">{formatTime(currentPlayTime)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="timeline-legend">
            <div className="legend-left">
              {patientHistoricalData.map(cat => (
                <div className="legend-item" key={cat.id} style={{ ['--cat-color']: cat.color }}>
                  <FontAwesomeIcon icon={cat.icon} className="legend-icon" />
                  {/* <span className="legend-count">{cat.items.length}</span> */}
                  <span style={{ fontSize: '12px' }}>{cat.title}</span>
                </div>
              ))}
            </div>

            <div className="legend-right">
              <div className="legend-small">
                <div className="legend-dot current" />
                <span>Current</span>
              </div>
              <div className="legend-small">
                <div className="legend-dot emergency" />
                <span>Emergency</span>
              </div>
              <div className="legend-small">
                <div className="legend-dot highrisk" />
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;
