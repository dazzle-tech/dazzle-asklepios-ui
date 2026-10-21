export type AmbientTranscriptSegment = {
  id: string;
  speaker: string;
  lang?: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
  confidence?: number | string | null;
};

export type AmbientSentence = {
  sentence_id?: string;
  text: string;
  segment_ids?: string[];
  low_confidence?: boolean;
  part?: string | null;
};

export type AmbientDraftSection = {
  sentences?: AmbientSentence[];
};

export type AmbientDiagnosis = {
  id: string;
  icd10?: string | null;
  label: string;
  rank?: string | null;
  suspected?: boolean;
  chronic?: boolean;
  segment_ids?: string[];
};

export type AmbientOrder = {
  id: string;
  kind: string;
  payload?: Record<string, any> | null;
  segment_ids?: string[];
};

export type AmbientMention = {
  kind?: string;
  text: string;
  segment_ids?: string[];
  confirm_required?: boolean;
};

export type AmbientTranscriptionError = {
  heard: string;
  likely: string;
  segment_ids?: string[];
};

export type AmbientDraft = {
  transcript?: AmbientTranscriptSegment[];
  sections?: Record<string, AmbientDraftSection | null>;
  soap_note?: {
    ChiefComplaint?: string | null;
    HPI?: string | null;
    MedicalHistory?: string | null;
    Vitals?: string | null;
    PhysicalExamination?: string | null;
    Assessments?: string | null;
    TreatmentPlans?: string | null;
  } | null;
  diagnoses?: AmbientDiagnosis[];
  orders?: AmbientOrder[];
  mentions?: AmbientMention[];
  instructions?: {
    language?: string | null;
    text?: string | null;
    segment_ids?: string[];
  } | null;
  possible_transcription_errors?: AmbientTranscriptionError[];
  record_evidence?: Record<string, string[]>;
  elapsed_ms?: number;
  review?: {
    texts?: Partial<Record<ReviewKey, string>>;
    statuses?: Partial<Record<ReviewKey, ReviewStatus>>;
    addedDiagnoses?: Record<string, boolean>;
    acceptedOrders?: Record<string, boolean>;
    signed?: boolean;
  };
};

export type ReviewKey = 'chief_complaint' | 'hpi' | 'physical_exam' | 'assessment_plan';
export type ReviewStatus = 'pending' | 'accepted' | 'rejected';
