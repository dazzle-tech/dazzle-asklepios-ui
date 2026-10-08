import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import { ClaimEncounterCopyPatientProblem } from '@/types/model-types-new';

export const claimEncounterCopyPatientProblemService = createApi({
  reducerPath: 'claimEncounterCopyPatientProblemApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyPatientProblem'],
  endpoints: builder => ({
    getClaimEncounterCopyPatientProblems: builder.query<
      ClaimEncounterCopyPatientProblem[],
      {
        claimEncounterCopyId: number;
        showCancelled?: boolean;
      }
    >({
      query: ({
        claimEncounterCopyId,
        showCancelled = false
      }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-copy-patient-problems/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-patient-problems/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyPatientProblem']
    }),

    updateClaimEncounterCopyPatientProblem: builder.mutation<
      ClaimEncounterCopyPatientProblem,
      {
        id: number;
        condition?: string | null;
        dateOfDiagnosis?: string | null;
        conditionStatus?: string | null;
        type?: string | null;
        dateOfResolution?: string | null;
        byPatient?: boolean | null;
        sourceOfInformation?: string | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        id,
        condition,
        dateOfDiagnosis,
        conditionStatus,
        type,
        dateOfResolution,
        byPatient,
        sourceOfInformation,
        patientIsFree,
        freeText
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-patient-problems/${id}`,
        method: 'PUT',
        body: {
          condition,
          dateOfDiagnosis,
          conditionStatus,
          type,
          dateOfResolution,
          byPatient,
          sourceOfInformation,
          patientIsFree,
          freeText
        }
      }),
      invalidatesTags: ['ClaimEncounterCopyPatientProblem']
    }),

    cancelClaimEncounterCopyPatientProblem: builder.mutation<
      ClaimEncounterCopyPatientProblem,
      {
        id: number;
        cancellationReason: string;
      }
    >({
      query: ({
        id,
        cancellationReason
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-patient-problems/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['ClaimEncounterCopyPatientProblem']
    }),

    createClaimEncounterCopyPatientProblem: builder.mutation<
      ClaimEncounterCopyPatientProblem,
      {
        claimEncounterCopyId: number;
        condition?: string | null;
        dateOfDiagnosis?: string | null;
        conditionStatus?: string | null;
        type?: string | null;
        dateOfResolution?: string | null;
        byPatient?: boolean | null;
        sourceOfInformation?: string | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        claimEncounterCopyId,
        ...body
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-patient-problems/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ClaimEncounterCopyPatientProblem']
    })
  })
});

export const {
  useGetClaimEncounterCopyPatientProblemsQuery,
  useUpdateClaimEncounterCopyPatientProblemMutation,
  useCancelClaimEncounterCopyPatientProblemMutation,
  useCreateClaimEncounterCopyPatientProblemMutation
} = claimEncounterCopyPatientProblemService;