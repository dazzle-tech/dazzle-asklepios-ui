import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faCircleExclamation,
  faEye,
  faMicrophone,
  faPause,
  faPlay,
  faStop
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Loader, Tooltip, Whisper } from 'rsuite';
import { useSelector } from 'react-redux';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useAutoPopulateMutation } from '@/services/auto-Population/autoPopulationService';
import type { AmbientDraft } from '@/services/ai-services/ambientDraft';
import {
  useCreateAmbientDraftMutation,
  type AmbientDraftRequest
} from '@/services/ai-services/ambientDraftService';
import {
  useCreateEncounterAmbientMutation,
  useLazyGetEncounterAmbientByEncounterQuery,
  useLazyGetEncounterAmbientQuery,
  useLazyGetEncounterAmbientRecordingQuery,
  useUpdateEncounterAmbientDraftMutation
} from '@/services/encounters/encounterAmbientService';
import AmbientDraftModal from './AmbientDraftModal';
import type { AutoPopulationResponse } from '@/types/model-types-new';
import { useGetPatientDiagnosesByPatientIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetPreviousClosedEncounterQuery } from '@/services/encounters/patientEncounterService';
import { useGetAllChronicRawQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import { formatEnumString } from '@/utils';
import {
  useGetAmbientScribeSetupQuery,
  type AmbientScribeClinic
} from '@/services/setup/ambientScribeSetupService';
import { useGetPractitionerByUserIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useEnumOptions } from '@/services/enumsApi';
import { preferredRecorderMimeType, toSupportedAudioFile } from '@/services/ai-services/supportedAudio';
import {
  LiveVisitConnection,
  livePatientContext,
  type LiveEvidence,
  type LivePickedUp,
  type LiveSegment
} from '@/services/ai-services/liveVisitScribe';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { notify } from '@/utils/uiReducerActions';
import './ambient-scribe.less';

type ConsentStatus = 'pending' | 'given' | 'declined';
type SessionPhase = 'idle' | 'recording' | 'paused' | 'processing' | 'stopped';

type AmbientScribeProps = {
  disabled?: boolean;
  patientId?: number | string | null;
  encounter?: any;
  onEncounterSaved?: (encounter: any) => void;
  encounterId?: number | string | null;
  facilityId?: number | string | null;
  departmentId?: number | string | null;
  patientLine?: string;
};

const CONSENT_METHOD_HINTS: Record<string, string> = {
  VERBAL: 'Logged with your name and time',
  TABLET: 'Patient signs the consent form'
};

const MICROPHONE_HINTS: Record<string, string> = {
  COMPUTER: 'Desk mic · signal good',
  PHONE: 'Scan with the Asklepios app'
};

const PATIENT_SCRIPT =
  "I'd like to use a tool that listens to our conversation and helps me write your notes. I review everything. The recording is deleted after 30 days. Is that OK?";

const PATIENT_SCRIPT_AR =
  'أود استخدام أداة تستمع إلى حديثنا وتساعدني في كتابة ملاحظاتك. أراجع كل شيء بنفسي، ويُحذف التسجيل بعد ٣٠ يوما. هل توافق؟';

const isoDate = (value: unknown) => {
  if (!value) {
    return '';
  }
  const text = value instanceof Date ? value.toISOString() : String(value);
  return text.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
};

const dosePhrase = (dose?: number | null, unit?: string | null, frequency?: string | null) =>
  [dose == null ? '' : String(dose), formatEnumString(unit || ''), formatEnumString(frequency || '')]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const QR_SIZE = 21;

const finderAt = (row: number, col: number) => {
  const origins = [
    [0, 0],
    [0, QR_SIZE - 7],
    [QR_SIZE - 7, 0]
  ];

  for (const [originRow, originCol] of origins) {
    if (row < originRow || row >= originRow + 7 || col < originCol || col >= originCol + 7) {
      continue;
    }

    const localRow = row - originRow;
    const localCol = col - originCol;
    const edge = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
    const core = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;

    return edge || core;
  }

  return null;
};

const qrDark = (row: number, col: number) => {
  const finder = finderAt(row, col);
  if (finder !== null) {
    return finder;
  }

  return (row * 17 + col * 13) % 5 < 2;
};

const QrMark = () => {
  const cells = [];

  for (let row = 0; row < QR_SIZE; row += 1) {
    for (let col = 0; col < QR_SIZE; col += 1) {
      if (!qrDark(row, col)) {
        continue;
      }

      cells.push(
        <rect
          key={`${row}-${col}`}
          x={col * 4}
          y={row * 4}
          width={4}
          height={4}
          fill="#1f2430"
        />
      );
    }
  }

  return (
    <svg className="ambient-scribe-qr" viewBox="0 0 84 84" aria-hidden="true">
      <rect width="84" height="84" fill="#fff" />
      {cells}
    </svg>
  );
};

type ChoiceCardProps = {
  title: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
  extra?: React.ReactNode;
};

type TranscriptTurn = {
  id: string;
  speaker: string;
  text: string;
};

type Finding = {
  id: string;
  label: string;
  value: string;
  confirmDose?: boolean;
};

const SPEAKER_LINE =
  /^(clinician|doctor|physician|provider|patient|nurse|speaker(?:\s*\d+)?)\s*:\s*(.+)$/i;

const speechRecognitionCtor = () => {
  const browserWindow = window as Window & {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };

  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
};

const toTurns = (text: string): TranscriptTurn[] => {
  const lines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  const labeled = lines.some(line => SPEAKER_LINE.test(line));

  if (labeled) {
    return lines.map((line, index) => {
      const match = line.match(SPEAKER_LINE);
      if (!match) {
        return { id: `line-${index}`, speaker: '', text: line };
      }

      const speaker = match[1].replace(/\s+/g, ' ');
      return {
        id: `line-${index}`,
        speaker: speaker.charAt(0).toUpperCase() + speaker.slice(1),
        text: match[2].trim()
      };
    });
  }

  const sentences = text.match(/[^.!?\n]+[.!?]+|\S[^.!?\n]*$/g) ?? [];

  return sentences
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map((sentence, index) => ({
      id: `sentence-${index}`,
      speaker: '',
      text: sentence
    }));
};

const formatMedication = (item: Record<string, any> | string) => {
  if (typeof item !== 'object' || item === null) {
    return String(item);
  }

  const name = item.name ? String(item.name) : 'Medication';
  const dosage = item.dosage ? String(item.dosage) : '';
  const frequency = item.frequency ? formatEnumString(String(item.frequency)) : '';
  const route = item.route ? String(item.route) : '';

  return [name, dosage, frequency, route].filter(Boolean).join(' · ');
};

const findingsFromDraft = (draft: AmbientDraft): Finding[] => {
  const items: Finding[] = [];
  const note = draft.soap_note;
  const reviewed = draft.review?.texts;

  const add = (id: string, label: string, value?: string | null) => {
    const text = value?.trim();
    if (text) {
      items.push({ id, label, value: text });
    }
  };

  add('complaint', 'Chief complaint', reviewed?.chief_complaint || note?.ChiefComplaint);
  add('hpi', 'History of present illness', reviewed?.hpi || note?.HPI);
  add('exam', 'Physical examination', reviewed?.physical_exam || note?.PhysicalExamination);
  add('assessment', 'Assessment', reviewed?.assessment_plan || note?.Assessments);
  add('plan', 'Plan', note?.TreatmentPlans);

  draft.diagnoses?.forEach((diagnosis, index) => {
    const value = [diagnosis.icd10, diagnosis.label].filter(Boolean).join(' · ');
    add(`diagnosis-${diagnosis.id || index}`, 'Diagnosis', value);
  });

  draft.mentions
    ?.filter(mention => mention.confirm_required && mention.text?.trim())
    .forEach((mention, index) => {
      items.push({
        id: `mention-${index}-${mention.text}`,
        label: 'Dose to confirm',
        value: mention.text.trim(),
        confirmDose: true
      });
    });

  return items;
};

const transcriptFromDraft = (draft: AmbientDraft) =>
  (draft.transcript ?? [])
    .map(segment => {
      const text = segment.text?.trim();
      if (!text) {
        return '';
      }

      const speaker = segment.speaker?.trim();
      return speaker ? `${speaker}: ${text}` : text;
    })
    .filter(Boolean)
    .join('\n');

const buildFindings = (result: AutoPopulationResponse, summary?: string): Finding[] => {
  const items: Finding[] = [];
  const fields = result.structured_fields;

  if (summary?.trim()) {
    items.push({ id: 'summary', label: 'Summary', value: summary.trim() });
  }

  if (fields?.chief_complaint) {
    items.push({ id: 'complaint', label: 'Chief complaint', value: fields.chief_complaint });
  }

  if (fields?.history_of_present_illness) {
    items.push({
      id: 'hpi',
      label: 'History of present illness',
      value: fields.history_of_present_illness
    });
  }

  if (fields?.assessment) {
    items.push({ id: 'assessment', label: 'Assessment', value: fields.assessment });
  }

  if (fields?.plan) {
    items.push({ id: 'plan', label: 'Plan', value: fields.plan });
  }

  if (fields?.diagnosis?.length) {
    items.push({ id: 'diagnosis', label: 'Diagnosis', value: fields.diagnosis.join(', ') });
  }

  if (fields?.allergies?.length) {
    items.push({ id: 'allergies', label: 'Allergies', value: fields.allergies.join(', ') });
  }

  fields?.medications?.forEach((medication, index) => {
    const value = formatMedication(medication);
    if (!value.trim()) {
      return;
    }

    items.push({
      id: `dose-${index}-${value}`,
      label: 'Dose to confirm',
      value,
      confirmDose: true
    });
  });

  result.uncertainty_flags?.forEach((flag, index) => {
    const flagText = `${flag.field_name} ${flag.reason}`;
    if (!/dose|medicat|dosage/i.test(flagText) || !flag.reason?.trim()) {
      return;
    }

    items.push({
      id: `uncertain-dose-${index}`,
      label: 'Dose to confirm',
      value: flag.reason,
      confirmDose: true
    });
  });

  return items;
};

const formatElapsed = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

type RecordingWorkspaceProps = {
  phase: SessionPhase;
  elapsed: number;
  languageLabel: string;
  mode: string;
  audioUrl?: string | null;
  hasDraft?: boolean;
  canRecreateDraft?: boolean;
  recreatingDraft?: boolean;
  liveSegments: LiveSegment[];
  pickedUp: LivePickedUp | null;
  liveNotice: string;
  liveLink: 'idle' | 'connecting' | 'live';
  liveHearing: boolean;
  onViewDraft?: () => void;
  onRecreateDraft?: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onPlaybackStart?: (audio: HTMLAudioElement, fromStart: boolean) => void;
  onPlaybackPause?: () => void;
  onPlaybackEnded?: () => void;
};

const clockMs = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const prettyKey = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, letter => letter.toUpperCase());

const fieldText = (value: unknown) => {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const RECORD_GROUP_ORDER = [
  'vital_sign',
  'body_measurements',
  'pain_assessment',
  'nursing_assessment',
  'clinical_visit',
  'assessment',
  'plan_of_care'
];

const LiveTranscriptPanel = ({
  segments,
  notice,
  link,
  hearing,
  phase
}: {
  segments: LiveSegment[];
  notice: string;
  link: 'idle' | 'connecting' | 'live';
  hearing: boolean;
  phase: SessionPhase;
}) => {
  const waiting =
    link === 'connecting'
      ? 'Connecting to the live transcript…'
      : link === 'live' && hearing
        ? phase === 'recording' || phase === 'paused'
          ? 'Hearing the microphone. Lines appear when speech is recognized.'
          : 'Hearing the recording. Lines appear when speech is recognized.'
        : link === 'live'
          ? 'Connected. Waiting for audio…'
          : phase === 'recording' || phase === 'paused'
            ? notice || 'The live transcript has not connected.'
            : 'Play the recording to send it to the live transcript.';

  return (
    <div className="ambient-transcript">
      {notice && <p className="ambient-empty">{notice}</p>}
      {!segments.length && !notice && <p className="ambient-empty">{waiting}</p>}
      {segments.map(segment => (
      <div
        key={segment.id}
        className={`ambient-turn${segment.final ? '' : ' is-live'}`}
        dir={/[\u0600-\u06FF]/.test(segment.text) ? 'rtl' : undefined}
      >
        <div
          className={`ambient-turn-speaker${
            segment.speaker === 'patient' ? ' is-patient' : segment.speaker === 'doctor' ? ' is-clinician' : ''
          }`}
        >
          {segment.speaker}
          <span className="ambient-live-meta">
            {segment.lang ? ` · ${segment.lang}` : ''} · {clockMs(segment.start_ms)}–{clockMs(segment.end_ms)} ·{' '}
            {segment.final ? 'final' : 'partial'}
          </span>
        </div>
        <p>{segment.text}</p>
      </div>
    ))}
    </div>
  );
};

const EvidenceBlock = ({ title, items }: { title: string; items?: LiveEvidence[] }) => {
  if (!items?.length) return null;
  return (
    <>
      <div className="ambient-live-heading">{title}</div>
      {items.map((item, index) => (
        <div key={`${title}-${index}`} className="ambient-finding">
          <p>{item.text}</p>
        </div>
      ))}
    </>
  );
};

const PickedUpPanel = ({ picked, notice }: { picked: LivePickedUp | null; notice: string }) => {
  const record = picked?.record ?? {};
  const names = [
    ...RECORD_GROUP_ORDER.filter(name => record[name]),
    ...Object.keys(record).filter(name => record[name] && !RECORD_GROUP_ORDER.includes(name))
  ];
  const hasItems = Boolean(
    picked?.complaint?.text ||
      picked?.symptoms?.length ||
      picked?.medications?.length ||
      picked?.exam?.length ||
      names.length
  );

  return (
    <div className="ambient-findings">
      {notice && <p className="ambient-empty">{notice}</p>}
      {!hasItems && (
        <p className="ambient-empty">
          Updated after a final line, at most every 8 seconds. Medicines always say confirm dose.
        </p>
      )}
      {picked?.complaint?.text && (
        <>
          <div className="ambient-live-heading">Complaint</div>
          <div className="ambient-finding">
            <p>{picked.complaint.text}</p>
          </div>
        </>
      )}
      <EvidenceBlock title="Symptoms" items={picked?.symptoms} />
      {!!picked?.medications?.length && (
        <>
          <div className="ambient-live-heading">Medications</div>
          {picked.medications.map((item, index) => (
            <div key={`med-${index}`} className="ambient-finding is-flagged">
              <div className="ambient-finding-label">Confirm dose</div>
              <p>
                {item.name}
                {item.detail ? ` — ${item.detail}` : ''}
              </p>
            </div>
          ))}
        </>
      )}
      <EvidenceBlock title="Exam" items={picked?.exam} />
      {names.map(name => {
        const value = record[name] ?? {};
        const fields = Object.entries(value).filter(([, field]) => field !== null && field !== undefined && field !== '');
        const missing = picked?.missing_required?.[name] ?? [];
        const status = picked?.record_status?.[name] ?? '';
        return (
          <section key={name} className="ambient-live-record">
            <header>
              <b>{prettyKey(name)}</b>
              {status && <span className="ambient-live-meta">{prettyKey(status)}</span>}
            </header>
            {fields.map(([key, field]) => (
              <div key={key} className="ambient-finding">
                <div className="ambient-finding-label">{prettyKey(key)}</div>
                <p>{fieldText(field)}</p>
              </div>
            ))}
            {!!missing.length && (
              <p className="ambient-live-meta">Still needed: {missing.map(prettyKey).join(', ')}</p>
            )}
          </section>
        );
      })}
    </div>
  );
};

const StoppedIconButton = ({
  label,
  icon,
  disabled,
  loading,
  onClick
}: {
  label: string;
  icon: IconDefinition;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) => (
  <Whisper trigger="hover" placement="top" speaker={<Tooltip>{label}</Tooltip>}>
    <span className="ambient-recording-icon-btn">
      <MyButton
        appearance="ghost"
        color="var(--primary-blue)"
        size="small"
        radius="8px"
        disabled={disabled}
        loading={loading}
        style={{ border: '1px solid var(--primary-blue)', background: 'transparent', padding: 0 }}
        onClick={onClick}
      >
        <FontAwesomeIcon icon={icon} style={{ color: 'var(--primary-blue)' }} />
        <span className="ambient-recording-sr">{label}</span>
      </MyButton>
    </span>
  </Whisper>
);

const RecordingWave = ({ live }: { live: boolean }) => (
  <span className={`ambient-recording-wave${live ? ' is-live' : ''}`} aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => (
      <span key={index} />
    ))}
  </span>
);

const RecordingWorkspace = ({
  phase,
  elapsed,
  languageLabel,
  mode,
  audioUrl,
  hasDraft,
  canRecreateDraft = true,
  recreatingDraft,
  liveSegments,
  pickedUp,
  liveNotice,
  liveLink,
  liveHearing,
  onViewDraft,
  onRecreateDraft,
  onPause,
  onResume,
  onStop,
  onPlaybackStart,
  onPlaybackPause,
  onPlaybackEnded
}: RecordingWorkspaceProps) => {
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);
  const creatingDraft = phase === 'processing' || Boolean(recreatingDraft);
  const barLabel = creatingDraft
    ? 'Creating draft'
    : phase === 'paused'
      ? 'Paused'
      : playing
        ? 'Playing'
        : phase === 'stopped'
          ? 'Recording stopped'
          : 'Recording';

  useEffect(() => {
    setPlaying(false);
    setPlaySeconds(0);
  }, [audioUrl]);

  const togglePlayback = () => {
    const audio = playbackRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      const fromStart = audio.ended || audio.currentTime < 0.3;
      if (audio.ended) audio.currentTime = 0;
      onPlaybackStart?.(audio, fromStart);
      void audio.play();
      return;
    }

    audio.pause();
    onPlaybackPause?.();
  };

  return (
    <div className={`ambient-recording ${mode === 'dark' ? 'dark' : 'light'}`}>
      <div
        className={`ambient-recording-bar is-${phase}${creatingDraft ? ' is-creating' : ''}`}
        role="status"
        aria-busy={creatingDraft}
      >
        <span className="ambient-recording-dot" />
        <span className="ambient-recording-label">{barLabel}</span>
        <span className="ambient-recording-timer">
          {formatElapsed(playing ? playSeconds : elapsed)}
        </span>
        <RecordingWave live={phase === 'recording'} />
        <span className="ambient-recording-lang">{languageLabel}</span>
        {creatingDraft && (
          <span className="ambient-recording-actions">
            <Loader size="sm" />
          </span>
        )}
        {phase === 'stopped' && !creatingDraft && (
          <div className="ambient-recording-actions">
            <audio
              ref={playbackRef}
              src={audioUrl || undefined}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setPlaySeconds(0);
                onPlaybackEnded?.();
              }}
              onTimeUpdate={event => setPlaySeconds(Math.floor(event.currentTarget.currentTime))}
            />
            <StoppedIconButton
              label={playing ? 'Pause' : 'Play'}
              icon={playing ? faPause : faPlay}
              disabled={!audioUrl}
              onClick={togglePlayback}
            />
            <StoppedIconButton
              label="View draft"
              icon={faEye}
              disabled={!hasDraft}
              onClick={onViewDraft}
            />
            {!hasDraft && (
              <StoppedIconButton
                label={
                  canRecreateDraft
                    ? 'Recreate draft'
                    : 'Ambient Scribe is not set up for this facility.'
                }
                icon={faArrowsRotate}
                loading={recreatingDraft}
                disabled={recreatingDraft || !canRecreateDraft}
                onClick={onRecreateDraft}
              />
            )}
          </div>
        )}
        {phase !== 'stopped' && phase !== 'processing' && (
          <div className="ambient-recording-actions">
            <MyButton
              appearance="ghost"
              color="#1f2937"
              size="small"
              radius="8px"
              prefixIcon={() => (
                <FontAwesomeIcon icon={phase === 'paused' ? faPlay : faPause} />
              )}
              style={{ border: '1px solid #d7dbe3', background: '#ffffff', padding: '0 14px' }}
              onClick={phase === 'paused' ? onResume : onPause}
            >
              {phase === 'paused' ? 'Resume' : 'Pause'}
            </MyButton>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faStop} />}
              onClick={onStop}
            >
              Stop & create draft
            </MyButton>
          </div>
        )}
      </div>

      <div className="ambient-recording-body">
        {creatingDraft && (
          <div className="ambient-recording-loading" role="status">
            <Loader size="md" content="Creating the ambient draft…" vertical />
          </div>
        )}
        <SectionContainer
          title="Live transcript"
          content={
            <LiveTranscriptPanel
              segments={liveSegments}
              notice={/picked up/i.test(liveNotice) ? '' : liveNotice}
              link={liveLink}
              hearing={liveHearing}
              phase={phase}
            />
          }
        />

        <SectionContainer
          title="Picked up so far"
          content={
            <PickedUpPanel
              picked={pickedUp}
              notice={/picked up/i.test(liveNotice) ? liveNotice : ''}
            />
          }
        />
      </div>
    </div>
  );
};

const ChoiceCard = ({ title, hint, selected, onSelect, extra }: ChoiceCardProps) => (
  <button
    type="button"
    className={`ambient-scribe-choice${selected ? ' is-selected' : ''}`}
    onClick={onSelect}
    aria-pressed={selected}
  >
    <span className="ambient-scribe-radio" />
    <span className="ambient-scribe-choice-copy">
      <span className="ambient-scribe-choice-title">{title}</span>
      <span className="ambient-scribe-choice-hint">{hint}</span>
    </span>
    {extra}
  </button>
);

const startAccess = (
  clinic: AmbientScribeClinic | undefined,
  practitionerId?: number | null
) => {
  if (!clinic || !clinic.enabled) {
    return { allowed: false, reason: 'Ambient Scribe is turned off for this clinic.' };
  }
  if (!practitionerId) {
    return { allowed: false, reason: 'Ambient Scribe can be started by a physician in this clinic.' };
  }

  const selected = clinic.practitioners.filter(practitioner => practitioner.enabled);
  const allowed =
    selected.length === 0
      ? clinic.practitioners.some(practitioner => practitioner.id === practitionerId)
      : selected.some(practitioner => practitioner.id === practitionerId);

  return allowed
    ? { allowed: true, reason: '' }
    : {
        allowed: false,
        reason:
          selected.length === 0
            ? 'Ambient Scribe can be started by a physician in this clinic.'
            : 'Ambient Scribe is limited to the physicians selected for this clinic.'
      };
};

const AmbientScribe = ({
  disabled = false,
  patientId,
  encounter,
  onEncounterSaved,
  encounterId,
  facilityId,
  departmentId,
  patientLine
}: AmbientScribeProps) => {
  const consentMethodOptions = useEnumOptions('AmbientConsentMethod', {
    labelOverrides: {
      VERBAL: 'Verbal consent',
      TABLET: 'Signed on tablet'
    }
  });
  const microphoneOptions = useEnumOptions('AmbientMicrophoneSource', {
    labelOverrides: {
      COMPUTER: 'This computer',
      PHONE: 'Pair phone or tablet'
    }
  });
  const consentStatusOptions = useEnumOptions('AmbientConsentStatus');
  const givenConsent =
    consentStatusOptions.find(option => option.value === 'GIVEN')?.value ?? 'GIVEN';
  const declinedConsent =
    consentStatusOptions.find(option => option.value === 'DECLINED')?.value ?? 'DECLINED';
  const dispatch = useAppDispatch();
  const ui = useSelector((state: { ui: { mode: string; lang: string } }) => state.ui);
  const userId = useSelector((state: { auth: { user?: { id?: number } } }) => state.auth.user?.id);
  const resolvedFacilityId = facilityId || (() => {
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
      return tenant?.selectedFacility?.id ?? null;
    } catch {
      return null;
    }
  })();
  const { data: scribeSetup, isLoading: scribeSetupLoading, isError: scribeSetupError } =
    useGetAmbientScribeSetupQuery(resolvedFacilityId as number | string, { skip: !resolvedFacilityId });
  const { data: currentPractitioner, isLoading: practitionerLoading, isError: practitionerError } =
    useGetPractitionerByUserIdQuery(Number(userId), { skip: !userId });
  const visitClinic = scribeSetup?.clinics.find(
    clinic => Number(clinic.departmentId) === Number(departmentId)
  );
  const patientIdNumber = patientId == null || patientId === '' ? null : Number(patientId);
  const encounterIdNumber = encounterId == null || encounterId === '' ? null : Number(encounterId);
  const { data: patientDiagnoses } = useGetPatientDiagnosesByPatientIdQuery(
    { patientId: patientIdNumber as number },
    { skip: patientIdNumber == null }
  );
  const chronicDiagnosisIds = useMemo(
    () =>
      (Array.isArray(patientDiagnoses) ? patientDiagnoses : [])
        .filter(diagnosis => diagnosis?.major && diagnosis.diagnosisId)
        .map(diagnosis => diagnosis.diagnosisId as number),
    [patientDiagnoses]
  );
  const { data: icdDiagnoses } = useGetIcdDiagnosesByIdsQuery(
    { ids: chronicDiagnosisIds },
    { skip: chronicDiagnosisIds.length === 0 }
  );
  const { data: chronicMedications } = useGetAllChronicRawQuery(
    { patientId: patientIdNumber as number, page: 0, size: 50, sort: 'id,asc' },
    { skip: patientIdNumber == null }
  );
  const medicationIds = useMemo(
    () =>
      (chronicMedications?.data ?? [])
        .map(medication => medication.medicationsId)
        .filter((id): id is number => id != null),
    [chronicMedications]
  );
  const { data: brandMedications } = useGetBrandMedicationsByIdsQuery(
    { ids: medicationIds },
    { skip: medicationIds.length === 0 }
  );
  const { data: patientAllergies } = useGetPatientAllergiesByPatientIdQuery(
    { patientId: patientIdNumber as number, page: 0, size: 50, showCancelled: false },
    { skip: patientIdNumber == null }
  );
  const { data: previousEncounter } = useGetPreviousClosedEncounterQuery(
    { encounterId: encounterIdNumber as number },
    { skip: encounterIdNumber == null }
  );
  const patientContext = useMemo(() => {
    const icdById = new Map((icdDiagnoses ?? []).map(diagnosis => [Number(diagnosis.id), diagnosis]));
    const chronicDiseases = (Array.isArray(patientDiagnoses) ? patientDiagnoses : [])
      .filter(diagnosis => diagnosis?.major)
      .map(diagnosis => {
        const icd = icdById.get(Number(diagnosis.diagnosisId));
        return (icd?.icdShortDescription || icd?.icdFullDescription || '').trim();
      })
      .filter(Boolean);
    const brands = new Map((brandMedications ?? []).map(medication => [String(medication.id), medication]));
    const activeMedications = (chronicMedications?.data ?? [])
      .map(medication => {
        const brand = brands.get(String(medication.medicationsId));
        const name = medication.otherMedicationName?.trim() || brand?.name || brand?.medicationName || '';
        const instructions = dosePhrase(medication.dose, medication.doesUnit, medication.frequency);
        return [name, instructions].filter(Boolean).join(' ').trim();
      })
      .filter(Boolean);
    const allergies = (patientAllergies?.data ?? [])
      .filter(allergy => !allergy.status || allergy.status === 'ACTIVE')
      .map(allergy => (allergy.allergenName || '').trim())
      .filter(Boolean);
    const lastVisitDate = isoDate(
      previousEncounter?.encounterDate || previousEncounter?.startedDate || previousEncounter?.createdDate
    );
    const lastVisitSummary = [
      previousEncounter?.historyOfPresentIllness,
      previousEncounter?.notes,
      previousEncounter?.encounterReason
    ]
      .map(value => (value || '').trim())
      .find(Boolean);
    return JSON.stringify({
      chronic_diseases: chronicDiseases,
      active_medications: activeMedications,
      allergies,
      ...(lastVisitDate || lastVisitSummary
        ? { last_visit: { date: lastVisitDate, summary: lastVisitSummary || '' } }
        : {})
    });
  }, [
    brandMedications,
    chronicMedications,
    icdDiagnoses,
    patientAllergies,
    patientDiagnoses,
    previousEncounter
  ]);
  const accessLoading = Boolean(resolvedFacilityId && departmentId && (scribeSetupLoading || practitionerLoading));
  const setupAdded = Boolean(scribeSetup?.id);
  const access = startAccess(
    scribeSetupError || !setupAdded ? undefined : visitClinic,
    practitionerError ? null : currentPractitioner?.id
  );
  const canStartAmbient = setupAdded && !accessLoading && access.allowed;
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [consentMethod, setConsentMethod] = useState('VERBAL');
  const [microphone, setMicrophone] = useState('COMPUTER');
  const [transcriptText, setTranscriptText] = useState('');
  const [interim, setInterim] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [confirmedDoses, setConfirmedDoses] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState(true);
  const [draft, setDraft] = useState<AmbientDraft | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [savedSessionReady, setSavedSessionReady] = useState(false);
  const [recreatingDraft, setRecreatingDraft] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const committedRef = useRef('');
  const sessionFinalRef = useRef('');
  const interimRef = useRef('');
  const patientIdRef = useRef(patientId);
  const encounterIdRef = useRef(encounterId);
  const audioUrlRef = useRef<string | null>(null);
  const microphoneRef = useRef(microphone);
  const consentMethodRef = useRef(consentMethod);
  const consentAtRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef<string | null>(null);
  const ambientIdRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const langRef = useRef(ui.lang);
  const draftOptionsRef = useRef<Omit<AmbientDraftRequest, 'audio'>>({});
  const populateSeqRef = useRef(0);
  const [storedDurationMs, setStoredDurationMs] = useState(0);
  const [liveSegments, setLiveSegments] = useState<LiveSegment[]>([]);
  const [pickedUp, setPickedUp] = useState<LivePickedUp | null>(null);
  const [liveNotice, setLiveNotice] = useState('');
  const [liveLink, setLiveLink] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [liveHearing, setLiveHearing] = useState(false);
  const liveRef = useRef<LiveVisitConnection | null>(null);

  const [createAmbientDraft] = useCreateAmbientDraftMutation();
  const [saveEncounterAmbient] = useCreateEncounterAmbientMutation();
  const [updateEncounterAmbientDraft] = useUpdateEncounterAmbientDraftMutation();
  const [loadEncounterAmbient] = useLazyGetEncounterAmbientByEncounterQuery();
  const [loadEncounterAmbientDetail] = useLazyGetEncounterAmbientQuery();
  const [loadEncounterAmbientRecording] = useLazyGetEncounterAmbientRecordingQuery();
  const [autoPopulate] = useAutoPopulateMutation();

  patientIdRef.current = patientId;
  encounterIdRef.current = encounterId;
  microphoneRef.current = microphone;
  consentMethodRef.current = consentMethod;
  phaseRef.current = phase;
  langRef.current = ui.lang;
  draftOptionsRef.current = {
    noteLanguage: scribeSetup?.noteLanguage,
    instructionLanguage: scribeSetup?.instructionLanguage,
    specialty: scribeSetup?.specialty,
    noteLength: scribeSetup?.noteStyle,
    noteForm: scribeSetup?.noteForm,
    patientContext,
    suggestIcd10: scribeSetup?.suggestIcd10,
    suggestOrders: scribeSetup?.suggestOrders
  };

  const publishTranscript = (committed: string, sessionFinal: string, nextInterim: string) => {
    committedRef.current = committed;
    sessionFinalRef.current = sessionFinal;
    interimRef.current = nextInterim;
    setTranscriptText(`${committed} ${sessionFinal}`.trim());
    setInterim(nextInterim);
  };

  const refreshFindings = async (text: string, summary?: string) => {
    const currentPatientId = Number(patientIdRef.current);
    if (!currentPatientId || !text.trim()) {
      if (summary?.trim()) {
        setFindings([{ id: 'summary', label: 'Summary', value: summary.trim() }]);
      }
      return;
    }

    const seq = populateSeqRef.current + 1;
    populateSeqRef.current = seq;

    try {
      const result = await autoPopulate({
        userText: text,
        patientId: currentPatientId
      }).unwrap();

      if (seq !== populateSeqRef.current) {
        return;
      }

      setFindings(buildFindings(result, summary));
    } catch {
      if (summary?.trim() && seq === populateSeqRef.current) {
        setFindings([{ id: 'summary', label: 'Summary', value: summary.trim() }]);
      }
    }
  };

  const startRecognition = () => {
    const Recognition = speechRecognitionCtor();
    if (!Recognition) {
      setLiveTranscript(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = langRef.current === 'SYS_LANG_ENG' ? 'en-US' : 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      if (recognitionRef.current !== recognition) {
        return;
      }

      let finals = '';
      let nextInterim = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const piece = event.results[index][0]?.transcript ?? '';
        if (event.results[index].isFinal) {
          finals += `${piece} `;
        } else {
          nextInterim += piece;
        }
      }

      publishTranscript(committedRef.current, finals.trim(), nextInterim.trim());
    };

    recognition.onerror = (event: { error?: string }) => {
      if (event.error === 'not-allowed') {
        setLiveTranscript(false);
      }
    };

    recognition.onend = () => {
      if (!shouldListenRef.current || recognitionRef.current !== recognition) {
        return;
      }

      if (sessionFinalRef.current) {
        publishTranscript(
          `${committedRef.current} ${sessionFinalRef.current}`.trim(),
          '',
          interimRef.current
        );
      }

      try {
        recognition.start();
      } catch {
        setLiveTranscript(false);
      }
    };

    recognitionRef.current = recognition;
    setLiveTranscript(true);

    try {
      recognition.start();
    } catch {
      setLiveTranscript(false);
    }
  };

  const stopRecognition = (commitSession: boolean) => {
    shouldListenRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    if (commitSession) {
      const combined = `${committedRef.current} ${sessionFinalRef.current} ${interimRef.current}`.trim();
      publishTranscript(combined, '', '');
    }

    try {
      recognition?.stop();
    } catch {
      /* already stopped */
    }
  };

  const releaseStream = () => {
    liveRef.current?.dispose();
    liveRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const saveAmbientSession = async (input: {
    consentStatus: string;
    audio?: File;
    draft?: AmbientDraft | null;
    recordingStoppedAt?: string;
    recordingDurationMs?: number;
  }) => {
    const currentPatientId = patientIdRef.current;
    const currentEncounterId = encounterIdRef.current;
    if (!currentPatientId || !currentEncounterId) {
      return;
    }

    const data = {
      patientId: Number(currentPatientId),
      encounterId: Number(currentEncounterId),
      consentStatus: input.consentStatus,
      consentMethod: consentMethodRef.current,
      microphoneSource: microphoneRef.current,
      consentAt: consentAtRef.current,
      recordingStartedAt: recordingStartedAtRef.current,
      recordingStoppedAt: input.recordingStoppedAt ?? null,
      recordingDurationMs:
        input.recordingDurationMs == null ? null : Math.round(input.recordingDurationMs),
      draft: input.draft ?? null
    };

    const body = new FormData();
    body.append(
      'data',
      new Blob([JSON.stringify(data)], { type: 'application/json' }),
      'data.json'
    );
    if (input.audio) {
      body.append('audio', input.audio);
    }

    const saved = await saveEncounterAmbient(body).unwrap();
    ambientIdRef.current = saved.id;
    return saved;
  };

  const saveReviewedDraft = async (nextDraft: AmbientDraft) => {
    const sessionId = ambientIdRef.current;
    if (!sessionId) {
      throw new Error('Ambient session was not saved');
    }

    const saved = await updateEncounterAmbientDraft({ id: sessionId, draft: nextDraft }).unwrap();
    setDraft(saved.draft ?? nextDraft);
  };

  const finishRecording = async (recorder: MediaRecorder) => {
    const audioBlob = new Blob(chunksRef.current, {
      type: recorder.mimeType || 'audio/webm'
    });
    const liveText = `${committedRef.current} ${sessionFinalRef.current}`.trim();
    const stoppedAt = new Date();
    const startedAt = recordingStartedAtRef.current
      ? new Date(recordingStartedAtRef.current)
      : stoppedAt;
    const recordingDurationMs = Math.max(0, stoppedAt.getTime() - startedAt.getTime());
    const recordingStoppedAt = stoppedAt.toISOString();

    releaseStream();

    if (!audioBlob.size) {
      dispatch(
        notify({
          msg: 'No audio was recorded. Please try again.',
          sev: 'warning'
        })
      );
      setPhase('stopped');
      try {
        await saveAmbientSession({
          consentStatus: givenConsent,
          recordingStoppedAt,
          recordingDurationMs
        });
      } catch (error) {
        dispatch(
          notify({
            msg: extractErrorMessage(error) || 'The ambient session could not be saved.',
            sev: 'error'
          })
        );
      }
      return;
    }

    await submitCapturedAudio(audioBlob, {
      recordingDurationMs,
      recordingStoppedAt,
      liveText
    });
  };

  const submitCapturedAudio = async (
    audioBlob: Blob,
    details: { recordingDurationMs: number; recordingStoppedAt: string; liveText?: string }
  ) => {
    let audioFile: File;
    try {
      audioFile = await toSupportedAudioFile(audioBlob);
    } catch {
      dispatch(
        notify({
          msg: 'The recording could not be saved as wav, mp3, or m4a.',
          sev: 'error'
        })
      );
      setPhase('stopped');
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const nextAudioUrl = URL.createObjectURL(audioFile);
    audioUrlRef.current = nextAudioUrl;
    setAudioUrl(nextAudioUrl);

    let sessionId = ambientIdRef.current;
    try {
      const saved = await saveAmbientSession({
        consentStatus: givenConsent,
        audio: audioFile,
        recordingStoppedAt: details.recordingStoppedAt,
        recordingDurationMs: details.recordingDurationMs
      });
      sessionId = saved?.id ?? sessionId;
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The ambient session could not be saved.',
          sev: 'error'
        })
      );
    }

    try {
      const result = await createAmbientDraft({
        audio: audioFile,
        ambientId: sessionId,
        ...draftOptionsRef.current
      }).unwrap();

      const serverText = (result.transcript ?? [])
        .map(segment => segment.text)
        .filter(Boolean)
        .join(' ');

      if (serverText) {
        publishTranscript(serverText, '', '');
      }

      if (sessionId) {
        try {
          const stored = await updateEncounterAmbientDraft({ id: sessionId, draft: result }).unwrap();
          setDraft(stored.draft ?? result);
        } catch {
          setDraft(result);
        }
      } else {
        const saved = await saveAmbientSession({
          consentStatus: givenConsent,
          audio: audioFile,
          draft: result,
          recordingStoppedAt: details.recordingStoppedAt,
          recordingDurationMs: details.recordingDurationMs
        });
        setDraft(saved?.draft ?? result);
      }

      setStoredDurationMs(details.recordingDurationMs);
      setDraftOpen(true);
      dispatch(
        notify({
          msg: 'Ambient draft is ready for review.',
          sev: 'success'
        })
      );
    } catch (error) {
      const message = extractErrorMessage(error);
      if (details.liveText) {
        await refreshFindings(details.liveText);
      }
      dispatch(
        notify({
          msg: sessionId
            ? 'The recording is saved. The draft is still processing and will be stored on this visit when it finishes.'
            : message || 'The recording was captured, but the draft could not be created.',
          sev: sessionId ? 'warning' : 'error'
        })
      );
    } finally {
      setPhase('stopped');
    }
  };

  const readAudioDuration = (file: File) =>
    new Promise<number>(resolve => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const durationMs = Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0;
        URL.revokeObjectURL(url);
        resolve(durationMs);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    });

  const uploadRecording = async (file: File) => {
    if (!setupAdded) {
      dispatch(
        notify({
          msg: 'Ambient Scribe is not set up for this facility.',
          sev: 'warning'
        })
      );
      return;
    }
    if (!/\.(wav|mp3|m4a)$/i.test(file.name)) {
      dispatch(
        notify({
          msg: 'Upload a wav, mp3, or m4a recording.',
          sev: 'warning'
        })
      );
      return;
    }

    const startedAt = new Date().toISOString();
    consentAtRef.current = startedAt;
    recordingStartedAtRef.current = startedAt;
    setStatus('given');
    setOpen(false);
    setPhase('processing');
    setElapsed(0);
    setUploading(true);
    try {
      const recordingDurationMs = await readAudioDuration(file);
      await submitCapturedAudio(file, {
        recordingDurationMs,
        recordingStoppedAt: new Date().toISOString()
      });
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (!setupAdded) {
      dispatch(
        notify({
          msg: 'Ambient Scribe is not set up for this facility.',
          sev: 'warning'
        })
      );
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      dispatch(
        notify({
          msg: 'Audio recording is not supported by this browser.',
          sev: 'error'
        })
      );
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      chunksRef.current = [];
      publishTranscript('', '', '');
      setFindings([]);
      setConfirmedDoses([]);
      setLiveSegments([]);
      setPickedUp(null);
      setLiveNotice('');
      setLiveLink('connecting');
      setLiveHearing(false);

      const live = new LiveVisitConnection();
      liveRef.current?.dispose();
      liveRef.current = live;
      let recordStream = stream;
      try {
        recordStream = live.start(stream, livePatientContext(draftOptionsRef.current.patientContext), {
          onSegment: segment => {
            setLiveSegments(current => {
              const index = current.findIndex(item => item.id === segment.id);
              if (index < 0) return [...current, segment];
              const next = current.slice();
              next[index] = segment;
              return next;
            });
          },
          onFinal: segments => {
            if (segments.length) setLiveSegments(segments);
          },
          onPickedUp: setPickedUp,
          onError: detail => setLiveNotice(detail),
          onReady: () => {
            setLiveLink('live');
            setLiveNotice('');
          },
          onAudio: hearing => setLiveHearing(current => (current === hearing ? current : hearing))
        });
      } catch (error) {
        setLiveLink('idle');
        setLiveNotice(error instanceof Error ? error.message : 'Live transcript could not start.');
      }

      const mimeType = preferredRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream);
      recorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void finishRecording(recorder);
      };

      recorder.start(1000);

      if (microphoneRef.current === 'PHONE') {
        dispatch(
          notify({
            msg: 'Phone pairing is not connected. This recording is using this computer’s microphone.',
            sev: 'warning'
          })
        );
      }

      return true;
    } catch {
      releaseStream();
      dispatch(
        notify({
          msg: 'Could not access the microphone. Please allow microphone access and try again.',
          sev: 'error'
        })
      );
      return false;
    }
  };

  const pauseRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }

    liveRef.current?.pause();
    recorder.pause();
    setPhase('paused');
  };

  const resumeRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }

    recorder.resume();
    liveRef.current?.resume();
    setPhase('recording');
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    liveRef.current?.stop();

    if (recorder && recorder.state !== 'inactive') {
      setPhase('processing');
      recorder.stop();
      return;
    }

    releaseStream();
    setPhase('stopped');
  };

  useEffect(() => {
    if (phase !== 'recording') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setElapsed(value => value + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'recording' && phase !== 'paused') {
      return undefined;
    }

    const text = transcriptText.trim();
    if (text.length < 24) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshFindings(text);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [phase, transcriptText]);

  useEffect(() => {
    return () => {
      liveRef.current?.dispose();
      liveRef.current = null;
      shouldListenRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }

      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }

      streamRef.current?.getTracks().forEach(track => track.stop());

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!encounterId) {
      setSavedSessionReady(true);
      return undefined;
    }

    if (phaseRef.current !== 'idle') {
      setSavedSessionReady(true);
      return undefined;
    }

    let cancelled = false;
    setSavedSessionReady(false);

    const restoreStoredSession = async () => {
      try {
        const sessions = await loadEncounterAmbient(encounterId).unwrap();
        const latest = sessions.find(
          session =>
            session.consentStatus === givenConsent && (session.hasRecording || session.draftCreatedAt)
        );
        if (!latest || cancelled || phaseRef.current !== 'idle') {
          return;
        }

        const detail = await loadEncounterAmbientDetail(latest.id).unwrap();
        if (cancelled || phaseRef.current !== 'idle') {
          return;
        }

        ambientIdRef.current = detail.id;
        setStatus('given');
        if (detail.consentMethod) {
          setConsentMethod(detail.consentMethod);
        }
        if (detail.microphoneSource) {
          setMicrophone(detail.microphoneSource);
        }

        const durationMs = detail.recordingDurationMs ?? latest.recordingDurationMs ?? 0;
        setStoredDurationMs(durationMs);
        setElapsed(Math.max(0, Math.round(durationMs / 1000)));

        if (detail.draft) {
          setDraft(detail.draft);
          const savedTranscript = transcriptFromDraft(detail.draft);
          if (savedTranscript) {
            publishTranscript(savedTranscript, '', '');
          }
          setFindings(findingsFromDraft(detail.draft));
        }

        if (detail.hasRecording || latest.hasRecording) {
          const recording = await loadEncounterAmbientRecording(detail.id).unwrap();
          if (cancelled || phaseRef.current !== 'idle') {
            return;
          }

          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
          }

          const nextAudioUrl = URL.createObjectURL(recording);
          audioUrlRef.current = nextAudioUrl;
          setAudioUrl(nextAudioUrl);
        }

        if (!cancelled && phaseRef.current === 'idle') {
          setPhase('stopped');
        }
      } catch {
        /* A missing history should still leave Start Ambient usable. */
      } finally {
        if (!cancelled) {
          setSavedSessionReady(true);
        }
      }
    };

    void restoreStoredSession();

    return () => {
      cancelled = true;
    };
  }, [encounterId, givenConsent, loadEncounterAmbient, loadEncounterAmbientDetail, loadEncounterAmbientRecording]);

  const openModal = () => {
    if (!setupAdded) {
      dispatch(
        notify({
          msg: 'Ambient Scribe is not set up for this facility.',
          sev: 'warning'
        })
      );
      return;
    }
    if (!canStartAmbient) {
      dispatch(
        notify({
          msg: access.reason || 'Ambient Scribe cannot be started for this visit.',
          sev: 'warning'
        })
      );
      return;
    }
    setConsentMethod(consentMethodOptions[0]?.value ?? 'VERBAL');
    setMicrophone(microphoneOptions[0]?.value ?? 'COMPUTER');
    setOpen(true);
  };

  const openStoredDraft = async () => {
    if (draft) {
      setDraftOpen(true);
      return;
    }

    const sessionId = ambientIdRef.current;
    if (!sessionId) {
      dispatch(
        notify({
          msg: 'No draft is saved for this recording yet.',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const detail = await loadEncounterAmbientDetail(sessionId).unwrap();
      if (!detail.draft) {
        dispatch(
          notify({
            msg: 'No draft is saved for this recording yet.',
            sev: 'warning'
          })
        );
        return;
      }

      setDraft(detail.draft);
      setStoredDurationMs(detail.recordingDurationMs ?? storedDurationMs);
      setDraftOpen(true);
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The draft could not be opened.',
          sev: 'error'
        })
      );
    }
  };

  const recreateDraft = async () => {
    if (recreatingDraft || draft) {
      return;
    }
    if (!setupAdded) {
      dispatch(
        notify({
          msg: 'Ambient Scribe is not set up for this facility.',
          sev: 'warning'
        })
      );
      return;
    }

    setRecreatingDraft(true);
    try {
      let recordingBlob: Blob | null = null;
      if (audioUrlRef.current) {
        try {
          const response = await fetch(audioUrlRef.current);
          if (response.ok) {
            recordingBlob = await response.blob();
          }
        } catch {
          recordingBlob = null;
        }
      }
      if ((!recordingBlob || !recordingBlob.size) && ambientIdRef.current) {
        recordingBlob = await loadEncounterAmbientRecording(ambientIdRef.current).unwrap();
      }
      if (!recordingBlob?.size) {
        dispatch(
          notify({
            msg: 'The saved recording is not available to create a draft.',
            sev: 'warning'
          })
        );
        return;
      }

      const audioFile = await toSupportedAudioFile(recordingBlob);

      const result = await createAmbientDraft({
        audio: audioFile,
        ambientId: ambientIdRef.current,
        ...draftOptionsRef.current
      }).unwrap();
      if (ambientIdRef.current) {
        const saved = await updateEncounterAmbientDraft({
          id: ambientIdRef.current,
          draft: result
        }).unwrap();
        setDraft(saved.draft ?? result);
      } else {
        const saved = await saveAmbientSession({
          consentStatus: givenConsent,
          audio: audioFile,
          draft: result
        });
        setDraft(saved?.draft ?? result);
      }

      const savedTranscript = transcriptFromDraft(result);
      if (savedTranscript) {
        publishTranscript(savedTranscript, '', '');
      }
      setFindings(findingsFromDraft(result));
      setDraftOpen(true);
      dispatch(
        notify({
          msg: 'Ambient draft is ready for review.',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The draft could not be created.',
          sev: 'error'
        })
      );
    } finally {
      setRecreatingDraft(false);
    }
  };

  const liveLanguageLabel = () => {
    const langs = new Set(liveSegments.map(segment => segment.lang).filter(Boolean));
    const arabic = langs.has('ar') || langs.has('mixed');
    const english = langs.has('en') || langs.has('mixed');
    if (arabic && english) return 'Arabic + English detected';
    if (arabic) return 'Arabic detected';
    if (english) return 'English detected';
    return 'Listening';
  };

  const statusLabel =
    status === 'given'
      ? 'Consent given'
      : status === 'declined'
        ? 'Patient declined'
        : 'Consent not yet asked';

  return (
    <>
      {!savedSessionReady ? (
        <div className={`ambient-scribe-launch ${ui.mode === 'dark' ? 'dark' : 'light'}`}>
          <div className="ambient-scribe-launch-copy">
            <span className="ambient-scribe-launch-icon">
              <FontAwesomeIcon icon={faMicrophone} />
            </span>
            <div>
              <div className="ambient-scribe-launch-title">Ambient Scribe</div>
              <div className="ambient-scribe-launch-status">Loading saved recording…</div>
            </div>
          </div>
        </div>
      ) : phase !== 'idle' ? (
        <RecordingWorkspace
          phase={phase}
          elapsed={elapsed}
          languageLabel={liveLanguageLabel()}
          mode={ui.mode}
          audioUrl={audioUrl}
          hasDraft={Boolean(draft)}
          canRecreateDraft={setupAdded}
          recreatingDraft={recreatingDraft}
          liveSegments={liveSegments}
          pickedUp={pickedUp}
          liveNotice={liveNotice}
          liveLink={liveLink}
          liveHearing={liveHearing}
          onViewDraft={() => {
            void openStoredDraft();
          }}
          onRecreateDraft={() => {
            void recreateDraft();
          }}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onStop={stopRecording}
          onPlaybackStart={(audio, fromStart) => {
            if (fromStart) {
              setLiveSegments([]);
              setPickedUp(null);
              setLiveNotice('');
              setLiveLink('connecting');
              setLiveHearing(false);
            }
            const live = liveRef.current ?? new LiveVisitConnection();
            liveRef.current = live;
            try {
              live.playRecording(
                audio,
                livePatientContext(draftOptionsRef.current.patientContext),
                {
                  onSegment: segment => {
                    setLiveSegments(current => {
                      const index = current.findIndex(item => item.id === segment.id);
                      if (index < 0) return [...current, segment];
                      const next = current.slice();
                      next[index] = segment;
                      return next;
                    });
                  },
                  onFinal: segments => {
                    if (segments.length) setLiveSegments(segments);
                  },
                  onPickedUp: setPickedUp,
                  onError: detail => setLiveNotice(detail),
                  onReady: () => {
                    setLiveLink('live');
                    setLiveNotice('');
                  },
                  onAudio: hearing => setLiveHearing(current => (current === hearing ? current : hearing))
                },
                fromStart
              );
            } catch (error) {
              setLiveLink('idle');
              setLiveNotice(error instanceof Error ? error.message : 'The recording could not be sent to the live transcript.');
            }
          }}
          onPlaybackPause={() => liveRef.current?.pause()}
          onPlaybackEnded={() => liveRef.current?.stop()}
        />
      ) : (
      <div className={`ambient-scribe-launch ${ui.mode === 'dark' ? 'dark' : 'light'}`}>
        <div className="ambient-scribe-launch-copy">
          <span className="ambient-scribe-launch-icon">
            <FontAwesomeIcon icon={faMicrophone} />
          </span>
          <div>
            <div className="ambient-scribe-launch-title">Ambient Scribe</div>
              <div className={`ambient-scribe-launch-status is-${status}`}>
                {accessLoading
                  ? 'Checking who can start Ambient…'
                  : !setupAdded
                    ? 'Ambient Scribe is not set up for this facility.'
                    : canStartAmbient
                      ? statusLabel
                      : access.reason}
              </div>
          </div>
        </div>
        <div className="ambient-scribe-launch-actions">
          {draft && (
            <MyButton appearance="ghost" onClick={() => setDraftOpen(true)} disabled={disabled}>
              View draft
            </MyButton>
          )}
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faMicrophone} />}
            onClick={openModal}
            disabled={disabled || !canStartAmbient}
          >
            Start Ambient
          </MyButton>
        </div>
      </div>
      )}

      <MyModal
        open={open}
        setOpen={setOpen}
        size="740px"
        bodyheight="auto"
        hideCancel
        hideActionBtn
        customClassName="ambient-scribe-modal"
        title={
          <div className="ambient-scribe-header">
            <span className="ambient-scribe-header-icon">
              <FontAwesomeIcon icon={faMicrophone} />
            </span>
            <div>
              <div className="ambient-scribe-header-title">
                Record this visit with Ambient Scribe?
              </div>
              <div className="ambient-scribe-header-subtitle">
                Ask the patient before you start. They can say no, and the visit continues as usual.
              </div>
            </div>
          </div>
        }
        content={
          <div>
            <div className="ambient-scribe-scripts">
              <div className="ambient-scribe-script">
                <div className="ambient-scribe-script-label">Say to the patient</div>
                <p>“{PATIENT_SCRIPT}”</p>
              </div>
              <div className="ambient-scribe-script" dir="rtl">
                <div className="ambient-scribe-script-label">قل للمريض</div>
                <p>“{PATIENT_SCRIPT_AR}”</p>
              </div>
            </div>

            <div className="ambient-scribe-section">
              <div className="ambient-scribe-section-title">How did the patient consent?</div>
              <div className="ambient-scribe-choices">
                {(consentMethodOptions.length
                  ? consentMethodOptions
                  : [
                      { value: 'VERBAL', label: 'Verbal consent' },
                      { value: 'TABLET', label: 'Signed on tablet' }
                    ]
                ).map(option => (
                  <ChoiceCard
                    key={option.value}
                    title={option.label}
                    hint={CONSENT_METHOD_HINTS[option.value] ?? ''}
                    selected={consentMethod === option.value}
                    onSelect={() => setConsentMethod(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="ambient-scribe-section">
              <div className="ambient-scribe-section-title">Microphone</div>
              <div className="ambient-scribe-choices">
                {(microphoneOptions.length
                  ? microphoneOptions
                  : [
                      { value: 'COMPUTER', label: 'This computer' },
                      { value: 'PHONE', label: 'Pair phone or tablet' }
                    ]
                ).map(option => (
                  <ChoiceCard
                    key={option.value}
                    title={option.label}
                    hint={MICROPHONE_HINTS[option.value] ?? ''}
                    selected={microphone === option.value}
                    onSelect={() => setMicrophone(option.value)}
                    extra={option.value === 'PHONE' ? <QrMark /> : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="ambient-scribe-note" role="note">
              <FontAwesomeIcon icon={faCircleExclamation} />
              <span>
                Say exam findings and doses out loud so the scribe can capture them. Nothing is
                saved to the chart until you accept it.
              </span>
            </div>

            <div className="ambient-scribe-actions">
              <MyButton
                onClick={() => {
                  consentAtRef.current = new Date().toISOString();
                  recordingStartedAtRef.current = null;
                  setStatus('declined');
                  setOpen(false);
                  void saveAmbientSession({ consentStatus: declinedConsent }).catch(error => {
                    dispatch(
                      notify({
                        msg: extractErrorMessage(error) || 'The declined consent could not be saved.',
                        sev: 'error'
                      })
                    );
                  });
                }}
              >
                Patient declined
              </MyButton>
              <MyButton
                loading={uploading}
                disabled={starting || uploading || !canStartAmbient}
                onClick={() => uploadInputRef.current?.click()}
              >
                Upload from device
              </MyButton>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a"
                hidden
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    void uploadRecording(file);
                  }
                }}
              />
              <MyButton
                loading={starting}
                disabled={starting || uploading || !canStartAmbient}
                onClick={async () => {
                  setStarting(true);
                  const started = await startRecording();
                  setStarting(false);

                  if (!started) {
                    return;
                  }

                  const startedAt = new Date().toISOString();
                  consentAtRef.current = startedAt;
                  recordingStartedAtRef.current = startedAt;
                  setStatus('given');
                  setElapsed(0);
                  setPhase('recording');
                  setOpen(false);
                }}
              >
                Consent given · Start recording
              </MyButton>
            </div>
          </div>
        }
      />
      <AmbientDraftModal
        open={draftOpen}
        setOpen={setDraftOpen}
        draft={draft}
        audioUrl={audioUrl}
        durationMs={elapsed > 0 ? elapsed * 1000 : storedDurationMs}
        patientLine={patientLine}
        patientId={patientId}
        encounter={encounter}
        onEncounterSaved={onEncounterSaved}
        onSave={saveReviewedDraft}
        regenerateDefaults={{
          noteLanguage: scribeSetup?.noteLanguage,
          instructionLanguage: scribeSetup?.instructionLanguage,
          specialty: scribeSetup?.specialty,
          noteLength: scribeSetup?.noteStyle,
          noteForm: scribeSetup?.noteForm,
          patientContext,
          suggestIcd10: scribeSetup?.suggestIcd10,
          suggestOrders: scribeSetup?.suggestOrders
        }}
      />
    </>
  );
};

export default AmbientScribe;
