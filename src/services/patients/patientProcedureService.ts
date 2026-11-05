import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  PatientProcedure,
  PatientProcedureCreateVM,
  PatientProcedureUpdateVM,
  PatientProcedureCancelVM
} from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

type ProcedureSearchParams = {
  page?: number;
  size?: number;
  sort?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  patientId?: number;
  procedureId?: number;
  includeCancelled?: boolean;
};

export const patientProcedureService = createApi({
  reducerPath: 'patientProcedureApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientProcedure', 'ProcedureWorkflow'],

  endpoints: builder => ({
    // ------------------
    // CREATE
    // ------------------
    createProcdure: builder.mutation<PatientProcedure, PatientProcedureCreateVM>({
      query: body => ({
        url: '/api/patient/procedure',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // UPDATE
    // ------------------
    updateProcdure: builder.mutation<PatientProcedure, PatientProcedureUpdateVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/procedure/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // CANCEL
    // ------------------
    cancelProcdure: builder.mutation<PatientProcedure, PatientProcedureCancelVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/procedure/${id}/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // FIND BY ENCOUNTER
    // ------------------
    findProcdureByEncounter: builder.query<
      PagedResult<PatientProcedure>,
      {
        encounterId: number;
        page?: number;
        size?: number;
        includeCancelled?: boolean;
      }
    >({
      query: ({ encounterId, page = 0, size = 20, includeCancelled = false }) => ({
        url: `/api/patient/procedure/by-encounter/${encounterId}`,
        params: { page, size, includeCancelled }
      }),

      transformResponse: (response: PatientProcedure[], meta): PagedResult<PatientProcedure> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['PatientProcedure']
    }),

    findProcduresByPatient: builder.query<
      PagedResult<PatientProcedure>,
      {
        patientId: number;
        page?: number;
        size?: number;
        includeCancelled?: boolean;
      }
    >({
      query: ({ patientId, page = 0, size = 20, includeCancelled = false }) => ({
        url: `/api/patient/procedure/by-patient/${patientId}`,
        params: { page, size, includeCancelled }
      }),

      transformResponse: (response: PatientProcedure[], meta): PagedResult<PatientProcedure> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['PatientProcedure']
    }),

    // ------------------
    // SEARCH (procedure module)
    // ------------------
    searchProcedures: builder.query<PagedResult<PatientProcedure>, ProcedureSearchParams>({
      query: ({ page = 0, size = 20, sort = 'scheduledDateTime,desc', ...filters }) => ({
        url: '/api/patient/procedure/search',
        params: { page, size, sort, ...filters }
      }),
      transformResponse: (response: PatientProcedure[], meta): PagedResult<PatientProcedure> => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers.get('X-Total-Count')) || 0
      }),
      providesTags: ['PatientProcedure']
    }),

    // ------------------
    // WORKFLOW
    // ------------------
    changeProcedureStatus: builder.mutation<PatientProcedure, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/patient/procedure/${id}/status`,
        method: 'PUT',
        body: { status }
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    saveProcedureRegistration: builder.mutation<PatientProcedure, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/registration`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    getProcedureStaff: builder.query<any[], number>({
      query: id => `/api/patient/procedure/${id}/staff`,
      providesTags: ['ProcedureWorkflow']
    }),

    addProcedureStaff: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/staff`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    updateProcedureStaff: builder.mutation<any, { id: number; staffId: number; body: any }>({
      query: ({ id, staffId, body }) => ({
        url: `/api/patient/procedure/${id}/staff/${staffId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    deleteProcedureStaff: builder.mutation<void, { id: number; staffId: number }>({
      query: ({ id, staffId }) => ({
        url: `/api/patient/procedure/${id}/staff/${staffId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    getProcedurePreAssessment: builder.query<any, number>({
      query: id => `/api/patient/procedure/${id}/pre-assessment`,
      providesTags: ['ProcedureWorkflow']
    }),

    saveProcedurePreAssessment: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/pre-assessment`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    getProcedurePerformance: builder.query<any, number>({
      query: id => `/api/patient/procedure/${id}/performance`,
      providesTags: ['ProcedureWorkflow']
    }),

    saveProcedurePerformance: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/performance`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    getProcedurePostCare: builder.query<any, number>({
      query: id => `/api/patient/procedure/${id}/post-care`,
      providesTags: ['ProcedureWorkflow']
    }),

    saveProcedurePostCare: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/post-care`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    getProcedureMedications: builder.query<any[], number>({
      query: id => `/api/patient/procedure/${id}/medications`,
      providesTags: ['ProcedureWorkflow']
    }),

    addProcedureMedication: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/medications`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    updateProcedureMedication: builder.mutation<any, { id: number; medicationId: number; body: any }>({
      query: ({ id, medicationId, body }) => ({
        url: `/api/patient/procedure/${id}/medications/${medicationId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    deleteProcedureMedication: builder.mutation<void, { id: number; medicationId: number }>({
      query: ({ id, medicationId }) => ({
        url: `/api/patient/procedure/${id}/medications/${medicationId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    getProcedureEquipment: builder.query<any[], number>({
      query: id => `/api/patient/procedure/${id}/service-equipment`,
      providesTags: ['ProcedureWorkflow']
    }),

    addProcedureEquipment: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/patient/procedure/${id}/service-equipment`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ProcedureWorkflow']
    }),

    deleteProcedureEquipment: builder.mutation<void, { id: number; equipmentId: number }>({
      query: ({ id, equipmentId }) => ({
        url: `/api/patient/procedure/${id}/service-equipment/${equipmentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProcedureWorkflow']
    })
  })
});

export const {
  useCreateProcdureMutation,
  useUpdateProcdureMutation,
  useCancelProcdureMutation,
  useFindProcdureByEncounterQuery,
  useFindProcduresByPatientQuery,
  useSearchProceduresQuery,
  useChangeProcedureStatusMutation,
  useSaveProcedureRegistrationMutation,
  useGetProcedureStaffQuery,
  useAddProcedureStaffMutation,
  useUpdateProcedureStaffMutation,
  useDeleteProcedureStaffMutation,
  useGetProcedurePreAssessmentQuery,
  useSaveProcedurePreAssessmentMutation,
  useGetProcedurePerformanceQuery,
  useSaveProcedurePerformanceMutation,
  useGetProcedurePostCareQuery,
  useSaveProcedurePostCareMutation,
  useGetProcedureMedicationsQuery,
  useAddProcedureMedicationMutation,
  useUpdateProcedureMedicationMutation,
  useDeleteProcedureMedicationMutation,
  useGetProcedureEquipmentQuery,
  useAddProcedureEquipmentMutation,
  useDeleteProcedureEquipmentMutation
} = patientProcedureService;
