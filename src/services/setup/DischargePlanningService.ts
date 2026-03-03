// services/setup/dischargePlanningService.ts

import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import type { DischargePlanning } from "@/types/model-types-new";

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

export type DischargePlanningSaveVM = Omit<DischargePlanning, "id" | "createdDate" | "lastModifiedDate">;
export type DischargePlanningUpdateVM = DischargePlanning;

export const DischargePlanningService = createApi({
  reducerPath: "dischargePlanningApi",
  baseQuery: BaseQuery,
  tagTypes: ["DischargePlanning"],
  endpoints: (builder) => ({

    // 🔹 Get object by encounter (one-to-one)
    getDischargePlanningByEncounter: builder.query<DischargePlanning | null, number | string>({
      query: (encounterId) => ({
        url: `/api/setup/discharge-planning/by-encounter/${encounterId}`,
        method: "GET",
      }),
      // إذا رجع 204 no content
      transformResponse: (response: any, meta) => {
        if (meta?.response?.status === 204) return null;
        return response as DischargePlanning;
      },
      providesTags: (r, e, encounterId) => [{ type: "DischargePlanning", id: `enc-${encounterId}` }],
    }),

    // 🔹 Upsert (Create/Update by encounter)
    upsertDischargePlanning: builder.mutation<DischargePlanning, DischargePlanningSaveVM>({
      query: (body) => ({
        url: "/api/setup/discharge-planning",
        method: "POST",
        body,
      }),
      invalidatesTags: (r, e, body) => [
        { type: "DischargePlanning", id: `enc-${body.encounterId}` },
        "DischargePlanning",
      ],
    }),

    // 🔹 Explicit update by id (optional)
    updateDischargePlanning: builder.mutation<DischargePlanning, DischargePlanningUpdateVM>({
      query: (body) => ({
        url: "/api/setup/discharge-planning",
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, body) => [
        { type: "DischargePlanning", id: body.id },
        { type: "DischargePlanning", id: `enc-${body.encounterId}` },
        "DischargePlanning",
      ],
    }),

    // 🔹 Get by patient (paged)
    getDischargePlanningByPatient: builder.query<PagedResult<DischargePlanning>, { patientId: number | string } & PagedParams>({
      query: ({ patientId, page, size, sort = "id,desc" }) => ({
        url: `/api/setup/discharge-planning/by-patient/${patientId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: DischargePlanning[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DischargePlanning"],
    }),

    // 🔹 Get by patient + encounter (paged) (optional)
    getDischargePlanningByPatientAndEncounter: builder.query<
      PagedResult<DischargePlanning>,
      { patientId: number | string; encounterId: number | string } & PagedParams
    >({
      query: ({ patientId, encounterId, page, size, sort = "id,desc" }) => ({
        url: `/api/setup/discharge-planning/by-patient/${patientId}/encounter/${encounterId}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: DischargePlanning[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DischargePlanning"],
    }),
  }),
});

export const {
  useGetDischargePlanningByEncounterQuery,
  useLazyGetDischargePlanningByEncounterQuery,
  useUpsertDischargePlanningMutation,
  useUpdateDischargePlanningMutation,
  useGetDischargePlanningByPatientQuery,
  useLazyGetDischargePlanningByPatientQuery,
  useGetDischargePlanningByPatientAndEncounterQuery,
  useLazyGetDischargePlanningByPatientAndEncounterQuery,
} = DischargePlanningService;
