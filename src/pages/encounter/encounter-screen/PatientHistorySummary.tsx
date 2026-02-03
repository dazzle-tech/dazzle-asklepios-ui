// PatientHistorySummary.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';

import { useGetClinicalRecommendationsMutation } from '@/services/ai-services/clinicalRecommendationsService';
import './styles.less';

type Props = {
  title?: any;
  button?: any;

  // from AiAssistantPopup (new version)
  data?: any; // miniSummary
  aiPayload?: any; // combined payload (patient + visit + diagnosis + practitioner + miniSummary)
  loading?: boolean; // parent loading (miniSummary/practitioner)
  error?: any; // parent error
};

const PatientHistorySummary: React.FC<Props> = ({
  title = null,
  button = null,
  data = null,
  aiPayload = null,
  loading = false,
  error = null
}) => {
  // UI loading state (covers: parent loading + AI waiting)
  const [isUiLoading, setIsUiLoading] = useState(false);

  // ✅ AI Clinical Recommendations mutation (instead of summarize)
  const [
    getClinicalRecommendations,
    { data: aiData, isLoading: isAiLoading, isError: isAiErr, error: aiError }
  ] = useGetClinicalRecommendationsMutation();

  // Prevent repeated call for same payload
  const lastCallKeyRef = useRef<string | null>(null);

  // ===========
  // helpers (local)
  // ===========
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const normalizeGender = (g: any): string => {
    const s = String(g ?? '').trim();
    if (!s) return '';
    const lower = s.toLowerCase();
    if (['m', 'male', 'man', 'ذكر'].includes(lower)) return 'Male';
    if (['f', 'female', 'woman', 'أنثى', 'انثى'].includes(lower)) return 'Female';
    return s;
  };

  const toStringArray = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    return [String(v).trim()].filter(Boolean);
  };

  // ===========
  // ✅ Map aiPayload (user role structure) -> RecommendationRequest schema
  // ===========
  const recommendationsPayload = useMemo(() => {
    if (!aiPayload) return null;

    const age =
      toStr(aiPayload?.visit?.patientAge).trim() ||
      toStr(data?.age).trim() ||
      'Unknown';

    const gender =
      normalizeGender(aiPayload?.patient?.gender) ||
      normalizeGender(data?.gender) ||
      'Unknown';

    // prefer parsed diagnosis.value if exists, else fallback
    const diagnosis =
      toStr(aiPayload?.diagnosis?.value).trim() ||
      toStr(aiPayload?.diagnosis).trim() ||
      toStr(data?.diagnosis).trim() ||
      'N/A';

    const symptoms = toStringArray(data?.symptoms);

    const medications = toStringArray(data?.medications);

    const allergies = Array.isArray(aiPayload?.miniSummary?.allergies)
      ? aiPayload.miniSummary.allergies
      : Array.isArray(data?.allergies)
        ? data.allergies
        : [];

    const comorbidities = toStringArray(data?.problems || data?.comorbidities);

    // vitals: if backend returns object keep it, else empty
    const vitals =
      data?.vitals && typeof data.vitals === 'object' ? data.vitals : {};

    const clinicalNotes = [
      toStr(aiPayload?.complain).trim(),
      toStr(aiPayload?.miniSummary?.medicalWarnings).trim()
    ]
      .filter(Boolean)
      .join('\n');

    return {
      request_id: toStr(aiPayload?.request_id).trim() || undefined,
      patient_context: {
        age,
        gender,
        diagnosis,
        symptoms,
        medications,
        allergies,
        comorbidities,
        vitals,
        lab_results: {},
        clinical_notes: clinicalNotes || undefined
      }
      // focus_areas?: optional
    };
  }, [aiPayload, data]);

  // Manage UI loading: parent loading OR waiting AI
  useEffect(() => {
    const waitingAiResult =
      isAiLoading || (!!recommendationsPayload && !aiData && !isAiErr);
    setIsUiLoading(!!loading || waitingAiResult);
  }, [loading, isAiLoading, recommendationsPayload, aiData, isAiErr]);

  // Call AI once per payload
  useEffect(() => {
    if (!recommendationsPayload) return;

    const callKey = JSON.stringify(recommendationsPayload);
    if (lastCallKeyRef.current === callKey) return;

    lastCallKeyRef.current = callKey;
    getClinicalRecommendations(recommendationsPayload);
  }, [recommendationsPayload, getClinicalRecommendations]);

  // AI output: RecommendationsResponse
  const summary = (aiData as any)?.summary;
  const recommendations = (aiData as any)?.recommendations ?? [];

  // pydantic error message
  const aiErrorMsg = useMemo(() => {
    const e: any = aiError;
    const detail = e?.data?.detail?.[0];
    if (!detail) return null;
    const loc = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
    return `${loc}: ${detail.msg}`;
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
                  {/* Loader */}
                  {isUiLoading && (
                    <div className="spinner-container">
                      <div className="spinner" />
                    </div>
                  )}

                  {/* Error */}
                  {(error || aiError) && !isUiLoading && (
                    <p style={{ color: 'red' }}>
                      Unable to load recommendations{aiErrorMsg ? ` (${aiErrorMsg})` : ''}
                    </p>
                  )}

                  {/* Result */}
                  {!isUiLoading && !error && !aiError && (
                    <>
                      <p style={{ whiteSpace: 'pre-line' }}>
                        {summary || 'No recommendations available'}
                      </p>

                      {Array.isArray(recommendations) && recommendations.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          {recommendations.map((r: any) => (
                            <div key={r.recommendation_id} style={{ marginBottom: 12 }}>
                              <div>
                                <b>{r.title}</b> ({r.priority})
                              </div>
                              <div style={{ whiteSpace: 'pre-line' }}>{r.description}</div>

                              {Array.isArray(r.actionable_steps) && r.actionable_steps.length > 0 && (
                                <ul>
                                  {r.actionable_steps.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
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