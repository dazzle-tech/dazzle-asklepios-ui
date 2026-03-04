// PatientHistorySummary.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '@/components/SectionsoContainer';

import { useGetPatientSummaryQuery } from '@/services/encounterService';
import { useSummarizeMutation } from '@/services/ai-services/clinicalSummaryService';
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
  const patientKey = patient?.id;
  const encounterKey = encounter?.id;

  // UI loading state (covers: fetch patientSummary + building payload + calling AI + waiting AI result)
  const [isUiLoading, setIsUiLoading] = useState(false);

  // 1) Get patient summary from backend
  const {
    data: patientSummaryResp,
    isFetching: isPatientSummaryFetching,
    isLoading: isPatientSummaryLoading,
    error: patientSummaryError
  } = useGetPatientSummaryQuery(
    { patientKey, encounterKey, lang },
    { skip: !patientKey || !encounterKey }
  );

  // 2) AI summarize mutation
  const [
    summarize,
    { data: aiData, isLoading: isAiLoading, isUninitialized, isError: isAiErr, error: aiError }
  ] = useSummarizeMutation();

  // Support both shapes: flattened or ParentResponse { object }
  const patientSummary = useMemo(() => {
    const r: any = patientSummaryResp;
    return r?.object ?? r ?? null;
  }, [patientSummaryResp]);

  // Fallback gender
  const genderFromPatient = useMemo(() => {
    const g =
      patient?.gender ??
      patient?.Gender ??
      patient?.genderName ??
      patient?.genderLvalue?.lovDisplayVale ??
      patient?.genderLvalue?.lovDisplayValue;
    return normalizeGender(g);
  }, [patient]);

  // Prevent repeated call for same patient+encounter
  const lastCallKeyRef = useRef<string | null>(null);

  // 3) Build AI payload (exact required shape)
  const aiPayload = useMemo(() => {
    // while waiting patientSummary -> keep loading visible
    if (!patientSummary) return null;

    const s: any = patientSummary;

    const vitals: Record<string, string> =
      s?.vitals && typeof s.vitals === 'object'
        ? ensureStringRecord(s.vitals)
        : vitalsTextToObject(String(s?.vitals ?? ''));

    const genderStr = String(s?.gender ?? '').trim() || genderFromPatient;

    return {
      request_id: `req-${patientKey ?? ''}-${encounterKey ?? ''}`,
      patient_data: {
        Age: String(s?.age ?? 'Unknown').trim() || 'Unknown',
        Gender: genderStr || 'Unknown',
        Diagnosis: String(s?.diagnosis ?? 'N/A').trim() || 'N/A',
        Symptoms: splitLines(s?.symptoms),
        Medications: toStringArray(s?.medications),
        Surgeries: toStringArray(s?.surgeries),
        Allergies: toStringArray(s?.allergies),
        Medical_Warnings: splitSemicolonOrArray(s?.medicalWarnings),
        Problems: toStringArray(s?.problems),
        Vitals: vitals
      }
    };
  }, [patientSummary, patientKey, encounterKey, genderFromPatient]);

  // 4) Manage UI loading: start as soon as modal has keys and until AI response arrives
  useEffect(() => {
    if (!patientKey || !encounterKey) {
      setIsUiLoading(false);
      return;
    }

    const waitingPatientSummary =
      isPatientSummaryFetching || isPatientSummaryLoading || !patientSummary;
    const waitingAiResult = isAiLoading || (aiPayload != null && !aiData && !isAiErr);

    setIsUiLoading(waitingPatientSummary || waitingAiResult);
  }, [
    patientKey,
    encounterKey,
    isPatientSummaryFetching,
    isPatientSummaryLoading,
    patientSummary,
    isAiLoading,
    aiPayload,
    aiData,
    isAiErr
  ]);

  // 5) Call AI summarize once per patient+encounter (after payload is ready)
  useEffect(() => {
    if (!aiPayload || !patientKey || !encounterKey) return;

    // guard: pydantic requires non-empty gender
    if (!aiPayload.patient_data.Gender || String(aiPayload.patient_data.Gender).trim() === '')
      return;

    const callKey = `${patientKey}:${encounterKey}`;
    if (lastCallKeyRef.current === callKey) return;

    lastCallKeyRef.current = callKey;
    summarize(aiPayload);
  }, [aiPayload, summarize, patientKey, encounterKey]);

  // AI output
  const clinicalSummary = (aiData as any)?.ClinicalSummary ?? (aiData as any)?.clinicalSummary;

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
            <span>{title || 'Patient History Summary'}</span>
          </div>
        }
        action={<div>{button && <div>{button}</div>}</div>}
        content={
          <div className="medical-table-div2">
            <div className="patient-history-card">
              <div className="patient-history-content">
                <div className="patient-history-text">
                  {/* Loader inside the box ALWAYS while collecting data + waiting AI */}
                  {isUiLoading && (
                    <div className="spinner-container">
                      <div className="spinner" />
                    </div>
                  )}

                  {/* Error (only when not loading) */}
                  {(patientSummaryError || aiError) && !isUiLoading && (
                    <p style={{ color: 'red' }}>
                      Unable to load summary{aiErrorMsg ? ` (${aiErrorMsg})` : ''}
                    </p>
                  )}

                  {/* Result (only when not loading) */}
                  {!isUiLoading && !patientSummaryError && !aiError && (
                    <p style={{ whiteSpace: 'pre-line' }}>
                      {clinicalSummary || 'No summary available'}
                    </p>
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

function normalizeGender(g: any): string {
  const s = String(g ?? '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();

  if (['m', 'male', 'man', 'ذكر'].includes(lower)) return 'Male';
  if (['f', 'female', 'woman', 'أنثى', 'انثى'].includes(lower)) return 'Female';

  return s;
}

function toStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
  return [String(v)].filter(Boolean);
}

function splitLines(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
  return String(v)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function splitSemicolonOrArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
  return String(v)
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

function vitalsTextToObject(vitalsText: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!vitalsText) return out;

  vitalsText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key) out[key] = val;
    });

  return out;
}

function ensureStringRecord(v: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== 'object') return out;

  Object.entries(v).forEach(([k, val]) => {
    out[String(k)] = val == null ? '' : String(val);
  });

  return out;
}
