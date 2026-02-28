import React, { useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';

// ✅ AI validation mutations
import { useValidateMedicationMutation } from '@/services/ai-services/medicationTestOrdersValidationService';
import './styles.less';

type Props = {
  title?: any;
  button?: any;

  // ✅ aggregated payload (your buildPrescriptionSummaryPayload output)
  aiPayload?: any;
};

const PatientHistorySummary: React.FC<Props> = ({ title = null, button = null, aiPayload = null }) => {
  // ======================
  // AI Validation
  // ======================
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

  // ======================
  // ✅ Build MedicationValidationRequest (Pydantic-safe)
  // ======================
  const validationRequest = useMemo(() => {
    if (!aiPayload) return null;

    // your aggregated payload shape: { patient, encounter, complain, diagnosis, medications }
    const patient = {
      mrn: toStr(aiPayload?.patient?.mrn),
      fullName: toStr(aiPayload?.patient?.fullName),
      gender: normalizeGender(aiPayload?.patient?.gender),
      dob: toStr(aiPayload?.patient?.dob)
    };

    const encounter = {
      visitId: toStr(aiPayload?.encounter?.visitId),
      visitType: toStr(aiPayload?.encounter?.visitType),
      plannedStartDate: toStr(aiPayload?.encounter?.plannedStartDate),
      chiefComplaint: toStr(aiPayload?.encounter?.chiefComplaint),
      patientAge: toStr(aiPayload?.encounter?.patientAge),
      diagnosis: toStr(aiPayload?.encounter?.diagnosis || aiPayload?.diagnosis?.value)
    };

    const diagnosis = {
      type: toStr(aiPayload?.diagnosis?.type || 'Encounter Diagnosis'),
      value: toStr(aiPayload?.diagnosis?.value)
    };

    const complain = toStr(aiPayload?.complain || aiPayload?.encounter?.chiefComplaint);

    const medications = Array.isArray(aiPayload?.medications)
      ? aiPayload.medications.map((m: any) => toStr(m)).filter(Boolean)
      : [];

    return { patient, encounter, complain, diagnosis, medications };
  }, [aiPayload]);

  useEffect(() => {
    if (!validationRequest) return;
    if (!Array.isArray(validationRequest.medications) || validationRequest.medications.length === 0)
      return;

    const callKey = JSON.stringify(validationRequest);
    if (lastCallKeyRef.current === callKey) return;

    lastCallKeyRef.current = callKey;


    validateMedication(validationRequest as any);
  }, [validationRequest, validateMedication]);

  const uiLoading = medsState.isLoading;
  const uiError = medsState.error;

  const uiModel = useMemo(() => {
    if (!medsState?.data) return null;
    const r: any = medsState.data;
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
      evidence?: string;
    }> = Array.isArray(r?.detailed_validations)
      ? r.detailed_validations.map((d: any) => ({
          item: toStr(d?.item),
          severity: toStr(d?.severity),
          issue: toStr(d?.issue),
          recommendation: toStr(d?.recommendation),
          evidence: toStr(d?.evidence)
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
  }, [medsState.data]);

  const canValidate = !!validationRequest && (validationRequest.medications?.length ?? 0) > 0;

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={
          <div
            className="patient-history-title"
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FontAwesomeIcon icon={faClipboardList} className="patient-history-icon" />
            <span>{title || 'Medication Validation'}</span>
          </div>
        }
        action={<div>{button && <div>{button}</div>}</div>}
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {!canValidate && (
                    <div className="ai-empty">Validation payload not ready (no medications).</div>
                  )}

                  {uiLoading && (
                    <div className="ai-loading-wrap">
                      <span className="ai-spinner" />
                      <span className="ai-loading-text">Validating medications...</span>
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
                                        <div className="ai-item-title">
                                          {i + 1}. {d.item || '-'}
                                        </div>

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

                                      {d.evidence && (
                                        <div className="ai-item-row">
                                          <span className="ai-item-label">Evidence:</span>
                                          <span className="ai-item-text">{d.evidence}</span>
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
