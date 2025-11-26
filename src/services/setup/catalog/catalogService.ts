import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { CatalogCreateVM, CatalogResponseVM, CatalogUpdateVM } from '@/types/model-types-new';

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


export const catalogService = createApi({
  reducerPath: 'newCatalogApi',
  baseQuery: BaseQuery,
  tagTypes: ['Catalog'],
  endpoints: (builder) => ({
    // GET /api/setup/catalog?page=&size=&sort=
    getCatalogs: builder.query<PagedResult<CatalogResponseVM>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/catalog',
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogResponseVM[], meta): PagedResult<CatalogResponseVM> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: (_res) => ['Catalog'],
    }),

    // GET /api/setup/catalog/{id}
    getCatalogById: builder.query<CatalogResponseVM, number | string>({
      query: (id) => `/api/setup/catalog/${id}`,
      providesTags: (_res, _err, _id) => ['Catalog'],
    }),

    // GET /api/setup/catalog/by-department/{departmentId}?page=&size=&sort=
    getCatalogByDepartment: builder.query<
      PagedResult<CatalogResponseVM>,
      { departmentId: number | string } & PagedParams
    >({
      query: ({ departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/catalog/by-department?departmentId=${departmentId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogResponseVM[], meta): PagedResult<CatalogResponseVM> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Catalog'],
    }),

    // GET /api/setup/catalog/by-type/{type}?page=&size=&sort=
    getCatalogByType: builder.query<PagedResult<CatalogResponseVM>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/catalog/by-type?type=${type}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogResponseVM[], meta): PagedResult<CatalogResponseVM> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Catalog'],
    }),

    // GET /api/setup/catalog/by-name/{name}?page=&size=&sort=
    getCatalogByName: builder.query<PagedResult<CatalogResponseVM>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/catalog/by-name?name=${encodeURIComponent(name)}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogResponseVM[], meta): PagedResult<CatalogResponseVM> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['Catalog'],
    }),

    // POST /api/setup/catalog
    addCatalog: builder.mutation<CatalogResponseVM, CatalogCreateVM>({
      query: (payload) => ({
        url: '/api/setup/catalog',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Catalog'],
    }),

    // PUT /api/setup/catalog/{id}
    updateCatalog: builder.mutation<CatalogResponseVM, { id: number | string; body: CatalogUpdateVM }>({
      query: ({ id, body }) => ({
        url: `/api/setup/catalog/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Catalog'],
    }),

     deleteCatalog: builder.mutation({
      query: id => ({
        url: `/api/setup/catalog/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Catalog'],
    }),
  }),
});

export const {
  useGetCatalogsQuery,
  useGetCatalogByIdQuery,
  useGetCatalogByDepartmentQuery,
  useLazyGetCatalogByDepartmentQuery,
  useGetCatalogByTypeQuery,
  useLazyGetCatalogByTypeQuery,
  useGetCatalogByNameQuery,
  useLazyGetCatalogByNameQuery,
  useAddCatalogMutation,
  useUpdateCatalogMutation,
  useDeleteCatalogMutation
} = catalogService;