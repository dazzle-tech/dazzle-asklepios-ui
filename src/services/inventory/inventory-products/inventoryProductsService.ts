import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { InventoryProduct } from '@/types/model-types-new';
type Id = number | string;
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


const mapPaged = <T>(response: T[], meta): PagedResult<T> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};
export const inventoryProductsService = createApi({
    reducerPath: 'inventoryProductsApi',
    baseQuery: BaseQuery,
    tagTypes: ['InventoryProducts'],
    endpoints: (builder) => ({
        getInventoryProducts: builder.query<PagedResult<InventoryProduct>, PagedParams>({
            query: (params) => ({
                url: '/api/inventory/inventory-products',
                params,
            }), 
            transformResponse: (response: InventoryProduct[], meta) =>
                mapPaged<InventoryProduct>(response, meta),
            providesTags: (result) =>
                result?.data
                  ? [
                    ...result.data
                      .filter((item): item is InventoryProduct & { id: number | string } => item.id != null)
                      .map((item) => ({
                        type: 'InventoryProducts' as const,
                        id: item.id as Id,
                      })),
                      { type: 'InventoryProducts', id: 'LIST' },
                    ]
                  : [{ type: 'InventoryProducts', id: 'LIST' }],                
        }),
        getInventoryProductsByName: builder.query<PagedResult<InventoryProduct>, { name: string } & PagedParams>({
            query: ({ name, page, size, sort = 'id,asc', timestamp }) => ({
                url: `/api/inventory/inventory-products/by-name/${encodeURIComponent(name)}`,
                params: { name, page, size, sort, timestamp },
            }),
            transformResponse: (response: InventoryProduct[], meta) =>
                mapPaged<InventoryProduct>(response, meta),
            providesTags: [{ type: 'InventoryProducts', id: 'LIST' }],
        }),
        getInventoryProductByType: builder.query<PagedResult<InventoryProduct>, { type: string } & PagedParams>({
            query: ({ type, page, size, sort = 'id,asc', timestamp }) => ({
                url: `/api/inventory/inventory-products/by-type/${encodeURIComponent(type)}`,
                params: { type, page, size, sort, timestamp },
            }),
            transformResponse: (response: InventoryProduct[], meta) =>
                mapPaged<InventoryProduct>(response, meta),
            providesTags: [{ type: 'InventoryProducts', id: 'LIST' }],
        }),
        getInventoryProductByInventoryType: builder.query<PagedResult<InventoryProduct>, { inventoryType: string } & PagedParams>({
            query: ({ inventoryType, page, size, sort = 'id,asc', timestamp }) => ({
                url: `/api/inventory/inventory-products/by-inventory-type/${encodeURIComponent(inventoryType)}`,
                params: { inventoryType, page, size, sort, timestamp },
            }),
            transformResponse: (response: InventoryProduct[], meta) =>
                mapPaged<InventoryProduct>(response, meta),
            providesTags: [{ type: 'InventoryProducts', id: 'LIST' }],
        }),
        getInventoryProductByBaseUom: builder.query<PagedResult<InventoryProduct>, { baseUom: string } & PagedParams>({
            query: ({ baseUom, page, size, sort = 'id,asc', timestamp }) => ({
                url: `/api/inventory/inventory-products/by-base-uom/${encodeURIComponent(baseUom)}`,
                params: { baseUom, page, size, sort, timestamp },
            }),
            transformResponse: (response: InventoryProduct[], meta) =>
                mapPaged<InventoryProduct>(response, meta),
            providesTags: [{ type: 'InventoryProducts', id: 'LIST' }],
        }),
        getInventoryProductById: builder.query<InventoryProduct, { id: number | string }>({
            query: ({ id }) => ({
                url: `/api/inventory/inventory-products/${id}`,
            }),
            transformResponse: (response: InventoryProduct) => response,
            providesTags: (result, error, id) => [{ type: 'InventoryProducts', id: id as unknown as Id }],
        }),
        createInventoryProduct: builder.mutation<InventoryProduct, InventoryProduct>({
            query: (inventoryProduct) => ({
                url: '/api/inventory/inventory-products',
                method: 'POST',
                body: inventoryProduct,
            }),
            invalidatesTags: [{ type: 'InventoryProducts', id: 'LIST' }],
        }),
        updateInventoryProduct: builder.mutation<InventoryProduct, InventoryProduct>({
            query: (inventoryProduct) => ({
                url: `/api/inventory/inventory-products/${inventoryProduct.id}`,
                method: 'PUT',
                body: inventoryProduct,
            }),
            invalidatesTags: (result, error, inventoryProduct) => [
                { type: 'InventoryProducts', id: inventoryProduct.id as Id },
                { type: 'InventoryProducts', id: 'LIST' },
            ],
        }),
        toggleInventoryProductActive: builder.mutation<InventoryProduct, { id: number | string }>({
            query: ({ id }) => ({
                url: `/api/inventory/inventory-products/${id}/toggle-active`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'InventoryProducts', id: id as Id },
                { type: 'InventoryProducts', id: 'LIST' },
            ],
        }),
        
    }),
});
export const {
    useGetInventoryProductsQuery,
    useGetInventoryProductsByNameQuery,
    useGetInventoryProductByTypeQuery,
    useGetInventoryProductByInventoryTypeQuery,
    useGetInventoryProductByBaseUomQuery,
    useGetInventoryProductByIdQuery,
    useCreateInventoryProductMutation,
    useUpdateInventoryProductMutation,
    useToggleInventoryProductActiveMutation,
} = inventoryProductsService;