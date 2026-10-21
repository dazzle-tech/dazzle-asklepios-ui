import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import type { AmbientDraft, AmbientOrder, ReviewKey, ReviewStatus } from '@/services/ai-services/ambientDraft';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { notify } from '@/utils/uiReducerActions';
import './ambient-draft.less';

type AmbientDraftModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  draft: AmbientDraft | null;
  audioUrl?: string | null;
  durationMs?: number;
  patientLine?: string;
  onSave?: (draft: AmbientDraft) => Promise<void>;
};

const REVIEW_SECTIONS: {
  key: ReviewKey;
  title: string;
  path: string;
  evidenceKeys: string[];
}[] = [
  {
    key: 'chief_complaint',
    title: 'Chief complaint',
    path: 'Visit Details · Chief Complaint',
    evidenceKeys: ['clinical_visit.chiefComplaint']
  },
  {
    key: 'hpi',
    title: 'History of present illness',
    path: 'Visit Details · History Of Present Illness',
    evidenceKeys: ['clinical_visit.historyOfPresentIllness']
  },
  {
    key: 'physical_exam',
    title: 'Physical examination',
    path: 'Visit Details · Physical Examination Summary',
    evidenceKeys: ['clinical_visit.physicalExaminationSummery']
  },
  {
    key: 'assessment_plan',
    title: 'Assessment & plan',
    path: 'Plan of Care',
    evidenceKeys: ['assessment.assessment', 'plan_of_care.treatmentPlan']
  }
];

const EMPTY_STATUS: Record<ReviewKey, ReviewStatus> = {
  chief_complaint: 'pending',
  hpi: 'pending',
  physical_exam: 'pending',
  assessment_plan: 'pending'
};

const joinSentences = (draft: AmbientDraft, key: string) =>
  (draft.sections?.[key]?.sentences ?? [])
    .map(sentence => sentence.text?.trim())
    .filter(Boolean)
    .join(' ');

const sectionSourceText = (draft: AmbientDraft, key: ReviewKey) => {
  const note = draft.soap_note;

  if (key === 'chief_complaint') {
    return note?.ChiefComplaint?.trim() || joinSentences(draft, 'chief_complaint');
  }

  if (key === 'hpi') {
    const history = note?.MedicalHistory?.trim();
    const hpi = note?.HPI?.trim() || joinSentences(draft, 'hpi');
    return [hpi, history ? `History: ${history}` : ''].filter(Boolean).join('\n');
  }

  if (key === 'physical_exam') {
    const vitals = note?.Vitals?.trim();
    const exam = note?.PhysicalExamination?.trim() || joinSentences(draft, 'physical_exam');
    return [vitals ? `Vitals: ${vitals}` : '', exam].filter(Boolean).join('\n\n');
  }

  const assessment = note?.Assessments?.trim();
  const plan = note?.TreatmentPlans?.trim();
  return [assessment, plan].filter(Boolean).join('\n\n') || joinSentences(draft, 'assessment_plan');
};

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDuration = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (!minutes) {
    return `${seconds} s`;
  }
  return `${minutes} min ${seconds} s`;
};

const languageLabel = (lang?: string | null) => {
  const value = (lang || '').toLowerCase();
  if (value.startsWith('ar')) return 'Arabic';
  if (value.startsWith('en')) return 'English';
  return lang || '';
};

const titleCase = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
};

const orderHeading = (kind: string) => {
  if (kind === 'medication') return 'Prescription';
  if (kind === 'follow_up') return 'Follow-up';
  if (kind === 'lab') return 'Lab';
  if (kind === 'stop') return 'Stop';
  return titleCase(kind);
};

const orderSummary = (order: AmbientOrder) => {
  const payload = order.payload ?? {};

  if (order.kind === 'medication') {
    return [payload.name, payload.dose || payload.dosage, payload.frequency, payload.duration]
      .filter(Boolean)
      .join(' · ');
  }

  if (order.kind === 'follow_up') {
    const when = payload.interval_days ? `in ${payload.interval_days} days` : payload.date;
    return ['Return visit', when].filter(Boolean).join(' · ');
  }

  return Object.values(payload)
    .filter(value => value !== null && value !== undefined && value !== '')
    .join(' · ');
};

const orderAction = (order: AmbientOrder) => {
  if (order.kind === 'follow_up') return 'Create Follow-up';
  if (order.kind === 'lab') return 'Accept orders';
  return 'Accept order';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const AmbientDraftModal = ({
  open,
  setOpen,
  draft,
  audioUrl,
  durationMs = 0,
  patientLine,
  onSave
}: AmbientDraftModalProps) => {
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [texts, setTexts] = useState<Record<ReviewKey, string>>({
    chief_complaint: '',
    hpi: '',
    physical_exam: '',
    assessment_plan: ''
  });
  const [statuses, setStatuses] = useState<Record<ReviewKey, ReviewStatus>>(EMPTY_STATUS);
  const [editing, setEditing] = useState<ReviewKey | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addedDiagnoses, setAddedDiagnoses] = useState<Record<string, boolean>>({});
  const [acceptedOrders, setAcceptedOrders] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const savedTexts = draft.review?.texts;
    setTexts({
      chief_complaint: savedTexts?.chief_complaint ?? sectionSourceText(draft, 'chief_complaint'),
      hpi: savedTexts?.hpi ?? sectionSourceText(draft, 'hpi'),
      physical_exam: savedTexts?.physical_exam ?? sectionSourceText(draft, 'physical_exam'),
      assessment_plan: savedTexts?.assessment_plan ?? sectionSourceText(draft, 'assessment_plan')
    });
    setStatuses({ ...EMPTY_STATUS, ...draft.review?.statuses });
    setEditing(null);
    setAddedDiagnoses(draft.review?.addedDiagnoses ?? {});
    setAcceptedOrders(draft.review?.acceptedOrders ?? {});
  }, [draft]);

  const transcript = draft?.transcript ?? [];
  const segmentById = useMemo(() => {
    const map = new Map<string, (typeof transcript)[number]>();
    transcript.forEach(segment => map.set(segment.id, segment));
    return map;
  }, [transcript]);

  const recordingMs = Math.max(
    durationMs,
    draft?.elapsed_ms ?? 0,
    ...transcript.map(segment => segment.end_ms || 0)
  );

  const languages = Array.from(
    new Set(transcript.map(segment => languageLabel(segment.lang)).filter(Boolean))
  ).join(' + ');

  const reviewedCount = REVIEW_SECTIONS.filter(section => statuses[section.key] !== 'pending').length;

  const evidenceFor = (keys: string[]) => {
    const ids = keys.flatMap(key => draft?.record_evidence?.[key] ?? []);
    const unique = Array.from(new Set(ids));

    return unique
      .map(id => segmentById.get(id))
      .filter(Boolean)
      .map(segment => {
        const start = formatClock(segment!.start_ms);
        const end = formatClock(segment!.end_ms);
        return start === end ? start : `${start}–${end}`;
      })
      .join(' · ');
  };

  const errorForSegment = (segmentId: string) =>
    draft?.possible_transcription_errors?.find(error => error.segment_ids?.includes(segmentId));

  const highlightedSpan = () => {
    const ids = draft?.possible_transcription_errors?.flatMap(error => error.segment_ids ?? []) ?? [];
    const segments = ids.map(id => segmentById.get(id)).filter(Boolean);
    if (!segments.length) {
      return null;
    }

    return {
      start: Math.min(...segments.map(segment => segment!.start_ms)),
      end: Math.max(...segments.map(segment => segment!.end_ms))
    };
  };

  const playRange = (start: number, end: number) => {
    const audio = audioRef.current;
    if (!audio) {
      dispatch(
        notify({
          msg: 'The recording audio is not available to play.',
          sev: 'warning'
        })
      );
      return;
    }

    const stopAt = () => {
      if (audio.currentTime >= end / 1000) {
        audio.pause();
        audio.removeEventListener('timeupdate', stopAt);
      }
    };

    audio.currentTime = start / 1000;
    audio.addEventListener('timeupdate', stopAt);
    void audio.play();
  };

  const setStatus = (key: ReviewKey, status: ReviewStatus) => {
    setStatuses(current => ({ ...current, [key]: status }));
    setEditing(null);
  };

  const snapshot = (signed: boolean): AmbientDraft => ({
    ...(draft ?? {}),
    review: {
      texts,
      statuses,
      addedDiagnoses,
      acceptedOrders,
      signed
    }
  });

  const persist = async (signed: boolean) => {
    if (!draft || saving) {
      return;
    }

    setSaving(true);
    try {
      await onSave?.(snapshot(signed));
      setOpen(false);
      dispatch(
        notify({
          msg: signed
            ? 'Signed draft saved on this visit.'
            : 'Draft saved on this visit. Open it again with View draft.',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: extractErrorMessage(error) || 'The draft could not be saved.',
          sev: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const printInstructions = () => {
    const text = draft?.instructions?.text?.trim();
    if (!text) {
      return;
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      return;
    }

    const direction = (draft?.instructions?.language || '').toLowerCase().startsWith('ar')
      ? 'rtl'
      : 'ltr';
    popup.document.write(
      `<html><body dir="${direction}" style="font-family: sans-serif; padding: 24px;"><pre style="white-space: pre-wrap;">${escapeHtml(
        text
      )}</pre></body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const sendWhatsApp = () => {
    const text = draft?.instructions?.text?.trim();
    if (!text) {
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const instructionLines = (draft?.instructions?.text || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  const instructionBullets =
    instructionLines.length > 1
      ? instructionLines
      : (draft?.instructions?.text || '')
          .split(/(?<=\.)\s+/)
          .map(line => line.trim())
          .filter(Boolean);

  const playSpan = highlightedSpan();
  const instructionsRtl = (draft?.instructions?.language || '').toLowerCase().startsWith('ar');

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="96vw"
      bodyheight="82vh"
      hideCancel
      hideActionBtn
      customClassName="ambient-draft-modal"
      title={
        <div className="ambient-draft-top">
          <div>
            <div className="ambient-draft-crumb">Patient Visit · Clinical Visit · Ambient draft</div>
            {patientLine && <div className="ambient-draft-patient">{patientLine}</div>}
          </div>
        </div>
      }
      content={
        draft ? (
          <div className="ambient-draft">
            {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

            <div className="ambient-draft-banner">
              <div>
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                <span>
                  Draft ready from a {formatDuration(recordingMs)} recording
                  {languages ? ` (${languages})` : ''}. Review each section; nothing is in the
                  chart until you accept it.
                </span>
              </div>
              <div className="ambient-draft-progress">
                <span>
                  {reviewedCount} of {REVIEW_SECTIONS.length} sections reviewed
                </span>
                <span className="ambient-draft-progress-track">
                  <span style={{ width: `${(reviewedCount / REVIEW_SECTIONS.length) * 100}%` }} />
                </span>
              </div>
            </div>

            <div className="ambient-draft-layout">
              <div className="ambient-draft-main">
                {REVIEW_SECTIONS.map(section => {
                  const status = statuses[section.key];
                  const evidence = evidenceFor(section.evidenceKeys);

                  return (
                    <section
                      key={section.key}
                      className={`ambient-draft-card is-${status}`}
                    >
                      <div className="ambient-draft-card-head">
                        <div>
                          <h3>{section.title}</h3>
                          <p>{section.path}</p>
                        </div>
                        <span className={`ambient-draft-badge is-${status}`}>
                          {status === 'accepted'
                            ? 'Accepted'
                            : status === 'rejected'
                              ? 'Rejected'
                              : 'AI draft'}
                        </span>
                      </div>

                      {editing === section.key ? (
                        <textarea
                          className="ambient-draft-editor"
                          value={editValue}
                          onChange={event => setEditValue(event.target.value)}
                        />
                      ) : (
                        <p className="ambient-draft-copy">{texts[section.key] || 'No text returned for this section.'}</p>
                      )}

                      <div className="ambient-draft-card-foot">
                        <span className="ambient-draft-evidence">
                          {evidence ? `Evidence: ${evidence}` : 'Evidence: —'}
                        </span>
                        <div className="ambient-draft-card-actions">
                          {editing === section.key ? (
                            <>
                              <MyButton
                                appearance="ghost"
                                color="#4b5563"
                                style={{ border: '1px solid #d5dae3', background: '#fff' }}
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </MyButton>
                              <MyButton
                                backgroundColor="#1f2430"
                                onClick={() => {
                                  setTexts(current => ({ ...current, [section.key]: editValue.trim() }));
                                  setEditing(null);
                                }}
                              >
                                Save edit
                              </MyButton>
                            </>
                          ) : (
                            <>
                              <MyButton
                                appearance="ghost"
                                color="#4b5563"
                                style={{ border: '1px solid #d5dae3', background: '#fff' }}
                                onClick={() =>
                                  dispatch(
                                    notify({
                                      msg: 'Regenerate is not connected yet.',
                                      sev: 'warning'
                                    })
                                  )
                                }
                              >
                                Regenerate
                              </MyButton>
                              <MyButton
                                appearance="ghost"
                                color="#4b5563"
                                style={{ border: '1px solid #d5dae3', background: '#fff' }}
                                onClick={() => {
                                  setEditing(section.key);
                                  setEditValue(texts[section.key]);
                                }}
                              >
                                Edit
                              </MyButton>
                              {status !== 'rejected' && (
                                <MyButton
                                  appearance="ghost"
                                  color="#b42318"
                                  style={{ border: '1px solid #f3c3bd', background: '#fff' }}
                                  onClick={() => setStatus(section.key, 'rejected')}
                                >
                                  Reject
                                </MyButton>
                              )}
                              {status === 'accepted' ? (
                                <MyButton
                                  backgroundColor="#1f2430"
                                  onClick={() => setStatus(section.key, 'pending')}
                                >
                                  Undo accept
                                </MyButton>
                              ) : status === 'rejected' ? (
                                <MyButton
                                  backgroundColor="#1f2430"
                                  onClick={() => setStatus(section.key, 'pending')}
                                >
                                  Undo reject
                                </MyButton>
                              ) : (
                                <MyButton
                                  backgroundColor="#1f2430"
                                  onClick={() => setStatus(section.key, 'accepted')}
                                >
                                  Accept
                                </MyButton>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}

                <section className="ambient-draft-card">
                  <div className="ambient-draft-card-head">
                    <div>
                      <h3>Suggested diagnoses</h3>
                      <p>Patient Diagnosis (ICD-10)</p>
                    </div>
                  </div>
                  <table className="ambient-draft-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Flags</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(draft.diagnoses ?? []).map(diagnosis => (
                        <tr key={diagnosis.id}>
                          <td>{diagnosis.icd10 || '—'}</td>
                          <td>{diagnosis.label}</td>
                          <td>{titleCase(diagnosis.rank) || '—'}</td>
                          <td>
                            {diagnosis.chronic && <span className="ambient-draft-chip">Chronic</span>}
                            {diagnosis.suspected && (
                              <span className="ambient-draft-chip is-warn">Suspected</span>
                            )}
                            {!diagnosis.chronic && !diagnosis.suspected && '—'}
                          </td>
                          <td>
                            <MyButton
                              appearance="ghost"
                              color="#1d4ed8"
                              disabled={addedDiagnoses[diagnosis.id]}
                              style={{ border: '1px solid #c7d7fe', background: '#fff' }}
                              onClick={() =>
                                setAddedDiagnoses(current => ({ ...current, [diagnosis.id]: true }))
                              }
                            >
                              {addedDiagnoses[diagnosis.id] ? 'Added' : 'Add to visit'}
                            </MyButton>
                          </td>
                        </tr>
                      ))}
                      {!draft.diagnoses?.length && (
                        <tr>
                          <td colSpan={5}>No diagnoses were returned.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                <section className="ambient-draft-card">
                  <div className="ambient-draft-card-head">
                    <div>
                      <h3>Suggested orders</h3>
                      <p>Checked against the draft mentions and transcription notes</p>
                    </div>
                  </div>
                  <div className="ambient-draft-orders">
                    {(draft.orders ?? []).map(order => {
                      const relatedError = draft.possible_transcription_errors?.find(error =>
                        error.segment_ids?.some(id => order.segment_ids?.includes(id))
                      );
                      const relatedMention = draft.mentions?.find(
                        mention =>
                          mention.confirm_required &&
                          mention.segment_ids?.some(id => order.segment_ids?.includes(id))
                      );
                      const note = relatedError
                        ? `Heard “${relatedError.heard}” · likely ${relatedError.likely}`
                        : relatedMention?.text ||
                          (order.kind === 'follow_up'
                            ? order.payload?.booked
                              ? 'Booked'
                              : 'Pre-filled, not booked'
                            : '');

                      return (
                        <div key={order.id} className="ambient-draft-order">
                          <div className="ambient-draft-order-kind">{orderHeading(order.kind)}</div>
                          <div className="ambient-draft-order-body">
                            <strong>{orderSummary(order) || order.kind}</strong>
                            {note && <span className="ambient-draft-chip is-warn">{note}</span>}
                          </div>
                          <MyButton
                            backgroundColor="#1d4ed8"
                            disabled={acceptedOrders[order.id]}
                            onClick={() =>
                              setAcceptedOrders(current => ({ ...current, [order.id]: true }))
                            }
                          >
                            {acceptedOrders[order.id] ? 'Accepted' : orderAction(order)}
                          </MyButton>
                        </div>
                      );
                    })}
                    {!draft.orders?.length && <p className="ambient-draft-copy">No orders were returned.</p>}
                  </div>
                </section>

                <section className="ambient-draft-card">
                  <div className="ambient-draft-card-head">
                    <div>
                      <h3>Patient instructions</h3>
                      <p>
                        Patient’s language: {titleCase(draft.instructions?.language) || 'Not specified'}
                      </p>
                    </div>
                    <div className="ambient-draft-card-actions">
                      <MyButton
                        appearance="ghost"
                        color="#4b5563"
                        style={{ border: '1px solid #d5dae3', background: '#fff' }}
                        onClick={printInstructions}
                        disabled={!draft.instructions?.text}
                      >
                        Print
                      </MyButton>
                      <MyButton
                        backgroundColor="#128C7E"
                        onClick={sendWhatsApp}
                        disabled={!draft.instructions?.text}
                      >
                        Send by WhatsApp
                      </MyButton>
                    </div>
                  </div>
                  <ul className="ambient-draft-instructions" dir={instructionsRtl ? 'rtl' : 'ltr'}>
                    {instructionBullets.map(line => (
                      <li key={line}>{line}</li>
                    ))}
                    {!instructionBullets.length && <li>No patient instructions were returned.</li>}
                  </ul>
                </section>
              </div>

              <aside className="ambient-draft-transcript">
                <h3>Transcript</h3>
                <div className="ambient-draft-transcript-list">
                  {transcript.map(segment => {
                    const error = errorForSegment(segment.id);
                    const rtl = (segment.lang || '').toLowerCase().startsWith('ar');

                    return (
                      <div
                        key={segment.id}
                        id={`ambient-segment-${segment.id}`}
                        className={`ambient-draft-segment${error ? ' is-flagged' : ''} is-${segment.speaker}`}
                      >
                        <div className="ambient-draft-segment-meta">
                          <span>{titleCase(segment.speaker)}</span>
                          <span>{formatClock(segment.start_ms)}</span>
                        </div>
                        <p dir={rtl ? 'rtl' : 'ltr'}>{segment.text}</p>
                        {error && (
                          <p className="ambient-draft-segment-note">
                            Heard “{error.heard}”. Likely {error.likely}.
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {!transcript.length && <p className="ambient-draft-copy">No transcript was returned.</p>}
                </div>
                {playSpan && (
                  <MyButton
                    appearance="ghost"
                    color="#1f2430"
                    style={{ border: '1px solid #d5dae3', background: '#fff', width: '100%' }}
                    prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
                    onClick={() => playRange(playSpan.start, playSpan.end)}
                  >
                    Play {formatClock(playSpan.start)}–{formatClock(playSpan.end)}
                  </MyButton>
                )}
              </aside>
            </div>

            <div className="ambient-draft-footer">
              <p>Review all 4 sections to sign. Accepted sections stay on this draft; rejected ones are left blank.</p>
              <div>
                <MyButton
                  appearance="ghost"
                  color="#4b5563"
                  loading={saving}
                  disabled={saving || !draft}
                  style={{ border: '1px solid #d5dae3', background: '#fff' }}
                  onClick={() => {
                    void persist(false);
                  }}
                >
                  Save draft for later
                </MyButton>
                <MyButton
                  backgroundColor="#1f2430"
                  loading={saving}
                  disabled={saving || reviewedCount < REVIEW_SECTIONS.length}
                  onClick={() => {
                    void persist(true);
                  }}
                >
                  Sign & Complete Visit
                </MyButton>
              </div>
            </div>
          </div>
        ) : null
      }
    />
  );
};

export default AmbientDraftModal;
