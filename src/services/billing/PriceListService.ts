// PriceListService.ts
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

export const PriceListService = createApi({
  reducerPath: "priceListApi",
  baseQuery: BaseQuery,
  tagTypes: ["PriceList"],
  endpoints: (builder) => ({

    getAllPriceLists: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/price-list",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PriceList"],
    }),

    getAllActivePriceLists: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/price-list/active",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PriceList"],
    }),

    getPriceListById: builder.query({
      query: (id) => ({
        url: `/api/setup/price-list/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "PriceList", id }],
    }),

    savePriceList: builder.mutation<any[], any>({
      query: (body) => ({
        url: "/api/setup/price-list",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PriceList"],
    }),

    togglePriceListActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/price-list/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["PriceList"],
    }),

    // ---------------- Filters ----------------

    getPriceListsByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, ...params }) => ({
        url: `/api/setup/price-list/by-name/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PriceList"],
    }),

    getPriceListsByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, ...params }) => ({
        url: `/api/setup/price-list/by-type/${type}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PriceList"],
    }),

    getPriceListsByTypeAndName: builder.query<PagedResult<any>, { type: string; name: string } & PagedParams>({
      query: ({ type, name, ...params }) => ({
        url: `/api/setup/price-list/by-type-and-name/${type}/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (res: any[], meta) => {
        const h = meta?.response?.headers;
        return {
          data: res,
          totalCount: Number(h?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(h?.get("Link")),
        };
      },
      providesTags: ["PriceList"],
    }),
  }),
});

export const {
  useGetAllPriceListsQuery,
  useGetAllActivePriceListsQuery,
  useGetPriceListByIdQuery,
  useSavePriceListMutation,
  useTogglePriceListActiveMutation,
  useGetPriceListsByNameQuery,
  useLazyGetPriceListsByNameQuery,
  useGetPriceListsByTypeQuery,
  useLazyGetPriceListsByTypeQuery,
  useGetPriceListsByTypeAndNameQuery,
  useLazyGetPriceListsByTypeAndNameQuery,
} = PriceListService;
