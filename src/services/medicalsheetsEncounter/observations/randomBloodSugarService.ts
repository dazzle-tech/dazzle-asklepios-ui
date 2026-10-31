import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type { RandomBloodSugar } from '@/types/model-types-new';

type Id = number | string;

export type RandomBloodSugarCreateDTO = {
  patientId: number;
  encounterId: number;
  randomBloodGlucose?: string | null;
  isActive?: boolean;
};

export type RandomBloodSugarFieldHistoryVM = {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string | null;
};

export const randomBloodSugarService = createApi({
  reducerPath: 'newRandomBloodSugarApi',
  baseQuery: BaseQuery,
  tagTypes: ['RandomBloodSugar'],
  endpoints: builder => ({
    createRandomBloodSugar: builder.mutation<RandomBloodSugar, RandomBloodSugarCreateDTO>({
      query: body => ({
        url: '/api/patient/random-blood-sugar',
        method: 'POST',
        body
      }),
      invalidatesTags: ['RandomBloodSugar']
    }),

    getLatestRandomBloodSugarByEncounterId: builder.query<RandomBloodSugar, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/random-blood-sugar/latest/encounter/${encodeURIComponent(
          String(encounterId)
        )}`
      }),
      providesTags: ['RandomBloodSugar']
    }),

    getRandomBloodSugarHistoryByEncounterId: builder.query<
      RandomBloodSugarFieldHistoryVM[],
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/random-blood-sugar/encounter/${encodeURIComponent(
          String(encounterId)
        )}/history`
      }),
      providesTags: ['RandomBloodSugar']
    })
  })
});

export const {
  useCreateRandomBloodSugarMutation,
  useGetLatestRandomBloodSugarByEncounterIdQuery,
  useLazyGetLatestRandomBloodSugarByEncounterIdQuery,
  useGetRandomBloodSugarHistoryByEncounterIdQuery,
  useLazyGetRandomBloodSugarHistoryByEncounterIdQuery
} = randomBloodSugarService;
