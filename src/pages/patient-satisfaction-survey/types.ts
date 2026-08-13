import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type SurveyLanguage = 'en' | 'ar';

export type SurveyResponseStatus = 'IN_PROGRESS' | 'COMPLETED'|'ABANDONED';

export type SurveyQuestionType = 'choice' | 'rating' | 'agreement' | 'nps' | 'text' | 'checkbox';

export type SurveyQuestionOption = {
  value: string;
  labelEn: string;
  labelAr: string;
  score?: number;
  icon?: IconDefinition;

};

export type SurveyQuestion = {
  code: string;
  textEn: string;
  textAr: string;
  type: SurveyQuestionType;
  options?: SurveyQuestionOption[];
  optional?: boolean;
  maxLength?: number;
  showWhen?: {
    questionCode: string;
    values: string[];
  };
};

export type SurveySection = {
  id: string;
  titleEn: string;
  titleAr: string;
  questions: SurveyQuestion[];
};

export type SurveyAnswerValue = {
  questionCode: string;
  value: string;
  answer: string;
  score?: number | null;
};

export type PatientSatisfactionSurveyAnswerDTO = {
  questionCode: string;
  answer: string;
};

export type PatientSatisfactionSurveySubmitPayload = {
  patientName: string;
  answers: PatientSatisfactionSurveyAnswerDTO[];
};

export type PatientSatisfactionSurveyResponse = {
  id: number;
  patientName: string;
  status: SurveyResponseStatus;
  startedAt: string;
  completedAt?: string | null;
  overallScore?: number | null;
  overallPercentage?: number | null;
  createdDate: string;
};

export type PatientSatisfactionSurveyResponseAnswerVM = {
  id: number;
  questionCode: string;
  answer: string;
  score?: number | null;
};

export type PatientSatisfactionSurveyResponseVM = PatientSatisfactionSurveyResponse & {
  answers: PatientSatisfactionSurveyResponseAnswerVM[];
};

export type PatientSatisfactionSurveyPageableParams = {
  page: number;
  size: number;
  sort?: string;
};
