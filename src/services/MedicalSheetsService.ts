import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

export const MedicalsheetsService = createApi({
  reducerPath: 'medicalSheetsApi',
  baseQuery: BaseQuery,
  tagTypes: ['MedicalSheets', 'NurseMedicalSheets'],
  endpoints: (builder) => ({
    // === DepartmentMedicalSheetsVisibility ===
    getAllMedicalSheets: builder.query({
      query: () => '/api/setup/department-medical-sheets',
      providesTags: ['MedicalSheets'],
    }),

    getMedicalSheetsByDepartment: builder.query({
      query: (departmentId) => `/api/setup/department-medical-sheets/department/${departmentId}`,
      providesTags: (result, error, id) => [{ type: 'MedicalSheets', id }],
    }),

    createMedicalSheet: builder.mutation({
      query: (body) => ({
        url: '/api/setup/department-medical-sheets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MedicalSheets'],
    }),

    bulkSaveMedicalSheets: builder.mutation({
      query: (list) => ({
        url: '/api/setup/department-medical-sheets/bulk',
        method: 'POST',
        body: list,
      }),
      invalidatesTags: ['MedicalSheets'],
    }),

    deleteMedicalSheet: builder.mutation({
      query: (id) => ({
        url: `/api/setup/department-medical-sheets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MedicalSheets'],
    }),

    // === DepartmentMedicalSheetsNurseVisibility ===
    getAllNurseMedicalSheets: builder.query({
      query: () => '/api/setup/department-medical-sheets-nurse',
      providesTags: ['NurseMedicalSheets'],
    }),

    getNurseMedicalSheetsByDepartment: builder.query({
      query: (departmentId) => `/api/setup/department-medical-sheets-nurse/department/${departmentId}`,
      providesTags: (result, error, id) => [{ type: 'NurseMedicalSheets', id }],
    }),

    createNurseMedicalSheet: builder.mutation({
      query: (body) => ({
        url: '/api/setup/department-medical-sheets-nurse',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NurseMedicalSheets'],
    }),

    bulkSaveNurseMedicalSheets: builder.mutation({
      query: (list) => ({
        url: '/api/setup/department-medical-sheets-nurse/bulk',
        method: 'POST',
        body: list,
      }),
      invalidatesTags: ['NurseMedicalSheets'],
    }),

    deleteNurseMedicalSheet: builder.mutation({
      query: (id) => ({
        url: `/api/setup/department-medical-sheets-nurse/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NurseMedicalSheets'],
    }),
  }),
});

export const {
  // DepartmentMedicalSheetsVisibility
  useGetAllMedicalSheetsQuery,
  useGetMedicalSheetsByDepartmentQuery,
  useCreateMedicalSheetMutation,
  useBulkSaveMedicalSheetsMutation,
  useDeleteMedicalSheetMutation,

  // DepartmentMedicalSheetsNurseVisibility
  useGetAllNurseMedicalSheetsQuery,
  useGetNurseMedicalSheetsByDepartmentQuery,
  useCreateNurseMedicalSheetMutation,
  useBulkSaveNurseMedicalSheetsMutation,
  useDeleteNurseMedicalSheetMutation,
} = MedicalsheetsService;
