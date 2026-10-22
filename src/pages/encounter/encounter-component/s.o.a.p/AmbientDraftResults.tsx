import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { SaveableSectionHandle } from '@/types/saveableSection';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import PatientObservationsComplaints from '@/pages/encounter/encounter-pre-observations-new/observations/PatientObservationsComplaints';
import BodyMeasurements from '@/pages/encounter/encounter-pre-observations-new/observations/BodyMeasurements';
import PainAssessment from '@/pages/encounter/encounter-pre-observations-new/observations/PainAssessment';
import PatientDiagnosis from '@/pages/encounter/medical-notes-and-assessments/patient-diagnosis/PatientDiagnosis';
import EncounterAssessmentSection from '@/pages/encounter/medical-notes-and-assessments/encounter-assessments/EncounterAssessmentSection';
import PatientPlan from '@/pages/encounter/medical-notes-and-assessments/patient-plan/PatientPlan';
import HistoryOfPresentIllnessSection from './HistoryOfPresentIllnessSection';
import ClinicalVisitDraftSection from './ClinicalVisitDraftSection';
import './ambientDraft.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  draft: any;
  isLoading: boolean;
  errorMessage: string | null;
  patient?: any;
  patientId?: number;
  encounterId?: number;
  encounter?: any;
  setEncounter?: (encounter: any) => void;
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="ambient-block">
    <div className="ambient-block-title">
      <Translate>{title}</Translate>
    </div>
    {children}
  </div>
);

/**
 * The ambient draft: the visit forms (prefilled, saved one by one or with Save All),
 * then only what has no form (orders, mentions, instructions, checks, transcript).
 */
const AmbientDraftResults: React.FC<Props> = ({
  open,
  setOpen,
  draft,
  isLoading,
  errorMessage,
  patient,
  patientId,
  encounterId,
  encounter,
  setEncounter
}) => {
  const dispatch = useAppDispatch();
  const [savingAll, setSavingAll] = useState(false);

  // The visit forms in the popup, saved one by one or all together
  const vitalSignsRef = useRef<SaveableSectionHandle>(null);
  const bodyMeasurementsRef = useRef<SaveableSectionHandle>(null);
  const painRef = useRef<SaveableSectionHandle>(null);
  const nursingRef = useRef<SaveableSectionHandle>(null);
  const hpiRef = useRef<SaveableSectionHandle>(null);
  const clinicalVisitRef = useRef<SaveableSectionHandle>(null);
  const assessmentRef = useRef<SaveableSectionHandle>(null);
  const planRef = useRef<SaveableSectionHandle>(null);

  const record = draft?.record ?? {};

  // One diagnosis form per draft diagnosis. Our "major" field is shown as "Chronic",
  // so it comes from the draft's chronic flag (the draft's own "major" means primary).
  const diagnosisPrefills = useMemo(
    () =>
      (draft?.diagnoses ?? []).map((d: any, i: number) => ({
        label: [d.icd10, d.label].filter(Boolean).join(' '),
        prefill: {
          diagnosisId: d.diagnosisId ?? null,
          type: draft?.record?.patient_diagnosis?.[i]?.type ?? (d.rank === 'primary' || d.rank === 1 ? 'PRIMARY' : 'SECONDARY'),
          suspected: !!d.suspected,
          major: !!d.chronic
        }
      })),
    [draft]
  );
  const diagnosisRefs = useMemo(
    () => diagnosisPrefills.map(() => createRef<SaveableSectionHandle>()),
    [diagnosisPrefills]
  );

  const clinicalVisit = record.clinical_visit;
  const hasClinicalVisit = !!(clinicalVisit?.chiefComplaint || clinicalVisit?.physicalExaminationSummery);

  const canShowForms = !!patientId && !!encounterId;
  // Save order: nursing assessment also updates the encounter, so chief complaint /
  // physical examination (encounter fields) are saved after it and are not overwritten
  const sections: { key: string; name: string; ref: React.RefObject<SaveableSectionHandle> }[] = [
    ...(record.vital_sign ? [{ key: 'vitalSigns', name: 'Vital Signs', ref: vitalSignsRef }] : []),
    ...(record.body_measurements
      ? [{ key: 'bodyMeasurements', name: 'Body Measurements', ref: bodyMeasurementsRef }]
      : []),
    ...(record.pain_assessment ? [{ key: 'pain', name: 'Pain Assessment', ref: painRef }] : []),
    ...(record.nursing_assessment && encounter
      ? [{ key: 'nursing', name: 'Nursing Assessment', ref: nursingRef }]
      : []),
    ...(clinicalVisit?.historyOfPresentIllness && encounter
      ? [{ key: 'hpi', name: 'History Of Present Illness', ref: hpiRef }]
      : []),
    ...(hasClinicalVisit && encounter
      ? [{ key: 'clinicalVisit', name: 'Chief Complaint / Physical Examination', ref: clinicalVisitRef }]
      : []),
    ...diagnosisPrefills.map((d: any, i: number) => ({
      key: `diagnosis-${i}`,
      name: `Diagnosis: ${d.label || i + 1}`,
      ref: diagnosisRefs[i]
    })),
    ...(record.assessment ? [{ key: 'assessment', name: 'Assessment', ref: assessmentRef }] : []),
    ...(record.plan_of_care && encounter ? [{ key: 'plan', name: 'Plan of Care', ref: planRef }] : [])
  ];

  // Sections the doctor rejected: kept on screen (collapsed) but left out of Save All
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  // Sections already saved (their own Save or Save All): read-only and never saved twice
  const [saved, setSaved] = useState<Set<string>>(new Set());
  useEffect(() => {
    setRejected(new Set());
    setSaved(new Set());
  }, [draft]);

  const markSaved = (key: string) => setSaved(prev => new Set(prev).add(key));

  const toggleRejected = (key: string) =>
    setRejected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Reject sits inside the section, next to its Save (not shown once the section is saved)
  const rejectButton = (key: string) =>
    saved.has(key) ? null : (
      <MyButton
        size="small"
        appearance="ghost"
        onClick={() => toggleRejected(key)}
        disabled={savingAll}
      >
        Reject
      </MyButton>
    );

  // The form stays mounted when rejected, so Undo brings back what the doctor edited
  const renderSection = (key: string, name: string, form: React.ReactNode) => {
    const isRejected = rejected.has(key);
    const isSaved = saved.has(key);
    return (
      <div key={key} className={`ambient-section ${isRejected ? 'rejected' : ''} ${isSaved ? 'saved' : ''}`}>
        {isSaved ? (
          <div className="ambient-section-actions">
            <span className="ambient-saved-tag">✓ <Translate>Saved</Translate></span>
          </div>
        ) : isRejected ? (
          <div className="ambient-rejected-row">
            <span>
              <Translate>{name}</Translate> — <Translate>Rejected</Translate>
            </span>
            <MyButton size="small" appearance="ghost" onClick={() => toggleRejected(key)} disabled={savingAll}>
              Undo
            </MyButton>
          </div>
        ) : null}
        {/* Saved: shown read-only so the doctor sees what was saved */}
        <div
          className={isSaved ? 'ambient-section-locked' : undefined}
          style={isRejected ? { display: 'none' } : undefined}
        >
          {form}
        </div>
      </div>
    );
  };

  // Sections still to save: Save All is disabled once every section is saved or rejected
  const toSave = sections.filter(section => !rejected.has(section.key) && !saved.has(section.key));

  // Each section runs its own validation and save; one failing does not stop the others
  const handleSaveAll = async () => {
    if (toSave.length === 0) {
      dispatch(notify({ msg: 'Nothing left to save: every section is saved or rejected.', sev: 'info' }));
      return;
    }

    setSavingAll(true);
    const failed: string[] = [];
    try {
      for (const section of toSave) {
        const ok = await section.ref.current?.save();
        if (ok) markSaved(section.key);
        else failed.push(section.name);
        // Let the saved encounter reach the next section before it saves
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      setSavingAll(false);
    }
    dispatch(
      notify(
        failed.length === 0
          ? { msg: 'All sections saved successfully', sev: 'success' }
          : { msg: `Not saved, please check:\n${failed.map(name => `• ${name}`).join('\n')}`, sev: 'warning' }
      )
    );
  };

  const content = () => {
    if (isLoading) {
      return (
        <div className="ambient-state">
          <Translate>Building the visit draft... this can take a minute.</Translate>
        </div>
      );
    }
    if (errorMessage) {
      return <div className="ambient-state ambient-error">{errorMessage}</div>;
    }
    if (!draft) {
      return (
        <div className="ambient-state">
          <Translate>No draft yet.</Translate>
        </div>
      );
    }

    return (
      <div className="ambient-draft">
        {canShowForms && sections.length > 0 && (
          <div className="ambient-forms">
            <div className="ambient-forms-header">
              <span className="ambient-block-title">
                <Translate>Review and save</Translate>
              </span>
              <MyButton onClick={handleSaveAll} loading={savingAll} disabled={savingAll || toSave.length === 0}>
                Save All
              </MyButton>
            </div>

            {record.vital_sign &&
              renderSection('vitalSigns', 'Vital Signs', (
                <VitalSigns
                  ref={vitalSignsRef}
                  onSaved={() => markSaved('vitalSigns')}
                  extraActions={rejectButton('vitalSigns')}
                  patientId={patientId as number}
                  encounterId={encounterId as number}
                  encounter={encounter}
                  prefill={record.vital_sign}
                  showFluidAssessment
                />
              ))}

            {record.nursing_assessment && encounter &&
              renderSection('nursing', 'Nursing Assessment', (
                // Like the Observations page: this section's fields need a Form around them
                <Form fluid>
                  <PatientObservationsComplaints
                    ref={nursingRef}
                    onSaved={() => markSaved('nursing')}
                    extraActions={rejectButton('nursing')}
                    patientId={patientId as number}
                    encounterId={encounterId as number}
                    encounter={encounter}
                    setEncounter={setEncounter ?? (() => undefined)}
                    prefill={record.nursing_assessment}
                  />
                </Form>
              ))}

            {record.body_measurements &&
              renderSection('bodyMeasurements', 'Body Measurements', (
                <Form fluid>
                  <BodyMeasurements
                    ref={bodyMeasurementsRef}
                    onSaved={() => markSaved('bodyMeasurements')}
                    extraActions={rejectButton('bodyMeasurements')}
                    patient={patient}
                    patientId={patientId as number}
                    encounterId={encounterId as number}
                    encounter={encounter}
                    prefill={record.body_measurements}
                  />
                </Form>
              ))}

            {record.pain_assessment &&
              renderSection('pain', 'Pain Assessment', (
                <Form fluid>
                  <PainAssessment
                    ref={painRef}
                    onSaved={() => markSaved('pain')}
                    extraActions={rejectButton('pain')}
                    patientId={patientId as number}
                    encounterId={encounterId as number}
                    encounter={encounter}
                    prefill={record.pain_assessment}
                  />
                </Form>
              ))}

            {hasClinicalVisit && encounter &&
              renderSection('clinicalVisit', 'Chief Complaint / Physical Examination', (
                <ClinicalVisitDraftSection
                  ref={clinicalVisitRef}
                  onSaved={() => markSaved('clinicalVisit')}
                  extraActions={rejectButton('clinicalVisit')}
                  encounter={encounter}
                  setEncounter={setEncounter}
                  prefill={clinicalVisit}
                />
              ))}

            {clinicalVisit?.historyOfPresentIllness && encounter &&
              renderSection('hpi', 'History Of Present Illness', (
                <HistoryOfPresentIllnessSection
                  ref={hpiRef}
                  onSaved={() => markSaved('hpi')}
                  extraActions={rejectButton('hpi')}
                  encounter={encounter}
                  setEncounter={setEncounter as any}
                  prefill={clinicalVisit.historyOfPresentIllness}
                />
              ))}

            {diagnosisPrefills.map((d: any, i: number) =>
              renderSection(`diagnosis-${i}`, `Diagnosis: ${d.label || i + 1}`, (
                <PatientDiagnosis
                  ref={diagnosisRefs[i]}
                  patient={patient ?? { id: patientId }}
                  encounter={encounter ?? { id: encounterId }}
                  title={
                    d.prefill.diagnosisId
                      ? `Diagnosis: ${d.label}`
                      : `Diagnosis: ${d.label} (choose the diagnosis)`
                  }
                  prefill={d.prefill}
                  hideTables
                  keepAfterSave
                  onDiagnosisSaved={() => markSaved(`diagnosis-${i}`)}
                  extraActions={rejectButton(`diagnosis-${i}`)}
                />
              ))
            )}

            {record.assessment &&
              renderSection('assessment', 'Assessment', (
                <EncounterAssessmentSection
                  ref={assessmentRef}
                  onSaved={() => markSaved('assessment')}
                  extraActions={rejectButton('assessment')}
                  patient={patient ?? { id: patientId }}
                  encounterId={encounterId as number}
                  prefill={record.assessment}
                />
              ))}

            {record.plan_of_care && encounter &&
              renderSection('plan', 'Plan of Care', (
                <PatientPlan
                  ref={planRef}
                  onSaved={() => markSaved('plan')}
                  extraActions={rejectButton('plan')}
                  patient={patient ?? { id: patientId }}
                  localEncounter={encounter}
                  prefill={record.plan_of_care}
                />
              ))}
          </div>
        )}

        {(!canShowForms || sections.length === 0) && (
          <div className="ambient-state">
            <Translate>Nothing to save was found in this recording.</Translate>
          </div>
        )}

        {(draft.orders ?? []).length > 0 && (
          <Block title="Suggested Orders">
            {draft.orders.map((o: any, i: number) => (
              <div key={o.id ?? i} className="ambient-row">
                <span className="ambient-tag">{o.kind}</span>
                <code>{pretty(o.payload)}</code>
              </div>
            ))}
          </Block>
        )}

        {(draft.mentions ?? []).length > 0 && (
          <Block title="Mentions (confirm)">
            {draft.mentions.map((m: any, i: number) => (
              <div key={i} className="ambient-row">
                <span className="ambient-tag">{m.kind}</span> {m.text}
              </div>
            ))}
          </Block>
        )}

        {draft.instructions?.text && (
          <Block title="Patient Instructions">
            <div className="ambient-value">
              <span className="ambient-tag">{draft.instructions.language}</span> {draft.instructions.text}
            </div>
          </Block>
        )}

        {((draft.flags ?? []).length > 0 || (draft.possible_transcription_errors ?? []).length > 0) && (
          <Block title="Check These">
            {(draft.flags ?? []).map((flag: any, i: number) => (
              <div key={`f${i}`} className="ambient-row">
                <span className="ambient-tag">{flag.kind}</span> {flag.text}
              </div>
            ))}
            {(draft.possible_transcription_errors ?? []).map((t: any, i: number) => (
              <div key={`t${i}`} className="ambient-row">
                heard “{t.heard}” → likely “{t.likely}”
              </div>
            ))}
          </Block>
        )}

        {(draft.transcript ?? []).length > 0 && (
          <Block title="Transcript">
            {draft.transcript.map((segment: any) => (
              <div key={segment.id} className="ambient-row">
                <b>{segment.speaker}:</b> {segment.text}
              </div>
            ))}
          </Block>
        )}
      </div>
    );
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Ambient Draft"
      size="70vw"
      bodyheight="70vh"
      position="center"
      hideActionBtn
      cancelButtonLabel="Close"
      content={content}
    />
  );
};

export default AmbientDraftResults;
