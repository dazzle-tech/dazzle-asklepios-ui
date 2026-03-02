import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/query/react";

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
};

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

export const diagnosticOrderTestReportService = createApi({
  reducerPath: "diagnosticOrderTestReportApi",
  baseQuery: BaseQuery,
  tagTypes: ["RadiologyReport", "RadiologyImage"],
  endpoints: (builder) => ({

    filterRadiologyReports: builder.query<
      PagedResult<any>,
      { page: number; size: number; sort?: string; params?: any }
    >({
      query: ({ page, size, sort = "id,desc", params }) => ({
        url: "/api/patient/radiology/reports",
        method: "GET",
        params: {
          page,
          size,
          sort,
          ...params,
        },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["RadiologyReport"],
    }),

    getRadiologyReportByOrderTestId: builder.query<any, number>({
      query: (orderTestId) => ({
        url: `/api/patient/radiology/reports/by-test/${orderTestId}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [
        { type: "RadiologyReport", id },
      ],
    }),

    createRadiologyReport: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/patient/radiology/reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

    updateRadiologyReport: builder.mutation<
      any,
      { reportId: number; body: any }
    >({
      query: ({ reportId, body }) => ({
        url: `/api/patient/radiology/reports/${reportId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

    reviewRadiologyReport: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/patient/radiology/reports/review/toggle",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

    rejectRadiologyReport: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/patient/radiology/reports/reject",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

    startRadiologyImage: builder.mutation<any, number>({
      query: (testId) => ({
        url: `/api/patient/radiology/reports/image/${testId}/start`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyImage", "RadiologyReport"],
    }),

    pauseRadiologyImage: builder.mutation<any, number>({
      query: (testId) => ({
        url: `/api/patient/radiology/reports/image/${testId}/pause`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyImage"],
    }),

    resumeRadiologyImage: builder.mutation<any, number>({
      query: (testId) => ({
        url: `/api/patient/radiology/reports/image/${testId}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyImage"],
    }),

    approveRadiologyReport: builder.mutation<any, number>({
      query: (reportId) => ({
        url: `/api/patient/radiology/reports/${reportId}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

      
    secondApproveRadiologyReport: builder.mutation<any, number>({
      query: (reportId) => ({
        url: `/api/patient/radiology/reports/${reportId}/second-approve`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyReport"],
    }),

    getRadiologyImageStatusLog: builder.query<any[], number>({
      query: (reportId) => ({
        url: `/api/patient/radiology/reports/${reportId}/image-status-log`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [
        { type: "RadiologyImage", id },
      ],
    }),



    finishRadiologyImage: builder.mutation<any, number>({
      query: (testId) => ({
        url: `/api/patient/radiology/reports/image/${testId}/finish`,
        method: "POST",
      }),
      invalidatesTags: ["RadiologyImage", "RadiologyReport"],
    }),
  }),
});

export const {
  useFilterRadiologyReportsQuery,
  useLazyFilterRadiologyReportsQuery,
  useGetRadiologyReportByOrderTestIdQuery,
  useLazyGetRadiologyReportByOrderTestIdQuery,
  useCreateRadiologyReportMutation,
  useUpdateRadiologyReportMutation,
  useReviewRadiologyReportMutation,
  useRejectRadiologyReportMutation,
  useApproveRadiologyReportMutation,
  useStartRadiologyImageMutation,
  usePauseRadiologyImageMutation,
  useResumeRadiologyImageMutation,
  useFinishRadiologyImageMutation,
  useSecondApproveRadiologyReportMutation,
  useGetRadiologyImageStatusLogQuery,
  useLazyGetRadiologyImageStatusLogQuery,
} = diagnosticOrderTestReportService;
