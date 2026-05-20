// PatientHistorySummary.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

type Props = {
  patient: any;
  encounter: any;
  edit?: boolean;
  title?: any;
  button?: any;
  lang?: string;
};

const PatientHistorySummary: React.FC<Props> = ({
  patient,
  encounter,
  edit = undefined,
  title = null,
  button = null,
  lang = 'en'
}) => {
  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
            <span>{title || 'Patient History Summary'}</span>
          </div>
        }
        action={<div>{button && <div>{button}</div>}</div>}
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  <p style={{ whiteSpace: 'pre-line' }}>No summary available</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default PatientHistorySummary;