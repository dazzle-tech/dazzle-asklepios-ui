import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import { parseLinkHeader } from "@/utils/paginationHelper";


import { Substitute } from "@/types/model-types-new";
import { newSubstitute } from "@/types/model-types-constructor-new";

export const BrandMedicationSubstituteService = createApi({
    reducerPath: "brandMedicationSubstituteApi",
    baseQuery: BaseQuery,
    tagTypes: ["BrandMedicationSubstitute"],

    endpoints: (builder) => ({
        // ---------- CREATE ----------
        createBrandMedicationSubstitute: builder.mutation<Substitute, typeof newSubstitute>({
            query: (body) => ({
                url: "/api/setup/brand-medication-substitute",
                method: "POST",
                body,
            }),
            invalidatesTags: ["BrandMedicationSubstitute"],
        }),

        // ---------- GET by Brand ----------
        getBrandMedicationSubstitutesByBrand: builder.query<Substitute[], number>({
            query: (brandId) => ({
                url: `/api/setup/brand-medication-substitute/by-brand/${brandId}`,
                method: "GET",
            }),
            providesTags: ["BrandMedicationSubstitute"],
            transformResponse: (response: any) => response as Substitute[],
        }),

        // ---------- DELETE ----------
        deleteBrandMedicationSubstitute: builder.mutation<void, number>({
            query: (id) => ({
                url: `/api/setup/brand-medication-substitute/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["BrandMedicationSubstitute"],
        }),

        deleteBrandMedicationSubstituteByBrandIdAndAlternativeBrandId: builder.mutation<void, { brandId: number; alternativeBrandId: number }>({
            query: ({ brandId, alternativeBrandId }) => ({
                url: `/api/setup/brand-medication-substitute/${brandId}/${alternativeBrandId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["BrandMedicationSubstitute"],
        }),

    }),
});

export const {
    useCreateBrandMedicationSubstituteMutation,
    useGetBrandMedicationSubstitutesByBrandQuery,
    useDeleteBrandMedicationSubstituteMutation,
    useDeleteBrandMedicationSubstituteByBrandIdAndAlternativeBrandIdMutation
} = BrandMedicationSubstituteService;
