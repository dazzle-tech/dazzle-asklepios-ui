import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import * as modelTypes from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;


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

export const encounterPlanService = createApi({
  reducerPath: 'encounterPlanApi',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterPlan'],
  endpoints: builder => ({
    createEncounterPlan: builder.mutation<
      modelTypes.EncounterPlan,
      modelTypes.EncounterPlan
    >({
      query: (data) => ({
        url: `/api/patient/encounter-plans`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EncounterPlan'],
    }),

    updateEncounterPlan: builder.mutation<
      modelTypes.EncounterPlan,
      { id: Id; data: modelTypes.EncounterPlan }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/encounter-plans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'EncounterPlan', id },
        'EncounterPlan',
      ],
    }),

    getLatestEncounterPlan: builder.query<
      modelTypes.EncounterPlan,
      { encounterId: Id; timestamp?: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter-plans/latest`,
        params: { encounterId },
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterPlan', id: `latest-${encounterId}` },
        'EncounterPlan',
      ],
    }),

    getEncounterPlansByPatient: builder.query<
  PagedResult<modelTypes.EncounterPlan>,
  { patientId: Id; page?: number; size?: number; sort?: string; timestamp?: number }
>({
  query: ({ patientId, page = 0, size = 10, sort = 'createdDate,desc' }) => ({
    url: `/api/patient/encounter-plans/by-patient`,
    params: {
      patientId,
      page,
      size,
      sort,
    },
  }),

  transformResponse: (
    response: modelTypes.EncounterPlan[],
    meta
  ): PagedResult<modelTypes.EncounterPlan> => {
    const headers = meta?.response?.headers;

    return {
      data: response,
      totalCount: Number(headers?.get('X-Total-Count') ?? 0),
      links: parseLinkHeader(headers?.get('Link')),
    };
  },

  providesTags: (_res, _err, { patientId }) => [
    { type: 'EncounterPlan', id: `patient-${patientId}` },
    'EncounterPlan',
  ],
}),
  }),
});

export const {
  useCreateEncounterPlanMutation,
  useUpdateEncounterPlanMutation,
  useGetLatestEncounterPlanQuery,
  useLazyGetLatestEncounterPlanQuery,
  useGetEncounterPlansByPatientQuery
} = encounterPlanService;
