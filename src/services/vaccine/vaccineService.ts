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

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const vaccineService = createApi({
  reducerPath: 'vaccineApi',
  baseQuery: BaseQuery,
  tagTypes: ['Vaccine'],
  endpoints: builder => ({
    getVaccines: builder.query<PagedResult<modelTypes.Vaccine>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/vaccine',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Vaccine'],
    }),

    getVaccineById: builder.query<modelTypes.Vaccine, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine/${id}`,
      }),
      providesTags: (_res, _err, { id }) => [{ type: 'Vaccine', id }, 'Vaccine'],
    }),

    getVaccinesByName: builder.query<PagedResult<modelTypes.Vaccine>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Vaccine'],
    }),

    getVaccinesByType: builder.query<PagedResult<modelTypes.Vaccine>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/by-type/${encodeURIComponent(type)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Vaccine'],
    }),

    getVaccinesByRoa: builder.query<PagedResult<modelTypes.Vaccine>, { roa: string } & PagedParams>({
      query: ({ roa, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/by-roa/${encodeURIComponent(roa)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Vaccine'],
    }),

    addVaccine: builder.mutation<modelTypes.Vaccine, modelTypes.Vaccine>({
      query: body => ({
        url: '/api/setup/vaccine',
        method: 'POST',
        body, 
      }),
      invalidatesTags: ['Vaccine'],
    }),

    updateVaccine: builder.mutation<modelTypes.Vaccine, { id: Id; data: modelTypes.Vaccine }>({
      query: ({ id, data }) => ({
        url: `/api/setup/vaccine/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Vaccine', id }, 'Vaccine'],
    }),

    toggleVaccineActive: builder.mutation<modelTypes.Vaccine, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Vaccine', id }, 'Vaccine'],
    }),

    deleteVaccine: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vaccine'],
    }),
  }),
});

export const {
  useGetVaccinesQuery,
  useLazyGetVaccinesQuery,
  useGetVaccineByIdQuery,
  useGetVaccinesByNameQuery,
  useLazyGetVaccinesByNameQuery,
  useGetVaccinesByTypeQuery,
  useLazyGetVaccinesByTypeQuery,
  useGetVaccinesByRoaQuery,
  useLazyGetVaccinesByRoaQuery,
  useAddVaccineMutation,
  useUpdateVaccineMutation,
  useToggleVaccineActiveMutation,
  useDeleteVaccineMutation,
} = vaccineService;
