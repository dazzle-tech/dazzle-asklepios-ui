import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPaperPlane, faPlus, faRightLeft, faXmark } from '@fortawesome/free-solid-svg-icons';

type Props = {
  onViewAppointmentRequests: () => void;
  onBulkReschedule: () => void;
  onViewCancelledAppointments: () => void;
};

const ScheduleFloatingActions = ({
  onViewAppointmentRequests,
  onBulkReschedule,
  onViewCancelledAppointments
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);

  const toggleExpanded = () => {
    if (!wasDragged) {
      setExpanded(v => !v);
    }
  };

  const runAction = (fn: () => void) => {
    fn();
    setExpanded(false);
  };

  return (
    <Draggable
      onStart={() => setWasDragged(false)}
      onDrag={() => setWasDragged(true)}
      onStop={() => {
        setTimeout(() => setWasDragged(false), 200);
      }}
    >
      <div className="schedule-fab-root">
        {expanded && (
          <div className="schedule-fab-actions">
            <Whisper placement="left" trigger="hover" speaker={<Tooltip>View app requests</Tooltip>}>
              <button
                type="button"
                className="schedule-fab-secondary-btn"
                aria-label="View app requests"
                onClick={() => runAction(onViewAppointmentRequests)}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </Whisper>
            <Whisper placement="left" trigger="hover" speaker={<Tooltip>Bulk reschedule</Tooltip>}>
              <button
                type="button"
                className="schedule-fab-secondary-btn"
                aria-label="Bulk reschedule"
                onClick={() => runAction(onBulkReschedule)}
              >
                <FontAwesomeIcon icon={faRightLeft} />
              </button>
            </Whisper>
            <Whisper placement="left" trigger="hover" speaker={<Tooltip>Cancelled appointments</Tooltip>}>
              <button
                type="button"
                className="schedule-fab-secondary-btn"
                aria-label="Cancelled appointments"
                onClick={() => runAction(onViewCancelledAppointments)}
              >
                <FontAwesomeIcon icon={faBan} />
              </button>
            </Whisper>
          </div>
        )}
        <Whisper
          placement="left"
          trigger="hover"
          speaker={<Tooltip>{expanded ? 'Close' : 'More actions'}</Tooltip>}
        >
          <button
            type="button"
            className="appointments-requests-fab-toggle schedule-fab-main-toggle"
            onClick={toggleExpanded}
            aria-label={expanded ? 'Close' : 'More actions'}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpanded();
              }
            }}
          >
            <FontAwesomeIcon icon={expanded ? faXmark : faPlus} />
          </button>
        </Whisper>
      </div>
    </Draggable>
  );
};

export default ScheduleFloatingActions;
