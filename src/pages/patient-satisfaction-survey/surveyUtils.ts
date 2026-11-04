import type { PatientSatisfactionSurveyAnswerDTO, SurveyAnswerValue } from './types';
import { getAllSurveyQuestions } from './surveyConfig';

export const calculateSurveyScores = (answers: Record<string, SurveyAnswerValue>) => {
  const normalizedScores = Object.values(answers)
    .map(item => {
      if (typeof item.score !== 'number') return null;
      if (item.questionCode === 'OVERALL_NPS') {
        return Number(((item.score / 10) * 5).toFixed(2));
      }
      return item.score;
    })
    .filter((score): score is number => score !== null);

  if (normalizedScores.length === 0) {
    return { overallScore: null, overallPercentage: null };
  }

  const total = normalizedScores.reduce((sum, score) => sum + score, 0);
  const overallScore = Number((total / normalizedScores.length).toFixed(2));
  const overallPercentage = Number(((overallScore / 5) * 100).toFixed(2));

  return { overallScore, overallPercentage };
};

export const buildSubmitAnswers = (
  answers: Record<string, SurveyAnswerValue>
): PatientSatisfactionSurveyAnswerDTO[] => {
  const configuredCodes = new Set(getAllSurveyQuestions().map(question => question.code));

  return Object.values(answers)
    .filter(answer => configuredCodes.has(answer.questionCode))
    .map(answer => ({
      questionCode: answer.questionCode,
      answer: answer.answer
    }));
};

export const formatSurveyDate = (value?: string | null) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-GB');
};

export const PATIENT_SATISFACTION_SURVEY_PATH = '/patient-satisfaction-survey';

export type PatientSatisfactionSurveyLinkParams = {
  origin?: string;
  patientName?: string;
  department?: string;
  facility?: string;
  visitDate?: string;
  anonymous?: boolean;
};

export const buildPatientSatisfactionSurveyUrl = ({
  origin,
  patientName,
  department,
  facility,
  visitDate,
  anonymous
}: PatientSatisfactionSurveyLinkParams) => {
  const baseOrigin =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : '');

  const search = new URLSearchParams();
  if (patientName) search.set('patientName', patientName);
  if (department) search.set('department', department);
  if (facility) search.set('facility', facility);
  if (visitDate) search.set('visitDate', visitDate);
  if (anonymous) search.set('anonymous', 'true');

  const query = search.toString();
  return `${baseOrigin}/#${PATIENT_SATISFACTION_SURVEY_PATH}${query ? `?${query}` : ''}`;
};
