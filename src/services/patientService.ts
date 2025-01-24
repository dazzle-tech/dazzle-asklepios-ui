
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApPatient, ApPatientAllergies,ApUser, ApPatientRelation, ApPatientSecondaryDocuments, ApPatientInsurance, ApPatientInsuranceCoverage, ApPatientAdministrativeWarnings } from '@/types/model-types';

export const patientService = createApi({
  reducerPath: 'patientApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getPatients: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/pas/patient-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePatient: builder.mutation({
      query: (patient: ApPatient) => ({
        url: `/pas/save-patient`,
        method: 'POST',
        body: patient
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientAllergies: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/pas/patient-allergy-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getPatientAllergiesView: builder.query({
      query: (data: { key: string }) => ({
        url: `/pas/patient-allergy-view-list`,
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    savePatientAllergy: builder.mutation({
      query: (patAllergy: ApPatientAllergies) => ({
        url: `/pas/save-patient-allergy`,
        method: 'POST',
        body: patAllergy
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    removePatientAllergy: builder.mutation({
      query: (patAllergy: ApPatientAllergies) => ({
        url: `/pas/remove-patient-allergy`,
        method: 'POST',
        body: patAllergy
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    sendVerificationOtp: builder.mutation({
      query: (patientId: string) => ({
        url: `/pas/send-verification-otp`,
        method: 'POST',
        headers: {
          patientId
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    verifyVerificationOtp: builder.mutation({
      query: (data: { patientId: string, otp: string }) => ({
        url: `/pas/verify-verification-otp`,
        method: 'POST',
        headers: {
          patientId: data.patientId,
          otp: data.otp
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientRelations: builder.query({
      query: ({ listRequest, key }) => ({
        url: `/pas/patient-relation-list?${fromListRequestToQueryParams(listRequest)}`,
        headers: {
          key: key,
        },
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),

    getPatientSecondaryDocuments: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/pas/patient-secondary_document_list?${fromListRequestToQueryParams(listRequest)}`,
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
     
    savePatientRelation: builder.mutation({
      query: (request: ApPatientRelation) => ({
        url: `/pas/save-patient-relation`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveNewSecondaryDocument: builder.mutation({
      query: (request: ApPatientSecondaryDocuments) => ({
        url: `/pas/save-secondary-document`,
        method: 'POST',
        body: request,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    fetchPatientInsurance: builder.mutation({
      query: (request: ApPatientInsurance) => ({
        url: `/pas/fetch-patient-insurance`,
        method: 'POST',
        body: request,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    getPatientInsurance: builder.query({
      query: (data: { patientKey: string }) => ({
        url: `/pas/fetch-patient-insurance`,
        headers: {
          patientKey: data.patientKey,
        },
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0,
    }),
    deletePatientInsurance: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/pas/delete-patient-insurance`,
        method: 'DELETE',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
    
    ,
    deletePatientRelation: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/pas/delete-patient-Relation`,
        method: 'DELETE',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
    ,
    deletePatientSecondaryDocument: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/pas/delete-patient-SecondaryDocument`,
        method: 'DELETE',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    savePatientInsurance: builder.mutation({
      query: (insurance: ApPatientInsurance) => ({
        url: `/pas/save-patient-insurance`,
        method: 'POST',
        body: insurance
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }), getPatientInsuranceCovg: builder.query({
      query: ({ listRequest, key }) => ({
        url: `/pas/patient-insurance-covg-list?${fromListRequestToQueryParams(listRequest)}`,
        headers: {
          key: key,
        },
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5,
    })
    ,
    savePatientInsuranceCovg: builder.mutation({
      query: (patient: ApPatient) => ({
        url: `/pas/save-patient-insurance-covg`,
        method: 'POST',
        body: patient
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    deletePatientInsuranceCovg: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/pas/remove-patient-insurance-covg`,
        method: 'DELETE',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    savePatientAdministrativeWarnings: builder.mutation({
      query: (patientAdministrativeWarnings: ApPatientAdministrativeWarnings) => ({
        url: `/pas/save-patient-administrative-warnings`,
        method: 'POST',
        body: patientAdministrativeWarnings
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getPatientAdministrativeWarnings: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/pas/fetch-patient-administrative-warnings?${fromListRequestToQueryParams(listRequest)}`,
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    updatePatientAdministrativeWarnings: builder.mutation({
      query: (patientAdministrativeWarnings: ApPatientAdministrativeWarnings) => ({
        url: `/pas/update-patient-administrative-warning`, 
        method: 'POST',
        body: patientAdministrativeWarnings,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;   
      }
    }),
    deletePatientAdministrativeWarnings: builder.mutation({
      query: (patientAdministrativeWarnings: ApPatientAdministrativeWarnings) => ({
        url: `/pas/delete-patient-administrative-warning`, 
        method: 'POST',
        body: patientAdministrativeWarnings,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;   
      }
    }),
    getAgeGroupValue: builder.query({
      query: (data: { dob: string }) => ({
        url: `/pas/age-group-value`,
        headers: {
          dob: data.dob
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveUserAccessLoginPrivatePatient: builder.mutation({
      query: (data: { user:ApUser , reason: string }) => ({
        url: `/pas/user-access-private-patient`,
        method: 'POST',
        body: data.user, 
        headers: {
          reason : data.reason
        },
      }),
      transformResponse: (response) => {
        return response;
      },
    }), 
  }),
    
});

export const {
  useGetPatientsQuery,
  useSavePatientMutation,
  useGetPatientAllergiesQuery,
  useSavePatientAllergyMutation,
  useRemovePatientAllergyMutation,
  useSendVerificationOtpMutation,
  useVerifyVerificationOtpMutation,
  useGetPatientRelationsQuery,
  useSavePatientRelationMutation,
  useGetPatientAllergiesViewQuery,
  useGetPatientSecondaryDocumentsQuery,
  useSaveNewSecondaryDocumentMutation,
  useGetPatientInsuranceQuery,
  useSavePatientInsuranceMutation,
  useDeletePatientInsuranceMutation,
  useDeletePatientSecondaryDocumentMutation,
  useDeletePatientRelationMutation,
  useGetPatientInsuranceCovgQuery,
  useSavePatientInsuranceCovgMutation,
  useDeletePatientInsuranceCovgMutation,
  useSavePatientAdministrativeWarningsMutation,
  useGetPatientAdministrativeWarningsQuery,
  useUpdatePatientAdministrativeWarningsMutation,
  useDeletePatientAdministrativeWarningsMutation,
  useGetAgeGroupValueQuery,
  useSaveUserAccessLoginPrivatePatientMutation
} = patientService;