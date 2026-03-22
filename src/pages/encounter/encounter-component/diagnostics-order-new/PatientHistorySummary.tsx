import SectionContainer from '@/components/SectionsoContainer';
import {
  useValidateMedicationMutation,
  useValidateTestsMutation
} from '@/services/ai-services/medicationTestOrdersValidationService';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef } from 'react';
import './styles.less';

type Props = {
  title?: any;
  button?: any;
  aiPayload?: any;
  mode?: 'tests' | 'medications';
};

const PatientHistorySummary: React.FC<Props> = ({
  title = null,
  button = null,
  aiPayload = null,
  mode = 'tests'
}) => {
  
  // ======================
  // AI Validation
  // ======================
  const [validateTests, testsState] = useValidateTestsMutation();
  const [validateMedication, medsState] = useValidateMedicationMutation();

  const lastCallKeyRef = useRef<string | null>(null);

  // ======================
  // helpers
  // ======================
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const normalizeGender = (g: any) => {
    const s = toStr(g).trim().toLowerCase();
    if (['male', 'm', 'man', 'ذكر'].includes(s)) return 'Male';
    if (['female', 'f', 'woman', 'أنثى', 'انثى'].includes(s)) return 'Female';
    if (['other'].includes(s)) return 'Other';
    return 'Unknown';
  };

  // ✅ NEW: normalize severity to match your enum and return color
  const normalizeSeverity = (sev: any) => {
    const s = toStr(sev).trim().toLowerCase();
    if (s === 'critical') return 'critical';
    if (s === 'high') return 'high';
    if (s === 'moderate' || s === 'medium') return 'moderate';
    if (s === 'low') return 'low';
    return 'info';
  };

  const getSeverityStyle = (sev: any) => {
    switch (normalizeSeverity(sev)) {
      case 'critical':
        return { background: '#FEE2E2', color: '#B91C1C' }; // red
      case 'high':
        return { background: '#FFEDD5', color: '#C2410C' }; // orange
      case 'moderate':
        return { background: '#FEF9C3', color: '#A16207' }; // yellow
      case 'low':
        return { background: '#DBEAFE', color: '#1D4ED8' }; // blue
      default:
        return { background: '#E5E7EB', color: '#374151' }; // gray
    }
  };

  const validationRequest = useMemo(() => {
    if (!aiPayload) return null;

    const patient = {
      mrn: toStr(aiPayload?.patient?.mrn),
      fullName: toStr(aiPayload?.patient?.fullName),
      gender: normalizeGender(aiPayload?.patient?.gender),
      dob: toStr(aiPayload?.patient?.dob)
    };

    const encounter = {
      visitId: toStr(aiPayload?.visit?.visitId),
      visitType: toStr(aiPayload?.visit?.visitType),
      plannedStartDate: toStr(aiPayload?.visit?.plannedStartDate),
      chiefComplaint: toStr(aiPayload?.visit?.chiefComplaint),
      patientAge: toStr(aiPayload?.visit?.patientAge),
      diagnosis: toStr(aiPayload?.diagnosis?.value)
    };

    const diagnosis = {
      type: toStr(aiPayload?.diagnosis?.type || 'Encounter Diagnosis'),
      value: toStr(aiPayload?.diagnosis?.value)
    };

    const complain = toStr(aiPayload?.complain || aiPayload?.visit?.chiefComplaint);

    if (mode === 'tests') {
      return {
        patient,
        encounter,
        complain,
        diagnosis,
        tests: Array.isArray(aiPayload?.tests)
          ? aiPayload.tests.map((t: any) => toStr(t)).filter(Boolean)
          : []
      };
    }

    return {
      patient,
      encounter,
      complain,
      diagnosis,
      medications: Array.isArray(aiPayload?.medications)
        ? aiPayload.medications.map((m: any) => toStr(m)).filter(Boolean)
        : []
    };
  }, [aiPayload, mode]);

  // ======================
  // ✅ Call AI once
  // ======================
  useEffect(() => {
    if (!validationRequest) return;

    const callKey = JSON.stringify({ mode, validationRequest });
    if (lastCallKeyRef.current === callKey) return;

    lastCallKeyRef.current = callKey;

    if (mode === 'tests') validateTests(validationRequest as any);
    else validateMedication(validationRequest as any);
  }, [validationRequest, mode, validateTests, validateMedication]);

  // ======================
  // UI state
  // ======================
  const aiState = mode === 'tests' ? testsState : medsState;
  const uiLoading = aiState.isLoading;
  const uiError = aiState.error;

  // ======================
  // ✅ compact formatted view models
  // ======================
  const uiModel = useMemo(() => {
    if (!aiState?.data) return null;
    const r: any = aiState.data;

    const header = {
      status: r?.quick_summary?.overall_status ?? '',
      topPriority: r?.quick_summary?.top_priority ?? '',
      confidence:
        r?.confidence_score !== undefined && r?.confidence_score !== null
          ? Number(r.confidence_score)
          : null
    };

    const findings: Array<{
      item: string;
      severity: string;
      issue: string;
      recommendation: string;
    }> = Array.isArray(r?.detailed_validations)
      ? r.detailed_validations.map((d: any) => ({
          item: toStr(d?.item),
          severity: toStr(d?.severity),
          issue: toStr(d?.issue),
          recommendation: toStr(d?.recommendation)
        }))
      : [];

    const alternatives: Array<{
      original: string;
      alternative: string;
      rationale: string;
    }> = Array.isArray(r?.recommended_alternatives)
      ? r.recommended_alternatives.map((a: any) => ({
          original: toStr(a?.original_item),
          alternative: toStr(a?.alternative),
          rationale: toStr(a?.rationale)
        }))
      : [];

    return { header, findings, alternatives };
  }, [aiState.data]);

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
            <span>{title || (mode === 'tests' ? 'Tests Validation' : 'Medication Validation')}</span>
          </div>
        }
        action={<div>{button && <div>{button}</div>}</div>}
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {/* ✅ Circular loader */}
                  {uiLoading && (
                    <div className="ai-loading-wrap">
                      <span className="ai-spinner" />
                      <span className="ai-loading-text">Validating...</span>
                    </div>
                  )}

                  {uiError && !uiLoading && <div className="ai-error">Validation failed</div>}

                  {!uiLoading && !uiError && (
                    <div className="ai-result">
                      {!uiModel ? (
                        <div className="ai-empty">No validation result available</div>
                      ) : (
                        <>
                          {/* ✅ compact header */}
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

                          {/* ✅ Findings */}
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
                                        <div className="ai-item-title">
                                          {i + 1}. {d.item || '-'}
                                        </div>

                                        {/* ✅ ONLY CHANGE: color by severity */}
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

                          {/* ✅ Alternatives */}
                          {uiModel.alternatives.length > 0 && (
                            <div className="ai-section">
                              <div className="ai-section-title">Recommended Alternatives</div>
                              <div className="ai-list">
                                {uiModel.alternatives.map((a, i) => (
                                  <div className="ai-item" key={`${a.original}-${i}`}>
                                    <div className="ai-item-top">
                                      <div className="ai-item-title">
                                        {i + 1}. {a.original || '-'}
                                      </div>
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
  );
};

export default PatientHistorySummary;