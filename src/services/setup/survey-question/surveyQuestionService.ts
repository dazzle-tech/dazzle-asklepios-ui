import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/query/react';

/**
 * A patient satisfaction survey question. SCALE uses min/max value, TEXT has no limits.
 * Only the order and isRequired of a question can change after it is created.
 */
export interface SurveyQuestion {
  id?: number;
  sectionId?: number;
  displayOrder: number | string | null;
  questionEn: string;
  questionAr: string;
  answerType: string | null;
  minValue: number | string | null;
  maxValue: number | string | null;
  /** False when the patient may skip the question */
  isRequired: boolean;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export const newSurveyQuestion: SurveyQuestion = {
  id: undefined,
  displayOrder: '',
  questionEn: '',
  questionAr: '',
  answerType: 'SCALE',
  minValue: 1,
  maxValue: 5,
  isRequired: false,
  isActive: true
};

// A section holds a few questions, so they are listed in one page
const SECTION_QUESTIONS_PAGE_SIZE = 500;

type CreateBody = {
  sectionId: number;
  displayOrder: number;
  questionEn: string;
  questionAr: string;
  answerType: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
};

export const surveyQuestionService = createApi({
  reducerPath: 'surveyQuestionApi',
  baseQuery: BaseQuery,
  tagTypes: ['SurveyQuestion'],
  endpoints: builder => ({
    getSurveyQuestionsBySection: builder.query<SurveyQuestion[], number>({
      query: sectionId => ({
        url: `/api/setup/survey-question/by-section/${sectionId}`,
        // Ordered by the setup-service: by order, then the oldest first
        params: { page: 0, size: SECTION_QUESTIONS_PAGE_SIZE }
      }),
      providesTags: ['SurveyQuestion']
    }),

    createSurveyQuestion: builder.mutation<SurveyQuestion, CreateBody>({
      query: body => ({
        url: '/api/setup/survey-question',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SurveyQuestion']
    }),

    // Only the order and isRequired can change
    updateSurveyQuestion: builder.mutation<SurveyQuestion, { id: number; displayOrder: number; isRequired: boolean }>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/survey-question/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SurveyQuestion']
    }),

    toggleSurveyQuestionActive: builder.mutation<SurveyQuestion, number>({
      query: id => ({
        url: `/api/setup/survey-question/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['SurveyQuestion']
    })
  })
});

export const {
  useGetSurveyQuestionsBySectionQuery,
  useCreateSurveyQuestionMutation,
  useUpdateSurveyQuestionMutation,
  useToggleSurveyQuestionActiveMutation
} = surveyQuestionService;
