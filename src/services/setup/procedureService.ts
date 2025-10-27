import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type WithFacility = { facilityId: Id };
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

// Reuse same pagination mapper
const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const procedureSetupService = createApi({
  reducerPath: 'newProcedureApi',
  baseQuery: BaseQuery,
  tagTypes: ['Procedure'],
  endpoints: (builder) => ({
    // ===== PROCEDURES (Paginated) =====
    getProcedures: builder.query<PagedResult<any>, WithFacility & PagedParams>({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/procedure',
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByCategory: builder.query<
      PagedResult<any>,
      WithFacility & { categoryType: string } & PagedParams
    >({
      query: ({ facilityId, categoryType, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-category/${encodeURIComponent(categoryType)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByCode: builder.query<
      PagedResult<any>,
      WithFacility & { code: string } & PagedParams
    >({
      query: ({ facilityId, code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-code/${encodeURIComponent(code)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByName: builder.query<
      PagedResult<any>,
      WithFacility & { name: string } & PagedParams
    >({
      query: ({ facilityId, name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-name/${encodeURIComponent(name)}`,
        params: { facilityId, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    // ===== PROCEDURES (Mutations) =====
    addProcedure: builder.mutation<any, WithFacility & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/procedure',
        method: 'POST',
        params: { facilityId },
        body: { ...body, facilityId },
      }),
      invalidatesTags: ['Procedure'],
    }),

    updateProcedure: builder.mutation<any, WithFacility & { id: Id } & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/procedure/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body, facilityId },
      }),
      invalidatesTags: ['Procedure'],
    }),

    toggleProcedureIsActive: builder.mutation<any, { id: Id; facilityId: Id }>({
      query: ({ id, facilityId }) => ({
        url: `/api/setup/procedure/${id}/toggle-active`,
        method: 'PATCH',
        params: { facilityId },
      }),
      invalidatesTags: ['Procedure'],
    }),
  }),
});

export const {
  // PROCEDURES
  useGetProceduresQuery,
  useGetProceduresByCategoryQuery,
  useLazyGetProceduresByCategoryQuery,
  useGetProceduresByCodeQuery,
  useLazyGetProceduresByCodeQuery,
  useGetProceduresByNameQuery,
  useLazyGetProceduresByNameQuery,
  useAddProcedureMutation,
  useUpdateProcedureMutation,
  useToggleProcedureIsActiveMutation,
} = procedureSetupService;
