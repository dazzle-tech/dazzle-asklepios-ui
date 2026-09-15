import React, { useEffect } from 'react';
import { Loader, Timeline } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useLazyGetPatientTimelineQuery } from '@/services/patients/patientTimelineService';
import './styles.less';

interface PatientTimelineModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number | null;
}

const importanceModifier: Record<string, string> = {
  high: 'patient-timeline-dot--high',
  medium: 'patient-timeline-dot--medium',
  low: 'patient-timeline-dot--low'
};

const PatientTimelineModal: React.FC<PatientTimelineModalProps> = ({ open, setOpen, patientId }) => {
  const [getPatientTimeline, { data, isFetching, isUninitialized, isError }] = useLazyGetPatientTimelineQuery();

  useEffect(() => {
    if (open && patientId) {
      getPatientTimeline(patientId);
    }
  }, [open, patientId, getPatientTimeline]);

  const missingPatientId = open && !patientId;
  const showLoading = !missingPatientId && (isFetching || (open && isUninitialized));

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Timeline"
      size="50vw"
      hideActionBtn
      cancelButtonLabel="Close"
      content={
        <div className="patient-timeline-content">
          {missingPatientId && (
            <div>
              <Translate>No patient selected.</Translate>
            </div>
          )}

          {showLoading && (
            <div className="patient-timeline-loading">
              <Loader size="lg" content="Generating timeline..." />
              <div className="patient-timeline-loading-text">
                <Translate>This can take a few minutes, please wait...</Translate>
              </div>
            </div>
          )}

          {!showLoading && isError && (
            <div>
              <Translate>Failed to load patient timeline.</Translate>
            </div>
          )}

          {!showLoading && !isError && data && data.timeline.length === 0 && (
            <div>
              <Translate>No timeline events found for this patient.</Translate>
            </div>
          )}

          {!showLoading && !isError && data && data.timeline.length > 0 && (
            <Timeline>
              {data.timeline.map((event, index) => (
                <Timeline.Item
                  key={index}
                  dot={
                    <div
                      className={`patient-timeline-dot ${
                        importanceModifier[event.clinical_importance] || 'patient-timeline-dot--low'
                      }`}
                    />
                  }
                >
                  <div className="patient-timeline-event-title">
                    {event.title} <span className="patient-timeline-event-date">({event.date})</span>
                  </div>
                  <div>{event.description}</div>
                  <div className="patient-timeline-event-meta">
                    {event.event_type} • {event.clinical_importance} • {event.source}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </div>
      }
    />
  );
};

export default PatientTimelineModal;