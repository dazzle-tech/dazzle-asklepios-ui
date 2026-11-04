import React, { useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';
import { useValidateTestsMutation } from '@/services/medicationTestOrdersValidation/MedicationTestOrdersValidation';
import type { TestValidationRequestDTO, ValidationResponseDTO } from '@/types/model-types-new';
import './styles.less';

type Props = {
  title?: any;
  button?: any;
  aiPayload?: {
    patientId?: number;
    encounterId?: number;
  } | null;
};

const PatientHistorySummary: React.FC<Props> = ({ title = null, button = null, aiPayload = null }) => {
  const [validateTests, testsState] = useValidateTestsMutation();
  const lastCallKeyRef = useRef<string | null>(null);

  const validationRequest = useMemo<TestValidationRequestDTO | null>(() => {
    const patientId = Number(aiPayload?.patientId);
    const encounterId = Number(aiPayload?.encounterId);
    if (!patientId || !encounterId) return null;
    return { patientId, encounterId };
  }, [aiPayload]);

  useEffect(() => {
    if (!validationRequest) return;
    const callKey = JSON.stringify(validationRequest);
    if (lastCallKeyRef.current === callKey) return;
    lastCallKeyRef.current = callKey;
    validateTests(validationRequest as any);
  }, [validationRequest, validateTests]);

  const aiState = testsState;
  const uiLoading = aiState.isLoading;
  const uiError = aiState.error;

  const uiModel = useMemo(() => {
    if (!aiState?.data) return null;
    const r = aiState.data as ValidationResponseDTO;

    return {
      header: {
        status: r?.quick_summary?.overall_status ?? '',
        topPriority: r?.quick_summary?.top_priority ?? '',
        confidence:
          r?.confidence_score !== undefined && r?.confidence_score !== null
            ? Number(r.confidence_score)
            : null
      },
      findings: Array.isArray(r?.detailed_validations)
        ? r.detailed_validations.map((d: any) => ({
            item: d?.item ?? '',
            severity: d?.severity ?? '',
            issue: d?.issue ?? '',
            recommendation: d?.recommendation ?? ''
          }))
        : [],
      alternatives: Array.isArray(r?.recommended_alternatives)
        ? r.recommended_alternatives.map((a: any) => ({
            original: a?.original_item ?? '',
            alternative: a?.alternative ?? '',
            rationale: a?.rationale ?? ''
          }))
        : []
    };
  }, [aiState.data]);

  const normalizeSeverity = (sev: any) => {
    const s = String(sev ?? '').trim().toLowerCase();
    if (s === 'critical') return 'critical';
    if (s === 'high') return 'high';
    if (s === 'moderate' || s === 'medium') return 'moderate';
    if (s === 'low') return 'low';
    return 'info';
  };

  const getSeverityStyle = (sev: any) => {
    switch (normalizeSeverity(sev)) {
      case 'critical':
        return { background: '#FEE2E2', color: '#B91C1C' };
      case 'high':
        return { background: '#FFEDD5', color: '#C2410C' };
      case 'moderate':
        return { background: '#FEF9C3', color: '#A16207' };
      case 'low':
        return { background: '#DBEAFE', color: '#1D4ED8' };
      default:
        return { background: '#E5E7EB', color: '#374151' };
    }
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div className="medical-container-div">
        <SectionContainer
          title={
            <div className="patient-history-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
              <span>{title || 'Tests Validation'}</span>
            </div>
          }
          action={<div>{button && <div>{button}</div>}</div>}
          content={
            <div className="medical-table-div2">
              <div className="patient-history-card">
                <div className="patient-history-content">
                  <div className="patient-history-text">
                    {!validationRequest && <div className="ai-empty">Validation payload not ready.</div>}

                    {uiLoading && (
                      <div className="ai-loading-wrap">
                        <span className="ai-spinner" />
                        <span className="ai-loading-text">Validating tests...</span>
                      </div>
                    )}

                    {uiError && !uiLoading && <div className="ai-error">Validation failed</div>}

                    {!uiLoading && !uiError && (
                      <div className="ai-result">
                        {!uiModel ? (
                          <div className="ai-empty">No validation result available</div>
                        ) : (
                          <>
                            <div className="ai-summary-header">
                              {!!uiModel.header.status && (
                                <div className="ai-kv">
                                  <span className="ai-k">Status</span>
                                  <span className="ai-v">{uiModel.header.status}</span>
                                </div>
                              )}
                              {!!uiModel.header.topPriority && (
                                <div className="ai-kv">
                                  <span className="ai-k">Top Priority</span>
                                  <span className="ai-v">{uiModel.header.topPriority}</span>
                                </div>
                              )}
                              {uiModel.header.confidence !== null && (
                                <div className="ai-kv">
                                  <span className="ai-k">Confidence</span>
                                  <span className="ai-v">{uiModel.header.confidence.toFixed(2)}</span>
                                </div>
                              )}
                            </div>

                            {uiModel.findings.length > 0 && (
                              <div className="ai-section">
                                <div className="ai-section-title">Findings</div>
                                <div className="ai-list">
                                  {uiModel.findings.map((d, i) => {
                                    const sev = normalizeSeverity(d.severity);
                                    const sevStyle = getSeverityStyle(sev);
                                    return (
                                      <div className="ai-item" key={`${d.item}-${i}`}>
                                        <div className="ai-item-top">
                                          <div className="ai-item-title">{i + 1}. {d.item || '-'}</div>
                                          {d.severity && (
                                            <div
                                              className="ai-item-pill"
                                              style={{
                                                backgroundColor: sevStyle.background,
                                                color: sevStyle.color,
                                                border: `1px solid ${sevStyle.background}`
                                              }}
                                            >
                                              {sev}
                                            </div>
                                          )}
                                        </div>
                                        {d.issue && (
                                          <div className="ai-item-row">
                                            <span className="ai-item-label">Issue:</span>
                                            <span className="ai-item-text">{d.issue}</span>
                                          </div>
                                        )}
                                        {d.recommendation && (
                                          <div className="ai-item-row">
                                            <span className="ai-item-label">Recommendation:</span>
                                            <span className="ai-item-text">{d.recommendation}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {uiModel.alternatives.length > 0 && (
                              <div className="ai-section">
                                <div className="ai-section-title">Recommended Alternatives</div>
                                <div className="ai-list">
                                  {uiModel.alternatives.map((a, i) => (
                                    <div className="ai-item" key={`${a.original}-${i}`}>
                                      <div className="ai-item-top">
                                        <div className="ai-item-title">{i + 1}. {a.original || '-'}</div>
                                      </div>
                                      {a.alternative && (
                                        <div className="ai-item-row">
                                          <span className="ai-item-label">Alternative:</span>
                                          <span className="ai-item-text">{a.alternative}</span>
                                        </div>
                                      )}
                                      {a.rationale && (
                                        <div className="ai-item-row">
                                          <span className="ai-item-label">Rationale:</span>
                                          <span className="ai-item-text">{a.rationale}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default PatientHistorySummary;
