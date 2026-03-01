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

export const vaccineDosesIntervalService = createApi({
  reducerPath: 'vaccineDosesIntervalApi',
  baseQuery: BaseQuery,
  tagTypes: ['VaccineDosesInterval', 'VaccineDose'],
  endpoints: builder => ({
    getIntervalsByVaccineId: builder.query<
      PagedResult<modelTypes.VaccineDosesInterval>,
      { vaccineId: Id } & PagedParams
    >({
      query: ({ vaccineId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine/${vaccineId}/doses-intervals`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['VaccineDosesInterval']
    }),

    // ===================== NEW: GET ONE BY ID =====================
    getIntervalById: builder.query<modelTypes.VaccineDosesInterval, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-doses-interval/${id}`
      }),
      transformResponse: (response: any) =>
        (response?.data ?? response?.object ?? response) as modelTypes.VaccineDosesInterval,
      providesTags: (_res, _err, { id }) => [{ type: 'VaccineDosesInterval', id }, 'VaccineDosesInterval']
    }),

    getIntervalByFromDoseIdOne: builder.query<modelTypes.VaccineDosesInterval | null, { fromDoseId: Id }>({
      query: ({ fromDoseId }) => ({
        url: `/api/setup/vaccine-doses-interval/from-dose/${fromDoseId}/one`
      }),
      transformResponse: (response: any) => {
        if (response == null) return null;
        return (response?.data ?? response?.object ?? response) as modelTypes.VaccineDosesInterval;
      },
      providesTags: (_res, _err, { fromDoseId }) => [{ type: 'VaccineDosesInterval', id: fromDoseId }]
    }),

    createInterval: builder.mutation<
      modelTypes.VaccineDosesInterval,
      { vaccineId: Id; data: modelTypes.VaccineDosesInterval }
    >({
      query: ({ vaccineId, data }) => ({
        url: `/api/setup/vaccine/${vaccineId}/doses-intervals`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['VaccineDosesInterval']
    }),

    updateInterval: builder.mutation<
      modelTypes.VaccineDosesInterval,
      { id: Id; vaccineId: Id; data: modelTypes.VaccineDosesInterval }
    >({
      query: ({ id, vaccineId, data }) => ({
        url: `/api/setup/vaccine-doses-interval/${id}`,
        method: 'PUT',
        params: { vaccineId },
        body: data
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'VaccineDosesInterval', id }, 'VaccineDosesInterval']
    }),

    toggleIntervalActive: builder.mutation<modelTypes.VaccineDosesInterval, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-doses-interval/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'VaccineDosesInterval', id }, 'VaccineDosesInterval']
    }),

    getNextDoses: builder.query<modelTypes.VaccineDose[], { vaccineId: Id; fromDoseId: Id }>({
      query: ({ vaccineId, fromDoseId }) => ({
        url: `/api/setup/vaccine/${vaccineId}/doses/${fromDoseId}/next`
      }),
      providesTags: ['VaccineDose']
    })
  })
});

export const {
  useGetIntervalsByVaccineIdQuery,
  useLazyGetIntervalsByVaccineIdQuery,

  // NEW HOOKS
  useGetIntervalByIdQuery,
  useLazyGetIntervalByIdQuery,

  useGetIntervalByFromDoseIdOneQuery,
  useLazyGetIntervalByFromDoseIdOneQuery,
  useCreateIntervalMutation,
  useUpdateIntervalMutation,
  useToggleIntervalActiveMutation,
  useGetNextDosesQuery,
  useLazyGetNextDosesQuery
} = vaccineDosesIntervalService;
