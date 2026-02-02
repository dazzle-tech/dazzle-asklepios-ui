import type { PainAssessment } from '@/types/model-types-new';
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';

type Id = number | string;

export type PainAssessmentCreateDTO = Omit<
  PainAssessment,
  'id' | 'createdDate' | 'lastModifiedDate'
>;

export type PainAssessmentUpdateDTO = PainAssessmentCreateDTO;

export const painAssessmentService = createApi({
  reducerPath: 'newPainAssessmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['PainAssessment'],
  endpoints: (builder) => ({
    createPainAssessment: builder.mutation<PainAssessment, PainAssessmentCreateDTO>({
      query: (body) => ({
        url: '/api/patient/pain-assessment',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PainAssessment']
    }),

    updatePainAssessment: builder.mutation<PainAssessment, { id: Id } & PainAssessmentUpdateDTO>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/pain-assessment/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PainAssessment']
    }),

    getLatestPainAssessmentByEncounterId: builder.query<PainAssessment | null, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/pain-assessment/latest/encounter/${encodeURIComponent(
          String(encounterId)
        )}`
      }),
      transformResponse: (response: any, meta) => {
        const status = (meta as any)?.response?.status;
        if (status === 204) return null;
        return response as PainAssessment;
      },
      providesTags: ['PainAssessment']
    })
  })
});

export const {
  useCreatePainAssessmentMutation,
  useUpdatePainAssessmentMutation,
  useGetLatestPainAssessmentByEncounterIdQuery,
  useLazyGetLatestPainAssessmentByEncounterIdQuery
} = painAssessmentService;
