import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export const BrandMedicationActiveIngredientService = createApi({
  reducerPath: "brandMedicationActiveIngredientApi",
  baseQuery: BaseQuery,
  tagTypes: ["BrandMedicationActiveIngredient"],

  endpoints: (builder) => ({

    // 🔹 Create
    createActiveIngredient: builder.mutation({
      query: (body) => ({
        url: "/api/setup/brand-medication-active-ingredient",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BrandMedicationActiveIngredient"],
    }),

    // 🔹 List by Brand Medication ID
    getActiveIngredientsByBrand: builder.query({
      query: (brandId: number) => ({
        url: `/api/setup/brand-medication-active-ingredient/by-brand/${brandId}`,
        method: "GET",
      }),
      providesTags: ["BrandMedicationActiveIngredient"],
    }),

    // 🔹 Delete relation
    deleteActiveIngredient: builder.mutation({
      query: (id: number) => ({
        url: `/api/setup/brand-medication-active-ingredient/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BrandMedicationActiveIngredient"],
    }),

    getActiveIngredientsByBrands: builder.mutation<
      Record<string, string[]>,
      number[]
    >({
      query: brandIds => ({
        url: "/api/setup/brand-medication-active-ingredient/by-brands",
        method: "POST",
        body: brandIds,
      }),
    }),
  }),
});

export const {
  useCreateActiveIngredientMutation,
  useGetActiveIngredientsByBrandQuery,
  useLazyGetActiveIngredientsByBrandQuery,
  useDeleteActiveIngredientMutation,
  useGetActiveIngredientsByBrandsMutation
} = BrandMedicationActiveIngredientService;

