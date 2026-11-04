import type { SurveyAnswerValue, SurveyQuestion, SurveySection } from './types';
import { SURVEY_SECTIONS } from './surveyConfig';

export const isQuestionVisible = (
  question: SurveyQuestion,
  answers: Record<string, SurveyAnswerValue>
) => {
  if (!question.showWhen) return true;

  const dependentAnswer = answers[question.showWhen.questionCode];
  return question.showWhen.values.includes(dependentAnswer?.value ?? '');
};

export const getVisibleQuestions = (
  section: SurveySection,
  answers: Record<string, SurveyAnswerValue>
) => section.questions.filter(question => isQuestionVisible(question, answers));

export const getVisibleQuestionIndex = (
  section: SurveySection,
  question: SurveyQuestion,
  answers: Record<string, SurveyAnswerValue>
) => {
  const visibleQuestions = getVisibleQuestions(section, answers);
  return Math.max(
    0,
    visibleQuestions.findIndex(item => item.code === question.code)
  );
};

export const findNextSurveyPosition = (
  sectionIndex: number,
  questionIndex: number,
  answers: Record<string, SurveyAnswerValue>
) => {
  for (let sectionIdx = sectionIndex; sectionIdx < SURVEY_SECTIONS.length; sectionIdx += 1) {
    const section = SURVEY_SECTIONS[sectionIdx];
    const visibleQuestions = getVisibleQuestions(section, answers);
    if (visibleQuestions.length === 0) continue;

    const startQuestionIdx =
      sectionIdx === sectionIndex
        ? section.questions.findIndex(
            question => question.code === section.questions[questionIndex]?.code
          ) + 1
        : 0;

    for (let rawIdx = Math.max(startQuestionIdx, 0); rawIdx < section.questions.length; rawIdx += 1) {
      const question = section.questions[rawIdx];
      if (!isQuestionVisible(question, answers)) continue;

      return { sectionIndex: sectionIdx, questionIndex: rawIdx };
    }
  }

  return null;
};

export const findPreviousSurveyPosition = (
  sectionIndex: number,
  questionIndex: number,
  answers: Record<string, SurveyAnswerValue>
) => {
  for (let sectionIdx = sectionIndex; sectionIdx >= 0; sectionIdx -= 1) {
    const section = SURVEY_SECTIONS[sectionIdx];
    const endRawIndex =
      sectionIdx === sectionIndex
        ? section.questions.findIndex(
            question => question.code === section.questions[questionIndex]?.code
          ) - 1
        : section.questions.length - 1;

    for (let rawIdx = endRawIndex; rawIdx >= 0; rawIdx -= 1) {
      const question = section.questions[rawIdx];
      if (!isQuestionVisible(question, answers)) continue;

      return { sectionIndex: sectionIdx, questionIndex: rawIdx };
    }
  }

  return null;
};

export const isLastVisibleQuestion = (
  sectionIndex: number,
  questionIndex: number,
  answers: Record<string, SurveyAnswerValue>
) => !findNextSurveyPosition(sectionIndex, questionIndex, answers);

export const isFirstVisibleQuestion = (
  sectionIndex: number,
  questionIndex: number,
  answers: Record<string, SurveyAnswerValue>
) => !findPreviousSurveyPosition(sectionIndex, questionIndex, answers);

export const isSectionCompleted = (
  sectionIndex: number,
  currentSectionIndex: number,
  answers: Record<string, SurveyAnswerValue>
) => {
  if (sectionIndex >= currentSectionIndex) return false;

  const section = SURVEY_SECTIONS[sectionIndex];
  const gateQuestion = section.questions.find(question => !question.showWhen);
  const gateAnswer = gateQuestion ? answers[gateQuestion.code] : undefined;

  if (gateQuestion && gateAnswer?.value === 'NO') {
    return true;
  }

  const visibleQuestions = getVisibleQuestions(section, answers);
  return visibleQuestions.every(question => {
    if (question.optional) return true;
    return Boolean(answers[question.code]);
  });
};

export const clearDependentAnswers = (
  section: SurveySection,
  gateQuestionCode: string,
  answers: Record<string, SurveyAnswerValue>
) => {
  const next = { ...answers };
  section.questions.forEach(question => {
    if (question.showWhen?.questionCode === gateQuestionCode) {
      delete next[question.code];
    }
  });
  return next;
};
