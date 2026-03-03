import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { ChiefComplain } from '@/types/model-types-new';

type ChiefComplainId = number | string;
type ChiefComplainCreate = Omit<ChiefComplain, 'id'>;
type ChiefComplainUpdate = ChiefComplain & { id: number };

export const chiefComplainService = createApi({
  reducerPath: 'chiefComplainApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createChiefComplain: builder.mutation<ChiefComplain, ChiefComplainCreate>({
      query: (payload) => ({
        url: '/api/patient/chief-complain',
        method: 'POST',
        body: payload
      })
    }),
    updateChiefComplain: builder.mutation<ChiefComplain, ChiefComplainUpdate>({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/chief-complain/${id}`,
        method: 'PUT',
        body: { id, ...payload }
      })
    }),
    getLatestChiefComplainByEncounter: builder.query<ChiefComplain, ChiefComplainId>({
      query: (encounterId) => ({
        url: `/api/patient/chief-complain/encounter/${encounterId}/latest`,
        method: 'GET'
      })
    }),

    getLatestTriageChiefComplainByEncounter: builder.query<ChiefComplain, ChiefComplainId>({
      query: (encounterId) => ({
        url: `/api/patient/chief-complain/encounter/${encounterId}/latest-triage`,
        method: 'GET'
      })
    }),
    hardDeleteChiefComplain: builder.mutation<void, ChiefComplainId>({
      query: (id) => ({
        url: `/api/patient/chief-complain/${id}`,
        method: 'DELETE'
      })
    })
  })
});

export const {
  useCreateChiefComplainMutation,
  useUpdateChiefComplainMutation,
  useGetLatestChiefComplainByEncounterQuery,
  useGetLatestTriageChiefComplainByEncounterQuery,
  useHardDeleteChiefComplainMutation
} = chiefComplainService;

