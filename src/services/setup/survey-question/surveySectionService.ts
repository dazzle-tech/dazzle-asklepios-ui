import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/query/react';

// No sort: the setup-service orders sections by their order, then the oldest first
type PagedParams = { page: number; size: number; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

/** A group of survey questions, shown as one step of the survey */
export interface SurveySection {
  id?: number;
  nameEn: string;
  nameAr: string;
  displayOrder: number | string | null;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export const newSurveySection: SurveySection = {
  id: undefined,
  nameEn: '',
  nameAr: '',
  displayOrder: '',
  isActive: true
};

const mapPaged = (response: SurveySection[], meta: any): PagedResult<SurveySection> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

type FilterParams = { page: number; size: number };

type SectionBody = { nameEn: string; nameAr: string; displayOrder: number };

export const surveySectionService = createApi({
  reducerPath: 'surveySectionApi',
  baseQuery: BaseQuery,
  tagTypes: ['SurveySection'],
  endpoints: builder => ({
    getAllSurveySections: builder.query<PagedResult<SurveySection>, PagedParams>({
      query: ({ page, size, timestamp }) => ({
        url: '/api/setup/survey-section',
        params: { page, size, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveySection']
    }),

    getSurveySectionsByStatus: builder.query<PagedResult<SurveySection>, FilterParams & { isActive: boolean | string }>({
      query: ({ isActive, ...params }) => ({
        url: `/api/setup/survey-section/by-status/${isActive}`,
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveySection']
    }),

    // Matches the English or the Arabic name
    getSurveySectionsByName: builder.query<PagedResult<SurveySection>, FilterParams & { name: string }>({
      query: params => ({
        url: '/api/setup/survey-section/by-name',
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['SurveySection']
    }),

    createSurveySection: builder.mutation<SurveySection, SectionBody>({
      query: body => ({
        url: '/api/setup/survey-section',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SurveySection']
    }),

    updateSurveySection: builder.mutation<SurveySection, { id: number } & SectionBody>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/survey-section/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SurveySection']
    }),

    toggleSurveySectionActive: builder.mutation<SurveySection, number>({
      query: id => ({
        url: `/api/setup/survey-section/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['SurveySection']
    })
  })
});

export const {
  useGetAllSurveySectionsQuery,
  useLazyGetSurveySectionsByStatusQuery,
  useLazyGetSurveySectionsByNameQuery,
  useCreateSurveySectionMutation,
  useUpdateSurveySectionMutation,
  useToggleSurveySectionActiveMutation
} = surveySectionService;
