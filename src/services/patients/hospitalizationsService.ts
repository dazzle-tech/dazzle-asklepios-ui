import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { Hospitalization } from '@/types/model-types-new';

type Id = number;
type PagedParams = { page: number; size: number; sort?: string };

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: any;
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const hospitalizationService = createApi({
  reducerPath: 'hospitalizationApi',
  baseQuery: BaseQuery,
  tagTypes: ['Hospitalization'],

  endpoints: builder => ({
    /* ========================= LIST ========================= */
    getHospitalizations: builder.query<
      PagedResult<Hospitalization>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/hospitalizations',
        params: { patientId, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Hospitalization']
    }),

    /* ========================= CREATE ========================= */
    addHospitalization: builder.mutation<Hospitalization, Hospitalization>({
      query: body => ({
        url: '/api/patient/hospitalizations',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Hospitalization']
    }),

    /* ========================= UPDATE ========================= */
    updateHospitalization: builder.mutation<Hospitalization, Hospitalization>({
      query: body => ({
        url: '/api/patient/hospitalizations',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Hospitalization']
    }),

    /* ========================= DELETE ========================= */
    deleteHospitalization: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/hospitalizations/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Hospitalization']
    })
  })
});

export const {
  useGetHospitalizationsQuery,
  useLazyGetHospitalizationsQuery,
  useAddHospitalizationMutation,
  useUpdateHospitalizationMutation,
  useDeleteHospitalizationMutation
} = hospitalizationService;