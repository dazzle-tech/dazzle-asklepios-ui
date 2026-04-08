import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { CurrentMedication } from '@/types/model-types-new';

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

export const currentMedicationService = createApi({
  reducerPath: 'currentMedicationApi',
  baseQuery: BaseQuery,
  tagTypes: ['CurrentMedication'],

  endpoints: builder => ({
    getCurrentMedications: builder.query<PagedResult<CurrentMedication>, { patientId: Id } & PagedParams>({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/current-medication',
        params: { patientId, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['CurrentMedication']
    }),

    addCurrentMedication: builder.mutation<CurrentMedication, CurrentMedication>({
      query: body => ({
        url: '/api/patient/current-medication',
        method: 'POST',
        body
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    updateCurrentMedication: builder.mutation<CurrentMedication, CurrentMedication>({
      query: body => ({
        url: '/api/patient/current-medication',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    deleteCurrentMedication: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/current-medication/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['CurrentMedication']
    })
  })
});

export const {
  useGetCurrentMedicationsQuery,
  useLazyGetCurrentMedicationsQuery,
  useAddCurrentMedicationMutation,
  useUpdateCurrentMedicationMutation,
  useDeleteCurrentMedicationMutation
} = currentMedicationService;