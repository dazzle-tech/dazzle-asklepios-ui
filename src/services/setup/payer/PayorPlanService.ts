import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import type { PayorPlan, PayorPlanItem } from "@/types/model-types-new";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

export type PayorPlanSaveVM = Omit<PayorPlan, "id" | "items" | "createdDate" | "lastModifiedDate">;
export type PayorPlanUpdateVM = Omit<PayorPlan, "items" | "createdDate" | "lastModifiedDate">;

export type PayorPlanItemSaveVM = Omit<PayorPlanItem, "id" | "createdDate" | "lastModifiedDate">;
export type PayorPlanItemUpdateVM = Omit<PayorPlanItem, "createdDate" | "lastModifiedDate">;

export const PayorPlanService = createApi({
  reducerPath: "payorPlanApi",
  baseQuery: BaseQuery,
  tagTypes: ["PayorPlan", "PayorPlanItem"],
  endpoints: (builder) => ({

    // ---------------- PLANS ----------------

    getAllPlans: builder.query<PagedResult<PayorPlan>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/payor-plan",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlan[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlan"],
    }),

    getAllActivePlans: builder.query<PagedResult<PayorPlan>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/payor-plan/active",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlan[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlan"],
    }),

    getPlansByPayor: builder.query<PagedResult<PayorPlan>, { payorId: number | string } & PagedParams>({
      query: ({ payorId, page, size, sort = "id,desc" }) => ({
        url: `/api/setup/payor-plan/by-payor/${payorId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlan[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlan"],
    }),

    getActivePlansByPayor: builder.query<PagedResult<PayorPlan>, { payorId: number | string } & PagedParams>({
      query: ({ payorId, page, size, sort = "id,desc" }) => ({
        url: `/api/setup/payor-plan/by-payor/${payorId}/active`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlan[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlan"],
    }),

    getPlanById: builder.query<PayorPlan, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan/${id}`,
        method: "GET",
        params: { includeItems: true },
      }),
      providesTags: (r, e, id) => [{ type: "PayorPlan", id }],
    }),

    createPlan: builder.mutation<PayorPlan, PayorPlanSaveVM>({
      query: (body) => ({
        url: "/api/setup/payor-plan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PayorPlan"],
    }),

    updatePlan: builder.mutation<PayorPlan, PayorPlanUpdateVM>({
      query: (body) => ({
        url: "/api/setup/payor-plan",
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, body: any) =>
        body?.id ? [{ type: "PayorPlan", id: body.id }, "PayorPlan"] : ["PayorPlan"],
    }),

    togglePlanActive: builder.mutation<PayorPlan, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["PayorPlan"],
    }),

    deletePlan: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PayorPlan", "PayorPlanItem"],
    }),

    // ---------------- PLAN ITEMS ----------------

    getItemsByPlan: builder.query<PagedResult<PayorPlanItem>, { planId: number | string } & PagedParams>({
      query: ({ planId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/payor-plan-item/by-plan/${planId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlanItem[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlanItem"],
    }),

    getActiveItemsByPlan: builder.query<PagedResult<PayorPlanItem>, { planId: number | string } & PagedParams>({
      query: ({ planId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/payor-plan-item/by-plan/${planId}/active`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (res: PayorPlanItem[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PayorPlanItem"],
    }),

    createPlanItem: builder.mutation<PayorPlanItem, PayorPlanItemSaveVM>({
      query: (body) => ({
        url: "/api/setup/payor-plan-item",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PayorPlanItem", "PayorPlan"],
    }),

    updatePlanItem: builder.mutation<PayorPlanItem, PayorPlanItemUpdateVM>({
      query: (body) => ({
        url: "/api/setup/payor-plan-item",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PayorPlanItem", "PayorPlan"],
    }),

    togglePlanItemActive: builder.mutation<PayorPlanItem, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan-item/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["PayorPlanItem", "PayorPlan"],
    }),

    deletePlanItem: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/api/setup/payor-plan-item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PayorPlanItem", "PayorPlan"],
    }),
  }),
});

export const {
  useGetAllPlansQuery,
  useLazyGetAllPlansQuery,
  useGetAllActivePlansQuery,
  useLazyGetAllActivePlansQuery,
  useGetPlansByPayorQuery,
  useLazyGetPlansByPayorQuery,
  useGetActivePlansByPayorQuery,
  useLazyGetActivePlansByPayorQuery,
  useGetPlanByIdQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useTogglePlanActiveMutation,
  useDeletePlanMutation,

  useGetItemsByPlanQuery,
  useLazyGetItemsByPlanQuery,
  useGetActiveItemsByPlanQuery,
  useLazyGetActiveItemsByPlanQuery,
  useCreatePlanItemMutation,
  useUpdatePlanItemMutation,
  useTogglePlanItemActiveMutation,
  useDeletePlanItemMutation,
} = PayorPlanService;
