// src/services/setup/patient-relation/RelationsMatrixService.ts
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export type Gender = "MALE" | "FEMALE"; // same enum names in backend

export type RelationsMatrix = {
  id: number;
  firstPatientGender: Gender | null;
  secondPatientGender: Gender | null;
  firstRelationCode: string;  // RelationType enum name
  secondRelationCode: string; // RelationType enum name
};

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

export const RelationsMatrixService = createApi({
  reducerPath: "relationsMatrixApi",
  baseQuery: BaseQuery,
  tagTypes: ["RelationsMatrix"],
  endpoints: (builder) => ({
    // ✅ GET /api/setup/relations-matrix  (paginated list)
    getAllRelationsMatrix: builder.query<PagedResult<RelationsMatrix>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/patient/relations-matrix",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: RelationsMatrix[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["RelationsMatrix"],
    }),

    // ✅ GET by first gender only
    // GET /api/setup/relations-matrix/by-first-gender/{gender}
    getByFirstGender: builder.query<PagedResult<RelationsMatrix>, { gender: Gender } & PagedParams>({
      query: ({ gender, page, size, sort = "id,asc" }) => ({
        url: `/api/patient/relations-matrix/by-first-gender/${gender}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: RelationsMatrix[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["RelationsMatrix"],
    }),

    // ✅ GET by both genders (to filter allowed relations precisely)
    // GET /api/setup/relations-matrix/by-genders?first=MALE&second=FEMALE
    getByGenders: builder.query<
      PagedResult<RelationsMatrix>,
      { firstGender: Gender; secondGender: Gender } & PagedParams
    >({
      query: ({ firstGender, secondGender, page, size, sort = "id,asc" }) => ({
        url: `/api/patient/relations-matrix/by-genders`,
        method: "GET",
        params: { firstGender, secondGender, page, size, sort },
      }),
      transformResponse: (response: RelationsMatrix[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["RelationsMatrix"],
    }),

    // ✅ Convenience endpoint: return distinct allowed firstRelationCode for a given firstGender
    // GET /api/setup/relations-matrix/allowed-relations/{firstGender}
    getAllowedRelationsForFirstGender: builder.query<string[], Gender>({
      query: (firstGender) => ({
        url: `/api/patient/relations-matrix/allowed-relations/${firstGender}`,
        method: "GET",
      }),
      providesTags: ["RelationsMatrix"],
    }),
  }),
});

export const {
  useGetAllRelationsMatrixQuery,
  useLazyGetAllRelationsMatrixQuery,
  useGetByFirstGenderQuery,
  useLazyGetByFirstGenderQuery,
  useGetByGendersQuery,
  useLazyGetByGendersQuery,
  useGetAllowedRelationsForFirstGenderQuery,
  useLazyGetAllowedRelationsForFirstGenderQuery,
} = RelationsMatrixService;

export default RelationsMatrixService;
