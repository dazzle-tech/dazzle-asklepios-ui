// src/services/setup/CdtDentalActionService.ts
import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/query/react";
import { CdtDentalAction, CdtDentalActionResponseVM } from "@/types/model-types-new";

export const CdtDentalActionService = createApi({
  reducerPath: "cdtDentalActionApi",
  baseQuery: BaseQuery,
  tagTypes: ["CdtDentalAction"],
  endpoints: (builder) => ({

    // Get all -- backend returns CdtDentalActionResponseVM (cdtId nested as a full CdtCode object)
    getAll: builder.query<CdtDentalActionResponseVM[], void>({
      query: () => ({
        url: "/api/setup/cdt-dental-action",
        method: "GET",
      }),
      providesTags: ["CdtDentalAction"],
    }),

    // Get one
    getOne: builder.query<CdtDentalActionResponseVM, number>({
      query: (id) => `/api/setup/cdt-dental-action/${id}`,
      providesTags: (r, e, id) => [{ type: "CdtDentalAction", id }],
    }),

    // Filter by dentalActionId
    getByDentalAction: builder.query<CdtDentalActionResponseVM[], number>({
      query: (dentalActionId) => `/api/setup/cdt-dental-action/by-dental-action/${dentalActionId}`,
      providesTags: ["CdtDentalAction"],
    }),

    // Filter by CDT code
    getByCode: builder.query<CdtDentalActionResponseVM[], string>({
      query: (cdtCode) => `/api/setup/cdt-dental-action/by-code/${cdtCode}`,
      providesTags: ["CdtDentalAction"],
    }),

    // Create -- request body is a plain id, but the backend responds with the nested VM shape
    create: builder.mutation<CdtDentalActionResponseVM, CdtDentalAction>({
      query: (body) => ({
        url: "/api/setup/cdt-dental-action",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CdtDentalAction"],
    }),

    // Delete
    delete: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/cdt-dental-action/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CdtDentalAction"],
    }),

  }),
});

export const {
  useGetAllQuery,
  useGetOneQuery,
  useGetByDentalActionQuery,
  useGetByCodeQuery,
  useCreateMutation,
  useDeleteMutation,
} = CdtDentalActionService;
