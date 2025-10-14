import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

type PagedParams = { page: number; size: number; sort?: string };
type PagedResult<T> = { data: T[]; totalCount: number };

export const serviceService = createApi({
  reducerPath: 'newServiceApi',
  baseQuery: BaseQuery,
  tagTypes: ['Service'],
  endpoints: (builder) => ({
    // GET /api/setup/service?page=&size=&sort=
    getServices: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service',
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/{id}
    getServiceById: builder.query<any, number | string>({
      query: (id) => `/api/setup/service/${id}`,
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-category?category=&page=&size=&sort=
    getServicesByCategory: builder.query<PagedResult<any>, { category: string } & PagedParams>({
      query: ({ category, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-category',
        params: { category, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-code?code=&page=&size=&sort=
    getServicesByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-code',
        params: { code, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-name?name=&page=&size=&sort=
    getServicesByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-name',
        params: { name, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // POST /api/setup/service
    addService: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/setup/service',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Service'],
    }),

    // PUT /api/setup/service/{id}
    updateService: builder.mutation<any, any>({
      query: (body) => ({
        url: `/api/setup/service/${body.id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Service'],
    }),

    // PATCH /api/setup/service/{id}/toggle-active
    toggleServiceIsActive: builder.mutation<any, number>({
      query: (id) => ({
        url: `/api/setup/service/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Service'],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useGetServicesByCategoryQuery,
  useLazyGetServicesByCategoryQuery,
  useGetServicesByCodeQuery,
  useLazyGetServicesByCodeQuery,
  useGetServicesByNameQuery,
  useLazyGetServicesByNameQuery,
  useAddServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceIsActiveMutation,
} = serviceService;
