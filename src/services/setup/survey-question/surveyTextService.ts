import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/query/react';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

/** A text of the survey page, found by textKey; {placeholders} are filled by the page */
export interface SurveyText {
  id?: number;
  textKey: string;
  textEn: string;
  textAr: string;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export const newSurveyText: SurveyText = {
  id: undefined,
  textKey: '',
  textEn: '',
  textAr: '',
  isActive: true
};

const mapPaged = (response: SurveyText[], meta: any): PagedResult<SurveyText> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

type FilterParams = { page: number; size: number; sort?: string };

export const surveyTextService = createApi({
  reducerPath: 'surveyTextApi',
  baseQuery: BaseQuery,
  tagTypes: ['SurveyText'],
  endpoints: builder => ({
    getAllSurveyTexts: builder.query<PagedResult<SurveyText>, PagedParams>({
      query: ({ page, size, sort = 'textKey,asc', timestamp }) => ({
        url: '/api/setup/survey-text',
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveyText']
    }),

    getSurveyTextsByStatus: builder.query<PagedResult<SurveyText>, FilterParams & { isActive: boolean | string }>({
      query: ({ isActive, ...params }) => ({
        url: `/api/setup/survey-text/by-status/${isActive}`,
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveyText']
    }),

    // Matches the key, the English text or the Arabic text
    getSurveyTextsByText: builder.query<PagedResult<SurveyText>, FilterParams & { text: string }>({
      query: params => ({
        url: '/api/setup/survey-text/by-text',
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveyText']
    }),

    createSurveyText: builder.mutation<SurveyText, { textKey: string; textEn: string; textAr: string }>({
      query: body => ({
        url: '/api/setup/survey-text',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SurveyText']
    }),

    // The key never changes: the survey page uses it
    updateSurveyText: builder.mutation<SurveyText, { id: number; textEn: string; textAr: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/survey-text/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SurveyText']
    }),

    toggleSurveyTextActive: builder.mutation<SurveyText, number>({
      query: id => ({
        url: `/api/setup/survey-text/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['SurveyText']
    })
  })
});

export const {
  useGetAllSurveyTextsQuery,
  useLazyGetSurveyTextsByStatusQuery,
  useLazyGetSurveyTextsByTextQuery,
  useCreateSurveyTextMutation,
  useUpdateSurveyTextMutation,
  useToggleSurveyTextActiveMutation
} = surveyTextService;
