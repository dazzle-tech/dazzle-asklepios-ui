// PatientHistorySummary.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import { Button } from 'rsuite';
import { useSummarizeMutation } from '@/services/ai-services/clinicalSummaryService';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';

type Props = {
  patientId?: number;
  encounterId?: number;
  title?: any;
  
};

const PatientHistorySummary: React.FC<Props> = ({
  patientId,
  encounterId,
  title = null
}) => {
  const [getClinicalSummary, { data: summaryData, isLoading, error }] =
    useSummarizeMutation();

  const handleGenerateSummary = () => {
    if (!patientId || !encounterId) return;

    getClinicalSummary({
      patientId,
      encounterId
    });
  };

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
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            

            <MyButton
              loading={isLoading}
              disabled={!patientId || !encounterId || isLoading}
              onClick={handleGenerateSummary}
            >
              Generate Summary
            </MyButton>
          </div>
        }
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {error && (
                    <p style={{ color: 'red' }}>
                      Unable to generate clinical summary
                    </p>
                  )}

                  <p style={{ whiteSpace: 'pre-line' }}>
                    {summaryData?.ClinicalSummary || 'No summary available'}
                  </p>
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