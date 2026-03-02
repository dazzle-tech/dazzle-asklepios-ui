import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export const patientInsuranceCoveragesService = createApi({
  reducerPath: 'patientInsuranceCoveragesApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientInsuranceCoverage'],

  endpoints: builder => ({
    // GET coverages by insurance (paged)
    getCoveragesByInsurance: builder.query<any, any>({
      query: ({ insuranceId, page, size, sort }) => ({
        url: `/api/patient/insurance-coverages/insurance/${insuranceId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientInsuranceCoverage']
    }),

    // CREATE coverage
    addPatientInsuranceCoverage: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/insurance-coverages',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientInsuranceCoverage']
    }),

    // UPDATE coverage
    updatePatientInsuranceCoverage: builder.mutation<any, any>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/insurance-coverages/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientInsuranceCoverage']
    }),

    // DELETE coverage
    deletePatientInsuranceCoverage: builder.mutation<any, any>({
      query: ({ id }) => ({
        url: `/api/patient/insurance-coverages/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PatientInsuranceCoverage']
    })
  })
});

export const {
  useGetCoveragesByInsuranceQuery,
  useLazyGetCoveragesByInsuranceQuery,

  useAddPatientInsuranceCoverageMutation,
  useUpdatePatientInsuranceCoverageMutation,
  useDeletePatientInsuranceCoverageMutation
} = patientInsuranceCoveragesService;
