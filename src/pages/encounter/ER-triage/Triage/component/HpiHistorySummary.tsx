import React, { useEffect, useMemo, useRef, useState } from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useSummarizeMutation } from '@/services/ai-services/clinicalSummaryService';

type Props = {
  patient?: any;
  encounter?: any;
  hpiText?: string | null;
};

const HpiHistorySummary: React.FC<Props> = ({ patient, encounter, hpiText }) => {
  const [isUiLoading, setIsUiLoading] = useState(false);
  const [summarize, { data: aiData, isLoading: isAiLoading, isError: isAiErr, error: aiError }] =
    useSummarizeMutation();

  const encounterKey = encounter?.key ?? encounter?.encounterKey ?? encounter?.id ?? encounter?.encounterId;

  const patientAge = useMemo(() => {
    const v = patient?.age ?? patient?.patientAge ?? patient?.Age;
    return v != null && String(v).trim() !== '' ? String(v) : 'Unknown';
  }, [patient]);

  const patientGender = useMemo(() => {
    const g =
      patient?.gender ??
      patient?.Gender ??
      patient?.genderName ??
      patient?.genderLvalue?.lovDisplayVale ??
      patient?.genderLvalue?.lovDisplayValue;
    return normalizeGender(g) || 'Unknown';
  }, [patient]);

  const cleanedText = useMemo(() => String(hpiText ?? '').trim(), [hpiText]);
  const [textSnapshot, setTextSnapshot] = useState<string>('');
  const symptoms = useMemo(() => splitLines(textSnapshot), [textSnapshot]);

  const aiPayload = useMemo(() => {
    if (!textSnapshot) return null;
    return {
      request_id: `req-hpi-${String(encounterKey ?? '')}`,
      patient_data: {
        Age: patientAge,
        Gender: patientGender,
        Diagnosis: 'HPI',
        Symptoms: symptoms
      }
    };
  }, [textSnapshot, encounterKey, patientAge, patientGender, symptoms]);

  const lastCallKeyRef = useRef<string | null>(null);

  const callKey = useMemo(() => {
    if (!aiPayload) return null;
    // include text length to regenerate when user edits notes
    return `${String(encounterKey ?? '')}:${textSnapshot.length}`;
  }, [aiPayload, encounterKey, textSnapshot.length]);

  useEffect(() => {
    setIsUiLoading(Boolean(isAiLoading));
  }, [isAiLoading]);

  const run = async () => {
    // Take a snapshot of the current HPI notes and summarize that snapshot only.
    const snapshot = String(hpiText ?? '').trim();
    setTextSnapshot(snapshot);

    if (!snapshot) return;

    const nextPayload = {
      request_id: `req-hpi-${String(encounterKey ?? '')}`,
      patient_data: {
        Age: patientAge,
        Gender: patientGender,
        Diagnosis: 'HPI',
        Symptoms: splitLines(snapshot)
      }
    };

    const nextCallKey = `${String(encounterKey ?? '')}:${snapshot.length}`;
    if (!nextCallKey) return;
    if (lastCallKeyRef.current === callKey) return;
    lastCallKeyRef.current = nextCallKey;
    summarize(nextPayload as any);
  };

  const clinicalSummary = (aiData as any)?.ClinicalSummary ?? (aiData as any)?.clinicalSummary;

  const errorMsg = useMemo(() => {
    const e: any = aiError;
    const detail = e?.data?.detail?.[0];
    if (!detail) return null;
    const loc = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
    return `${loc}: ${detail.msg}`;
  }, [aiError]);

  return (
    <SectionContainer
      title="HPI History Summary (AI)"
      action={
        <MyButton appearance="primary" onClick={run} disabled={!cleanedText || isAiLoading}>
          <Translate>Generate</Translate>
        </MyButton>
      }
      content={
        <div style={{ position: 'relative', minHeight: 70, width: '100%' }}>
          {isUiLoading && <div style={{ opacity: 0.8 }}><Translate>Loading</Translate>...</div>}

          {(isAiErr || aiError) && !isUiLoading && (
            <div style={{ color: 'red' }}>
              <Translate>Unable to load summary</Translate>
              {errorMsg ? ` (${errorMsg})` : ''}
            </div>
          )}

          {!isUiLoading && !isAiErr && !aiError && (
            <div style={{ whiteSpace: 'pre-line' }}>
              {textSnapshot
                ? clinicalSummary || 'No summary available'
                : 'Click Generate to summarize the current HPI notes.'}
            </div>
          )}
        </div>
      }
    />
  );
};

export default HpiHistorySummary;

function normalizeGender(g: any): string {
  const s = String(g ?? '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (['m', 'male', 'man', 'ذكر'].includes(lower)) return 'Male';
  if (['f', 'female', 'woman', 'أنثى', 'انثى'].includes(lower)) return 'Female';
  return s;
}

function splitLines(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
  return String(v)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}


