import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { Warehouse } from '@/types/model-types-new';

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

export const warehouseService = createApi({
  reducerPath: 'warehouseApi',
  baseQuery: BaseQuery,
  tagTypes: ['Warehouse'],
  endpoints: (builder) => ({
    // GET /api/inventory/warehouse?page=&size=&sort=
    getWarehouses: builder.query<PagedResult<Warehouse>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/inventory/warehouse',
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/{id}
    getWarehouseById: builder.query<Warehouse, number | string>({
      query: (id) => `/api/inventory/warehouse/${id}`,
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/by-department/{departmentId}?page=&size=&sort=
    getWarehousesByDepartment: builder.query<
      PagedResult<Warehouse>,
      { departmentId: number | string } & PagedParams
    >({
      query: ({ departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse/by-department/${departmentId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/by-facility/{facilityId}?page=&size=&sort=
    getWarehousesByFacility: builder.query<
      PagedResult<Warehouse>,
      { facilityId: number | string } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse/by-facility/${facilityId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/by-facility-and-department/{facilityId}/{departmentId}?page=&size=&sort=
    getWarehousesByFacilityAndDepartment: builder.query<
      PagedResult<Warehouse>,
      { facilityId: number | string; departmentId: number | string } & PagedParams
    >({
      query: ({ facilityId, departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse/by-facility-and-department/${facilityId}/${departmentId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/by-name/{name}?page=&size=&sort=
    getWarehousesByName: builder.query<
      PagedResult<Warehouse>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse/by-name/${name}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/by-code/{code}?page=&size=&sort=
    getWarehousesByCode: builder.query<
      PagedResult<Warehouse>,
      { code: string } & PagedParams
    >({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse/by-code/${code}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // GET /api/inventory/warehouse/search?quickSearch=&page=&size=&sort=
    searchWarehouses: builder.query<
      PagedResult<Warehouse>,
      { quickSearch: string } & PagedParams
    >({
      query: ({ quickSearch, page, size, sort = 'id,asc' }) => ({
        url: '/api/inventory/warehouse/search',
        params: { quickSearch, page, size, sort },
      }),
      transformResponse: (response: Warehouse[], meta): PagedResult<Warehouse> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Warehouse'],
    }),

    // POST /api/inventory/warehouse
    addWarehouse: builder.mutation<Warehouse, Partial<Warehouse>>({
      query: (warehouse) => ({
        url: '/api/inventory/warehouse',
        method: 'POST',
        body: warehouse,
      }),
      invalidatesTags: ['Warehouse'],
    }),

    // PUT /api/inventory/warehouse/{id}
    updateWarehouse: builder.mutation<Warehouse, Partial<Warehouse> & { id: number }>(
      {
        query: (warehouse) => ({
          url: `/api/inventory/warehouse/${warehouse.id}`,
          method: 'PUT',
          body: warehouse,
        }),
        invalidatesTags: ['Warehouse'],
      }
    ),

    // PATCH /api/inventory/warehouse/{id}/toggle-active
    toggleWarehouseIsActive: builder.mutation<Warehouse, number>({
      query: (id) => ({
        url: `/api/inventory/warehouse/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Warehouse'],
    }),
  }),
});

export const {
  useGetWarehousesQuery,
  useGetWarehouseByIdQuery,
  useGetWarehousesByDepartmentQuery,
  useLazyGetWarehousesByDepartmentQuery,
  useGetWarehousesByFacilityQuery,
  useLazyGetWarehousesByFacilityQuery,
  useGetWarehousesByFacilityAndDepartmentQuery,
  useLazyGetWarehousesByFacilityAndDepartmentQuery,
  useGetWarehousesByNameQuery,
  useLazyGetWarehousesByNameQuery,
  useGetWarehousesByCodeQuery,
  useLazyGetWarehousesByCodeQuery,
  useSearchWarehousesQuery,
  useLazySearchWarehousesQuery,
  useAddWarehouseMutation,
  useUpdateWarehouseMutation,
  useToggleWarehouseIsActiveMutation,
} = warehouseService;
