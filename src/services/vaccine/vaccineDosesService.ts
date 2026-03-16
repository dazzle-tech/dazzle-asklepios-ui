import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };

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

export const vaccineDosesService = createApi({
  reducerPath: 'vaccineDosesApi',
  baseQuery: BaseQuery,
  tagTypes: ['VaccineDose'],
  endpoints: builder => ({
    getVaccineDosesByVaccineId: builder.query<
      PagedResult<modelTypes.VaccineDose>,
      { vaccineId: Id } & PagedParams
    >({
      query: ({ vaccineId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/${vaccineId}/doses`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['VaccineDose']
    }),

    getVaccineDoses: builder.query<PagedResult<modelTypes.VaccineDose>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/doses`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['VaccineDose']
    }),
     
    getVaccineDosesByIds: builder.query<modelTypes.VaccineDose[], { ids: Id[] }>({
      query: ({ ids }) => ({
        url: `/api/setup/vaccine-doses/by-ids`,
        params: { ids }
      }),
      transformResponse: (res: any) => res ?? [],
      providesTags: (res) =>
        res && Array.isArray(res)
          ? [...res.map((d: any) => ({ type: 'VaccineDose' as const, id: d.id })), 'VaccineDose']
          : ['VaccineDose']
    }),

    getVaccineDoseById: builder.query<modelTypes.VaccineDose, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-doses/${id}`
      }),
      providesTags: (_res, _err, { id }) => [{ type: 'VaccineDose', id }, 'VaccineDose']
    }),

    addVaccineDose: builder.mutation<
      modelTypes.VaccineDose,
      { vaccineId: Id; data: modelTypes.VaccineDose }
    >({
      query: ({ vaccineId, data }) => ({
        url: `/api/setup/vaccine/${vaccineId}/doses`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['VaccineDose']
    }),

    updateVaccineDose: builder.mutation<
      modelTypes.VaccineDose,
      { id: Id; data: Partial<modelTypes.VaccineDose> }
    >({
      query: ({ id, data }) => ({
        url: `/api/setup/vaccine-doses/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'VaccineDose', id }, 'VaccineDose']
    }),

    toggleVaccineDoseActive: builder.mutation<modelTypes.VaccineDose, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-doses/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'VaccineDose', id }, 'VaccineDose']
    }),

    getDoseNumbersUpTo: builder.query<string[], { numberOfDoses: string }>({
      query: ({ numberOfDoses }) => ({
        url: `/api/setup/vaccine-doses/dose-numbers/up-to/${numberOfDoses}`
      }),
      providesTags: ['VaccineDose']
    }),

    getNextVaccineDose: builder.query<modelTypes.VaccineDose | null, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-doses/${id}/next`
      }),
      transformResponse: (response: any) => response ?? null,
      providesTags: (_res, _err, { id }) => [{ type: 'VaccineDose', id }, 'VaccineDose']
    })
  })
});

export const {
  useGetVaccineDosesByVaccineIdQuery,
  useGetVaccineDosesQuery,
  useLazyGetVaccineDosesByVaccineIdQuery,
  useGetDoseNumbersUpToQuery,
  useAddVaccineDoseMutation,
  useUpdateVaccineDoseMutation,
  useToggleVaccineDoseActiveMutation,
  useGetNextVaccineDoseQuery,
  useLazyGetNextVaccineDoseQuery,
  useGetVaccineDoseByIdQuery,
  useLazyGetVaccineDoseByIdQuery,
  useGetVaccineDosesByIdsQuery,
  useLazyGetVaccineDosesByIdsQuery
} = vaccineDosesService;
