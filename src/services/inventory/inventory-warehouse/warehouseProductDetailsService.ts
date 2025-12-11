// src/services/setup/warehouseProductDetailsService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { WarehouseProductDetails } from '@/types/model-types-new';

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

export const warehouseProductDetailsService = createApi({
  reducerPath: 'warehouseProductDetailsApi',
  baseQuery: BaseQuery,
  tagTypes: ['WarehouseProductDetails'],
  endpoints: (builder) => ({
    // GET /api/inventory/warehouse-product-details/by-warehouse-product/{warehouseProductId}?page=&size=&sort=
    getWarehouseProductDetailsByWarehouseProduct: builder.query<
      PagedResult<WarehouseProductDetails>,
      { warehouseProductId: number | string } & PagedParams
    >({
      query: ({ warehouseProductId, page, size, sort = 'id,asc' }) => ({
        url: `/api/inventory/warehouse-product-details/by-warehouse-product/${warehouseProductId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: WarehouseProductDetails[], meta): PagedResult<WarehouseProductDetails> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['WarehouseProductDetails'],
    }),

    // GET /api/inventory/warehouse-product-details/{id}
    getWarehouseProductDetailsById: builder.query<WarehouseProductDetails, number | string>({
      query: (id) => `/api/inventory/warehouse-product-details/${id}`,
      providesTags: ['WarehouseProductDetails'],
    }),

    // GET /api/inventory/warehouse-product-details/{warehouseProductId}/active
    getActiveWarehouseProductDetails: builder.query<
      WarehouseProductDetails[],
      { warehouseProductId: number | string }
    >({
      query: ({ warehouseProductId }) =>
        `/api/inventory/warehouse-product-details/${warehouseProductId}/active`,
      providesTags: ['WarehouseProductDetails'],
    }),

    // POST /api/inventory/warehouse-product-details
    addWarehouseProductDetails: builder.mutation<
      WarehouseProductDetails,
      Partial<WarehouseProductDetails>
    >({
      query: (body) => ({
        url: '/api/inventory/warehouse-product-details',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WarehouseProductDetails'],
    }),

    // PUT /api/inventory/warehouse-product-details/{id}
    updateWarehouseProductDetails: builder.mutation<
      WarehouseProductDetails,
      Partial<WarehouseProductDetails> & { id: number }
    >({
      query: (body) => ({
        url: `/api/inventory/warehouse-product-details/${body.id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['WarehouseProductDetails'],
    }),

    // PATCH /api/inventory/warehouse-product-details/{id}/toggle-active
    toggleWarehouseProductDetailsIsActive: builder.mutation<WarehouseProductDetails, number>({
      query: (id) => ({
        url: `/api/inventory/warehouse-product-details/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['WarehouseProductDetails'],
    }),
  }),
});

export const {
  useGetWarehouseProductDetailsByWarehouseProductQuery,
  useLazyGetWarehouseProductDetailsByWarehouseProductQuery,
  useGetWarehouseProductDetailsByIdQuery,
  useGetActiveWarehouseProductDetailsQuery,
  useLazyGetActiveWarehouseProductDetailsQuery,
  useAddWarehouseProductDetailsMutation,
  useUpdateWarehouseProductDetailsMutation,
  useToggleWarehouseProductDetailsIsActiveMutation,
} = warehouseProductDetailsService;
