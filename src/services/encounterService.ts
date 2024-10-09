import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApEncounter, ApPatientDiagnose, ApReviewOfSystem } from '@/types/model-types';

export const encounterService = createApi({
  reducerPath: 'encounterApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getEncounters: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/encounter-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getEncounterAppliedServices: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/encounter-service-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    completeEncounterRegistration: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/complete-encounter-registration`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    startEncounter: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/start-encounter`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    completeEncounter: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/complete-encounter`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveEncounterChanges: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/save-encounter-changes`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getEncounterReviewOfSystems: builder.query({
      query: (encounterKey: any) => ({
        headers: {
          encounterKey
        },
        url: `/encounter/encounter-review-of-systems`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    saveReviewOfSystem: builder.mutation({
      query: (request: any) => ({
        url: `/encounter/save-review-of-system`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removeReviewOfSystem: builder.mutation({
      query: (request: any) => ({
        url: `/encounter/remove-review-of-system`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getEncounterPhysicalExamAreas: builder.query({
      query: (encounterKey: any) => ({
        headers: {
          encounterKey
        },
        url: `/encounter/encounter-physical-exam-areas`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    savePhysicalExamArea: builder.mutation({
      query: (request: any) => ({
        url: `/encounter/save-physical-exam-area`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removePhysicalExamArea: builder.mutation({
      query: (request: any) => ({
        url: `/encounter/remove-physical-exam-area`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientDiagnosis: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/patient-diagnosis-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePatientDiagnose: builder.mutation({
      query: (patDiag: ApPatientDiagnose) => ({
        url: `/encounter/save-patient-diagnose`,
        method: 'POST',
        body: patDiag
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removePatientDiagnose: builder.mutation({
      query: (patDiag: ApPatientDiagnose) => ({
        url: `/encounter/remove-patient-diagnose`,
        method: 'POST',
        body: patDiag
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const {
  useGetEncountersQuery,
  useCompleteEncounterRegistrationMutation,
  useStartEncounterMutation,
  useCompleteEncounterMutation,
  useGetEncounterAppliedServicesQuery,
  useSaveEncounterChangesMutation,
  useGetEncounterReviewOfSystemsQuery,
  useSaveReviewOfSystemMutation,
  useRemoveReviewOfSystemMutation,
  useGetEncounterPhysicalExamAreasQuery,
  useSavePhysicalExamAreaMutation,
  useRemovePhysicalExamAreaMutation,
  useGetPatientDiagnosisQuery,
  useSavePatientDiagnoseMutation,
  useRemovePatientDiagnoseMutation
} = encounterService;
