import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../api';
import { fromListRequestToQueryParams } from '@/utils';

export const recoveryService = createApi({
  reducerPath: 'recoveryApi',
  baseQuery: baseQuery,

  endpoints: (builder) => ({
    // ===== Arrival =====
    saveArrival: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-arrival',
        method: 'POST',
        body,
      }),
    }),
    getArrivalList: builder.query({
      query: (params) => `/recovery/arrival-list?${fromListRequestToQueryParams(params)}`,
    }),
    getArrivalByOperation: builder.query({
      query: (operationKey) => `/recovery/arrival-by-operation?operationKey=${operationKey}`,
    }),

    // ===== Anesthesia Recovery =====
    saveAnesthesiaRecovery: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-anesthesia-recovery',
        method: 'POST',
        body,
      }),
    }),
    getAnesthesiaRecoveryList: builder.query({
      query: (params) => `/recovery/anesthesia-recovery-list?${fromListRequestToQueryParams(params)}`,
    }),
    getAnesthesiaRecoveryByOperation: builder.query({
      query: (operationKey) => `/recovery/anesthesia-recovery-by-operation?operationKey=${operationKey}`,
    }),

    // ===== Continuous Vitals =====
    saveContinuousVitals: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-continuous-vitals',
        method: 'POST',
        body,
      }),
    }),
    getContinuousVitalsList: builder.query({
      query: (params) => `/recovery/continuous-vitals-list?${fromListRequestToQueryParams(params)}`,
    }),
    getContinuousVitalsByOperation: builder.query({
      query: (operationKey) => `/recovery/continuous-vitals-by-operation?operationKey=${operationKey}`,
    }),

    // ===== Nursing Care =====
    saveNursingCare: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-nursing-care',
        method: 'POST',
        body,
      }),
    }),
    getNursingCareList: builder.query({
      query: (params) => `/recovery/nursing-care-list?${fromListRequestToQueryParams(params)}`,
    }),
    getNursingCareByOperation: builder.query({
      query: (operationKey) => `/recovery/nursing-care-by-operation?operationKey=${operationKey}`,
    }),

    // ===== Discharge Readiness =====
    saveDischargeReadiness: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-discharge-readiness',
        method: 'POST',
        body,
      }),
    }),
    getDischargeReadinessList: builder.query({
      query: (params) => `/recovery/discharge-readiness-list?${fromListRequestToQueryParams(params)}`,
    }),
    getDischargeReadinessByOperation: builder.query({
      query: (operationKey) => `/recovery/discharge-readiness-by-operation?operationKey=${operationKey}`,
    }),

    // ===== Discharge to Ward =====
    saveDischargeToWard: builder.mutation({
      query: (body) => ({
        url: '/recovery/save-discharge-to-ward',
        method: 'POST',
        body,
      }),
    }),
    getDischargeToWardList: builder.query({
      query: (params) => `/recovery/discharge-to-ward-list?${fromListRequestToQueryParams(params)}`,
    }),
    getDischargeToWardByOperation: builder.query({
      query: (operationKey) => `/recovery/discharge-to-ward-by-operation?operationKey=${operationKey}`,
    }),
    getRecoveryAntiemeticGivenList: builder.query({
      query: (params) => `/recovery/antiemetic-given-list?${fromListRequestToQueryParams(params)}`,
    }),
    saveRecoveryAntiemeticGiven:
     builder.mutation({
      query: (body) => ({
        url: '/recovery/save-antiemetic-given',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSaveArrivalMutation,
  useGetArrivalListQuery,
  useGetArrivalByOperationQuery,

  useSaveAnesthesiaRecoveryMutation,
  useGetAnesthesiaRecoveryListQuery,
  useGetAnesthesiaRecoveryByOperationQuery,

  useSaveContinuousVitalsMutation,
  useGetContinuousVitalsListQuery,
  useGetContinuousVitalsByOperationQuery,

  useSaveNursingCareMutation,
  useGetNursingCareListQuery,
  useGetNursingCareByOperationQuery,

  useSaveDischargeReadinessMutation,
  useGetDischargeReadinessListQuery,
  useGetDischargeReadinessByOperationQuery,

  useSaveDischargeToWardMutation,
  useGetDischargeToWardListQuery,
  useGetDischargeToWardByOperationQuery,

  useGetRecoveryAntiemeticGivenListQuery,
  useSaveRecoveryAntiemeticGivenMutation,
} = recoveryService;
