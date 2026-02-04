import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "../../newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

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

export type ICDCategoryDTO = {
  categoryCode: string;
  icdCoding: string;
  categoryName: string;
  categoryDescription?: string | null;
  parentCategoryCode?: string | null;
};

export type ICDDiagnosisDTO = {
  id?: number | null;
  icdDiagnosisUid: string;
  icdCode: string;
  icdCoding: string;
  categoryCode: string;
  icdShortDescription?: string | null;
  icdFullDescription?: string | null;
};

export type ICDNodeDetailsDTO = {
  selected: ICDCategoryDTO;
  children: ICDCategoryDTO[];
  diagnoses: ICDDiagnosisDTO[];
};

const mapPaged = <T,>(response: T[] = [], meta?: any): PagedResult<T> => {
  const headers = meta?.response?.headers;

  const getHeader = (name: string): string | null => {
    if (!headers) return null;
    if (typeof headers.get === "function") return headers.get(name);
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? String(headers[key]) : null;
  };

  const totalRaw = getHeader("X-Total-Count") ?? getHeader("x-total-count") ?? "0";
  const linkRaw = getHeader("Link") ?? getHeader("link") ?? "";

  return {
    data: response ?? [],
    totalCount: Number(totalRaw) || 0,
    links: (parseLinkHeader(linkRaw) as LinkMap) || {},
  };
};

export const ICDTreeService = createApi({
  reducerPath: "icdTreeApi",
  baseQuery: BaseQuery,
  tagTypes: ["ICD_TREE"],
  endpoints: (builder) => ({
    getIcdRoots: builder.query<PagedResult<ICDCategoryDTO>, { icdCoding: string } & PagedParams>({
      query: ({ icdCoding, page, size, sort = "categoryCode,asc" }) => ({
        url: "/api/setup/icd/tree/root",
        method: "GET",
        params: { icdCoding, page, size, sort },
      }),
      transformResponse: (response: ICDCategoryDTO[], meta) => mapPaged<ICDCategoryDTO>(response, meta),
      providesTags: ["ICD_TREE"],
    }),
    getIcdChildren: builder.query<
      PagedResult<ICDCategoryDTO>,
      { icdCoding: string; parentCategoryCode: string } & PagedParams
    >({
      query: ({ icdCoding, parentCategoryCode, page, size, sort = "categoryCode,asc" }) => ({
        url: "/api/setup/icd/tree/children",
        method: "GET",
        params: { icdCoding, parentCategoryCode, page, size, sort },
      }),
      transformResponse: (response: ICDCategoryDTO[], meta) => mapPaged<ICDCategoryDTO>(response, meta),
      providesTags: ["ICD_TREE"],
    }),

    getIcdNodeDetails: builder.query<ICDNodeDetailsDTO, { icdCoding: string; categoryCode: string } & PagedParams>({
      query: ({ icdCoding, categoryCode, page, size, sort = "icdCode,asc" }) => ({
        url: "/api/setup/icd/tree/node",
        method: "GET",
        params: { icdCoding, categoryCode, page, size, sort },
      }),
      providesTags: ["ICD_TREE"],
    }),

    getIcdDiagnosesByCategory: builder.query<
      PagedResult<ICDDiagnosisDTO>,
      { icdCoding: string; categoryCode: string } & PagedParams
    >({
      query: ({ icdCoding, categoryCode, page, size, sort = "icdCode,asc" }) => ({
        url: "/api/setup/icd/diagnoses",
        method: "GET",
        params: { icdCoding, categoryCode, page, size, sort },
      }),
      transformResponse: (response: ICDDiagnosisDTO[], meta) => mapPaged<ICDDiagnosisDTO>(response, meta),
      providesTags: ["ICD_TREE"],
    }),

    getIcdDiagnosisById: builder.query<ICDDiagnosisDTO, { id: number | string; timestamp?: number }>({
      query: ({ id }) => ({
        url: `/api/setup/icd/diagnoses/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { id }) => [{ type: "ICD_TREE", id }, "ICD_TREE"],
    }),

    searchIcdDiagnoses: builder.query<PagedResult<ICDDiagnosisDTO>, { keyword: string } & PagedParams>({
      query: ({ keyword, page, size, sort = "icdCode,asc" }) => ({
        url: "/api/setup/icd/diagnoses/search",
        method: "GET",
        params: { keyword, page, size, sort },
      }),
      transformResponse: (response: ICDDiagnosisDTO[], meta) => mapPaged<ICDDiagnosisDTO>(response, meta),
      providesTags: ["ICD_TREE"],
    }),

    getIcdDiagnosesByIds: builder.query<ICDDiagnosisDTO[], { ids: Array<number | string>; timestamp?: number }>({
      query: ({ ids }) => ({
        url: "/api/setup/icd/diagnoses/by-ids",
        method: "GET",
        params: { ids }, 
      }),
      providesTags: ["ICD_TREE"],
    }),

  }),
});

export const {
  useGetIcdRootsQuery,
  useGetIcdChildrenQuery,
  useLazyGetIcdChildrenQuery,
  useGetIcdNodeDetailsQuery,
  useGetIcdDiagnosesByCategoryQuery,
  useLazyGetIcdDiagnosesByCategoryQuery,
  useGetIcdDiagnosisByIdQuery,
  useLazyGetIcdDiagnosisByIdQuery,
  useGetIcdDiagnosesByIdsQuery,
  useLazyGetIcdDiagnosesByIdsQuery,
  useSearchIcdDiagnosesQuery,
  useLazySearchIcdDiagnosesQuery,
} = ICDTreeService;
