import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { ServiceItemCreate, ServiceItemUpdate } from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';
type Id = number | string;
type WithFacility = { facilityId: Id };
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

// Helper to unify pagination mapping from headers
const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const serviceService = createApi({
  reducerPath: 'newServiceApi',
  baseQuery: BaseQuery,
  tagTypes: ['Service', 'ServiceItems', 'ServiceItemsByService', 'ServiceItemsSources'],
  endpoints: (builder) => ({

    // ===== SERVICES (Paginated) =====
    getServices: builder.query<PagedResult<any>, WithFacility & PagedParams>({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service',
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Service'],
    }),

    getServicesByCategory: builder.query<
      PagedResult<any>,
      WithFacility & { category: string } & PagedParams
    >({
      query: ({ facilityId, category, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/service/by-category/${encodeURIComponent(category)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Service'],
    }),

    getServicesByCode: builder.query<
      PagedResult<any>,
      WithFacility & { code: string } & PagedParams
    >({
      query: ({ facilityId, code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/service/by-code/${encodeURIComponent(code)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Service'],
    }),

    getServicesByName: builder.query<
      PagedResult<any>,
      WithFacility & { name: string } & PagedParams
    >({
      query: ({ facilityId, name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/service/by-name/${encodeURIComponent(name)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Service'],
    }),

    // ===== SERVICES (Mutations - unchanged) =====
    addService: builder.mutation<any, WithFacility & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/service',
        method: 'POST',
        params: { facilityId },
        body: { ...body, facilityId },
      }),
      invalidatesTags: ['Service'],
    }),

    updateService: builder.mutation<any, WithFacility & { id: Id } & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/service/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body, facilityId },
      }),
      invalidatesTags: ['Service'],
    }),

    toggleServiceIsActive: builder.mutation<any, { id: Id; facilityId: Id }>({
      query: ({ id, facilityId }) => ({
        url: `/api/setup/service/${id}/toggle-active`,
        method: 'PATCH',
        params: { facilityId },
      }),
      invalidatesTags: ['Service'],
    }),

    // ===== SERVICE ITEMS (Paginated) =====
    getServiceItems: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/service-items',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((i: any) => ({ type: 'ServiceItems' as const, id: i.id })),
              { type: 'ServiceItems', id: 'LIST' },
            ]
          : [{ type: 'ServiceItems', id: 'LIST' }],
    }),

    getServiceItemsByService: builder.query<PagedResult<any>, { serviceId: Id } & PagedParams>({
      query: ({ serviceId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/service-items/by-service/${serviceId}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (result, _err, args) =>
        result?.data
          ? [
              ...result.data.map((i: any) => ({ type: 'ServiceItemsByService' as const, id: i.id })),
              { type: 'ServiceItemsByService', id: `LIST_${args.serviceId}` },
            ]
          : [{ type: 'ServiceItemsByService', id: `LIST_${args.serviceId}` }],
    }),

    // ===== SERVICE ITEMS (Non-paginated) =====
    getServiceItemById: builder.query<any, Id>({
      query: (id) => `/api/setup/service-items/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'ServiceItems', id }],
    }),

    addServiceItem: builder.mutation<any, ServiceItemCreate>({
      query: (body) => ({
        url: '/api/setup/service-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, body) => [
        { type: 'ServiceItems', id: 'LIST' },
        { type: 'ServiceItemsByService', id: `LIST_${body.serviceId}` },
      ],
    }),

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
