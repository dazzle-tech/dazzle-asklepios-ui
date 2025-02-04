import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApConsultationOrder, ApCustomeInstructions, ApDrugOrder, ApDrugOrderMedications, ApEncounter, ApPatientDiagnose, ApPatientEncounterOrder, ApPatientPlan, ApPrescription, ApPrescriptionMedications, ApProcedure, ApReviewOfSystem, ApVisitAllergies } from '@/types/model-types';

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
      keepUnusedDataFor:5
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
    }),
    savePatientPlan: builder.mutation({
      query: (patPlan: ApPatientPlan) => ({
        url: `/encounter/save-patient-plan`,
        method: 'POST',
        body: patPlan
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientPlans: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/patient-plan-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePatientEncounterOrder: builder.mutation({
      query: (patEncounterOrder: ApPatientEncounterOrder) => ({
        url: `/encounter/save-patient-encounter-order`,
        method: 'POST',
        body: patEncounterOrder
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientEncounterOrders: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/patient-encounter-order-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removePatientEncounterOrder: builder.mutation({
      query: (patEncounterOrder: ApPatientEncounterOrder) => ({
        url: `/encounter/remove-encounter-order`,
        method: 'POST',
        body: patEncounterOrder,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;   
      }
    }),
    GetPrescriptions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/prescription-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    SavePrescription: builder.mutation({
      query: (prescription: ApPrescription) => ({
        url: `/encounter/save-prescription`,
        method: 'POST',
        body: prescription
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    GetPrescriptionMedications: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/prescription-medic-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    SavePrescriptionMedication: builder.mutation({
      query: (prescriptionmed: ApPrescriptionMedications) => ({
        url: `/encounter/save-prescription-medication`,
        method: 'POST',
        body: prescriptionmed
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    GetCustomeInstructions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/custome-instructions-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    SaveCustomeInstructions: builder.mutation({
      query: (co: ApCustomeInstructions) => ({
        url: `/encounter/save-custome-instructions`,
        method: 'POST',
        body: co
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getConsultationOrders: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/consultation-orders-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
   saveConsultationOrders: builder.mutation({
      query: (consultation: ApConsultationOrder) => ({
        url: `/encounter/save-consultation-orders`,
        method: 'POST',
        body: consultation
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDrugOrder: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/drug_order-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    SaveDrugOrder: builder.mutation({
      query: (co: ApDrugOrder) => ({
        url: `/encounter/save-drug-order`,
        method: 'POST',
        body: co
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDrugOrderMedication: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/drug-order-medic-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
   saveDrugOrderMedication: builder.mutation({
      query: (order: ApDrugOrderMedications) => ({
        url: `/encounter/save-drug-order-medic`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getProcedures: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/procedures-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
   saveProcedures: builder.mutation({
      query: (order: ApProcedure) => ({
        url: `/encounter/save-procedures`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

   
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
  useRemovePatientDiagnoseMutation,
  useSavePatientPlanMutation,
  useGetPatientPlansQuery,
  useSavePatientEncounterOrderMutation,
  useGetPatientEncounterOrdersQuery,
  useRemovePatientEncounterOrderMutation,
  useGetPrescriptionsQuery,
 useSavePrescriptionMutation,
 useGetPrescriptionMedicationsQuery,
 useSavePrescriptionMedicationMutation,
 useGetCustomeInstructionsQuery,
 useSaveCustomeInstructionsMutation,
 useGetConsultationOrdersQuery,
 useSaveConsultationOrdersMutation,
 useGetDrugOrderQuery,
 useSaveDrugOrderMutation,
 useGetDrugOrderMedicationQuery,
 useSaveDrugOrderMedicationMutation,
 useGetProceduresQuery,
 useSaveProceduresMutation

  
} = encounterService;

