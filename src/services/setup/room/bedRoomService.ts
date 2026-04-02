import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { BedRoomService } from '@/types/model-types-new';

type Id = number | string;
type PagedParams = {
  roomId: Id;
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
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: BedRoomService[], meta: any): PagedResult<BedRoomService> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const bedRoomService = createApi({
  reducerPath: 'bedRoomService',
  baseQuery: BaseQuery,
  tagTypes: ['BedRoomService'],
  endpoints: builder => ({
    getBedRoomServices: builder.query<PagedResult<BedRoomService>, PagedParams>({
      query: ({ roomId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/bed-room-service/room/${roomId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['BedRoomService']
    }),

    getBedRoomServiceById: builder.query<BedRoomService, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed-room-service/${id}`
      }),
      providesTags: ['BedRoomService']
    }),

    addBedRoomService: builder.mutation<BedRoomService, BedRoomService>({
      query: body => ({
        url: '/api/setup/bed-room-service',
        method: 'POST',
        body
      }),
      invalidatesTags: ['BedRoomService']
    }),

    updateBedRoomService: builder.mutation<BedRoomService, BedRoomService>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/bed-room-service/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['BedRoomService']
    }),

    activateBedRoomService: builder.mutation<BedRoomService, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed-room-service/${id}/activate`,
        method: 'POST'
      }),
      invalidatesTags: ['BedRoomService']
    }),

    deactivateBedRoomService: builder.mutation<BedRoomService, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/bed-room-service/${id}/deactivate`,
        method: 'POST'
      }),
      invalidatesTags: ['BedRoomService']
    })
  })
});

export const {
  useGetBedRoomServicesQuery,
  useLazyGetBedRoomServicesQuery,
  useGetBedRoomServiceByIdQuery,
  useLazyGetBedRoomServiceByIdQuery,
  useAddBedRoomServiceMutation,
  useUpdateBedRoomServiceMutation,
  useActivateBedRoomServiceMutation,
  useDeactivateBedRoomServiceMutation
} = bedRoomService;