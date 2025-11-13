import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export const MedicationCategoriesService = createApi({
  reducerPath: 'MedicationCategoriesApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({

   
    addMedicationCategory: builder.mutation({
      query: addMedicationCategory => ({
        url: '/api/setup/medication-categories',
        method: 'POST',
        body: addMedicationCategory, 
      }),
    }),

    
    deleteMedicationCategory: builder.mutation({
      query: (id: number | string) => ({
        url: `/api/setup/medication-categories/${id}`,
        method: 'DELETE',
      }),
    }),

   
    updateMedicationCategory: builder.mutation({
      query: MedicationCategory => ({
        url: `/api/setup/medication-categories/${MedicationCategory.id}`,
        method: 'PUT',
        body: MedicationCategory, 
      }),
    }),

   
    getAllMedicationCategories: builder.query({
    query: (name?: string) =>
        name
          ? `/api/setup/medication-categories?name=${name}`
          : '/api/setup/medication-categories',
    }),

    
    getMedicationCategory: builder.query({
      query: (id: number | string) => ({
        url: `/api/setup/medication-categories/${id}`,
        method: 'GET',
      }),
    }),

  }),
});

export const {
  useAddMedicationCategoryMutation,
  useDeleteMedicationCategoryMutation,
  useUpdateMedicationCategoryMutation,
  useGetAllMedicationCategoriesQuery,
  useGetMedicationCategoryQuery,
} = medicationCategoriesService;
