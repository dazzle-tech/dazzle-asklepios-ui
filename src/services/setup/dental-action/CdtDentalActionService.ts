// src/services/setup/CdtDentalActionService.ts
import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/query/react";
import { CdtDentalAction } from "@/types/model-types-new";

export const CdtDentalActionService = createApi({
  reducerPath: "cdtDentalActionApi",
  baseQuery: BaseQuery,
  tagTypes: ["CdtDentalAction"],
  endpoints: (builder) => ({

    // Get all
    getAll: builder.query<CdtDentalAction[], void>({
      query: () => ({
        url: "/api/setup/cdt-dental-action",
        method: "GET",
      }),
      providesTags: ["CdtDentalAction"],
    }),

    // Get one
    getOne: builder.query<CdtDentalAction, number>({
      query: (id) => `/api/setup/cdt-dental-action/${id}`,
      providesTags: (r, e, id) => [{ type: "CdtDentalAction", id }],
    }),

    // Filter by dentalActionId
    getByDentalAction: builder.query<CdtDentalAction[], number>({
      query: (dentalActionId) => `/api/setup/cdt-dental-action/by-dental-action/${dentalActionId}`,
      providesTags: ["CdtDentalAction"],
    }),

    // Filter by CDT code
    getByCode: builder.query<CdtDentalAction[], string>({
      query: (cdtCode) => `/api/setup/cdt-dental-action/by-code/${cdtCode}`,
      providesTags: ["CdtDentalAction"],
    }),

    // Create
    create: builder.mutation<CdtDentalAction, CdtDentalAction>({
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
