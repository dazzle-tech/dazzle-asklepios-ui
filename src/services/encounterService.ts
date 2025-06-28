import { ApAdmitOutpatientInpatient, ApAudiometryPuretone, ApBedTransactions, ApElectrocardiogramEcg, ApOptometricExam, ApProcedureRegistration, ApTreadmillStress } from './../types/model-types';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApConsultationOrder,
  ApCustomeInstructions,
  ApDiagnosticOrders,
  ApDiagnosticOrderTests,
  ApDrugOrder, ApDrugOrderMedications,
  ApEncounter, ApPatientDiagnose,
  ApPatientEncounterOrder,
  ApPatientPlan, ApPrescription,
  ApPrescriptionMedications, ApProcedure, ApReviewOfSystem, ApVisitAllergies, ApPsychologicalExam, ApDiagnosticOrderTestsNotes, ApDiagnosticOrderTestsSamples
} from '@/types/model-types';
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
    getEncounterById: builder.query({
      query: (patientId: string) => ({
        url: `/encounter/get-encounter-by-id`,
        params: {
          key: patientId,
        }

      }),
      transformResponse: (response: any) => {
        return response.object;
      }
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
      keepUnusedDataFor: 0
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

    getDiagnosticOrder: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/diagnostic-order-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticOrder: builder.mutation({
      query: (order: ApDiagnosticOrders) => ({
        url: `/encounter/save-diagnostic-order`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDiagnosticOrderTest: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/diagnostic-order-test-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDiagnosticOrderTest: builder.mutation({
      query: (order: ApDiagnosticOrderTests) => ({
        url: `/encounter/save-diagnostic-order-tests`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getOrderTestNotesByTestId: builder.query({
      query: (testid: string) => ({
        headers: {
          testid
        },
        url: `/encounter/diagnostic-order-test-notes-list`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5

    }),
    saveDiagnosticOrderTestNotes: builder.mutation({
      query: (note: ApDiagnosticOrderTestsNotes) => ({
        url: `/encounter/save-diagnostic-order-tests-notes`,
        method: 'POST',
        body: note
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getOrderTestSamplesByTestId: builder.query({
      query: (testid: string) => ({
        headers: {
          testid
        },
        url: `/encounter/diagnostic-order-test-samples-list`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5

    }),
    saveDiagnosticOrderTestSamples: builder.mutation({
      query: (note: ApDiagnosticOrderTestsSamples) => ({
        url: `/encounter/save-diagnostic-order-tests-sample`,
        method: 'POST',
        body: note
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    savePsychologicalExams: builder.mutation({
      query: (psychologicalExam: ApPsychologicalExam) => ({
        url: `/encounter/save-psychological-exam`,
        method: 'POST',
        body: psychologicalExam
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPsychologicalExams: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/psychological-exam-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveAudiometryPuretone: builder.mutation({
      query: (audiometryPuretone: ApAudiometryPuretone) => ({
        url: `/encounter/save-audiometry-puretone`,
        method: 'POST',
        body: audiometryPuretone
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getAudiometryPuretones: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/audiometry-puretone-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveOptometricExam: builder.mutation({
      query: (optometricExam: ApOptometricExam) => ({
        url: `/encounter/save-optometric-exam`,
        method: 'POST',
        body: optometricExam
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getOptometricExams: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/optometric-exam-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveTreadmillStresse: builder.mutation({
      query: (treadmillStress: ApTreadmillStress) => ({
        url: `/encounter/save-treadmill-stress`,
        method: 'POST',
        body: treadmillStress
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getTreadmillStresses: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/treadmill-stress-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveComplaintSymptoms: builder.mutation({
      query: (treadmillStress: ApTreadmillStress) => ({
        url: `/encounter/save-complaint-symptoms`,
        method: 'POST',
        body: treadmillStress
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getComplaintSymptoms: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/complaint-symptoms-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveElectrocardiogramECG: builder.mutation({
      query: (electrocardiogramEcg: ApElectrocardiogramEcg) => ({
        url: `/encounter/save-electrocardiogram-ecg`,
        method: 'POST',
        body: electrocardiogramEcg
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getElectrocardiogramECGs: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/electrocardiogram-ecg-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    dischargeInpatientEncounter: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/discharge-inpatient-encounter`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    admitToInpatientEncounter: builder.mutation({
      query: (admit: ApAdmitOutpatientInpatient) => ({
        url: `/encounter/admit-outpatient-inpatient`,
        method: 'POST',
        body: admit
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getWaitingListEncounter: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/waiting_encounter-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePatientAdmission: builder.mutation({
      query: (admit: ApAdmitOutpatientInpatient) => ({
        url: `/encounter/patient_admission_from_waiting_list`,
        method: 'POST',
        body: admit
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getInpatientEncounters: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/inpatient-encounter-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveBedTransaction: builder.mutation({
      query: (bedTransaction: ApBedTransactions) => ({
        url: `/encounter/save-bed-transaction`,
        method: 'POST',
        body: bedTransaction
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
  useGetEncounterByIdQuery,
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
  useGetDiagnosticOrderQuery,
  useGetDiagnosticOrderTestQuery,
  useSaveDiagnosticOrderMutation,
  useSaveDiagnosticOrderTestMutation,
  useGetOrderTestNotesByTestIdQuery,
  useSaveDiagnosticOrderTestNotesMutation,
  useGetOrderTestSamplesByTestIdQuery,
  useSaveDiagnosticOrderTestSamplesMutation,
  useSavePsychologicalExamsMutation,
  useGetPsychologicalExamsQuery,
  useSaveAudiometryPuretoneMutation,
  useGetAudiometryPuretonesQuery,
  useSaveOptometricExamMutation,
  useGetOptometricExamsQuery,
  useSaveTreadmillStresseMutation,
  useGetTreadmillStressesQuery,
  useSaveComplaintSymptomsMutation,
  useGetComplaintSymptomsQuery,
  useSaveElectrocardiogramECGMutation,
  useGetElectrocardiogramECGsQuery,
  useDischargeInpatientEncounterMutation,
  useAdmitToInpatientEncounterMutation,
  useGetWaitingListEncounterQuery,
  useSavePatientAdmissionMutation,
  useGetInpatientEncountersQuery,
  useSaveBedTransactionMutation
} = encounterService;

