import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery, onQueryStarted } from "../../../newApi";
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
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
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ["AvailabilityTemplateIntervalBreak"], 
    }),
    
  }),
  
});

export const {
  useGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
  useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
   useCreateAvailabilityTemplateIntervalBreakMutation,
} = availabilityTemplateIntervalBreakService;
