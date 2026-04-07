// services/setup/formEntriesService.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import type { FormEntry, FormEntryCreateVM } from "@/types/model-types-new";

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
const unwrapObjectOrReturn = <T>(response: any): T => {
  return (response?.object ?? response) as T;
};

export const FormEntriesService = createApi({
  reducerPath: "formEntryApi",
  baseQuery: BaseQuery,
  tagTypes: ["FormEntry"],
  endpoints: (builder) => ({
    // GET /api/setup/form-entries?templateId=&page=&size=&sort=
    getFormEntriesByTemplate: builder.query<PagedResult<FormEntry>, { templateId: number | string } & PagedParams>({
  query: ({ templateId, page, size, sort = "id,desc" }) => ({
    url: `/api/setup/form-entries`,
    method: "GET",
    params: { templateId, page, size, sort },
  }),
  transformResponse: (response: any, meta) => {
    const headers = meta?.response?.headers;
    const raw = unwrapObjectOrReturn<any>(response);

    if (Array.isArray(raw)) {
      return {
        data: raw,
        totalCount: Number(headers?.get("X-Total-Count") ?? raw.length ?? 0),
        links: parseLinkHeader(headers?.get("Link")),
      };
    }

    return {
      data: raw?.data ?? [],
      totalCount: Number(raw?.totalCount ?? headers?.get("X-Total-Count") ?? 0),
      links: raw?.links ?? parseLinkHeader(headers?.get("Link")),
    };
  },
  providesTags: (r, e, arg) => [
    { type: "FormEntry", id: `tpl-${arg.templateId}` },
    "FormEntry"
  ],
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    const { timestamp, ...rest } = queryArgs || ({} as any);
    return `${endpointName}-${JSON.stringify(rest)}`;
  },
  forceRefetch({ currentArg, previousArg }) {
    return currentArg?.timestamp !== previousArg?.timestamp;
  },
}),

    // POST /api/setup/form-entries
    createFormEntry: builder.mutation<FormEntry, FormEntryCreateVM>({
      query: (body) => ({
        url: `/api/setup/form-entries`,
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, body: any) => {
        const templateId = body?.templateId;
        return templateId
          ? [{ type: "FormEntry", id: `tpl-${templateId}` }, "FormEntry"]
          : ["FormEntry"];
      },
    }),
    // PUT /api/setup/form-entries/{id}
updateFormEntry: builder.mutation<FormEntry, { id: number; title: string; dataJson: string }>({
  query: ({ id, title, dataJson }) => ({
    url: `/api/setup/form-entries/${id}`,
    method: "PUT",
    body: { title, dataJson },
  }),
  invalidatesTags: ["FormEntry"],
}),
  }),
});

export const {
  useGetFormEntriesByTemplateQuery,
  useLazyGetFormEntriesByTemplateQuery,
  useCreateFormEntryMutation,
  useUpdateFormEntryMutation
} = FormEntriesService;
