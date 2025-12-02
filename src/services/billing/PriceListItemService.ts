// services/billing/PriceListItemService.ts
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import { PriceListItem, PriceListItemSaveVM } from "@/types/model-types-new";

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

export const PriceListItemService = createApi({
  reducerPath: "priceListItemApi",
  baseQuery: BaseQuery,
  tagTypes: ["PriceListItem"],
  endpoints: (builder) => ({

    // 🔹 Get all price list items (paginated)
    getAllPriceListItems: builder.query<PagedResult<PriceListItem>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/price-list-item",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: PriceListItem[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PriceListItem"],
    }),

    // 🔹 Get items by priceListId (paginated)
    getPriceListItemsByPriceListId: builder.query<
      PagedResult<PriceListItem>,
      { priceListId: number } & PagedParams
    >({
      query: ({ priceListId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/price-list-item/by-price-list/${priceListId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: PriceListItem[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: (result, error, { priceListId }) => [
        { type: "PriceListItem", id: priceListId },
        "PriceListItem",
      ],
    }),

    // 🔹 Get single item
    getPriceListItemById: builder.query<PriceListItem, number>({
      query: (id) => ({
        url: `/api/setup/price-list-item/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "PriceListItem", id }],
    }),

    // 🔹 Create item (POST) — بدون id
    createPriceListItem: builder.mutation<PriceListItem, Omit<PriceListItemSaveVM, "id">>({
      query: (body) => ({
        url: "/api/setup/price-list-item",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, body) => [
        "PriceListItem",
        { type: "PriceListItem", id: body.priceListId },
      ],
    }),

    // 🔹 Update item (PUT) — مع id
    updatePriceListItem: builder.mutation<PriceListItem, PriceListItemSaveVM>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/price-list-item/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id, priceListId }) => [
        { type: "PriceListItem", id },
        { type: "PriceListItem", id: priceListId },
        "PriceListItem",
      ],
    }),

    // 🔹 Toggle active status
    togglePriceListItemActive: builder.mutation<PriceListItem, number>({
      query: (id) => ({
        url: `/api/setup/price-list-item/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["PriceListItem"],
    }),
  }),
});

export const {
  useGetAllPriceListItemsQuery,
  useGetPriceListItemsByPriceListIdQuery,
  useLazyGetPriceListItemsByPriceListIdQuery,
  useGetPriceListItemByIdQuery,
  useCreatePriceListItemMutation,
  useUpdatePriceListItemMutation,
  useTogglePriceListItemActiveMutation,
} = PriceListItemService;
