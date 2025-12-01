// reportTemplateService.ts
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

// --------- Types ----------
export type ReportTemplate = {
  id?: number;
  name: string;
  templateValue: string; // HTML
  isActive?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
};

export type ReportTemplateCreateVM = {
  name: string;
  templateValue: string;
  isActive?: boolean;
};

export type ReportTemplateUpdateVM = {
  id: number;
  name: string;
  templateValue: string;
  isActive?: boolean;
};

export const ReportTemplateService = createApi({
  reducerPath: "reportTemplateApi",
  baseQuery: BaseQuery,
  tagTypes: ["ReportTemplate"],
  endpoints: (builder) => ({

    // 🔹 List all (paginated)
    getAllReportTemplates: builder.query<PagedResult<ReportTemplate>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/report-template",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: ReportTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["ReportTemplate"],
    }),

    // 🔹 List active only
    getActiveReportTemplates: builder.query<PagedResult<ReportTemplate>, PagedParams>({
      query: ({ page, size, sort = "name,asc" }) => ({
        url: "/api/setup/report-template/active",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: ReportTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["ReportTemplate"],
    }),

    // 🔹 Get by id
    getReportTemplateById: builder.query<ReportTemplate, number>({
      query: (id) => ({
        url: `/api/setup/report-template/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "ReportTemplate", id }],
    }),

    // 🔹 CREATE
    createReportTemplate: builder.mutation<ReportTemplate, ReportTemplateCreateVM>({
      query: (body) => ({
        url: "/api/setup/report-template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ReportTemplate"],
    }),

    // 🔹 UPDATE
    updateReportTemplate: builder.mutation<ReportTemplate, ReportTemplateUpdateVM>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/report-template/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "ReportTemplate", id },
        "ReportTemplate",
      ],
    }),

    // 🔹 Toggle Active
    toggleReportTemplateActive: builder.mutation<ReportTemplate, number>({
      query: (id) => ({
        url: `/api/setup/report-template/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (r, e, id) => [
        { type: "ReportTemplate", id },
        "ReportTemplate",
      ],
    }),

    // 🔹 Delete
    deleteReportTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/report-template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ReportTemplate"],
    }),

    // 🔹 Search by name (paginated)
    getReportTemplatesByName: builder.query<
      PagedResult<ReportTemplate>,
      { name: string } & PagedParams
    >({
      query: ({ name, ...params }) => ({
        url: `/api/setup/report-template/by-name/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: ReportTemplate[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["ReportTemplate"],
    }),
  }),
});

export const {
  useGetAllReportTemplatesQuery,
  useLazyGetAllReportTemplatesQuery,
  useGetActiveReportTemplatesQuery,
  useLazyGetActiveReportTemplatesQuery,
  useGetReportTemplateByIdQuery,
  useLazyGetReportTemplateByIdQuery,
  useCreateReportTemplateMutation,
  useUpdateReportTemplateMutation,
  useToggleReportTemplateActiveMutation,
  useDeleteReportTemplateMutation,
  useGetReportTemplatesByNameQuery,
  useLazyGetReportTemplatesByNameQuery,
} = ReportTemplateService;
