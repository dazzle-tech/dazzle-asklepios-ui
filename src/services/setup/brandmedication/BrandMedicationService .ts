import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

export const BrandMedicationService = createApi({
  reducerPath: "brandMedicationApi",
  baseQuery: BaseQuery,
  tagTypes: ["BrandMedication"],
  endpoints: (builder) => ({

    // 🔹 Get all
    getAllBrandMedications: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/brand-medication",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    // 🔹 Get by id
    getBrandMedicationById: builder.query({
      query: (id) => ({
        url: `/api/setup/brand-medication/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "BrandMedication", id }],
    }),

    // 🔹 Create
    createBrandMedication: builder.mutation({
      query: (body) => ({
        url: "/api/setup/brand-medication",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BrandMedication"],
    }),

    // 🔹 Update
   updateBrandMedication: builder.mutation({
  query: (body ) => {
    console.log("🧩 updateBrandMedication BODY:", body);
    console.log("🧩 updateBrandMedication ID:", body.id);

    return {
      url: `/api/setup/brand-medication/${body.id}`,
      method: "PUT",
      body,
    };
  },
  invalidatesTags: (result, error, { id }) => [
    { type: "BrandMedication", id },
    "BrandMedication",
  ],
}),


     


    // 🔹 Toggle Active
    toggleBrandMedicationActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/brand-medication/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["BrandMedication"],
    }),

    // ---------------------- Filters ----------------------

    getBrandMedicationsByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, ...params }) => ({
        url: `/api/setup/brand-medication/by-name/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByManufacturer: builder.query<PagedResult<any>, { manufacturer: string } & PagedParams>({
      query: ({ manufacturer, ...params }) => ({
        url: `/api/setup/brand-medication/by-manufacturer/${manufacturer}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByDosageForm: builder.query<PagedResult<any>, { dosageForm: string } & PagedParams>({
      query: ({ dosageForm, ...params }) => ({
        url: `/api/setup/brand-medication/by-dosage-form/${dosageForm}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByUsageInstructions: builder.query<PagedResult<any>, { usageInstructions: string } & PagedParams>({
      query: ({ usageInstructions, ...params }) => ({
        url: `/api/setup/brand-medication/by-usage-instructions/${usageInstructions}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByRoa: builder.query<PagedResult<any>, { roa: string } & PagedParams>({
      query: ({ roa, ...params }) => ({
        url: `/api/setup/brand-medication/by-roa/${roa}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByExpiresAfterOpening: builder.query<PagedResult<any>, { expiresAfterOpening: boolean } & PagedParams>({
      query: ({ expiresAfterOpening, ...params }) => ({
        url: `/api/setup/brand-medication/by-expires-after-opening/${expiresAfterOpening}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByUseSinglePatient: builder.query<PagedResult<any>, { useSinglePatient: boolean } & PagedParams>({
      query: ({ useSinglePatient, ...params }) => ({
        url: `/api/setup/brand-medication/by-use-single-patient/${useSinglePatient}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),

    getBrandMedicationsByIsActive: builder.query<PagedResult<any>, { isActive: boolean } & PagedParams>({
      query: ({ isActive, ...params }) => ({
        url: `/api/setup/brand-medication/by-is-active/${isActive}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["BrandMedication"],
    }),
  }),
});

export const {
  useGetAllBrandMedicationsQuery,
  useGetBrandMedicationByIdQuery,
  useCreateBrandMedicationMutation,
  useUpdateBrandMedicationMutation,
  useToggleBrandMedicationActiveMutation,
  useGetBrandMedicationsByNameQuery,
  useLazyGetBrandMedicationsByNameQuery,
  useGetBrandMedicationsByManufacturerQuery,
  useLazyGetBrandMedicationsByManufacturerQuery,
  useGetBrandMedicationsByDosageFormQuery,
  useLazyGetBrandMedicationsByDosageFormQuery,
  useGetBrandMedicationsByUsageInstructionsQuery,
  useLazyGetBrandMedicationsByUsageInstructionsQuery,
  useGetBrandMedicationsByRoaQuery,
  useLazyGetBrandMedicationsByRoaQuery,
  useGetBrandMedicationsByExpiresAfterOpeningQuery,
  useLazyGetBrandMedicationsByExpiresAfterOpeningQuery,
  useGetBrandMedicationsByUseSinglePatientQuery,
  useLazyGetBrandMedicationsByUseSinglePatientQuery,
  useGetBrandMedicationsByIsActiveQuery,
  useLazyGetBrandMedicationsByIsActiveQuery
} = BrandMedicationService;
