import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { Room } from '@/types/model-types-new';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: Room[], meta: any): PagedResult<Room> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const roomService = createApi({
  reducerPath: 'roomService',
  baseQuery: BaseQuery,
  tagTypes: ['Room'],
  endpoints: builder => ({
    getRooms: builder.query<PagedResult<Room>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup',
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Room']
    }),

    getRoomsByName: builder.query<PagedResult<Room>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/search/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Room']
    }),

    getRoomsByDepartmentId: builder.query<PagedResult<Room>, { departmentId: Id } & PagedParams>({
      query: ({ departmentId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/room/search/by-department/${departmentId}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Room']
    }),

    getRoomById: builder.query<Room, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/room/${id}`
      }),
      providesTags: ['Room']
    }),

    addRoom: builder.mutation<Room, Room>({
      query: body => ({
        url: '/api/setup/room',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Room']
    }),

    updateRoom: builder.mutation<Room, Room>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/room/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['Room']
    }),

    activateRoom: builder.mutation<Room, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/room/${id}/activate`,
        method: 'POST'
      }),
      invalidatesTags: ['Room']
    }),
    getAvailableRoomsByDepartmentAndGender: builder.query<
      PagedResult<Room>,
      { departmentId: Id; gender: string } & PagedParams
    >({
      query: ({ departmentId, gender, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/room/available/by-department/${departmentId}/gender/${gender}`,
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Room']
    }),
    deactivateRoom: builder.mutation<Room, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/room/${id}/deactivate`,
        method: 'POST'
      }),
      invalidatesTags: ['Room']
    }),
    getRoomsByIds: builder.mutation<Room[], { ids: Id[] }>({
      query: ({ ids }) => ({
        url: '/api/setup/room/by-ids',
        method: 'POST',
        body: ids
      }),
      invalidatesTags: ['Room']
    }),
  })
});

export const {
  useGetRoomsQuery,
  useLazyGetRoomsQuery,
  useGetRoomsByNameQuery,
  useLazyGetRoomsByNameQuery,
  useGetRoomsByDepartmentIdQuery,
  useLazyGetRoomsByDepartmentIdQuery,
  useGetRoomByIdQuery,
  useLazyGetRoomByIdQuery,
  useAddRoomMutation,
  useUpdateRoomMutation,
  useActivateRoomMutation,
  useDeactivateRoomMutation,
  useGetAvailableRoomsByDepartmentAndGenderQuery,
  useLazyGetAvailableRoomsByDepartmentAndGenderQuery,
  useGetRoomsByIdsMutation
} = roomService;