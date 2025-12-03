import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

export type LinkMap = {
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

const mapPaged = <T>(response: T[], meta): PagedResult<T> => {
  const headers = meta?.response?.headers;

  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const referralRequestService = createApi({
  reducerPath: "referralRequestService",
  baseQuery: BaseQuery,
  tagTypes: ["ReferralRequest"],

  endpoints: (builder) => ({
    
    // ---------- CREATE ----------
    createReferralRequest: builder.mutation({
      query: (body) => ({
        url: "/api/setup/referral-request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ReferralRequest"],
    }),

    // ---------- UPDATE ----------
    updateReferralRequest: builder.mutation({
      query: (body) => ({
        url: "/api/setup/referral-request",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ReferralRequest"],
    }),

    // ---------- LIST ----------
    getReferralRequests: builder.query({
      query: ({ page = 0, size = 10, sort = "id,desc" }) =>
        `/api/setup/referral-request?page=${page}&size=${size}&sort=${sort}`,
      transformResponse: (response: any[], meta) => mapPaged(response, meta),
      providesTags: ["ReferralRequest"],
    }),

    // ---------- GET BY ID ----------
    getReferralRequestById: builder.query({
      query: (id) => `/api/setup/referral-request/${id}`,
      providesTags: ["ReferralRequest"],
    }),

    // ---------- GET BY PATIENT ----------
    getReferralRequestsByPatient: builder.query({
      query: ({ patientId, page = 0, size = 10, sort = "id,desc" }) =>
        `/api/setup/referral-request/by-patient/${patientId}?page=${page}&size=${size}&sort=${sort}`,
      transformResponse: (response: any[], meta) => mapPaged(response, meta),
      providesTags: ["ReferralRequest"],
    }),

    // ---------- GET BY PATIENT + ENCOUNTER ----------
    getReferralRequestsByPatientAndEncounter: builder.query({
      query: ({ patientId, encounterId, page = 0, size = 10, sort = "id,desc" }) =>
        `/api/setup/referral-request/by-patient/${patientId}/encounter/${encounterId}?page=${page}&size=${size}&sort=${sort}`,
      transformResponse: (response: any[], meta) => mapPaged(response, meta),
      providesTags: ["ReferralRequest"],
    }),
  }),
});

export const {
  useCreateReferralRequestMutation,
  useUpdateReferralRequestMutation,
  useGetReferralRequestsQuery,
  useGetReferralRequestByIdQuery,
  useGetReferralRequestsByPatientQuery,
  useGetReferralRequestsByPatientAndEncounterQuery,
} = referralRequestService;
