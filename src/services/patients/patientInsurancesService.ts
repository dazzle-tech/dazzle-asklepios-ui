import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export const patientInsurancesService = createApi({
  reducerPath: 'patientInsurancesApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientInsurance'],

  endpoints: builder => ({
    // GET all insurances
    getAllInsurances: builder.query<any, any>({
      query: ({ page, size, sort }) => ({
        url: '/api/patient/insurances',
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientInsurance']
    }),

    // GET all insurances for a specific patient (paged)
    getInsurancesByPatient: builder.query<any, any>({
      query: ({ patientId, page, size, sort }) => ({
        url: `/api/patient/insurances/patient/${patientId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientInsurance']
    }),

    // CREATE insurance
    addPatientInsurance: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/insurances',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientInsurance']
    }),

    // UPDATE insurance
    updatePatientInsurance: builder.mutation<any, any>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/insurances/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientInsurance']
    }),

    // DELETE insurance
    deletePatientInsurance: builder.mutation<any, any>({
  query: ({ id, deleteCoverages = false }) => ({
    url: `/api/patient/insurances/${id}`,
    method: 'DELETE',
    params: { deleteCoverages }
  }),
  invalidatesTags: ['PatientInsurance']
})
,

    // COUNT coverages for insurance
getInsuranceCoveragesCount: builder.query<any, any>({
  query: ({ id }) => ({
    url: `/api/patient/insurances/${id}/coverages/count`,
    method: 'GET'
  })
}),

  })
});

export const {
  useGetAllInsurancesQuery,
  useLazyGetAllInsurancesQuery,

  useGetInsurancesByPatientQuery,
  useLazyGetInsurancesByPatientQuery,

  useAddPatientInsuranceMutation,
  useUpdatePatientInsuranceMutation,
  useDeletePatientInsuranceMutation,
  useLazyGetInsuranceCoveragesCountQuery,

} = patientInsurancesService;
