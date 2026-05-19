import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { CurrentMedication } from '@/types/model-types-new';

type Id = number;

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  showCancelled?: boolean;
};

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
    getCurrentMedications: builder.query<
      PagedResult<CurrentMedication>,
      { patientId: Id } & PagedParams
    >({
      query: ({
        patientId,
        page,
        size,
        sort = 'id,desc',
        showCancelled = false
      }) => ({
        url: '/api/patient/current-medication',
        params: {
          patientId,
          page,
          size,
          sort,
          showCancelled
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['CurrentMedication']
    }),

    addCurrentMedication: builder.mutation<
      CurrentMedication,
      CurrentMedication
    >({
      query: body => ({
        url: '/api/patient/current-medication',
        method: 'POST',
        body
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    updateCurrentMedication: builder.mutation<
      CurrentMedication,
      CurrentMedication
    >({
      query: body => ({
        url: '/api/patient/current-medication',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    cancelCurrentMedication: builder.mutation<
      CurrentMedication,
      { id: number; cancellationReason?: string }
    >({
      query: body => ({
        url: '/api/patient/current-medication/cancel',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    deleteCurrentMedication: builder.mutation<
      void,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/current-medication/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['CurrentMedication']
    }),

    checkCurrentMedicationExists: builder.query<
      boolean,
      { patientId: Id; activeIngredientId: Id }
    >({
      query: ({ patientId, activeIngredientId }) => ({
        url: '/api/patient/current-medication/exists',
        params: {
          patientId,
          activeIngredientId
        }
      })
    })
  })
});

export const {
  useGetCurrentMedicationsQuery,
  useLazyGetCurrentMedicationsQuery,
  useAddCurrentMedicationMutation,
  useUpdateCurrentMedicationMutation,
  useCancelCurrentMedicationMutation,
  useDeleteCurrentMedicationMutation,
  useCheckCurrentMedicationExistsQuery,
  useLazyCheckCurrentMedicationExistsQuery
} = currentMedicationService;