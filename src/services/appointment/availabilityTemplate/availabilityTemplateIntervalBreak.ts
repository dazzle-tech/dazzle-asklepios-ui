import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "../../../newApi";
import type { AvailabilityTemplateIntervalBreakCreateDTO, AvailabilityTemplateIntervalBreakResponseVM } from "@/types/model-types-new";

type Id = number | string;

export const availabilityTemplateIntervalBreakService = createApi({
  reducerPath: "availabilityTemplateIntervalBreakApi",
  baseQuery: BaseQuery,
  tagTypes: ["AvailabilityTemplateIntervalBreak"],
  endpoints: (builder) => ({
    getAvailabilityTemplateIntervalBreaksByInterval: builder.query<
      AvailabilityTemplateIntervalBreakResponseVM[],
      { intervalId: Id }
    >({
      query: ({ intervalId }) => ({
        url: `/api/patient/availability-template-interval-breaks/by-interval/${intervalId}`,
        method: "GET",
      }),
      providesTags: ["AvailabilityTemplateIntervalBreak"],
    }),

    createAvailabilityTemplateIntervalBreak: builder.mutation<
      AvailabilityTemplateIntervalBreakResponseVM,
      AvailabilityTemplateIntervalBreakCreateDTO
    >({
      query: (body) => ({
        url: `/api/patient/availability-template-interval-breaks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AvailabilityTemplateIntervalBreak"],
    }),

    deleteAvailabilityTemplateIntervalBreak: builder.mutation<
      void,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/availability-template-interval-breaks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AvailabilityTemplateIntervalBreak"],
    }),

  }),

});

export const {
  useGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
  useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
  useCreateAvailabilityTemplateIntervalBreakMutation,
  useDeleteAvailabilityTemplateIntervalBreakMutation
} = availabilityTemplateIntervalBreakService;
