import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { Bed } from '@/types/model-types-new';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

type BedStatus = 'READY' | 'OCCUPIED' | 'IN_CLEANING' | 'OUT_OF_SERVICE';

const mapPaged = (response: Bed[], meta: any): PagedResult<Bed> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const bedService = createApi({
  reducerPath: 'bedService',
  baseQuery: BaseQuery,
  tagTypes: ['Bed'],
  endpoints: builder => ({
    getBeds: builder.query<PagedResult<Bed>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup/bed',
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Bed']
    }),

    getBedsByRoomId: builder.query<PagedResult<Bed>, { roomId: Id } & PagedParams>({
      query: ({ roomId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/bed/search/by-room/${roomId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Bed']
    }),

    getActiveBedsByRoomId: builder.query<PagedResult<Bed>, { roomId: Id } & PagedParams>({
      query: ({ roomId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/bed/search/active/by-room/${roomId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Bed']
    }),

    getBedById: builder.query<Bed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed/${id}`
      }),
      providesTags: ['Bed']
    }),

    addBed: builder.mutation<Bed, Bed>({
      query: body => ({
        url: '/api/setup/bed',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Bed']
    }),

    updateBed: builder.mutation<Bed, Bed>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/bed/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['Bed']
    }),

    changeBedActivationStatus: builder.mutation<Bed, { id: Id; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/api/setup/bed/${id}/activation-status/${active}`,
        method: 'PUT'
      }),
      invalidatesTags: ['Bed']
    }),

    occupyBed: builder.mutation<Bed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed/${id}/occupy`,
        method: 'POST'
      }),
      invalidatesTags: ['Bed']
    }),

    markBedAsInCleaning: builder.mutation<Bed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed/${id}/mark-in-cleaning`,
        method: 'POST'
      }),
      invalidatesTags: ['Bed']
    }),

    getBedsByIds: builder.mutation<Bed[], { ids: Id[] }>({
      query: ({ ids }) => ({
        url: '/api/setup/bed/by-ids',
        method: 'POST',
        body: ids
      }),
      invalidatesTags: ['Bed']
    }),

    getBedsByDepartmentId: builder.query<PagedResult<Bed>, { departmentId: Id } & PagedParams>({
      query: ({ departmentId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/bed/search/by-department/${departmentId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Bed']
    }),

    markBedAsOutOfService: builder.mutation<Bed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed/${id}/mark-out-of-service`,
        method: 'POST'
      }),
      invalidatesTags: ['Bed']
    }),

    markBedAsReady: builder.mutation<Bed, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed/${id}/mark-ready`,
        method: 'POST'
      }),
      invalidatesTags: ['Bed']
    }),

    countActiveBeds: builder.query<number, { departmentId: Id }>({
      query: ({ departmentId }) => ({
        url: `/api/setup/bed/count/active/${departmentId}`
      }),
      providesTags: ['Bed']
    }),

    countBedsByStatus: builder.query<number, { departmentId: Id; status: BedStatus }>({
      query: ({ departmentId, status }) => ({
        url: `/api/setup/bed/count/${status}/${departmentId}`
      }),
      providesTags: ['Bed']
    }),

    getAllActiveBedsByRoomId: builder.query<PagedResult<Bed>, { roomId: Id } & PagedParams>({
      query: ({ roomId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/bed/search/all-active/by-room/${roomId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Bed']
    }),
  }),
});

export const {
  useGetBedsQuery,
  useLazyGetBedsQuery,
  useGetBedsByRoomIdQuery,
  useLazyGetBedsByRoomIdQuery,
  useGetActiveBedsByRoomIdQuery,
  useLazyGetActiveBedsByRoomIdQuery,
  useGetAllActiveBedsByRoomIdQuery,
  useLazyGetAllActiveBedsByRoomIdQuery,
  useGetBedByIdQuery,
  useLazyGetBedByIdQuery,
  useAddBedMutation,
  useUpdateBedMutation,
  useChangeBedActivationStatusMutation,
  useOccupyBedMutation,
  useMarkBedAsInCleaningMutation,
  useMarkBedAsOutOfServiceMutation,
  useMarkBedAsReadyMutation,
  useGetBedsByIdsMutation,
  useGetBedsByDepartmentIdQuery,
  useCountActiveBedsQuery,
  useLazyCountActiveBedsQuery,
  useCountBedsByStatusQuery,
  useLazyCountBedsByStatusQuery,
} = bedService;