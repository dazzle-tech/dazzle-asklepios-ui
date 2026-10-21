import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faMicrophone,
  faPause,
  faPlay,
  faStop
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useAutoPopulateMutation } from '@/services/auto-Population/autoPopulationService';
import type { AmbientDraft } from '@/services/ai-services/ambientDraft';
import { useCreateAmbientDraftMutation } from '@/services/ai-services/ambientDraftService';
import {
  useCreateEncounterAmbientMutation,
  useLazyGetEncounterAmbientByEncounterQuery,
  useLazyGetEncounterAmbientQuery,
  useLazyGetEncounterAmbientRecordingQuery,
  useUpdateEncounterAmbientDraftMutation
} from '@/services/encounters/encounterAmbientService';
import AmbientDraftModal from './AmbientDraftModal';
import type { AutoPopulationResponse } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { notify } from '@/utils/uiReducerActions';
import './ambient-scribe.less';

type ConsentMethod = 'verbal' | 'tablet';
type MicrophoneSource = 'computer' | 'phone';
type ConsentStatus = 'pending' | 'given' | 'declined';
type SessionPhase = 'idle' | 'recording' | 'paused' | 'processing' | 'stopped';

type AmbientScribeProps = {
  disabled?: boolean;
  patientId?: number | string | null;
  encounterId?: number | string | null;
  patientLine?: string;
};

const PATIENT_SCRIPT =
  "I'd like to use a tool that listens to our conversation and helps me write your notes. I review everything. The recording is deleted after 30 days. Is that OK?";

const PATIENT_SCRIPT_AR =
  'أود استخدام أداة تستمع إلى حديثنا وتساعدني في كتابة ملاحظاتك. أراجع كل شيء بنفسي، ويُحذف التسجيل بعد ٣٠ يوما. هل توافق؟';

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
  turns: TranscriptTurn[];
  interim: string;
  findings: Finding[];
  confirmedDoses: string[];
  liveTranscript: boolean;
  mode: string;
  onViewDraft?: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onConfirmDose: (value: string) => void;
};

const RecordingWorkspace = ({
  phase,
  elapsed,
  turns,
  interim,
  findings,
  confirmedDoses,
  liveTranscript,
  mode,
  onViewDraft,
  onPause,
  onResume,
  onStop,
  onConfirmDose
}: RecordingWorkspaceProps) => {
  const barLabel =
    phase === 'paused'
      ? 'Paused'
      : phase === 'processing'
        ? 'Creating draft'
        : phase === 'stopped'
          ? 'Recording stopped'
          : 'Recording';

  return (
    <div className={`ambient-recording ${mode === 'dark' ? 'dark' : 'light'}`}>
      <div className={`ambient-recording-bar is-${phase}`} role="status">
        <span className="ambient-recording-dot" />
        <span className="ambient-recording-label">{barLabel}</span>
        <span className="ambient-recording-timer">{formatElapsed(elapsed)}</span>
        {phase === 'stopped' && onViewDraft && (
          <div className="ambient-recording-actions">
            <MyButton
              appearance="ghost"
              color="#ffffff"
              size="small"
              radius="8px"
              style={{ border: '1px solid rgba(255,255,255,0.75)', padding: '0 12px' }}
              onClick={onViewDraft}
            >
              View draft
            </MyButton>
          </div>
        )}
        {phase !== 'stopped' && phase !== 'processing' && (
          <div className="ambient-recording-actions">
            <MyButton
              appearance="ghost"
              color="#ffffff"
              size="small"
              radius="8px"
              prefixIcon={() => (
                <FontAwesomeIcon icon={phase === 'paused' ? faPlay : faPause} />
              )}
              style={{ border: '1px solid rgba(255,255,255,0.75)', padding: '0 12px' }}
              onClick={phase === 'paused' ? onResume : onPause}
            >
              {phase === 'paused' ? 'Resume' : 'Pause'}
            </MyButton>
            <MyButton
              appearance="ghost"
              color="#7f1d1d"
              size="small"
              radius="8px"
              prefixIcon={() => <FontAwesomeIcon icon={faStop} />}
              style={{
                border: '1px solid #ffffff',
                background: '#ffffff',
                color: '#7f1d1d',
                padding: '0 12px'
              }}
              onClick={onStop}
            >
              Stop
            </MyButton>
          </div>
        )}
      </div>

      <div className="ambient-recording-body">
        <SectionContainer
          title="Live transcript"
          content={
            <div className="ambient-transcript">
              {!turns.length && !interim && (
                <div className="ambient-empty">
                  {liveTranscript
                    ? 'Listening…'
                    : 'Live transcription is not available in this browser. The transcript will appear after you stop.'}
                </div>
              )}
              {turns.map(turn => (
                <div key={turn.id} className="ambient-turn">
                  {turn.speaker && (
                    <div
                      className={`ambient-turn-speaker is-${turn.speaker.toLowerCase().split(' ')[0]}`}
                    >
                      {turn.speaker}
                    </div>
                  )}
                  <p>{turn.text}</p>
                </div>
              ))}
              {interim && <div className="ambient-turn is-live">{interim}</div>}
              {phase === 'recording' && !interim && !!turns.length && (
                <div className="ambient-turn is-live">Listening…</div>
              )}
            </div>
          }
        />

        <SectionContainer
          title="Picked up"
          content={
            <div className="ambient-findings">
              {!findings.length && (
                <div className="ambient-empty">
                  {phase === 'processing'
                    ? 'Reading the recording…'
                    : 'Findings appear here as the visit is transcribed.'}
                </div>
              )}
              {findings.map(finding => {
                const confirmed = finding.confirmDose && confirmedDoses.includes(finding.value);
                const flagged = finding.confirmDose && !confirmed;

                return (
                  <div
                    key={finding.id}
                    className={`ambient-finding${flagged ? ' is-flagged' : ''}${
                      confirmed ? ' is-confirmed' : ''
                    }`}
                  >
                    <div className="ambient-finding-label">
                      {flagged && <FontAwesomeIcon icon={faCircleExclamation} />}
                      <span>{confirmed ? 'Dose confirmed' : finding.label}</span>
                    </div>
                    <p>{finding.value}</p>
                    {flagged && (
                      <>
                        <p className="ambient-finding-hint">
                          Said out loud. Nothing is saved to the chart until you confirm it.
                        </p>
                        <MyButton
                          size="small"
                          backgroundColor="#b45309"
                          onClick={() => onConfirmDose(finding.value)}
                        >
                          Confirm dose
                        </MyButton>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

const AmbientScribe = ({
  disabled = false,
  patientId,
  encounterId,
  patientLine
}: AmbientScribeProps) => {
  const dispatch = useAppDispatch();
  const ui = useSelector((state: { ui: { mode: string; lang: string } }) => state.ui);
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [consentMethod, setConsentMethod] = useState<ConsentMethod>('verbal');
  const [microphone, setMicrophone] = useState<MicrophoneSource>('computer');
  const [transcriptText, setTranscriptText] = useState('');
  const [interim, setInterim] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [confirmedDoses, setConfirmedDoses] = useState<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState(true);
  const [draft, setDraft] = useState<AmbientDraft | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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
  const populateSeqRef = useRef(0);
  const [storedDurationMs, setStoredDurationMs] = useState(0);

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
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  const saveAmbientSession = async (input: {
    consentStatus: 'GIVEN' | 'DECLINED';
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
      consentMethod: consentMethodRef.current === 'tablet' ? 'TABLET' : 'VERBAL',
      microphoneSource: microphoneRef.current === 'phone' ? 'PHONE' : 'COMPUTER',
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
          consentStatus: 'GIVEN',
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

    const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const audioFile = new File([audioBlob], `ambient-scribe.${extension}`, {
      type: audioBlob.type || 'audio/webm'
    });
    const formData = new FormData();
    formData.append('audio', audioFile);

    if (patientIdRef.current) {
      formData.append('patientId', String(patientIdRef.current));
    }

    if (encounterIdRef.current) {
      formData.append('encounterId', String(encounterIdRef.current));
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const nextAudioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = nextAudioUrl;
    setAudioUrl(nextAudioUrl);

    let createdDraft: AmbientDraft | null = null;

    try {
      const result = await createAmbientDraft(formData).unwrap();
      createdDraft = result;

      const serverText = (result.transcript ?? [])
        .map(segment => segment.text)
        .filter(Boolean)
        .join(' ');

      if (serverText) {
        publishTranscript(serverText, '', '');
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      if (liveText) {
        await refreshFindings(liveText);
      }
      dispatch(
        notify({
          msg: message || 'The recording was captured, but the draft could not be created.',
          sev: 'error'
        })
      );
    } finally {
      setPhase('stopped');
    }

    try {
      await saveAmbientSession({
        consentStatus: 'GIVEN',
        audio: audioFile,
        draft: createdDraft,
        recordingStoppedAt,
        recordingDurationMs
      });

      if (createdDraft) {
        setDraft(createdDraft);
        setStoredDurationMs(recordingDurationMs);
        setDraftOpen(true);
        dispatch(
          notify({
            msg: 'Ambient draft is ready for review.',
            sev: 'success'
          })
        );
      }
    } catch (error) {
      if (createdDraft) {
        setDraft(createdDraft);
        setStoredDurationMs(recordingDurationMs);
        setDraftOpen(true);
      }
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The ambient session could not be saved.',
          sev: 'error'
        })
      );
    }
  };

  const startRecording = async () => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      publishTranscript('', '', '');
      setFindings([]);
      setConfirmedDoses([]);

      const recorder = new MediaRecorder(stream);
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
      shouldListenRef.current = true;
      startRecognition();

      if (microphoneRef.current === 'phone') {
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

    stopRecognition(true);
    recorder.pause();
    setPhase('paused');
  };

  const resumeRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }

    recorder.resume();
    shouldListenRef.current = true;
    startRecognition();
    setPhase('recording');
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    stopRecognition(true);

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
    if (!encounterId || phaseRef.current !== 'idle') {
      return undefined;
    }

    let cancelled = false;

    const restoreStoredSession = async () => {
      try {
        const sessions = await loadEncounterAmbient(encounterId).unwrap();
        const latest = sessions.find(
          session => session.consentStatus === 'GIVEN' && session.draftCreatedAt
        );
        if (!latest || cancelled || phaseRef.current !== 'idle') {
          return;
        }

        const detail = await loadEncounterAmbientDetail(latest.id).unwrap();
        if (!detail.draft || cancelled || phaseRef.current !== 'idle') {
          return;
        }

        setDraft(detail.draft);
        setStatus('given');
        ambientIdRef.current = detail.id;
        setStoredDurationMs(detail.recordingDurationMs ?? latest.recordingDurationMs ?? 0);

        if (!detail.hasRecording) {
          return;
        }

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
      } catch {
        /* A missing history should still leave Start Ambient usable. */
      }
    };

    void restoreStoredSession();

    return () => {
      cancelled = true;
    };
  }, [encounterId, loadEncounterAmbient, loadEncounterAmbientDetail, loadEncounterAmbientRecording]);

  const openModal = () => {
    setConsentMethod('verbal');
    setMicrophone('computer');
    setOpen(true);
  };

  const statusLabel =
    status === 'given'
      ? 'Consent given'
      : status === 'declined'
        ? 'Patient declined'
        : 'Consent not yet asked';

  return (
    <>
      {phase !== 'idle' ? (
        <RecordingWorkspace
          phase={phase}
          elapsed={elapsed}
          turns={toTurns(transcriptText)}
          interim={interim}
          findings={findings}
          confirmedDoses={confirmedDoses}
          liveTranscript={liveTranscript}
          mode={ui.mode}
          onViewDraft={draft ? () => setDraftOpen(true) : undefined}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onStop={stopRecording}
          onConfirmDose={value =>
            setConfirmedDoses(current => (current.includes(value) ? current : [...current, value]))
          }
        />
      ) : (
      <div className={`ambient-scribe-launch ${ui.mode === 'dark' ? 'dark' : 'light'}`}>
        <div className="ambient-scribe-launch-copy">
          <span className="ambient-scribe-launch-icon">
            <FontAwesomeIcon icon={faMicrophone} />
          </span>
          <div>
            <div className="ambient-scribe-launch-title">Ambient Scribe</div>
            <div className={`ambient-scribe-launch-status is-${status}`}>{statusLabel}</div>
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
            disabled={disabled}
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
                <ChoiceCard
                  title="Verbal consent"
                  hint="Logged with your name and time"
                  selected={consentMethod === 'verbal'}
                  onSelect={() => setConsentMethod('verbal')}
                />
                <ChoiceCard
                  title="Signed on tablet"
                  hint="Patient signs the consent form"
                  selected={consentMethod === 'tablet'}
                  onSelect={() => setConsentMethod('tablet')}
                />
              </div>
            </div>

            <div className="ambient-scribe-section">
              <div className="ambient-scribe-section-title">Microphone</div>
              <div className="ambient-scribe-choices">
                <ChoiceCard
                  title="This computer"
                  hint="Desk mic · signal good"
                  selected={microphone === 'computer'}
                  onSelect={() => setMicrophone('computer')}
                />
                <ChoiceCard
                  title="Pair phone or tablet"
                  hint="Scan with the Asklepios app"
                  selected={microphone === 'phone'}
                  onSelect={() => setMicrophone('phone')}
                  extra={<QrMark />}
                />
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
                appearance="ghost"
                color="#4b5563"
                size="medium"
                radius="8px"
                style={{
                  border: '1px solid #d5dae3',
                  background: '#fff',
                  padding: '0 16px'
                }}
                onClick={() => {
                  consentAtRef.current = new Date().toISOString();
                  recordingStartedAtRef.current = null;
                  setStatus('declined');
                  setOpen(false);
                  void saveAmbientSession({ consentStatus: 'DECLINED' }).catch(error => {
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
                size="medium"
                radius="8px"
                backgroundColor="#6d4cff"
                style={{ padding: '0 16px' }}
                loading={starting}
                disabled={starting}
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
        onSave={saveReviewedDraft}
      />
    </>
  );
};

export default AmbientScribe;
