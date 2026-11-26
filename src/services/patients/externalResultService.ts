import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

// One request carries the reviewed data and the original file
const toFormData = (data: unknown, file?: File | null) => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (file) formData.append('file', file);
  return formData;
};

export const externalResultService = createApi({
  reducerPath: 'externalResultApi',
  baseQuery: BaseQuery,
  tagTypes: ['ExternalLabResult', 'ExternalRadiologyReport'],
  endpoints: builder => ({
    saveExternalLabResults: builder.mutation<
      modelTypes.ExternalLabResult[],
      { data: modelTypes.SaveExternalLabResultsRequest; file?: File | null }
    >({
      query: ({ data, file }) => ({
        url: '/api/patient/external-results/lab',
        method: 'POST',
        body: toFormData(data, file)
      }),
      invalidatesTags: ['ExternalLabResult']
    }),

    saveExternalRadiologyReports: builder.mutation<
      modelTypes.ExternalRadiologyReport[],
      { data: modelTypes.SaveExternalRadiologyReportsRequest; file?: File | null }
    >({
      query: ({ data, file }) => ({
        url: '/api/patient/external-results/radiology',
        method: 'POST',
        body: toFormData(data, file)
      }),
      invalidatesTags: ['ExternalRadiologyReport']
    }),

    getExternalLabResultsByPatient: builder.query<modelTypes.ExternalLabResult[], number>({
      query: patientId => `/api/patient/external-results/lab/by-patient/${patientId}`,
      providesTags: ['ExternalLabResult']
    }),

    getExternalRadiologyReportsByPatient: builder.query<modelTypes.ExternalRadiologyReport[], number>({
      query: patientId => `/api/patient/external-results/radiology/by-patient/${patientId}`,
      providesTags: ['ExternalRadiologyReport']
    }),

    getExternalLabResultsByEncounter: builder.query<modelTypes.ExternalLabResult[], number>({
      query: encounterId => `/api/patient/external-results/lab/by-encounter/${encounterId}`,
      providesTags: ['ExternalLabResult']
    }),

    getExternalRadiologyReportsByEncounter: builder.query<modelTypes.ExternalRadiologyReport[], number>({
      query: encounterId => `/api/patient/external-results/radiology/by-encounter/${encounterId}`,
      providesTags: ['ExternalRadiologyReport']
    })
  })
});

export const {
  useSaveExternalLabResultsMutation,
  useSaveExternalRadiologyReportsMutation,
  useGetExternalLabResultsByPatientQuery,
  useGetExternalRadiologyReportsByPatientQuery,
  useGetExternalLabResultsByEncounterQuery,
  useGetExternalRadiologyReportsByEncounterQuery
} = externalResultService;
