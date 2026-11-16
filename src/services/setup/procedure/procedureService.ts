import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type { ProcedureItemCreate, ProcedureItemUpdate } from '@/types/model-types-new';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number; isActive?: boolean };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const procedureSetupService = createApi({
  reducerPath: 'procedureSetupService',
  baseQuery: BaseQuery,
  tagTypes: ['Procedure', 'ProcedureItemsByProcedure'],
  endpoints: builder => ({
    // ===== PROCEDURES (Paginated) =====
    getProcedures: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', isActive }) => ({
        url: '/api/setup/procedure',
        params: { page, size, sort, isActive }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    getProceduresByCategory: builder.query<
      PagedResult<any>,
      { categoryType: string } & PagedParams
    >({
      query: ({ categoryType, page, size, sort = 'id,asc', isActive }) => ({
        url: `/api/setup/procedure/by-category/${encodeURIComponent(categoryType)}`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    getProceduresByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc', isActive }) => ({
        url: `/api/setup/procedure/by-code/${encodeURIComponent(code)}`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    getProceduresByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc', isActive }) => ({
        url: `/api/setup/procedure/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),
    addProcedure: builder.mutation<any, { facilityId: Id } & any>({
      query: ({ facilityId, ...body }) => ({
        url: '/api/setup/procedure',
        method: 'POST',
        params: { facilityId },
        body
      }),
      invalidatesTags: ['Procedure']
    }),

    updateProcedure: builder.mutation<any, { facilityId: Id; id: Id } & any>({
      query: ({ facilityId, id, ...body }) => ({
        url: `/api/setup/procedure/${id}`,
        method: 'PUT',
        params: { facilityId },
        body: { id, ...body }
      }),
      invalidatesTags: ['Procedure']
    }),

    toggleProcedureIsActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Procedure']
    }),
    getProceduresByFacility: builder.query<
      PagedResult<any>,
      { facilityId: Id; category?: Id } & PagedParams
    >({
      query: ({ facilityId, category, page, size, sort = 'id,asc', isActive }) => ({
        url: `/api/setup/procedure/by-facility/${encodeURIComponent(String(facilityId))}`,
        params: { page, size, sort, isActive, ...(category ? { category } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    getActiveAppointableProcedures: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/active-appointable`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    getProcedureById: builder.query<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure/${id}`
      }),
      providesTags: ['Procedure']
    }),

    getProceduresByIds: builder.query<any[], number[]>({
      query: ids => ({
        url: '/api/setup/procedure/by-ids',
        params: { ids }
      }),
      providesTags: ['Procedure']
    }),
    getActiveProceduresByFacility: builder.query<
      PagedResult<any>,
      { facilityId: Id } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure/active/by-facility/${encodeURIComponent(String(facilityId))}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

        getActiveProceduresByFacilityAndCategorySearch: builder.query<
      PagedResult<any>,
      { facilityId: Id; category: Id; name: string } & PagedParams
    >({
      query: ({ facilityId, category, name, page, size, sort = 'name,asc' }) => ({
        url: `/api/setup/procedure/active/by-facility/${encodeURIComponent(
          String(facilityId)
        )}/by-category/search`,
        params: {
          page,
          size,
          sort,
          category,
          name
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),


    getActiveProceduresByFacilityAndCategory: builder.query<
      PagedResult<any>,
      { facilityId: Id; category: Id } & PagedParams
    >({
      query: ({ facilityId, category, page, size, sort = 'name,asc' }) => ({
        url: `/api/setup/procedure/active/by-facility/${encodeURIComponent(
          String(facilityId)
        )}/by-category`,
        params: { page, size, sort, category }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure']
    }),

    // GET /api/setup/procedure/by-department?sourceId=...&specialty=...
    // Default procedures of a visit department/specialty.
    getProceduresByDepartment: builder.query<
      PagedResult<any>,
      { sourceId: Id; specialty?: string | null } & PagedParams
    >({
      query: ({ sourceId, specialty, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/procedure/by-department',
        params: {
          sourceId,
          ...(specialty != null && specialty !== '' ? { specialty } : {}),
          page,
          size,
          sort
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['Procedure', 'ProcedureItemsByProcedure']
    }),

    // ===== PROCEDURE ITEMS (procedure -> department + specialty links) =====
    getProcedureItemsByProcedure: builder.query<
      PagedResult<any>,
      { procedureId: Id } & PagedParams
    >({
      query: ({ procedureId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure-items/by-procedure/${encodeURIComponent(String(procedureId))}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: (_result, _error, args) => [
        { type: 'ProcedureItemsByProcedure', id: `LIST_${args.procedureId}` }
      ]
    }),

    addProcedureItem: builder.mutation<any, ProcedureItemCreate>({
      query: body => ({
        url: '/api/setup/procedure-items',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'ProcedureItemsByProcedure', id: `LIST_${body.procedureId}` }
      ]
    }),

    updateProcedureItem: builder.mutation<any, ProcedureItemUpdate>({
      query: ({ id, ...rest }) => ({
        url: `/api/setup/procedure-items/${id}`,
        method: 'PUT',
        body: { id, ...rest }
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'ProcedureItemsByProcedure', id: `LIST_${body.procedureId}` }
      ]
    }),

    toggleProcedureItemIsActive: builder.mutation<any, { id: Id; procedureId: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure-items/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: (_result, _error, { procedureId }) => [
        { type: 'ProcedureItemsByProcedure', id: `LIST_${procedureId}` }
      ]
    }),

    getProcedureItemSourcesByFacility: builder.query<any[], { type: string; facilityId: Id }>({
      query: ({ type, facilityId }) => ({
        url: '/api/setup/procedure-items/sources/by-facility',
        params: { type, facilityId }
      })
    })
  })
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
  useGetActiveAppointableProceduresQuery,
  useGetProcedureByIdQuery,
  useLazyGetProcedureByIdQuery,
  useGetProceduresByIdsQuery,
  useGetActiveProceduresByFacilityQuery,
  useLazyGetActiveProceduresByFacilityQuery,
  useGetActiveProceduresByFacilityAndCategoryQuery,
  useLazyGetActiveProceduresByFacilityAndCategoryQuery,
  useGetActiveProceduresByFacilityAndCategorySearchQuery,
  useLazyGetActiveProceduresByFacilityAndCategorySearchQuery,
  useGetProceduresByDepartmentQuery,
  useLazyGetProceduresByDepartmentQuery,
  useGetProcedureItemsByProcedureQuery,
  useAddProcedureItemMutation,
  useUpdateProcedureItemMutation,
  useToggleProcedureItemIsActiveMutation,
  useLazyGetProcedureItemSourcesByFacilityQuery
} = procedureSetupService;
