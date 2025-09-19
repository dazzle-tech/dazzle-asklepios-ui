import { ApAdmitOutpatientInpatient, ApAudiometryPuretone, ApBedTransactions, ApElectrocardiogramEcg, ApOptometricExam, ApProcedureRegistration, ApTreadmillStress, ApPainAssessment, ApInpatientChiefComplain, ApGeneralAssessment, ApFunctionalAssessment, ApMedicationReconciliation, ApTransferPatient, ApDoctorRound, ApNurseNotes, ApRepositioning, ApDayCaseEncounters, ApPreOperationAdministeredMedications, ApEmergencyTriage, ApEncounterAssignToBed, ApProgressNotes, ApPatient } from './../types/model-types';
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
  ApPrescriptionMedications, ApProcedure, ApPatientTemporaryDischarge, ApReviewOfSystem, ApVisitAllergies, ApPsychologicalExam, ApDiagnosticOrderTestsNotes, ApDiagnosticOrderTestsSamples
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

    dischargeEncounter: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/discharge-encounter`,
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
      query: ({ listRequest, department_key }) => ({
        url: `/encounter/inpatient-encounter-list?${fromListRequestToQueryParams(listRequest)}`,
        headers: {
          departmentKey: department_key
        }
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
    getBedTransactionsList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/bed-transactions-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePainAssessment: builder.mutation({
      query: (painAssessment: ApPainAssessment) => ({
        url: `/encounter/save-pain-assessment`,
        method: 'POST',
        body: painAssessment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPainAssessment: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/pain-assessment-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getChiefComplain: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/inpatient-chief-complain-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveChiefComplain: builder.mutation({
      query: (chiefComplain: ApInpatientChiefComplain) => ({
        url: `/encounter/save-inpatient-chief-complain`,
        method: 'POST',
        body: chiefComplain
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getGeneralAssessments: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/general-assessment-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveGeneralAssessment: builder.mutation({
      query: (generalAssessment: ApGeneralAssessment) => ({
        url: `/encounter/save-general-assessment`,
        method: 'POST',
        body: generalAssessment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getFunctionalAssessments: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/functional-assessment-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveFunctionalAssessment: builder.mutation({
      query: (functionalAssessment: ApFunctionalAssessment) => ({
        url: `/encounter/save-functional-assessment`,
        method: 'POST',
        body: functionalAssessment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getMedicationReconciliation: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/medication-reconciliation-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveMedicationReconciliation: builder.mutation({
      query: (medicationReconciliation: ApMedicationReconciliation) => ({
        url: `/encounter/save-medication-reconciliation`,
        method: 'POST',
        body: medicationReconciliation
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveTransferPatient: builder.mutation({
      query: (transferPatient: ApTransferPatient) => ({
        url: `/encounter/save-transfer-patient`,
        method: 'POST',
        body: transferPatient
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getTransferPatientsList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/transfer-requests-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveApprovalTransfer: builder.mutation({
      query: (transferPatient: ApTransferPatient) => ({
        url: `/encounter/approval-transfer-patient`,
        method: 'POST',
        body: transferPatient
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getTransferTransactions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/transfer-transactions-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getDoctorRoundStaffList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/doctor-round-staff-list?${fromListRequestToQueryParams(listRequest)}`,
        method: 'GET'
      }),
      onQueryStarted
    }),
    saveDoctorRoundStaff: builder.mutation({
      query: (body) => ({
        url: `/encounter/save-doctor-round-staff`,
        method: 'POST',
        body
      }),
      onQueryStarted
    }),
    deleteDoctorRoundStaff: builder.mutation({
      query: (key: string) => ({
        url: `/encounter/delete-doctor-round-staff?key=${key}`,
        method: 'DELETE'
      }),
      onQueryStarted
    }),
    saveDoctorRound: builder.mutation({
      query: (doctorRound: ApDoctorRound) => ({
        url: `/encounter/save-new-round`,
        method: 'POST',
        body: doctorRound
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDoctorRoundsList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/doctor-round-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveNurseNotes: builder.mutation({
      query: (nurseNotes: ApNurseNotes) => ({
        url: `/encounter/save-nurse-notes`,
        method: 'POST',
        body: nurseNotes
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getNurseNotesList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/nurse-notes-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveNewPosition: builder.mutation({
      query: (position: ApRepositioning) => ({
        url: `/encounter/save-new-position`,
        method: 'POST',
        body: position
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getRepositioningList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/repositioning-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveAssignToBed: builder.mutation({
      query: (encounterAssignToBed: ApEncounterAssignToBed) => ({
        url: `/encounter/save-assign-to-bed`,
        method: 'POST',
        body: encounterAssignToBed
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    savePreOperationMedications: builder.mutation({
      query: (preOperation: ApPreOperationAdministeredMedications) => ({
        url: `/encounter/save-pre-operation-administered-medications`,
        method: 'POST',
        body: preOperation
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPreOperationMedicationsList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/pre-operation-administered-medications-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveEmergencyTriages: builder.mutation({
      query: (emergencyTriage: ApEmergencyTriage) => ({
        url: `/encounter/save-new-triage`,
        method: 'POST',
        body: emergencyTriage
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getEmergencyTriagesList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/emergency-triage-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getEREncounters: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/er-waiting-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    ERCompleteEncounter: builder.mutation({
      query: (data: { encounter: ApEncounter, triageKey: string, destinationKey: string }) => ({
        url: `/encounter/er-complete-encounter`,
        method: 'POST',
        body: data.encounter,
        headers: {
          triage_key: data.triageKey,
          destination_key: data.destinationKey,
        }
      }),
    }),
    SentToER: builder.mutation({
      query: (data: { encounter: ApEncounter, triageKey: string, destinationKey: string }) => ({
        url: `/encounter/sent-to-er`,
        method: 'POST',
        body: data.encounter,
        headers: {
          triage_key: data.triageKey,
          destination_key: data.destinationKey,
        }
      }),
    }),
    getEREncountersList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/er-triage-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getEmergencyEncounters: builder.query({
      query: ({ listRequest, department_key }) => ({
        url: `/encounter/emergency-encounter-list?${fromListRequestToQueryParams(listRequest)}`,
        headers: {
          department_key: department_key
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveProgressNotes: builder.mutation({
      query: (progressNotes: ApProgressNotes) => ({
        url: `/encounter/save-progress-notes`,
        method: 'POST',
        body: progressNotes
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getProgressNotesList: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/encounter/progress-notes-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    cancelEncounter: builder.mutation({
      query: (encounter: ApEncounter) => ({
        url: `/encounter/cancel-encounter`,
        method: 'POST',
        body: encounter
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    patientTemporaryDischarge: builder.mutation({
      query: (patientTemporaryDischarge: ApPatientTemporaryDischarge) => ({
        url: `/encounter/patient-temporary-discharge`,
        method: 'POST',
        body: patientTemporaryDischarge
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    returnTemporaryDischarge: builder.mutation({
      query: ({ patientTemporaryDischarge, department_key }: { patientTemporaryDischarge: ApPatientTemporaryDischarge, department_key: string }) => ({
        url: `/encounter/return-from-temporary-discharge`,
        method: 'POST',
        body: patientTemporaryDischarge,
        headers: {
          department_key: department_key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
     getDayCaseEncounters: builder.query({
      query: ({ listRequest, department_key }) => ({
        url: `/encounter/day-case-encounter-list?${fromListRequestToQueryParams(listRequest)}`,
        headers: {
          department_key: department_key
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
  }),
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
  useDischargeEncounterMutation,
  useAdmitToInpatientEncounterMutation,
  useGetWaitingListEncounterQuery,
  useSavePatientAdmissionMutation,
  useGetInpatientEncountersQuery,
  useSaveBedTransactionMutation,
  useGetBedTransactionsListQuery,
  useSavePainAssessmentMutation,
  useGetPainAssessmentQuery,
  useSaveChiefComplainMutation,
  useGetChiefComplainQuery,
  useGetGeneralAssessmentsQuery,
  useSaveGeneralAssessmentMutation,
  useGetFunctionalAssessmentsQuery,
  useSaveFunctionalAssessmentMutation,
  useGetMedicationReconciliationQuery,
  useSaveMedicationReconciliationMutation,
  useSaveTransferPatientMutation,
  useGetTransferPatientsListQuery,
  useSaveApprovalTransferMutation,
  useGetTransferTransactionsQuery,
  useGetDoctorRoundStaffListQuery,
  useSaveDoctorRoundStaffMutation,
  useDeleteDoctorRoundStaffMutation,
  useGetDoctorRoundsListQuery,
  useSaveDoctorRoundMutation,
  useGetNurseNotesListQuery,
  useSaveNurseNotesMutation,
  useSaveNewPositionMutation,
  useGetRepositioningListQuery,
  useSaveAssignToBedMutation,
  useSavePreOperationMedicationsMutation,
  useGetPreOperationMedicationsListQuery,
  useGetEmergencyTriagesListQuery,
  useSaveEmergencyTriagesMutation,
  useGetEREncountersQuery,
  useERCompleteEncounterMutation,
  useSentToERMutation,
  useGetEREncountersListQuery,
  useGetEmergencyEncountersQuery,
  useGetProgressNotesListQuery,
  useSaveProgressNotesMutation,
  useCancelEncounterMutation,
  usePatientTemporaryDischargeMutation,
  useReturnTemporaryDischargeMutation,
  useGetDayCaseEncountersQuery
} = encounterService;