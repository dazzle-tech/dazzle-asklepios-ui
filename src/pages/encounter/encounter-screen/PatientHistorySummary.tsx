import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetClinicalRecommendationsMutation } from '@/services/ai-services/clinicalRecommendationsService';
import './styles.less';

type Props = {
  title?: any;
  button?: any;
  patientId?: number | string;
  encounterId?: number | string;
  focusAreas?: string[];
  loading?: boolean;
  error?: any;
};

const PatientHistorySummary: React.FC<Props> = ({
  title = null,
  button = null,
  patientId,
  encounterId,
  focusAreas = ['medication optimization', 'diagnostic workup'],
  loading = false,
  error = null
}) => {
  const [isUiLoading, setIsUiLoading] = useState(false);

  const [
    getClinicalRecommendations,
    { data: aiData, isLoading: isAiLoading, isError: isAiErr, error: aiError }
  ] = useGetClinicalRecommendationsMutation();

  const lastCallKeyRef = useRef<string | null>(null);

  const recommendationsPayload = useMemo(() => {
    if (!patientId || !encounterId) return null;

    return {
      patientId: Number(patientId),
      encounterId: Number(encounterId),
      focusAreas
    };
  }, [patientId, encounterId, focusAreas]);

  useEffect(() => {
    const waitingAiResult =
      isAiLoading || (!!recommendationsPayload && !aiData && !isAiErr);

    setIsUiLoading(!!loading || waitingAiResult);
  }, [loading, isAiLoading, recommendationsPayload, aiData, isAiErr]);

  useEffect(() => {
    if (!recommendationsPayload) return;

    const callKey = JSON.stringify(recommendationsPayload);
    if (lastCallKeyRef.current === callKey) return;

    lastCallKeyRef.current = callKey;
    getClinicalRecommendations(recommendationsPayload);
  }, [recommendationsPayload, getClinicalRecommendations]);

  const summary = (aiData as any)?.summary;
  const recommendations = (aiData as any)?.recommendations ?? [];

  const aiErrorMsg = useMemo(() => {
    const e: any = aiError;
    const detail = e?.data?.detail;

    if (Array.isArray(detail)) {
      const first = detail[0];
      const loc = Array.isArray(first?.loc) ? first.loc.join('.') : '';
      return `${loc}: ${first?.msg}`;
    }

    if (typeof detail === 'string') return detail;

    return null;
  }, [aiError]);

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
            <span>{title || 'Clinical Recommendations'}</span>
          </div>
        }
        action={<div>{button && <div>{button}</div>}</div>}
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {isUiLoading && (
                    <div className="spinner-container">
                      <div className="spinner" />
                    </div>
                  )}

                  {(error || aiError) && !isUiLoading && (
                    <p style={{ color: 'red' }}>
                      Unable to load recommendations
                      {aiErrorMsg ? ` (${aiErrorMsg})` : ''}
                    </p>
                  )}

                  {!isUiLoading && !error && !aiError && !recommendationsPayload && (
                    <p>No patient or encounter selected</p>
                  )}

                  {!isUiLoading && !error && !aiError && recommendationsPayload && (
                    <>
                      <p style={{ whiteSpace: 'pre-line' }}>
                        {summary || 'No recommendations available'}
                      </p>

                      {Array.isArray(recommendations) && recommendations.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          {recommendations.map((r: any) => (
                            <div key={r.recommendation_id} style={{ marginBottom: 12 }}>
                              <div>
                                <b>{r.title}</b> {r.priority ? `(${r.priority})` : ''}
                              </div>

                              <div style={{ whiteSpace: 'pre-line' }}>
                                {r.description}
                              </div>

                              {r.rationale && (
                                <div style={{ marginTop: 4 }}>
                                  <b>Rationale:</b> {r.rationale}
                                </div>
                              )}

                              {Array.isArray(r.actionable_steps) &&
                                r.actionable_steps.length > 0 && (
                                  <ul>
                                    {r.actionable_steps.map((s: string, i: number) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                )}

                              {r.monitoring_requirements && (
                                <div>
                                  <b>Monitoring:</b> {r.monitoring_requirements}
                                </div>
                              )}

                              {r.follow_up && (
                                <div>
                                  <b>Follow-up:</b> {r.follow_up}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
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