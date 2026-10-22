import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Form, Tooltip, Whisper } from 'rsuite';

import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch/Icd10DiagnosisSearch';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import VitalSigns from '@/pages/medical-component/vital-signs/VitalSigns';
import BodyMeasurements from '@/pages/encounter/encounter-pre-observations-new/observations/BodyMeasurements';
import PainAssessmentForm from '@/pages/encounter/encounter-pre-observations-new/observations/PainAssessment';
import PatientObservationsComplaints from '@/pages/encounter/encounter-pre-observations-new/observations/PatientObservationsComplaints';
import { useAppDispatch } from '@/hooks';
import type {
  AmbientDiagnosis,
  AmbientDraft,
  AmbientOrder,
  ReviewKey,
  ReviewStatus
} from '@/services/ai-services/ambientDraft';
import { useUpdateEncounterMutation, useUpdateHistoryOfPresentIllnessMutation } from '@/services/encounters/patientEncounterService';
import {
  useCreateEncounterAssessmentMutation,
  useGetLatestEncounterAssessmentQuery,
  useUpdateEncounterAssessmentMutation
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterAssessmentService';
import {
  useCreateEncounterPlanMutation,
  useGetLatestEncounterPlanQuery,
  useUpdateEncounterPlanMutation
} from '@/services/medicalsheetsEncounter/clinicalVisit/encounterPlanService';
import { useCreateDiagnosticOrderMutation } from '@/services/diagnosic-order/diagnosticOrderService';
import { useCreateDiagnosticOrderTestMutation } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useLazyGetActiveDiagnosticTestsByTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useCreateOrGetPatientPrescriptionMutation } from '@/services/patients/Prescription/patientPrescriptionService';
import { useCreatePatientPrescriptionMedicationMutation } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useCreateAppointmentRequestMutation } from '@/services/appointment/appointmentRequestService';
import { useCreatePatientDiagnosisMutation } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useCreateVitalSignsMutation } from '@/services/medicalsheetsEncounter/observations/vitalSignsService';
import { useCreateBodyMeasurementsMutation } from '@/services/medicalsheetsEncounter/observations/bodyMeasurementsService';
import { useCreatePainAssessmentMutation } from '@/services/medicalsheetsEncounter/observations/painAssessmentService';
import { useCreatePatientObservationsComplaintsMutation } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazySearchIcdDiagnosesQuery } from '@/services/setup/icdTreeService';
import { DiagnosticStatus, TestType, type PatientEncounter } from '@/types/model-types-new';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { useRegenerateAmbientSectionMutation } from '@/services/ai-services/ambientDraftService';
import { notify } from '@/utils/uiReducerActions';
import AmbientOrderEditModal, { ambientOrderKind } from './AmbientOrderEditModal';
import './ambient-draft.less';

type AmbientDraftModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  draft: AmbientDraft | null;
  audioUrl?: string | null;
  durationMs?: number;
  patientLine?: string;
  patientId?: number | string | null;
  encounter?: any;
  onEncounterSaved?: (encounter: any) => void;
  onSave?: (draft: AmbientDraft) => Promise<void>;
  regenerateDefaults?: {
    noteLanguage?: string | null;
    instructionLanguage?: string | null;
    specialty?: string | null;
    noteLength?: string | null;
    noteForm?: string | null;
    patientContext?: string | null;
    suggestIcd10?: boolean | null;
    suggestOrders?: boolean | null;
  };
};

const toEncounterPayload = (encounter: any): PatientEncounter => ({
  id: Number(encounter?.id),
  patientId: Number(encounter?.patientId ?? encounter?.patient?.id),
  encounterNumber: encounter?.encounterNumber ?? null,
  facilityId: Number(encounter?.facilityId),
  departmentId: Number(encounter?.departmentId),
  practitionerId: encounter?.practitionerId ?? null,
  paymentDate: encounter?.paymentDate,
  amount: encounter?.amount,
  encounterType: encounter?.encounterType,
  encounterReason: encounter?.encounterReason,
  followUpEncounterId: encounter?.followUpEncounterId ?? encounter?.followUpEncounter?.id ?? null,
  priorityLevel: encounter?.priorityLevel,
  originType: encounter?.originType ?? null,
  originName: encounter?.originName ?? null,
  notes: encounter?.notes ?? null,
  departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,
  encounterDate: encounter?.encounterDate ?? null,
  status: encounter?.status,
  chiefComplaint: encounter?.chiefComplaint ?? null,
  hasPrescription: Boolean(encounter?.hasPrescription),
  hasOrder: Boolean(encounter?.hasOrder),
  isObserved: Boolean(encounter?.isObserved),
  physicalExaminationSummery: encounter?.physicalExaminationSummery ?? null
});

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
  },
  {
    key: 'vital_signs',
    title: 'Vital signs',
    path: 'Observations · Vital Signs',
    evidenceKeys: ['vital_sign']
  },
  {
    key: 'body_measurements',
    title: 'Body measurements',
    path: 'Observations · Body Measurements',
    evidenceKeys: ['body_measurements']
  },
  {
    key: 'pain_assessment',
    title: 'Pain assessment',
    path: 'Observations · Pain Assessment',
    evidenceKeys: ['pain_assessment']
  },
  {
    key: 'nursing_assessment',
    title: 'Nursing assessment',
    path: 'Observations · Nursing Assessment',
    evidenceKeys: ['nursing_assessment']
  }
];

const EMPTY_STATUS: Record<ReviewKey, ReviewStatus> = {
  chief_complaint: 'pending',
  hpi: 'pending',
  physical_exam: 'pending',
  assessment_plan: 'pending',
  vital_signs: 'pending',
  body_measurements: 'pending',
  pain_assessment: 'pending',
  nursing_assessment: 'pending'
};

type ObservationKey = 'vital_signs' | 'body_measurements' | 'pain_assessment' | 'nursing_assessment';
type ObservationField = { key: string; label: string; kind: 'number' | 'text' | 'boolean' };

const OBSERVATION_FIELDS: Record<ObservationKey, ObservationField[]> = {
  vital_signs: [
    { key: 'bloodPressureSystolic', label: 'Blood pressure systolic', kind: 'number' },
    { key: 'bloodPressureDiastolic', label: 'Blood pressure diastolic', kind: 'number' },
    { key: 'heartRate', label: 'Heart rate', kind: 'number' },
    { key: 'temperature', label: 'Temperature', kind: 'number' },
    { key: 'oxygenSaturation', label: 'Oxygen saturation', kind: 'number' },
    { key: 'respiratoryRate', label: 'Respiratory rate', kind: 'number' },
    { key: 'measurementSite', label: 'Measurement site', kind: 'text' },
    { key: 'fastingBloodGlucose', label: 'Fasting blood glucose', kind: 'text' },
    { key: 'fluidStatus', label: 'Fluid status', kind: 'text' },
    { key: 'edema', label: 'Edema', kind: 'text' },
    { key: 'urineOutput', label: 'Urine output', kind: 'text' },
    { key: 'notes', label: 'Notes', kind: 'text' }
  ],
  body_measurements: [
    { key: 'weight', label: 'Weight', kind: 'number' },
    { key: 'height', label: 'Height', kind: 'number' },
    { key: 'headCircumference', label: 'Head circumference', kind: 'number' }
  ],
  pain_assessment: [
    { key: 'painDegree', label: 'Pain degree', kind: 'text' },
    { key: 'painLevel', label: 'Pain level', kind: 'text' },
    { key: 'painAssessmentType', label: 'Pain assessment type', kind: 'text' },
    { key: 'painDescription', label: 'Pain description', kind: 'text' },
    { key: 'painPattern', label: 'Pain pattern', kind: 'text' }
  ],
  nursing_assessment: [
    { key: 'reasonOfVisit', label: 'Reason of visit', kind: 'text' },
    { key: 'modeOfArrival', label: 'Mode of arrival', kind: 'text' },
    { key: 'byPatient', label: 'By patient', kind: 'boolean' },
    { key: 'sourceOfInformation', label: 'Source of information', kind: 'text' },
    { key: 'functionalStatus', label: 'Functional status', kind: 'text' },
    { key: 'cognitiveCheck', label: 'Cognitive check', kind: 'text' },
    { key: 'patientConditions', label: 'Patient conditions', kind: 'text' },
    { key: 'bloodGroup', label: 'Blood group', kind: 'text' },
    { key: 'isPregnant', label: 'Pregnant', kind: 'boolean' },
    { key: 'isLactating', label: 'Lactating', kind: 'boolean' },
    { key: 'priorityLevel', label: 'Priority', kind: 'text' }
  ]
};

const OBSERVATION_RECORD_KEYS: Record<ObservationKey, string[]> = {
  vital_signs: ['vital_sign', 'vitalSign', 'vital_signs', 'vitals'],
  body_measurements: ['body_measurements', 'bodyMeasurements'],
  pain_assessment: ['pain_assessment', 'painAssessment'],
  nursing_assessment: ['nursing_assessment', 'nursingAssessment', 'observations_complaints']
};

const FIELD_ALIASES: Record<string, string[]> = {
  bloodPressureSystolic: ['systolic', 'bpSystolic'],
  bloodPressureDiastolic: ['diastolic', 'bpDiastolic'],
  heartRate: ['pulse', 'pulseRate'],
  oxygenSaturation: ['spo2', 'o2Sat'],
  respiratoryRate: ['respRate'],
  headCircumference: ['head_circumference'],
  painDegree: ['degree'],
  painLevel: ['level'],
  painAssessmentType: ['type'],
  painDescription: ['description'],
  reasonOfVisit: ['reason'],
  priorityLevel: ['priority']
};

const isObservationKey = (key: ReviewKey): key is ObservationKey => key in OBSERVATION_FIELDS;

const camelizeKey = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const asRecord = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized: Record<string, any> = {};
  Object.entries(value as Record<string, any>).forEach(([key, item]) => {
    normalized[camelizeKey(key)] = item;
  });
  return normalized;
};

const readObservation = (draft: AmbientDraft, key: ObservationKey) => {
  const record = asRecord(draft.record);
  const sourceName = OBSERVATION_RECORD_KEYS[key].find(name => record[name] != null || record[camelizeKey(name)] != null);
  const raw = asRecord(sourceName ? record[sourceName] ?? record[camelizeKey(sourceName)] : {});
  const result: Record<string, any> = {};
  OBSERVATION_FIELDS[key].forEach(field => {
    const aliases = [field.key, ...(FIELD_ALIASES[field.key] ?? [])];
    const value = aliases
      .map(alias => raw[alias] ?? raw[camelizeKey(alias)])
      .find(item => item !== undefined && item !== null && item !== '');
    if (value !== undefined) result[field.key] = value;
  });
  if (key === 'vital_signs' && (result.bloodPressureSystolic == null || result.bloodPressureDiastolic == null)) {
    const combined = raw.bloodPressure ?? raw.bp;
    if (typeof combined === 'string' && combined.includes('/')) {
      const [systolic, diastolic] = combined.split('/').map(part => Number(part.trim()));
      if (result.bloodPressureSystolic == null && Number.isFinite(systolic)) result.bloodPressureSystolic = systolic;
      if (result.bloodPressureDiastolic == null && Number.isFinite(diastolic)) result.bloodPressureDiastolic = diastolic;
    }
  }
  return result;
};

const formatObservation = (key: ObservationKey, record: Record<string, any>) =>
  OBSERVATION_FIELDS[key]
    .map(field => {
      const value = record[field.key];
      if (value === undefined || value === null || value === '') return '';
      return `${field.label}: ${value}`;
    })
    .filter(Boolean)
    .join('\n');

const parseObservation = (key: ObservationKey, text: string) => {
  const result: Record<string, any> = {};
  text.split('\n').forEach(line => {
    const index = line.indexOf(':');
    if (index < 0) return;
    const label = line.slice(0, index).trim().toLowerCase();
    const raw = line.slice(index + 1).trim();
    const field = OBSERVATION_FIELDS[key].find(item => item.label.toLowerCase() === label);
    if (!field || !raw) return;
    if (field.kind === 'number') {
      const number = Number(raw);
      if (Number.isFinite(number)) result[field.key] = number;
      return;
    }
    if (field.kind === 'boolean') {
      result[field.key] = ['true', 'yes', '1'].includes(raw.toLowerCase());
      return;
    }
    result[field.key] = raw;
  });
  return result;
};

const painLevelValue = (value: unknown) => {
  if (value == null || value === '') return 'LEVEL_0';
  const text = String(value).trim();
  if (/^level_\d+$/i.test(text)) return text.toUpperCase();
  if (/^\d+$/.test(text)) return `LEVEL_${text}`;
  return text;
};

const REGENERATE_SECTION: Record<ReviewKey, string> = {
  chief_complaint: 'chief_complaint',
  hpi: 'hpi',
  physical_exam: 'physical_exam',
  assessment_plan: 'assessment_plan',
  vital_signs: 'vital_sign',
  body_measurements: 'body_measurements',
  pain_assessment: 'pain_assessment',
  nursing_assessment: 'nursing_assessment'
};

const regeneratedSectionText = (key: ReviewKey, current: AmbientDraft | null, response: unknown) => {
  if (typeof response === 'string' && response.trim()) return response.trim();
  if (!response || typeof response !== 'object' || Array.isArray(response)) return '';
  const data = response as Record<string, any>;
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
  if (typeof data.content === 'string' && data.content.trim()) return data.content.trim();
  const nested = data.draft || data.result;
  const candidate = nested && typeof nested === 'object' ? nested : data;
  const looksLikeDraft =
    candidate.soap_note || candidate.record || candidate.sections || candidate.transcript;
  if (looksLikeDraft) {
    const merged: AmbientDraft = {
      ...(current ?? {}),
      ...candidate,
      soap_note: { ...(current?.soap_note ?? {}), ...(candidate.soap_note ?? {}) },
      record: { ...(current?.record ?? {}), ...(candidate.record ?? {}) },
      sections: { ...(current?.sections ?? {}), ...(candidate.sections ?? {}) }
    };
    const text = sectionSourceText(merged, key);
    if (text) return text;
  }
  const sectionName = REGENERATE_SECTION[key];
  const direct = data[sectionName];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (Array.isArray(data.sentences)) {
    const sentenceText = data.sentences
      .map((sentence: { text?: string }) => sentence?.text?.trim())
      .filter(Boolean)
      .join(' ');
    if (sentenceText) return sentenceText;
  }
  const recordValue = data[sectionName] || data.record?.[sectionName];
  if (isObservationKey(key) && recordValue && typeof recordValue === 'object') {
    return formatObservation(key, readObservation({ record: { [sectionName]: recordValue } } as AmbientDraft, key));
  }
  return '';
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
    return note?.PhysicalExamination?.trim() || joinSentences(draft, 'physical_exam');
  }

  if (isObservationKey(key)) {
    const formatted = formatObservation(key, readObservation(draft, key));
    if (formatted) return formatted;
    if (key === 'vital_signs') return note?.Vitals?.trim() || joinSentences(draft, 'vital_signs');
    return joinSentences(draft, key);
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

const SoonButton = ({ children }: { children: string }) => (
  <Whisper trigger="hover" placement="top" speaker={<Tooltip>Coming soon</Tooltip>}>
    <span className="ambient-draft-soon">
      <MyButton
        appearance="ghost"
        color="var(--primary-blue)"
        disabled
        style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
      >
        {children}
      </MyButton>
    </span>
  </Whisper>
);

type DiagnosisEdit = {
  suggestionId: string;
  suggested: string;
  diagnosisId: number | null;
  type: string | null;
  suspected: boolean;
  major: boolean;
};

const diagnosisTypeFromRank = (rank?: string | null) => {
  const value = (rank || '').toLowerCase();
  if (value === 'primary' || value === '1') return 'PRIMARY';
  if (value === 'secondary' || value === '2') return 'SECONDARY';
  return null;
};

const orderAction = (order: AmbientOrder) => {
  if (order.kind === 'follow_up') return 'Create Follow-up';
  if (order.kind === 'lab') return 'Accept orders';
  return 'Accept order';
};

const AmbientDraftModal = ({
  open,
  setOpen,
  draft,
  audioUrl,
  durationMs = 0,
  patientLine,
  patientId,
  encounter,
  onEncounterSaved,
  onSave,
  regenerateDefaults
}: AmbientDraftModalProps) => {
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [visit, setVisit] = useState<any>(encounter);
  const [savingKey, setSavingKey] = useState<ReviewKey | null>(null);
  const [signedLock, setSignedLock] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [addingDiagnosisId, setAddingDiagnosisId] = useState<string | null>(null);
  const encounterId = visit?.id ?? encounter?.id;
  const [updateEncounter] = useUpdateEncounterMutation();
  const [updateHistoryOfPresentIllness] = useUpdateHistoryOfPresentIllnessMutation();
  const [createEncounterAssessment] = useCreateEncounterAssessmentMutation();
  const [updateEncounterAssessment] = useUpdateEncounterAssessmentMutation();
  const [createEncounterPlan] = useCreateEncounterPlanMutation();
  const [updateEncounterPlan] = useUpdateEncounterPlanMutation();
  const { data: latestAssessment } = useGetLatestEncounterAssessmentQuery(
    { encounterId },
    { skip: !encounterId }
  );
  const { data: latestPlan } = useGetLatestEncounterPlanQuery({ encounterId }, { skip: !encounterId });
  const [createDiagnosticOrder] = useCreateDiagnosticOrderMutation();
  const [createDiagnosticOrderTest] = useCreateDiagnosticOrderTestMutation();
  const [findDiagnosticTests] = useLazyGetActiveDiagnosticTestsByTypeQuery();
  const [createOrGetPrescription] = useCreateOrGetPatientPrescriptionMutation();
  const [createPrescriptionMedication] = useCreatePatientPrescriptionMedicationMutation();
  const [createAppointmentRequest] = useCreateAppointmentRequestMutation();
  const [createPatientDiagnosis] = useCreatePatientDiagnosisMutation();
  const [createVitalSigns] = useCreateVitalSignsMutation();
  const [createBodyMeasurements] = useCreateBodyMeasurementsMutation();
  const [createPainAssessment] = useCreatePainAssessmentMutation();
  const [createNursingAssessment] = useCreatePatientObservationsComplaintsMutation();
  const [searchIcdDiagnoses] = useLazySearchIcdDiagnosesQuery();
  const diagnosisTypeOptions = useEnumOptions('DiagnosisType');
  const noteLanguages = useEnumOptions('AmbientNoteLanguage');
  const instructionLanguages = useEnumOptions('AmbientInstructionLanguage');
  const noteStyles = useEnumOptions('AmbientNoteStyle');
  const specialties = useEnumOptions('AmbientSpecialty');
  const noteForms = useEnumOptions('AmbientNoteForm');
  const [regenerateSection, setRegenerateSection] = useState<ReviewKey | null>(null);
  const [regenerateForm, setRegenerateForm] = useState({
    instruction: '',
    noteLanguage: '',
    instructionLanguage: '',
    specialty: '',
    noteLength: '',
    noteForm: '',
    suggestIcd10: true,
    suggestOrders: true
  });
  const [regenerateAmbientSection, { isLoading: regenerating }] = useRegenerateAmbientSectionMutation();
  const [diagnosisEdit, setDiagnosisEdit] = useState<DiagnosisEdit | null>(null);
  const [orderEdit, setOrderEdit] = useState<AmbientOrder | null>(null);
  const locked = signedLock;

  useEffect(() => {
    if (encounter) {
      setVisit(encounter);
    }
  }, [encounter]);
  const [texts, setTexts] = useState<Record<ReviewKey, string>>({
    chief_complaint: '',
    hpi: '',
    physical_exam: '',
    assessment_plan: '',
    vital_signs: '',
    body_measurements: '',
    pain_assessment: '',
    nursing_assessment: ''
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
      assessment_plan: savedTexts?.assessment_plan ?? sectionSourceText(draft, 'assessment_plan'),
      vital_signs: savedTexts?.vital_signs ?? sectionSourceText(draft, 'vital_signs'),
      body_measurements: savedTexts?.body_measurements ?? sectionSourceText(draft, 'body_measurements'),
      pain_assessment: savedTexts?.pain_assessment ?? sectionSourceText(draft, 'pain_assessment'),
      nursing_assessment: savedTexts?.nursing_assessment ?? sectionSourceText(draft, 'nursing_assessment')
    });
    setStatuses({ ...EMPTY_STATUS, ...draft.review?.statuses });
    setEditing(null);
    setAddedDiagnoses(draft.review?.addedDiagnoses ?? {});
    setAcceptedOrders(draft.review?.acceptedOrders ?? {});
    setSignedLock(Boolean(draft.review?.signed));
    setDiagnosisEdit(null);
    setOrderEdit(null);
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

  const rememberEncounter = (updated: any) => {
    setVisit(updated);
    onEncounterSaved?.(updated);
  };

  const requireEncounter = () => {
    const current = visit ?? encounter;
    const id = current?.id;
    if (!id) {
      dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
      return null;
    }
    const payload = toEncounterPayload(current);
    if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
      dispatch(
        notify({
          msg: 'Missing required fields: patientId / facilityId / departmentId',
          sev: 'error'
        })
      );
      return null;
    }
    return { id, payload, current };
  };

  const saveChiefComplaint = async (text: string) => {
    const ready = requireEncounter();
    if (!ready) {
      return false;
    }
    const updated = await updateEncounter({
      id: ready.id,
      body: { ...ready.payload, chiefComplaint: text }
    }).unwrap();
    rememberEncounter(updated);
    return true;
  };

  const savePhysicalExam = async (text: string) => {
    const ready = requireEncounter();
    if (!ready) {
      return false;
    }
    const updated = await updateEncounter({
      id: ready.id,
      body: { ...ready.payload, physicalExaminationSummery: text }
    }).unwrap();
    rememberEncounter(updated);
    return true;
  };

  const saveHistory = async (text: string) => {
    const id = visit?.id ?? encounter?.id;
    if (!id) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return false;
    }
    const updated = await updateHistoryOfPresentIllness({
      id,
      historyOfPresentIllness: text
    }).unwrap();
    rememberEncounter(updated);
    return true;
  };

  const saveAssessmentPlan = async (text: string) => {
    const current = visit ?? encounter;
    const encId = Number(current?.id);
    const ownerId = Number(current?.patientId ?? current?.patient?.id ?? patientId);
    if (!encId || !ownerId) {
      dispatch(notify({ msg: 'Patient id and encounter id are required.', sev: 'warning' }));
      return false;
    }

    const note = draft?.soap_note;
    const originalAssessment = note?.Assessments?.trim() || '';
    const originalPlan = note?.TreatmentPlans?.trim() || '';
    const original = [originalAssessment, originalPlan].filter(Boolean).join('\n\n');
    let assessment = originalAssessment;
    let treatmentPlan = originalPlan;
    if (text !== original) {
      const parts = text.split(/\n\n+/);
      assessment = parts[0]?.trim() || '';
      treatmentPlan = parts.slice(1).join('\n\n').trim();
      if (!treatmentPlan) {
        treatmentPlan = assessment;
      }
    }
    if (!assessment && !treatmentPlan) {
      dispatch(notify({ msg: 'Assessment and plan cannot be empty.', sev: 'warning' }));
      return false;
    }

    if (assessment) {
      const body = {
        id: latestAssessment?.id,
        patientId: ownerId,
        encounterId: encId,
        assessment
      };
      if (latestAssessment?.id) {
        await updateEncounterAssessment({ id: latestAssessment.id, data: body as any }).unwrap();
      } else {
        await createEncounterAssessment(body as any).unwrap();
      }
    }

    if (treatmentPlan) {
      const body = {
        id: latestPlan?.id,
        patientId: ownerId,
        encounterId: encId,
        goals: latestPlan?.goals ?? '',
        treatmentPlan
      };
      if (latestPlan?.id) {
        await updateEncounterPlan({ id: latestPlan.id, data: body as any }).unwrap();
      } else {
        await createEncounterPlan(body as any).unwrap();
      }
    }
    return true;
  };

  const missingObservationFields = (labels: string[]) => {
    dispatch(
      notify({
        msg: `Please fix the following fields:\n${labels.map(label => `• ${label}: must not be empty`).join('\n')}`,
        sev: 'warning'
      })
    );
  };

  const saveVitalSigns = async (text: string) => {
    const ids = visitIds();
    if (!ids) return false;
    const values = parseObservation('vital_signs', text);
    const missing = [
      ['bloodPressureSystolic', 'Blood Pressure Systolic'],
      ['bloodPressureDiastolic', 'Blood Pressure Diastolic'],
      ['heartRate', 'Heart Rate'],
      ['temperature', 'Temperature'],
      ['oxygenSaturation', 'Oxygen Saturation'],
      ['respiratoryRate', 'Respiratory Rate']
    ].filter(([key]) => values[key] == null);
    if (missing.length) {
      missingObservationFields(missing.map(([, label]) => label));
      return false;
    }
    await createVitalSigns({
      patientId: ids.patient,
      encounterId: ids.encId,
      bloodPressureSystolic: values.bloodPressureSystolic,
      bloodPressureDiastolic: values.bloodPressureDiastolic,
      measurementSite: values.measurementSite ?? null,
      heartRate: values.heartRate,
      temperature: values.temperature,
      oxygenSaturation: values.oxygenSaturation,
      respiratoryRate: values.respiratoryRate,
      fastingBloodGlucose: values.fastingBloodGlucose ?? null,
      fluidStatus: values.fluidStatus ?? null,
      edema: values.edema ?? null,
      urineOutput: values.urineOutput ?? null,
      isTriage: false,
      isActive: true,
      notes: values.notes ?? null
    }).unwrap();
    return true;
  };

  const saveBodyMeasurements = async (text: string) => {
    const ids = visitIds();
    if (!ids) return false;
    const values = parseObservation('body_measurements', text);
    const missing = [
      ['weight', 'Weight'],
      ['height', 'Height']
    ].filter(([key]) => values[key] == null);
    if (missing.length) {
      missingObservationFields(missing.map(([, label]) => label));
      return false;
    }
    await createBodyMeasurements({
      patientId: ids.patient,
      encounterId: ids.encId,
      weight: values.weight,
      height: values.height,
      headCircumference: values.headCircumference ?? null,
      isActive: true
    }).unwrap();
    return true;
  };

  const savePainAssessment = async (text: string) => {
    const ids = visitIds();
    if (!ids) return false;
    const values = parseObservation('pain_assessment', text);
    if (!values.painDegree) {
      missingObservationFields(['Pain Degree']);
      return false;
    }
    const assessmentType = values.painAssessmentType || 'NUMERIC';
    const flacc = String(assessmentType).toUpperCase() === 'FLACC';
    await createPainAssessment({
      patientId: ids.patient,
      encounterId: ids.encId,
      painDegree: String(values.painDegree),
      painDescription: flacc ? null : values.painDescription ?? null,
      painPattern: flacc ? null : values.painPattern ?? null,
      painLevel: painLevelValue(values.painLevel),
      painAssessmentType: assessmentType,
      isActive: true
    } as any).unwrap();
    return true;
  };

  const saveNursingAssessment = async (text: string) => {
    const ids = visitIds();
    if (!ids) return false;
    const values = parseObservation('nursing_assessment', text);
    const priority = values.priorityLevel || ids.current?.priorityLevel;
    const missing: string[] = [];
    if (!String(values.reasonOfVisit || '').trim()) missing.push('Reason Of Visit');
    if (!priority) missing.push('Priority');
    if (missing.length) {
      missingObservationFields(missing);
      return false;
    }
    const byPatient = values.byPatient !== false;
    await createNursingAssessment({
      patientId: ids.patient,
      encounterId: ids.encId,
      reasonOfVisit: values.reasonOfVisit,
      modeOfArrival: values.modeOfArrival ?? null,
      byPatient,
      sourceOfInformation: byPatient ? null : values.sourceOfInformation ?? null,
      functionalStatus: values.functionalStatus ?? null,
      patientConditions: values.patientConditions ?? null,
      cognitiveCheck: values.cognitiveCheck ?? null,
      bloodGroup: values.bloodGroup ?? null,
      isPregnant: values.isPregnant ?? null,
      isLactating: values.isLactating ?? null,
      isActive: true
    } as any).unwrap();
    if (values.priorityLevel && values.priorityLevel !== ids.current?.priorityLevel) {
      const updated = await updateEncounter({
        id: ids.encId,
        body: { ...toEncounterPayload(ids.current), priorityLevel: values.priorityLevel }
      }).unwrap();
      rememberEncounter(updated);
    }
    return true;
  };

  const acceptSection = async (key: ReviewKey) => {
    if (locked) {
      return;
    }
    const text = texts[key].trim();
    if (!text) {
      dispatch(notify({ msg: 'This section cannot be empty.', sev: 'warning' }));
      return;
    }
    setSavingKey(key);
    try {
      const saved =
        key === 'chief_complaint'
          ? await saveChiefComplaint(text)
          : key === 'hpi'
            ? await saveHistory(text)
            : key === 'physical_exam'
              ? await savePhysicalExam(text)
              : key === 'vital_signs'
                ? await saveVitalSigns(text)
                : key === 'body_measurements'
                  ? await saveBodyMeasurements(text)
                  : key === 'pain_assessment'
                    ? await savePainAssessment(text)
                    : key === 'nursing_assessment'
                      ? await saveNursingAssessment(text)
                      : await saveAssessmentPlan(text);
      if (!saved) {
        return;
      }
      setStatus(key, 'accepted');
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'Save failed', sev: 'error' }));
    } finally {
      setSavingKey(null);
    }
  };

  const setStatus = (key: ReviewKey, status: ReviewStatus) => {
    if (locked) {
      return;
    }
    setStatuses(current => ({ ...current, [key]: status }));
    setEditing(null);
  };

  const openRegenerate = (key: ReviewKey) => {
    if (locked) return;
    setRegenerateSection(key);
    setRegenerateForm({
      instruction: '',
      noteLanguage: regenerateDefaults?.noteLanguage || '',
      instructionLanguage: regenerateDefaults?.instructionLanguage || '',
      specialty: regenerateDefaults?.specialty || '',
      noteLength: regenerateDefaults?.noteLength || '',
      noteForm: regenerateDefaults?.noteForm || '',
      suggestIcd10: regenerateDefaults?.suggestIcd10 !== false,
      suggestOrders: regenerateDefaults?.suggestOrders !== false
    });
  };

  const runRegenerate = async () => {
    if (!regenerateSection || locked) return;
    const instruction = regenerateForm.instruction.trim();
    if (!instruction) {
      dispatch(notify({ msg: 'Describe the change for this section.', sev: 'warning' }));
      return;
    }
    if (!draft?.transcript?.length) {
      dispatch(notify({ msg: 'This draft has no transcript to regenerate from.', sev: 'warning' }));
      return;
    }
    try {
      const response = await regenerateAmbientSection({
        transcript: draft.transcript,
        section: REGENERATE_SECTION[regenerateSection],
        instruction,
        noteLanguage: regenerateForm.noteLanguage,
        instructionLanguage: regenerateForm.instructionLanguage,
        specialty: regenerateForm.specialty,
        noteLength: regenerateForm.noteLength,
        noteForm: regenerateForm.noteForm,
        patientContext: regenerateDefaults?.patientContext,
        suggestIcd10: regenerateForm.suggestIcd10,
        suggestOrders: regenerateForm.suggestOrders
      }).unwrap();
      const text = regeneratedSectionText(regenerateSection, draft, response);
      if (!text) {
        dispatch(notify({ msg: 'Regenerate did not return section text.', sev: 'warning' }));
        return;
      }
      const sectionKey = regenerateSection;
      setTexts(current => ({ ...current, [sectionKey]: text }));
      setEditing(current => (current === sectionKey ? null : current));
      setRegenerateSection(null);
      dispatch(notify({ msg: 'Section regenerated.', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'The section could not be regenerated.', sev: 'error' }));
    }
  };

  const visitIds = () => {
    const current = visit ?? encounter;
    const patient = Number(current?.patientId ?? current?.patient?.id ?? patientId);
    const encId = Number(current?.id);
    const facilityId = Number(current?.facilityId);
    const departmentId = Number(current?.departmentId);
    if (!patient || !encId) {
      dispatch(notify({ msg: 'Patient id and encounter id are required.', sev: 'warning' }));
      return null;
    }
    return { current, patient, encId, facilityId, departmentId };
  };

  const createDiagnostic = async (order: AmbientOrder, radiology: boolean) => {
    const ids = visitIds();
    if (!ids) {
      return false;
    }
    const payload = order.payload ?? {};
    const created = await createDiagnosticOrder({
      patientId: ids.patient,
      encounterId: ids.encId,
      labStatus: DiagnosticStatus.NEW,
      radStatus: DiagnosticStatus.NEW,
      fromDepartmentId: ids.departmentId || undefined,
      fromFacilityId: ids.facilityId || undefined,
      isUrgent: Boolean(payload.urgent || payload.isUrgent)
    }).unwrap();

    const givenId = Number(payload.testId ?? payload.test_id ?? payload.diagnosticTestId);
    let testId = Number.isFinite(givenId) && givenId > 0 ? givenId : 0;
    const testName = String(payload.name || payload.test || payload.description || '').trim();
    if (!testId && testName) {
      const found = await findDiagnosticTests({
        type: radiology ? 'RADIOLOGY' : 'LABORATORY',
        page: 0,
        size: 20,
        sort: 'id,asc',
        name: testName
      }).unwrap();
      const rows = found?.data ?? [];
      const match =
        rows.find((row: any) =>
          String(row.name || row.shortName || row.testName || '')
            .trim()
            .toLowerCase() === testName.toLowerCase()
        ) ?? rows[0];
      testId = Number(match?.id) || 0;
    }

    if (testId && created?.id) {
      await createDiagnosticOrderTest({
        orderId: Number(created.id),
        testId,
        orderType: radiology ? TestType.RAD : TestType.LAB,
        notes: payload.notes || orderSummary(order),
        reason: payload.reason || undefined
      }).unwrap();
    }
    return true;
  };

  const createMedicationOrder = async (order: AmbientOrder) => {
    const ids = visitIds();
    if (!ids) {
      return false;
    }
    if (!ids.facilityId || !ids.departmentId) {
      dispatch(notify({ msg: 'Facility and department are required to create a prescription.', sev: 'warning' }));
      return false;
    }
    const payload = order.payload ?? {};
    const header = await createOrGetPrescription({
      patientId: ids.patient,
      encounterId: ids.encId,
      fromFacilityId: ids.facilityId,
      fromDepartmentId: ids.departmentId,
      urgencyLevel: 'NORMAL'
    } as any).unwrap();
    const name = String(payload.name || payload.medication || orderSummary(order) || '').trim();
    const numeric = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    await createPrescriptionMedication({
      prescriptionHeaderId: header.id,
      medicationsId: payload.medicationsId ?? payload.medicationId ?? null,
      pharmaceuticalId: payload.pharmaceuticalId ?? payload.medicationsId ?? payload.medicationId ?? null,
      activeIngredientId: payload.activeIngredientId ?? null,
      otherMedicationName: payload.otherMedicationName ?? (payload.activeIngredientId ? null : name || null),
      instructionsType: payload.instructionsType || 'MANUAL',
      instructions:
        payload.instructions ??
        ([payload.dose || payload.dosage, payload.frequency, payload.duration].filter(Boolean).join(' ') || null),
      dose: numeric(payload.dose),
      doesUnit: payload.doesUnit ?? null,
      rout: payload.rout ?? null,
      frequency: payload.frequency ?? null,
      duration: numeric(payload.duration),
      durationType: payload.durationType ?? null,
      chronicMedication: Boolean(payload.chronicMedication),
      indicationIcd: payload.indicationIcd ?? payload.icd10 ?? null,
      indicationUse: payload.indicationUse ?? payload.indication ?? null,
      notes: payload.notes ?? orderSummary(order)
    } as any).unwrap();
    return true;
  };

  const createFollowUp = async (order: AmbientOrder) => {
    const ids = visitIds();
    if (!ids) {
      return false;
    }
    if (!ids.facilityId || !ids.departmentId) {
      dispatch(notify({ msg: 'Facility and department are required to create a follow-up.', sev: 'warning' }));
      return false;
    }
    const payload = order.payload ?? {};
    const days = Number(payload.interval_days ?? payload.intervalDays ?? 0);
    const preferred = payload.preferredDate || payload.date ? new Date(payload.preferredDate || payload.date) : new Date();
    if (!payload.preferredDate && !payload.date && Number.isFinite(days) && days > 0) {
      preferred.setDate(preferred.getDate() + days);
    }
    await createAppointmentRequest({
      patientId: ids.patient,
      facilityId: ids.facilityId,
      departmentId: ids.departmentId,
      sourceEncounterId: ids.encId,
      priority: payload.priority || 'NORMAL',
      reason: payload.reason || 'Follow-up',
      note: payload.note || orderSummary(order) || null,
      preferredDate: Number.isNaN(preferred.getTime()) ? null : preferred.toISOString().slice(0, 10)
    }).unwrap();
    return true;
  };

  const resolveCatalogDiagnosisId = async (diagnosis: AmbientDiagnosis) => {
    const existing = Number((diagnosis as AmbientDiagnosis & { diagnosisId?: number }).diagnosisId);
    if (existing) {
      return existing;
    }
    const keyword = (diagnosis.icd10 || diagnosis.label || '').trim();
    if (!keyword) {
      return 0;
    }
    const found = await searchIcdDiagnoses({ keyword, page: 0, size: 10 }).unwrap();
    const code = (diagnosis.icd10 || '').replace(/\./g, '').toLowerCase();
    const match =
      (found?.data ?? []).find(row => (row.icdCode || '').replace(/\./g, '').toLowerCase() === code) ??
      found?.data?.[0];
    return Number(match?.id) || 0;
  };

  const addDiagnosis = async (diagnosis: AmbientDiagnosis) => {
    if (locked || addedDiagnoses[diagnosis.id]) {
      return;
    }
    const ids = visitIds();
    if (!ids) {
      return;
    }
    setAddingDiagnosisId(diagnosis.id);
    try {
      const diagnosisId = await resolveCatalogDiagnosisId(diagnosis);
      if (!diagnosisId) {
        dispatch(notify({ msg: 'This diagnosis was not found in the ICD catalog.', sev: 'warning' }));
        return;
      }
      await createPatientDiagnosis({
        patientId: ids.patient,
        encounterId: ids.encId,
        diagnosisId,
        type: diagnosisTypeFromRank(diagnosis.rank) ?? 'SECONDARY',
        suspected: Boolean(diagnosis.suspected),
        major: Boolean(diagnosis.chronic)
      } as any).unwrap();
      setAddedDiagnoses(current => ({ ...current, [diagnosis.id]: true }));
      dispatch(notify({ msg: 'Diagnosis saved on this visit.', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'The diagnosis could not be saved.', sev: 'error' }));
    } finally {
      setAddingDiagnosisId(null);
    }
  };

  const openDiagnosisEdit = async (diagnosis: AmbientDiagnosis) => {
    if (locked || addedDiagnoses[diagnosis.id]) {
      return;
    }
    const suggested = [diagnosis.icd10, diagnosis.label].filter(Boolean).join(' — ');
    setDiagnosisEdit({
      suggestionId: diagnosis.id,
      suggested,
      diagnosisId: null,
      type: diagnosisTypeFromRank(diagnosis.rank),
      suspected: Boolean(diagnosis.suspected),
      major: Boolean(diagnosis.chronic)
    });
    try {
      const diagnosisId = await resolveCatalogDiagnosisId(diagnosis);
      if (!diagnosisId) {
        return;
      }
      setDiagnosisEdit(current =>
        current?.suggestionId === diagnosis.id ? { ...current, diagnosisId } : current
      );
    } catch {
      // The catalog search stays available when the suggestion cannot be matched.
    }
  };

  const saveEditedDiagnosis = async () => {
    if (!diagnosisEdit || locked || addedDiagnoses[diagnosisEdit.suggestionId]) {
      return;
    }
    const ids = visitIds();
    if (!ids) {
      return;
    }
    if (!diagnosisEdit.diagnosisId) {
      dispatch(notify({ msg: 'Diagnosis is required.', sev: 'warning' }));
      return;
    }
    if (!diagnosisEdit.type) {
      dispatch(notify({ msg: 'Type is required.', sev: 'warning' }));
      return;
    }
    setAddingDiagnosisId(diagnosisEdit.suggestionId);
    try {
      await createPatientDiagnosis({
        patientId: ids.patient,
        encounterId: ids.encId,
        diagnosisId: diagnosisEdit.diagnosisId,
        type: diagnosisEdit.type,
        suspected: Boolean(diagnosisEdit.suspected),
        major: Boolean(diagnosisEdit.major)
      } as any).unwrap();
      setAddedDiagnoses(current => ({ ...current, [diagnosisEdit.suggestionId]: true }));
      setDiagnosisEdit(null);
      dispatch(notify({ msg: 'Diagnosis saved on this visit.', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'The diagnosis could not be saved.', sev: 'error' }));
    } finally {
      setAddingDiagnosisId(null);
    }
  };

  const acceptOrder = async (order: AmbientOrder) => {
    if (locked || acceptedOrders[order.id]) {
      return false;
    }
    const kind = ambientOrderKind(order.kind);
    setAcceptingOrderId(order.id);
    try {
      const created =
        kind === 'lab'
          ? await createDiagnostic(order, false)
          : kind === 'radiology'
            ? await createDiagnostic(order, true)
            : kind === 'medication'
              ? await createMedicationOrder(order)
              : kind === 'follow_up'
                ? await createFollowUp(order)
                : null;
      if (created === null) {
        dispatch(
          notify({
            msg: 'This order type cannot be created from the draft.',
            sev: 'warning'
          })
        );
        return false;
      }
      if (!created) {
        return false;
      }
      setAcceptedOrders(current => ({ ...current, [order.id]: true }));
      dispatch(notify({ msg: 'Order created.', sev: 'success' }));
      return true;
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'The order could not be created.', sev: 'error' }));
      return false;
    } finally {
      setAcceptingOrderId(null);
    }
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
      if (signed) {
        setSignedLock(true);
      } else {
        setOpen(false);
      }
      dispatch(
        notify({
          msg: signed
            ? 'Signed. This draft can no longer be changed.'
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
    <>
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
          <div className={`ambient-draft${locked ? ' is-locked' : ''}`}>
            {locked && (
              <div className="ambient-draft-banner">Signed. This draft can no longer be changed.</div>
            )}
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
                        isObservationKey(section.key) ? (
                          <div className="ambient-draft-observation-form">
                            <Form fluid>
                            {(() => {
                              const observationKey = section.key;
                              const fromText = parseObservation(observationKey, texts[observationKey]);
                              const prefill = {
                                ...(draft ? readObservation(draft, observationKey) : {}),
                                ...fromText
                              };
                              if (observationKey === 'pain_assessment' && prefill.painLevel != null) {
                                prefill.painLevel = painLevelValue(prefill.painLevel);
                              }
                              const formPatientId = Number(
                                visit?.patientId ?? encounter?.patientId ?? encounter?.patient?.id ?? patientId
                              );
                              const formEncounterId = Number(visit?.id ?? encounter?.id);
                              const markSaved = (saved?: Record<string, any>) => {
                                const summary = formatObservation(observationKey, { ...prefill, ...(saved ?? {}) });
                                if (summary) {
                                  setTexts(current => ({ ...current, [observationKey]: summary }));
                                }
                                setStatus(observationKey, 'accepted');
                              };
                              if (observationKey === 'vital_signs') {
                                return (
                                  <VitalSigns
                                    patientId={formPatientId}
                                    encounterId={formEncounterId}
                                    encounter={visit ?? encounter}
                                    prefill={prefill}
                                    onSaved={markSaved}
                                    width="100%"
                                  />
                                );
                              }
                              if (observationKey === 'body_measurements') {
                                return (
                                  <BodyMeasurements
                                    patientId={formPatientId}
                                    encounterId={formEncounterId}
                                    encounter={visit ?? encounter}
                                    prefill={prefill}
                                    onSaved={markSaved}
                                    width="100%"
                                  />
                                );
                              }
                              if (observationKey === 'pain_assessment') {
                                return (
                                  <PainAssessmentForm
                                    patientId={formPatientId}
                                    encounterId={formEncounterId}
                                    encounter={visit ?? encounter}
                                    prefill={prefill}
                                    onSaved={markSaved}
                                    width="100%"
                                  />
                                );
                              }
                              return (
                                <PatientObservationsComplaints
                                  patientId={formPatientId}
                                  encounterId={formEncounterId}
                                  encounter={{
                                    ...(visit ?? encounter),
                                    priorityLevel: prefill.priorityLevel || (visit ?? encounter)?.priorityLevel
                                  }}
                                  setEncounter={next => {
                                    setVisit(next);
                                    onEncounterSaved?.(next);
                                  }}
                                  prefill={prefill}
                                  onSaved={markSaved}
                                  width="100%"
                                />
                              );
                            })()}
                            </Form>
                          </div>
                        ) : (
                        <textarea
                          className="ambient-draft-editor"
                          value={editValue}
                          readOnly={locked}
                          onChange={event => setEditValue(event.target.value)}
                        />
                        )
                      ) : (
                        <p className="ambient-draft-copy">{texts[section.key] || 'No text returned for this section.'}</p>
                      )}

                      <div className="ambient-draft-card-foot">
                        <span className="ambient-draft-evidence">
                          {evidence ? `Evidence: ${evidence}` : 'Evidence: —'}
                        </span>
                        <div className="ambient-draft-card-actions">
                          {editing === section.key ? (
                            isObservationKey(section.key) ? (
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                disabled={locked}
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </MyButton>
                            ) : (
                            <>
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                disabled={locked}
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </MyButton>
                              <MyButton
                                backgroundColor="var(--primary-blue)"
                                disabled={locked}
                                onClick={() => {
                                  setTexts(current => ({ ...current, [section.key]: editValue.trim() }));
                                  setEditing(null);
                                }}
                              >
                                Save edit
                              </MyButton>
                            </>
                            )
                          ) : (
                            <>
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                loading={regenerating && regenerateSection === section.key}
                                disabled={locked || status === 'accepted' || status === 'rejected' || regenerating}
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => openRegenerate(section.key)}
                              >
                                Regenerate
                              </MyButton>
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                disabled={locked || status === 'accepted' || status === 'rejected'}
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
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
                                  color="var(--primary-blue)"
                                  disabled={locked}
                                  style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                  onClick={() => setStatus(section.key, 'rejected')}
                                >
                                  Reject
                                </MyButton>
                              )}
                              {status === 'accepted' ? (
                                <MyButton
                                  backgroundColor="var(--primary-blue)"
                                  disabled={locked}
                                  onClick={() => setStatus(section.key, 'pending')}
                                >
                                  Undo accept
                                </MyButton>
                              ) : status === 'rejected' ? (
                                <MyButton
                                  backgroundColor="var(--primary-blue)"
                                  disabled={locked}
                                  onClick={() => setStatus(section.key, 'pending')}
                                >
                                  Undo reject
                                </MyButton>
                              ) : (
                                <MyButton
                                  backgroundColor="var(--primary-blue)"
                                  loading={savingKey === section.key}
                                  disabled={locked || savingKey !== null}
                                  onClick={() => {
                                    void acceptSection(section.key);
                                  }}
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
                            <div className="ambient-draft-diagnosis-actions">
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                loading={addingDiagnosisId === diagnosis.id && !diagnosisEdit}
                                disabled={
                                  locked ||
                                  addedDiagnoses[diagnosis.id] ||
                                  addingDiagnosisId !== null ||
                                  Boolean(diagnosisEdit)
                                }
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => {
                                  void addDiagnosis(diagnosis);
                                }}
                              >
                                {addedDiagnoses[diagnosis.id] ? 'Added' : 'Add to visit'}
                              </MyButton>
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                disabled={
                                  locked ||
                                  addedDiagnoses[diagnosis.id] ||
                                  addingDiagnosisId !== null ||
                                  Boolean(diagnosisEdit)
                                }
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => {
                                  void openDiagnosisEdit(diagnosis);
                                }}
                              >
                                Edit
                              </MyButton>
                            </div>
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
                          <div className="ambient-draft-order-actions">
                            <MyButton
                              backgroundColor="var(--primary-blue)"
                              loading={acceptingOrderId === order.id && !orderEdit}
                              disabled={
                                locked ||
                                acceptedOrders[order.id] ||
                                acceptingOrderId !== null ||
                                Boolean(orderEdit)
                              }
                              onClick={() => {
                                void acceptOrder(order);
                              }}
                            >
                              {acceptedOrders[order.id] ? 'Accepted' : orderAction(order)}
                            </MyButton>
                            {ambientOrderKind(order.kind) !== 'other' && (
                              <MyButton
                                appearance="ghost"
                                color="var(--primary-blue)"
                                disabled={
                                  locked ||
                                  acceptedOrders[order.id] ||
                                  acceptingOrderId !== null ||
                                  Boolean(orderEdit)
                                }
                                style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                                onClick={() => setOrderEdit(order)}
                              >
                                Edit
                              </MyButton>
                            )}
                          </div>
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
                      <SoonButton>Print</SoonButton>
                      <SoonButton>Send by WhatsApp</SoonButton>
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
                    color="var(--primary-blue)"
                    style={{ border: '1px solid var(--primary-blue)', background: 'transparent', width: '100%' }}
                    prefixIcon={() => <FontAwesomeIcon icon={faPlay} />}
                    disabled={locked}
                    onClick={() => playRange(playSpan.start, playSpan.end)}
                  >
                    Play {formatClock(playSpan.start)}–{formatClock(playSpan.end)}
                  </MyButton>
                )}
              </aside>
            </div>

            <div className="ambient-draft-footer">
              <p>
                Review all {REVIEW_SECTIONS.length} sections to sign. Accepted sections stay on this draft; rejected ones are left blank.
              </p>
              <div>
                <MyButton
                  appearance="ghost"
                  color="var(--primary-blue)"
                  loading={saving}
                  disabled={locked || saving || !draft}
                  style={{ border: '1px solid var(--primary-blue)', background: 'transparent' }}
                  onClick={() => {
                    void persist(false);
                  }}
                >
                  Save
                </MyButton>
                <MyButton
                  backgroundColor="var(--primary-blue)"
                  loading={saving}
                  disabled={locked || saving || reviewedCount < REVIEW_SECTIONS.length}
                  onClick={() => {
                    void persist(true);
                  }}
                >
                  Sign
                </MyButton>
              </div>
            </div>
          </div>
        ) : null
      }
    />
    <MyModal
      open={Boolean(diagnosisEdit)}
      setOpen={next => {
        if (!next) {
          setDiagnosisEdit(null);
        }
      }}
      title="Edit diagnosis"
      size="640px"
      bodyheight="auto"
      enforceFocus={false}
      customClassName="ambient-diagnosis-edit-modal"
      actionButtonLabel="Save"
      actionButtonLoading={Boolean(diagnosisEdit && addingDiagnosisId === diagnosisEdit.suggestionId)}
      isDisabledActionBtn={locked || !diagnosisEdit?.diagnosisId || !diagnosisEdit?.type}
      actionButtonFunction={saveEditedDiagnosis}
      content={
        diagnosisEdit ? (
          <Form fluid className="ambient-diagnosis-edit">
            {diagnosisEdit.suggested && (
              <p className="ambient-draft-copy">Suggested: {diagnosisEdit.suggested}</p>
            )}
            <Icd10DiagnosisSearch
              diagnosisId={diagnosisEdit.diagnosisId}
              setDiagnosisId={(id: number | null) =>
                setDiagnosisEdit(current => (current ? { ...current, diagnosisId: id } : current))
              }
              label=""
              disabled={locked}
            />
            <div className="ambient-diagnosis-edit-fields">
              <MyInput
                width="220px"
                required
                fieldType="select"
                selectData={diagnosisTypeOptions ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="type"
                record={diagnosisEdit}
                setRecord={setDiagnosisEdit}
                fieldLabel="Type"
                disabled={locked}
              />
              <MyInput
                width="100%"
                fieldLabel="Suspected"
                fieldType="checkbox"
                fieldName="suspected"
                record={diagnosisEdit}
                setRecord={setDiagnosisEdit}
                disabled={locked}
              />
              <MyInput
                width="100%"
                fieldLabel="Chronic"
                fieldType="checkbox"
                fieldName="major"
                record={diagnosisEdit}
                setRecord={setDiagnosisEdit}
                disabled={locked}
              />
            </div>
          </Form>
        ) : null
      }
    />
    <MyModal
      open={Boolean(regenerateSection)}
      setOpen={next => {
        if (!next && !regenerating) setRegenerateSection(null);
      }}
      title={`Regenerate ${REVIEW_SECTIONS.find(section => section.key === regenerateSection)?.title || 'section'}`}
      size="720px"
      bodyheight="auto"
      enforceFocus={false}
      customClassName="ambient-diagnosis-edit-modal"
      actionButtonLabel="Regenerate"
      actionButtonLoading={regenerating}
      isDisabledActionBtn={locked || regenerating || !regenerateForm.instruction.trim()}
      actionButtonFunction={runRegenerate}
      content={
        regenerateSection ? (
          <Form fluid className="ambient-order-edit">
            <p className="ambient-draft-copy">Current section</p>
            <textarea className="ambient-draft-editor" readOnly value={texts[regenerateSection] || ''} />
            <div className="ambient-order-edit-fields">
              <MyInput
                width="100%"
                required
                fieldType="textarea"
                fieldLabel="Modification"
                fieldName="instruction"
                record={regenerateForm}
                setRecord={setRegenerateForm}
              />
              <MyInput
                width="220px"
                fieldType="select"
                fieldLabel="Note language"
                selectData={noteLanguages ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="noteLanguage"
                record={regenerateForm}
                setRecord={setRegenerateForm}
                searchable={false}
                cleanable={false}
              />
              <MyInput
                width="220px"
                fieldType="select"
                fieldLabel="Patient instructions"
                selectData={instructionLanguages ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="instructionLanguage"
                record={regenerateForm}
                setRecord={setRegenerateForm}
                searchable={false}
                cleanable={false}
              />
              <MyInput
                width="220px"
                fieldType="select"
                fieldLabel="Note length"
                selectData={noteStyles ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="noteLength"
                record={regenerateForm}
                setRecord={setRegenerateForm}
                searchable={false}
                cleanable={false}
              />
              <MyInput
                width="220px"
                fieldType="select"
                fieldLabel="Specialty"
                selectData={specialties ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="specialty"
                record={regenerateForm}
                setRecord={setRegenerateForm}
                searchable={false}
                cleanable={false}
              />
              <MyInput
                width="220px"
                fieldType="select"
                fieldLabel="Note form"
                selectData={noteForms ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                fieldName="noteForm"
                record={regenerateForm}
                setRecord={setRegenerateForm}
                searchable={false}
                cleanable={false}
              />
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldLabel="Suggest ICD-10 diagnoses"
                fieldName="suggestIcd10"
                record={regenerateForm}
                setRecord={setRegenerateForm}
              />
              <MyInput
                width="100%"
                fieldType="checkbox"
                fieldLabel="Suggest orders"
                fieldName="suggestOrders"
                record={regenerateForm}
                setRecord={setRegenerateForm}
              />
            </div>
          </Form>
        ) : null
      }
    />
    <AmbientOrderEditModal
      order={orderEdit}
      open={Boolean(orderEdit)}
      locked={locked}
      saving={Boolean(orderEdit && acceptingOrderId === orderEdit.id)}
      patientId={patientId}
      onClose={() => setOrderEdit(null)}
      onAccept={async edited => {
        const saved = await acceptOrder(edited);
        if (saved) setOrderEdit(null);
        return saved;
      }}
    />
    </>
  );
};

export default AmbientDraftModal;
