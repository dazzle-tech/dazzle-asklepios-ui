import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { GlasgowComaScaleAssessment } from '@/types/model-types-new';

type Id = number | string;

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
  showCancelled?: boolean;
};

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

type GlasgowComaScaleAssessmentCancelRequest = {
  id: Id;
  cancellationReason: string;
};

const mapPaged = (
  response: GlasgowComaScaleAssessment[],
  meta: any
): PagedResult<GlasgowComaScaleAssessment> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const glasgowComaScaleAssessmentService = createApi({
  reducerPath: 'glasgowComaScaleAssessmentService',
  baseQuery: BaseQuery,
  tagTypes: ['GlasgowComaScaleAssessment'],
  endpoints: builder => ({
    getGlasgowComaScaleAssessmentById: builder.query<
      GlasgowComaScaleAssessment,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/glasgow-coma-scale-assessment/${id}`
      }),
      providesTags: ['GlasgowComaScaleAssessment']
    }),

    getGlasgowComaScaleAssessmentsByEncounterId: builder.query<
      PagedResult<GlasgowComaScaleAssessment>,
      { encounterId: Id } & PagedParams
    >({
      query: ({
        encounterId,
        showCancelled = false,
        page,
        size,
        sort = 'id,desc'
      }) => ({
        url: showCancelled
          ? `/api/patient/glasgow-coma-scale-assessment/by-encounter/${encounterId}`
          : `/api/patient/glasgow-coma-scale-assessment/by-encounter/${encounterId}/active`,
        params: {
          page,
          size,
          sort
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['GlasgowComaScaleAssessment']
    }),

    addGlasgowComaScaleAssessment: builder.mutation<
      GlasgowComaScaleAssessment,
      GlasgowComaScaleAssessment
    >({
      query: ({ encounter, patient, ...body }) => ({
        url: '/api/patient/glasgow-coma-scale-assessment',
        method: 'POST',
        body: {
          encounterId: encounter?.id ?? null,
          patientId: patient?.id ?? null,
          ...body
        }
      }),
      invalidatesTags: ['GlasgowComaScaleAssessment']
    }),

    updateGlasgowComaScaleAssessment: builder.mutation<
      GlasgowComaScaleAssessment,
      GlasgowComaScaleAssessment
    >({
      query: ({ id, encounter, patient, ...body }) => ({
        url: `/api/patient/glasgow-coma-scale-assessment/${id}`,
        method: 'PUT',
        body: {
          id,
          encounterId: encounter?.id ?? null,
          patientId: patient?.id ?? null,
          ...body
        }
      }),
      invalidatesTags: ['GlasgowComaScaleAssessment']
    }),

    cancelGlasgowComaScaleAssessment: builder.mutation<
      GlasgowComaScaleAssessment,
      GlasgowComaScaleAssessmentCancelRequest
    >({
      query: body => ({
        url: '/api/patient/glasgow-coma-scale-assessment/cancel',
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['GlasgowComaScaleAssessment']
    })
  })
});

export const {
  useGetGlasgowComaScaleAssessmentByIdQuery,
  useLazyGetGlasgowComaScaleAssessmentByIdQuery,
  useGetGlasgowComaScaleAssessmentsByEncounterIdQuery,
  useLazyGetGlasgowComaScaleAssessmentsByEncounterIdQuery,
  useAddGlasgowComaScaleAssessmentMutation,
  useUpdateGlasgowComaScaleAssessmentMutation,
  useCancelGlasgowComaScaleAssessmentMutation
} = glasgowComaScaleAssessmentService;