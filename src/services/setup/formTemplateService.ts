import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "../../newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import type { FormTemplate } from "@/types/model-types-new";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

const unwrapObjectOrReturn = <T>(response: any): T => {
  return (response?.object ?? response) as T;
};

export const formTemplateService = createApi({
  reducerPath: "formTemplateApi",
  baseQuery: BaseQuery,
  tagTypes: ["FormTemplate"],
  endpoints: (builder) => ({
    // -------------------------
    // CRUD
    // -------------------------

    // GET /api/setup/form-templates/{id}
    getFormTemplate: builder.query<FormTemplate, number>({
      query: (id) => ({
        url: `/api/setup/form-templates/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => unwrapObjectOrReturn<FormTemplate>(response),
      providesTags: (r, e, id) => [{ type: "FormTemplate", id }],
    }),

    // POST /api/setup/form-templates
    createFormTemplate: builder.mutation<FormTemplate, Omit<FormTemplate, "id">>({
      query: (body) => ({
        url: `/api/setup/form-templates`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => unwrapObjectOrReturn<FormTemplate>(response),
      invalidatesTags: ["FormTemplate"],
    }),

    // PUT /api/setup/form-templates/{id}
    updateFormTemplate: builder.mutation<FormTemplate, { id: number; body: Omit<FormTemplate, "id"> }>({
      query: ({ id, body }) => ({
        url: `/api/setup/form-templates/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: any) => unwrapObjectOrReturn<FormTemplate>(response),
      invalidatesTags: (r, e, arg) => [{ type: "FormTemplate", id: arg.id }, "FormTemplate"],
    }),

    // DELETE /api/setup/form-templates/{id}
    deleteFormTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/form-templates/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => unwrapObjectOrReturn<any>(response),
      invalidatesTags: (r, e, id) => [{ type: "FormTemplate", id }, "FormTemplate"],
    }),

    // -------------------------
    // LIST (Paged) - main table
    // GET /api/setup/form-templates?page=&size=&sort=
    // -------------------------
       getFormTemplates: builder.query<
  PagedResult<FormTemplate>,
  PagedParams & { params?: Record<string, any> }
>({
  query: ({ page, size, sort = "id,asc", params }) => ({
    url: `/api/setup/form-templates`,
    method: "GET",
    params: {
      page,
      size,
      sort,
      ...params,
    },
  }),
  transformResponse: (response: any, meta) => {
    const headers = meta?.response?.headers;
    const isArray = Array.isArray(response);

    if (isArray) {
      return {
        data: response as FormTemplate[],
        totalCount: Number(headers?.get("X-Total-Count") ?? 0),
        links: parseLinkHeader(headers?.get("Link")),
      };
    }

    const obj = unwrapObjectOrReturn<PagedResult<FormTemplate>>(response);
    return {
      data: obj?.data ?? [],
      totalCount: obj?.totalCount ?? 0,
      links: obj?.links ?? undefined,
    };
  },

  providesTags: ["FormTemplate"],

  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    const { timestamp, ...rest } = queryArgs || ({} as any);
    return `${endpointName}-${JSON.stringify(rest)}`;
  },

  forceRefetch({ currentArg, previousArg }) {
    return currentArg?.timestamp !== previousArg?.timestamp;
  },
}),
    // -------------------------
    // FILTERS 
    // -------------------------

    // GET /api/setup/form-templates/by-facility?facilityId=&page=&size=&sort=
    getFormTemplatesByFacility: builder.query<
      PagedResult<FormTemplate>,
      { facilityId: number } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/form-templates/by-facility`,
        method: "GET",
        params: { facilityId, page, size, sort },
      }),
      transformResponse: (response: any, meta) => {
        const headers = meta?.response?.headers;
        if (Array.isArray(response)) {
          return {
            data: response as FormTemplate[],
            totalCount: Number(headers?.get("X-Total-Count") ?? 0),
            links: parseLinkHeader(headers?.get("Link")),
          };
        }
        const obj = unwrapObjectOrReturn<PagedResult<FormTemplate>>(response);
        return { data: obj?.data ?? [], totalCount: obj?.totalCount ?? 0, links: obj?.links };
      },
      providesTags: ["FormTemplate"],
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { timestamp, ...rest } = queryArgs || ({} as any);
        return `${endpointName}-${JSON.stringify(rest)}`;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.timestamp !== previousArg?.timestamp;
      },
    }),

    // GET /api/setup/form-templates/by-department?departmentId=&page=&size=&sort=
    getFormTemplatesByDepartment: builder.query<
      PagedResult<FormTemplate>,
      { departmentId: number } & PagedParams
    >({
      query: ({ departmentId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/form-templates/by-department`,
        method: "GET",
        params: { departmentId, page, size, sort },
      }),
      transformResponse: (response: any, meta) => {
        const headers = meta?.response?.headers;
        if (Array.isArray(response)) {
          return {
            data: response as FormTemplate[],
            totalCount: Number(headers?.get("X-Total-Count") ?? 0),
            links: parseLinkHeader(headers?.get("Link")),
          };
        }
        const obj = unwrapObjectOrReturn<PagedResult<FormTemplate>>(response);
        return { data: obj?.data ?? [], totalCount: obj?.totalCount ?? 0, links: obj?.links };
      },
      providesTags: ["FormTemplate"],
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { timestamp, ...rest } = queryArgs || ({} as any);
        return `${endpointName}-${JSON.stringify(rest)}`;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.timestamp !== previousArg?.timestamp;
      },
    }),

    // GET /api/setup/form-templates/by-name?name=&page=&size=&sort=
    getFormTemplatesByName: builder.query<
      PagedResult<FormTemplate>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/form-templates/by-name`,
        method: "GET",
        params: { name, page, size, sort },
      }),
      transformResponse: (response: any, meta) => {
        const headers = meta?.response?.headers;
        if (Array.isArray(response)) {
          return {
            data: response as FormTemplate[],
            totalCount: Number(headers?.get("X-Total-Count") ?? 0),
            links: parseLinkHeader(headers?.get("Link")),
          };
        }
        const obj = unwrapObjectOrReturn<PagedResult<FormTemplate>>(response);
        return { data: obj?.data ?? [], totalCount: obj?.totalCount ?? 0, links: obj?.links };
      },
      providesTags: ["FormTemplate"],
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { timestamp, ...rest } = queryArgs || ({} as any);
        return `${endpointName}-${JSON.stringify(rest)}`;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.timestamp !== previousArg?.timestamp;
      },
    }),
  }),
});

export const {
  // CRUD
  useGetFormTemplateQuery,
  useLazyGetFormTemplateQuery,
  useCreateFormTemplateMutation,
  useUpdateFormTemplateMutation,
  useDeleteFormTemplateMutation,

  // main list
  useGetFormTemplatesQuery,
  useLazyGetFormTemplatesQuery,

  // filters
  useGetFormTemplatesByFacilityQuery,
  useLazyGetFormTemplatesByFacilityQuery,
  useGetFormTemplatesByDepartmentQuery,
  useLazyGetFormTemplatesByDepartmentQuery,
  useGetFormTemplatesByNameQuery,
  useLazyGetFormTemplatesByNameQuery,
} = formTemplateService;
