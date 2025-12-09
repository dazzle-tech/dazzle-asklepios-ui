// src/services/setup/warehouseProductService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { WarehouseProduct } from '@/types/model-types-new';

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

export const warehouseProductService = createApi({
  reducerPath: 'warehouseProductApi',
  baseQuery: BaseQuery,
  tagTypes: ['WarehouseProduct'],
  endpoints: (builder) => ({
    // GET /api/inventory/warehouse-product?page=&size=&sort=
    getWarehouseProducts: builder.query<PagedResult<WarehouseProduct>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/inventory/warehouse-product',
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseProduct[], meta): PagedResult<WarehouseProduct> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseProduct'],
    }),

    // GET /api/inventory/warehouse-product/{id}
    getWarehouseProductById: builder.query<WarehouseProduct, number | string>({
      query: (id) => `/api/inventory/warehouse-product/${id}`,
      providesTags: ['WarehouseProduct'],
    }),

    // GET /api/inventory/warehouse-product/by-warehouse/{warehouseId}?page=&size=&sort=
    getWarehouseProductsByWarehouse: builder.query<
      PagedResult<WarehouseProduct>,
      { warehouseId: number | string } & PagedParams
    >({
      query: ({ warehouseId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-product/by-warehouse/${warehouseId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseProduct[], meta): PagedResult<WarehouseProduct> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseProduct'],
    }),

    // GET /api/inventory/warehouse-product/by-department/{departmentId}?page=&size=&sort=
    getWarehouseProductsByDepartment: builder.query<
      PagedResult<WarehouseProduct>,
      { departmentId: number | string } & PagedParams
    >({
      query: ({ departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-product/by-department/${departmentId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseProduct[], meta): PagedResult<WarehouseProduct> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseProduct'],
    }),

    // GET /api/inventory/warehouse-product/by-warehouse-and-department/{warehouseId}/{departmentId}?page=&size=&sort=
    getWarehouseProductsByWarehouseAndDepartment: builder.query<
      PagedResult<WarehouseProduct>,
      { warehouseId: number | string; departmentId: number | string } & PagedParams
    >({
      query: ({ warehouseId, departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-product/by-warehouse-and-department/${warehouseId}/${departmentId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseProduct[], meta): PagedResult<WarehouseProduct> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseProduct'],
    }),

    // POST /api/inventory/warehouse-product
    addWarehouseProduct: builder.mutation<WarehouseProduct, Partial<WarehouseProduct>>({
      query: (body) => ({
        url: '/api/inventory/warehouse-product',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WarehouseProduct'],
    }),

    // PUT /api/inventory/warehouse-product/{id}
    updateWarehouseProduct: builder.mutation<
      WarehouseProduct,
      Partial<WarehouseProduct> & { id: number }
    >({
      query: (body) => ({
        url: `/api/inventory/warehouse-product/${body.id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['WarehouseProduct'],
    }),

    // PATCH /api/inventory/warehouse-product/{id}/toggle-active
    toggleWarehouseProductIsActive: builder.mutation<WarehouseProduct, number>({
      query: (id) => ({
        url: `/api/inventory/warehouse-product/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['WarehouseProduct'],
    }),
  }),
});

export const {
  useGetWarehouseProductsQuery,
  useLazyGetWarehouseProductsQuery,
  useGetWarehouseProductByIdQuery,
  useGetWarehouseProductsByWarehouseQuery,
  useLazyGetWarehouseProductsByWarehouseQuery,
  useGetWarehouseProductsByDepartmentQuery,
  useLazyGetWarehouseProductsByDepartmentQuery,
  useGetWarehouseProductsByWarehouseAndDepartmentQuery,
  useLazyGetWarehouseProductsByWarehouseAndDepartmentQuery,
  useAddWarehouseProductMutation,
  useUpdateWarehouseProductMutation,
  useToggleWarehouseProductIsActiveMutation,
} = warehouseProductService;
