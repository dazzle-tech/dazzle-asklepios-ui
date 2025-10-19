import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { ServiceItemCreate, ServiceItemUpdate } from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string };
type PagedResult<T> = { data: T[]; totalCount: number };
type Id = number | string;
type WithFacility = { facilityId: Id };

export const serviceService = createApi({
  reducerPath: 'newServiceApi',
  baseQuery: BaseQuery,
  tagTypes: ['Service', 'ServiceItems', 'ServiceItemsByService', 'ServiceItemsSources'],
  endpoints: (builder) => ({
    // =========================
    //         SERVICES
    // =========================

    // GET /api/setup/service?facilityId=&page=&size=&sort=
    getServices: builder.query<PagedResult<any>, WithFacility & PagedParams>({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service',
        params: { facilityId, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/{id}?facilityId=
    getServiceById: builder.query<any, { id: Id; facilityId: Id }>({
      query: ({ id, facilityId }) => ({
        url: `/api/setup/service/${id}`,
        params: { facilityId },
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-category?facilityId=&category=&page=&size=&sort=
    getServicesByCategory: builder.query<
      PagedResult<any>,
      WithFacility & { category: string } & PagedParams
    >({
      query: ({ facilityId, category, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-category',
        params: { facilityId, category, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-code?facilityId=&code=&page=&size=&sort=
    getServicesByCode: builder.query<
      PagedResult<any>,
      WithFacility & { code: string } & PagedParams
    >({
      query: ({ facilityId, code, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-code',
        params: { facilityId, code, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // GET /api/setup/service/service-list-by-name?facilityId=&name=&page=&size=&sort=
    getServicesByName: builder.query<
      PagedResult<any>,
      WithFacility & { name: string } & PagedParams
    >({
      query: ({ facilityId, name, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service/service-list-by-name',
        params: { facilityId, name, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Service'],
    }),

    // POST /api/setup/service?facilityId=
    // ملاحظة: الـ VM يتطلّب facilityId داخل الـ body أيضًا.
    addService: builder.mutation<any, WithFacility & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/service',
        method: 'POST',
        params: { facilityId },
        body: { ...body, facilityId }, // تأكيد تمريره داخل الـ body أيضًا
      }),
      invalidatesTags: ['Service'],
    }),

    // PUT /api/setup/service/{id}?facilityId=
    updateService: builder.mutation<any, WithFacility & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/service/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body, facilityId }, // الـ VM يتطلّب id و facilityId
      }),
      invalidatesTags: ['Service'],
    }),

    // PATCH /api/setup/service/{id}/toggle-active?facilityId=
    toggleServiceIsActive: builder.mutation<any, { id: Id; facilityId: Id }>({
      query: ({ id, facilityId }) => ({
        url: `/api/setup/service/${id}/toggle-active`,
        method: 'PATCH',
        params: { facilityId },
      }),
      invalidatesTags: ['Service'],
    }),

 // =========================
//        SERVICE ITEMS
// =========================

// GET /api/setup/service-items?page=&size=&sort=
getServiceItems: builder.query<PagedResult<any>, PagedParams>({
  query: ({ page, size, sort = 'id,asc' }) => ({
    url: '/api/setup/service-items',
    params: { page, size, sort },
  }),
  transformResponse: (response: any[], meta): PagedResult<any> => ({
    data: response,
    totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
  }),
  providesTags: (result) =>
    result?.data
      ? [
          ...result.data.map((i: any) => ({ type: 'ServiceItems' as const, id: i.id })),
          { type: 'ServiceItems', id: 'LIST' },
        ]
      : [{ type: 'ServiceItems', id: 'LIST' }],
}),

// GET /api/setup/service-items/by-service/{serviceId}?page=&size=&sort=
getServiceItemsByService: builder.query<PagedResult<any>, { serviceId: Id } & PagedParams>({
  query: ({ serviceId, page, size, sort = 'id,asc' }) => ({
    url: `/api/setup/service-items/by-service/${serviceId}`,
    params: { page, size, sort },
  }),
  transformResponse: (response: any[], meta): PagedResult<any> => ({
    data: response,
    totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
  }),
  providesTags: (result, _err, args) =>
    result?.data
      ? [
          ...result.data.map((i: any) => ({ type: 'ServiceItemsByService' as const, id: i.id })),
          { type: 'ServiceItemsByService', id: `LIST_${args.serviceId}` },
        ]
      : [{ type: 'ServiceItemsByService', id: `LIST_${args.serviceId}` }],
}),

// GET /api/setup/service-items/{id}
getServiceItemById: builder.query<any, Id>({
  query: (id) => `/api/setup/service-items/${id}`,
  providesTags: (_res, _err, id) => [{ type: 'ServiceItems', id }],
}),

// POST /api/setup/service-items  (Body = ServiceItemCreate)
addServiceItem: builder.mutation<any, ServiceItemCreate>({
  query: (body) => ({
    url: '/api/setup/service-items',
    method: 'POST',
    body, // ✅ بدون { body: payload }
  }),
  invalidatesTags: (_res, _err, body) => [
    { type: 'ServiceItems', id: 'LIST' },
    { type: 'ServiceItemsByService', id: `LIST_${body.serviceId}` },
  ],
}),

// PUT /api/setup/service-items/{id}  (Body = ServiceItemUpdate)
updateServiceItem: builder.mutation<any, ServiceItemUpdate>({
  query: ({ id, ...rest }) => ({
    url: `/api/setup/service-items/${id}`,
    method: 'PUT',
    body: { id, ...rest },
  }),
  invalidatesTags: (_res, _err, body) => [
    { type: 'ServiceItems', id: body.id },
    { type: 'ServiceItems', id: 'LIST' },
    { type: 'ServiceItemsByService', id: `LIST_${body.serviceId}` },
  ],
}),

// PATCH /api/setup/service-items/{id}/toggle-active
toggleServiceItemIsActive: builder.mutation<any, { id: Id; serviceId: Id }>({
  query: ({ id }) => ({
    url: `/api/setup/service-items/${id}/toggle-active`,
    method: 'PATCH',
  }),
  invalidatesTags: (_res, _err, { id, serviceId }) => [
    { type: 'ServiceItems', id },
    { type: 'ServiceItems', id: 'LIST' },
    { type: 'ServiceItemsByService', id: `LIST_${serviceId}` },
  ],
}),

// DELETE /api/setup/service-items/{id}
deleteServiceItem: builder.mutation<void, { id: Id; serviceId: Id }>({
  query: ({ id }) => ({
    url: `/api/setup/service-items/${id}`,
    method: 'DELETE',
  }),
  invalidatesTags: (_res, _err, { id, serviceId }) => [
    { type: 'ServiceItems', id },
    { type: 'ServiceItems', id: 'LIST' },
    { type: 'ServiceItemsByService', id: `LIST_${serviceId}` },
  ],
}),

// GET /api/setup/service-items/sources/by-facility?type=&facilityId=
getServiceItemSourcesByFacility: builder.query<any[], { type: string; facilityId: Id }>({
  query: ({ type, facilityId }) => ({
    url: '/api/setup/service-items/sources/by-facility',
    params: { type, facilityId },
  }),
  providesTags: (_res, _err, { type, facilityId }) => [
    { type: 'ServiceItemsSources', id: `${type}_${facilityId}` },
  ],
}),
}),
});

export const {
  // SERVICES
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

  // SERVICE ITEMS
  useGetServiceItemsQuery,
  useGetServiceItemsByServiceQuery,
  useGetServiceItemByIdQuery,
  useAddServiceItemMutation,
  useUpdateServiceItemMutation,
  useToggleServiceItemIsActiveMutation,
  useDeleteServiceItemMutation,
  useGetServiceItemSourcesByFacilityQuery,
  useLazyGetServiceItemSourcesByFacilityQuery,
} = serviceService;
