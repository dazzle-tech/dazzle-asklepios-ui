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

export const prescriptionInstructionService = createApi({
  reducerPath: "newPrescriptionInstructionApi",
  baseQuery: BaseQuery,
  tagTypes: ["prescriptionInstructions"],
  endpoints: builder => ({
    // 🔹 Get all diagnostic tests (paginated)
    getAllPrescriptionInstructions: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/prescription-instruction",
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
      providesTags: ["prescriptionInstructions"],
    }),

    // 🔹 Get diagnostic tests by type
    getPrescriptionInstructionsByCategory: builder.query({
      query: ({ category, ...params }) => ({
        url: `/api/setup/prescription-instruction/by-category/${category}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["prescriptionInstructions"],
    }),

    // 🔹 Get diagnostic tests by name
    getPrescriptionInstructionsByUnit: builder.query({
      query: ({ unit, ...params }) => ({
        url: `/api/setup/prescription-instruction/by-unit/${unit}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
    providesTags: ["prescriptionInstructions"],
    }),

    getPrescriptionInstructionsByDose: builder.query({
      query: ({ dose, ...params }) => ({
        url: `/api/setup/prescription-instruction/by-dose/${encodeURIComponent(dose)}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["prescriptionInstructions"],
    }),

    getPrescriptionInstructionsByRoute: builder.query({
      query: ({ route, ...params }) => ({
        url: `/api/setup/prescription-instruction/by-route/${route}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
    providesTags: ["prescriptionInstructions"],
    }),

    getPrescriptionInstructionsByFrequency: builder.query({
      query: ({ frequency, ...params }) => ({
        url: `/api/setup/prescription-instruction/by-frequency/${frequency}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
    providesTags: ["prescriptionInstructions"],
    }),


    // 🔹 Get single diagnostic test
    getPrescriptionInstructionById: builder.query({
      query: id => ({
        url: `/api/setup/prescription-instruction/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: (result, error, id) => [{ type: "prescriptionInstructions", id }],
    }),

    // 🔹 Create diagnostic test
    createPrescriptionInstruction: builder.mutation({
      query: body => ({
        url: "/api/setup/prescription-instruction",
        method: "POST",
        body,
      }),
      invalidatesTags: ["prescriptionInstructions"],
    }),

    // 🔹 Update diagnostic test
    updatePrescriptionInstruction: builder.mutation({
      query: prescriptionInstruction => ({
        url: `/api/setup/prescription-instruction/${prescriptionInstruction?.id}`,
        method: "PUT",
        body: prescriptionInstruction,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "prescriptionInstructions", id },
        "prescriptionInstructions",
      ],
    }),

    deletePrescriptionInstruction: builder.mutation({
      query: id => ({
        url: `/api/setup/prescription-instruction/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "prescriptionInstructions", id },
        "prescriptionInstructions",
      ],
    }),

    
  }),
});

export const {
  useGetAllPrescriptionInstructionsQuery,
  useGetPrescriptionInstructionByIdQuery,
  useLazyGetPrescriptionInstructionsByCategoryQuery,
  useLazyGetPrescriptionInstructionsByFrequencyQuery,
  useLazyGetPrescriptionInstructionsByRouteQuery,
  useLazyGetPrescriptionInstructionsByUnitQuery,
  useLazyGetPrescriptionInstructionsByDoseQuery,
  useCreatePrescriptionInstructionMutation,
  useUpdatePrescriptionInstructionMutation,
  useDeletePrescriptionInstructionMutation
} = prescriptionInstructionService;
