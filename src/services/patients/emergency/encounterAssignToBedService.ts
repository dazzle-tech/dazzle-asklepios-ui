import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { BedTransaction, EncounterAssignToBed } from '@/types/model-types-new';

type Id = number | string;

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
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

const mapPaged = (
  response: EncounterAssignToBed[],
  meta: any
): PagedResult<EncounterAssignToBed> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const encounterAssignToBedService = createApi({
  reducerPath: 'encounterAssignToBedService',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterAssignToBed', 'BedTransaction'],
  endpoints: builder => ({
    getEncounterAssignToBedById: builder.query<EncounterAssignToBed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter-assign-to-bed/${id}`
      }),
      providesTags: ['EncounterAssignToBed']
    }),

    getActiveAssignmentByEncounterId: builder.query<EncounterAssignToBed, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter-assign-to-bed/active/by-encounter/${encounterId}`
      }),
      providesTags: ['EncounterAssignToBed']
    }),

    getActiveBedIds: builder.query<number[], void>({
      query: () => ({
        url: '/api/patient/encounter-assign-to-bed/active/bed-ids'
      }),
      providesTags: ['EncounterAssignToBed']
    }),

    getActiveRoomIds: builder.query<number[], void>({
      query: () => ({
        url: '/api/patient/encounter-assign-to-bed/active/room-ids'
      }),
      providesTags: ['EncounterAssignToBed']
    }),

    addEncounterAssignToBed: builder.mutation<EncounterAssignToBed, EncounterAssignToBed>({
      query: ({ encounter, patient, ...body }) => ({
        url: '/api/patient/encounter-assign-to-bed',
        method: 'POST',
        body: {
          encounterId: encounter?.id ?? null,
          patientId: patient?.id ?? null,
          ...body
        }
      }),
      invalidatesTags: ['EncounterAssignToBed']
    }),

    updateEncounterAssignToBed: builder.mutation<EncounterAssignToBed, EncounterAssignToBed>({
      query: ({ id, encounter, patient, ...body }) => ({
        url: `/api/patient/encounter-assign-to-bed/${id}`,
        method: 'PUT',
        body: {
          id,
          encounterId: encounter?.id ?? null,
          patientId: patient?.id ?? null,
          ...body
        }
      }),
      invalidatesTags: ['EncounterAssignToBed']
    }),

    releaseEncounterAssignToBed: builder.mutation<EncounterAssignToBed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter-assign-to-bed/${id}/release`,
        method: 'PUT'
      }),
      invalidatesTags: ['EncounterAssignToBed']
    }),
    getActiveAssignmentsByEncounterIds: builder.query<
      EncounterAssignToBed[],
      { encounterIds?: Id[] } | void
    >({
      query: arg => {
        const encounterIds = arg && 'encounterIds' in arg ? arg.encounterIds ?? [] : [];

        return {
          url: `/api/patient/encounter-assign-to-bed/active-list/by-encounters`,
          params: {
            encounterIds: encounterIds.join(',')
          }
        };
      },
      providesTags: ['EncounterAssignToBed']
    }),
    getBedTransactionsByDepartmentAndDateRange: builder.query<
      PagedResult<BedTransaction>,
      {
        departmentId: Id;
        from: string;
        to: string;
      } & PagedParams
    >({
      query: ({ departmentId, from, to, page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/bed-transaction/search/by-department-and-date',
        params: {
          departmentId,
          from,
          to,
          page,
          size,
          sort
        }
      }),
      transformResponse: (response: BedTransaction[], meta: any) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['BedTransaction']
    }),
  })
});

export const {
  useGetEncounterAssignToBedByIdQuery,
  useLazyGetEncounterAssignToBedByIdQuery,
  useGetActiveAssignmentByEncounterIdQuery,
  useLazyGetActiveAssignmentByEncounterIdQuery,
  useGetActiveBedIdsQuery,
  useLazyGetActiveBedIdsQuery,
  useGetActiveRoomIdsQuery,
  useLazyGetActiveRoomIdsQuery,
  useAddEncounterAssignToBedMutation,
  useUpdateEncounterAssignToBedMutation,
  useReleaseEncounterAssignToBedMutation,
  useGetActiveAssignmentsByEncounterIdsQuery,
  useLazyGetActiveAssignmentsByEncounterIdsQuery,
  useGetBedTransactionsByDepartmentAndDateRangeQuery,
  useLazyGetBedTransactionsByDepartmentAndDateRangeQuery
} = encounterAssignToBedService;