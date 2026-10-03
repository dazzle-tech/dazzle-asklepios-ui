import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import {
  formatSepsisAnalysisAsText,
  useAnalyseSepsisMutation
} from '@/services/ai-services/sepsisEarlyDetectionService';
import '@/pages/encounter/encounter-component/patient-history/styles.less';

type Props = {
  patientId?: number;
  hourlyData?: string[];
  title?: React.ReactNode;
};

const SepsisEarlyDetection: React.FC<Props> = ({
  patientId,
  hourlyData = [],
  title = 'Sepsis Early Detection'
}) => {
  const [analyseSepsis, { data, isLoading, error }] = useAnalyseSepsisMutation();

  const handleAnalyse = () => {
    if (!patientId) return;

    analyseSepsis({
      patientId,
      hourlyData
    });
  };

  const analysisText = data?.analysis
    ? formatSepsisAnalysisAsText(data.analysis)
    : 'No analysis available';

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="patient-history-icon" />
            <span>{title}</span>
          </div>
        }
        action={
          <MyButton
            loading={isLoading}
            disabled={!patientId || isLoading}
            onClick={handleAnalyse}
          >
            Analyze Trends
          </MyButton>
        }
        content={
          <div className="medical-table-div2">
            <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: '13px' }}>
              Analyzes vitals and lab trends over time to generate early alerts.
            </p>
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {error && (
                    <p style={{ color: 'red' }}>
                      Unable to generate sepsis early detection analysis
                    </p>
                  )}

                  <p style={{ whiteSpace: 'pre-line' }}>{analysisText}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default SepsisEarlyDetection;
