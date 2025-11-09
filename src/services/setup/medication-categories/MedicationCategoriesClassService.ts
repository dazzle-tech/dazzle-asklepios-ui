import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export const medicationCategoriesClassService = createApi({
  reducerPath: 'MedicationCategoriesClassApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({

   
    addMedicationCategoryClass: builder.mutation({
      query: MedicationCategoryClass => ({
        url: '/api/setup/medication-categories-class',
        method: 'POST',
        body: MedicationCategoryClass, 
      }),
    }),

    
    deleteMedicationCategoryClass: builder.mutation({
      query: (id: number | string) => ({
        url: `/api/setup/medication-categories-class/${id}`,
        method: 'DELETE',
      }),
    }),

   
    updateMedicationCategoryClass: builder.mutation({
      query: MedicationCategoryClass => ({
        url: `/api/setup/medication-categories-class/${MedicationCategoryClass.id}`,
        method: 'PUT',
        body: MedicationCategoryClass, 
      }),
    }),

   
    getAllMedicationCategoriesClasses: builder.query({
      query: () => ({
        url: '/api/setup/medication-categories-class',
        method: 'GET',
      }),
    }),

    
    getMedicationCategoryClass: builder.query({
      query: (id: number | string) => ({
        url: `/api/setup/medication-categories-class/${id}`,
        method: 'GET',
      }),
    }),

    getAllMedicationCategoryClassesByCategory: builder.query({
  query: ({ id, name }: { id: number | string; name?: string }) =>
    name
      ? `/api/setup/medication-categories-class/by-category?id=${id}&name=${name}`
      : `/api/setup/medication-categories-class/by-category?id=${id}&name=`,
}),

  }),
});

export const {
  useAddMedicationCategoryClassMutation,
  useDeleteMedicationCategoryClassMutation,
  useUpdateMedicationCategoryClassMutation,
  useGetAllMedicationCategoriesClassesQuery,
  useGetMedicationCategoryClassQuery,
  useGetAllMedicationCategoryClassesByCategoryQuery
} = medicationCategoriesClassService;
