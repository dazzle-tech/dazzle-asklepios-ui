import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery, onQueryStarted } from "../../../newApi";
import type { AvailabilityTemplateIntervalBreakResponseVM } from "@/types/model-types-new";

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
  }),
});

export const {
  useGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
  useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery,
} = availabilityTemplateIntervalBreakService;
