import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

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
    getProcedures: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/procedure',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByCategory: builder.query<
      PagedResult<any>,
      { categoryType: string } & PagedParams
    >({
      query: ({ categoryType, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-category/${encodeURIComponent(categoryType)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByCode: builder.query<
      PagedResult<any>,
      { code: string } & PagedParams
    >({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-code/${encodeURIComponent(code)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

    getProceduresByName: builder.query<
      PagedResult<any>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),
    addProcedure: builder.mutation<any, { facilityId: Id } & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/procedure',
        method: 'POST',
        params: { facilityId },
        body, 
      }),
      invalidatesTags: ['Procedure'],
    }),

    updateProcedure: builder.mutation<any, { facilityId: Id; id: Id } & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/procedure/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body }, 
      }),
      invalidatesTags: ['Procedure'],
    }),

    toggleProcedureIsActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Procedure'],
    }),
    getProceduresByFacility: builder.query<
      PagedResult<any>,
      { facilityId: Id } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/by-facility/${encodeURIComponent(String(facilityId))}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure'],
    }),

  }),
});

export const {
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
   useGetProceduresByFacilityQuery,      
  useLazyGetProceduresByFacilityQuery,   
} = procedureSetupService;
