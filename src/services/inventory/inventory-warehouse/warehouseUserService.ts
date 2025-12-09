// src/services/setup/warehouseUserService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { WarehouseUser } from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
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

export const warehouseUserService = createApi({
  reducerPath: 'warehouseUserApi',
  baseQuery: BaseQuery,
  tagTypes: ['WarehouseUser'],
  endpoints: (builder) => ({
    // GET /api/inventory/warehouse-user?page=&size=&sort=
    getWarehouseUsers: builder.query<PagedResult<WarehouseUser>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/inventory/warehouse-user',
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseUser[], meta): PagedResult<WarehouseUser> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseUser'],
    }),

    // GET /api/inventory/warehouse-user/{id}
    getWarehouseUserById: builder.query<WarehouseUser, number | string>({
      query: (id) => `/api/inventory/warehouse-user/${id}`,
      providesTags: ['WarehouseUser'],
    }),

    // GET /api/inventory/warehouse-user/by-warehouse/{warehouseId}?page=&size=&sort=
    getWarehouseUsersByWarehouse: builder.query<
      PagedResult<WarehouseUser>,
      { warehouseId: number | string } & PagedParams
    >({
      query: ({ warehouseId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-user/by-warehouse/${warehouseId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseUser[], meta): PagedResult<WarehouseUser> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseUser'],
    }),

    // GET /api/inventory/warehouse-user/by-user/{userId}?page=&size=&sort=
    getWarehouseUsersByUser: builder.query<
      PagedResult<WarehouseUser>,
      { userId: number | string } & PagedParams
    >({
      query: ({ userId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-user/by-user/${userId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseUser[], meta): PagedResult<WarehouseUser> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseUser'],
    }),

    // GET /api/inventory/warehouse-user/by-user-and-warehouse/{userId}/{warehouseId}
    getWarehouseUserByUserAndWarehouse: builder.query<
      WarehouseUser | null,
      { userId: number | string; warehouseId: number | string }
    >({
      query: ({ userId, warehouseId }) =>
        `/api/inventory/warehouse-user/by-user-and-warehouse/${userId}/${warehouseId}`,
      providesTags: ['WarehouseUser'],
    }),

    // POST /api/inventory/warehouse-user
    addWarehouseUser: builder.mutation<WarehouseUser, { warehouseId: number; userId: number }>({
      query: (body) => ({
        url: '/api/inventory/warehouse-user',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WarehouseUser'],
    }),

    // PUT /api/inventory/warehouse-user/{id}
    updateWarehouseUser: builder.mutation<WarehouseUser, Partial<WarehouseUser> & { id: number }>(
      {
        query: (body) => ({
          url: `/api/inventory/warehouse-user/${body.id}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: ['WarehouseUser'],
      }
    ),
  }),
});

export const {
  useGetWarehouseUsersQuery,
  useLazyGetWarehouseUsersQuery,
  useGetWarehouseUserByIdQuery,
  useGetWarehouseUsersByWarehouseQuery,
  useLazyGetWarehouseUsersByWarehouseQuery,
  useGetWarehouseUsersByUserQuery,
  useLazyGetWarehouseUsersByUserQuery,
  useGetWarehouseUserByUserAndWarehouseQuery,
  useAddWarehouseUserMutation,
  useUpdateWarehouseUserMutation,
} = warehouseUserService;
