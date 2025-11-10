// src/services/vaccineBrandsService.ts
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

export const vaccineBrandsService = createApi({
  reducerPath: 'vaccineBrandsApi',
  baseQuery: BaseQuery,
  tagTypes: ['VaccineBrand'],
  endpoints: (builder) => ({
    // ====================== LIST BY VACCINE (Paged) ======================
    getVaccineBrandsByVaccine: builder.query<
      PagedResult<modelTypes.VaccineBrand>,
      { vaccineId: Id } & PagedParams
    >({
      query: ({ vaccineId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/vaccine-brands/by-vaccine/${vaccineId}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (_res, _err, { vaccineId }) => [{ type: 'VaccineBrand', id: `vaccine-${vaccineId}` }, 'VaccineBrand'],
    }),

    // ====================== CREATE ======================
    addVaccineBrand: builder.mutation<
      modelTypes.VaccineBrand,
      { vaccineId: Id; data: modelTypes.VaccineBrand }
    >({
      query: ({ vaccineId, data }) => ({
        url: '/api/setup/vaccine-brands',
        method: 'POST',
        params: { vaccineId },
        body: data, // 👈 استخدم الأوبجكت كما هو
      }),
      invalidatesTags: (_res, _err, { vaccineId }) => [
        { type: 'VaccineBrand', id: `vaccine-${vaccineId}` },
        'VaccineBrand',
      ],
    }),

    // ====================== UPDATE ======================
    updateVaccineBrand: builder.mutation<
      modelTypes.VaccineBrand,
      { id: Id; vaccineId: Id; data: modelTypes.VaccineBrand }
    >({
      query: ({ id, vaccineId, data }) => ({
        url: `/api/setup/vaccine-brands/${id}`,
        method: 'PUT',
        params: { vaccineId },
        body: data, // 👈 نفس الشي، أوبجكت كامل
      }),
      invalidatesTags: (_res, _err, { id, vaccineId }) => [
        { type: 'VaccineBrand', id },
        { type: 'VaccineBrand', id: `vaccine-${vaccineId}` },
        'VaccineBrand',
      ],
    }),

    // ====================== TOGGLE ACTIVE ======================
    toggleVaccineBrandActive: builder.mutation<modelTypes.VaccineBrand, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/vaccine-brands/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'VaccineBrand', id }, 'VaccineBrand'],
    }),
  }),
});

export const {
  // QUERIES
  useGetVaccineBrandsByVaccineQuery,
  useLazyGetVaccineBrandsByVaccineQuery,

  // MUTATIONS
  useAddVaccineBrandMutation,
  useUpdateVaccineBrandMutation,
  useToggleVaccineBrandActiveMutation,
} = vaccineBrandsService;
