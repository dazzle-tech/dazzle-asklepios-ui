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

export type PayorPlan = any;
export type PayorPlanSaveVM = any;
export type PayorPlanUpdateVM = any;

export const PayorPlanService = createApi({
  reducerPath: "newPayorPlanApi",
  baseQuery: BaseQuery,
  tagTypes: ["PayorPlan"],
  endpoints: (builder) => ({
    // 🔹 Get Payor Plans by Payor ID (paged)
    getPayorPlansByPayor: builder.query<
      PagedResult<PayorPlan>,
      PagedParams & { payorId: number }
    >({
      query: ({ payorId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/payor-plan/by-payor/${payorId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: PayorPlan[], meta) => {
        const headers = meta?.response?.headers;

        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PayorPlan"],
    }),

    // 🔹 Get single plan by ID
    getPayorPlanById: builder.query<PayorPlan, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "PayorPlan", id }],
    }),

    // 🔹 Create new PayorPlan
    createPayorPlan: builder.mutation<PayorPlan, PayorPlanSaveVM>({
      query: (body) => ({
        url: `/api/setup/payor-plan`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PayorPlan"],
    }),

    // 🔹 Update PayorPlan
    updatePayorPlan: builder.mutation<PayorPlan, PayorPlanUpdateVM>({
      query: (body) => ({
        url: `/api/setup/payor-plan`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, body: any) =>
        body?.id
          ? [{ type: "PayorPlan", id: body.id }, "PayorPlan"]
          : ["PayorPlan"],
    }),

    // 🔹 Delete PayorPlan
    deletePayorPlan: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/payor-plan/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PayorPlan"],
    }),
  }),
});

export const {
  useGetPayorPlansByPayorQuery,
  useLazyGetPayorPlansByPayorQuery,
  useGetPayorPlanByIdQuery,
  useCreatePayorPlanMutation,
  useUpdatePayorPlanMutation,
  useDeletePayorPlanMutation,
} = PayorPlanService;
