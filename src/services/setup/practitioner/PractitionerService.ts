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



export const PractitionerService = createApi({
  reducerPath: "newPractitionerApi",
  baseQuery: BaseQuery,
  tagTypes: ["Practitioner"],
  endpoints: (builder) => ({

    // 🔹 Get all practitioners (paginated)
    getAllPractitioners: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/practitioner",
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

      providesTags: ["Practitioner"],
    }),

    // 🔹 Get practitioners by facility
    getPractitionersByFacility: builder.query({
      query: ({ facilityId, ...params }) => ({
        url: `/api/setup/practitioner/by-facility/${facilityId}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Practitioner"],
    }),

    // 🔹 Get practitioners by specialty
    getPractitionersBySpecialty: builder.query({
      query: ({ specialty, ...params }) => ({
        url: `/api/setup/practitioner/by-specialty/${specialty}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Practitioner"],
    }),

    // 🔹 Get active practitioners by sub-specialty
    getActivePractitionersBySubSpecialty: builder.query({
      query: ({ specialty, ...params }) => ({
        url: `/api/setup/practitioner/active/by-sub-specialty/${specialty}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Practitioner"],
    }),
    getPractitionerByName: builder.query({
      query: ({ name, ...params }) => ({
        url: `/api/setup/practitioner/by-name/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Practitioner"],
    }),

    // 🔹 Get single practitioner
    getPractitionerById: builder.query({
      query: (id) => ({
        url: `/api/setup/practitioner/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Practitioner", id }],
    }),

    // 🔹 Create practitioner
    createPractitioner: builder.mutation({
      query: (body) => ({
        url: "/api/setup/practitioner",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Practitioner"],
    }),

    // 🔹 Update practitioner
    updatePractitioner: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/setup/practitioner/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Practitioner", id },
        "Practitioner",
      ],
    }),
      getActiveAppointablePractitioner: builder.query({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/practitioner/active-appointable`,
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
      providesTags: ["Practitioner"],
    }),

    // 🔹 Toggle active status
    togglePractitionerActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/practitioner/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["Practitioner"],
    }),
    getPractitionerByUserId: builder.query<any, number>({
      query: (userId) => ({
        url: `/api/setup/practitioner/by-user/${userId}`,
        method: "GET",
      }),
      providesTags: ["Practitioner"],
    }),
    existsPractitionerByUserId: builder.query<boolean, number>({
      query: (userId) => ({
        url: `/api/setup/practitioner/exists-by-user/${userId}`,
        method: "GET",
      }),
      providesTags: ["Practitioner"],
    }),
  }),
});

export const {
  useGetAllPractitionersQuery,
  useGetPractitionersByFacilityQuery,
  useLazyGetPractitionersByFacilityQuery,
  useLazyGetPractitionersBySpecialtyQuery,
  useLazyGetPractitionerByNameQuery,
  useGetPractitionersBySpecialtyQuery,
  useGetActivePractitionersBySubSpecialtyQuery,
  useLazyGetActivePractitionersBySubSpecialtyQuery,
  useGetPractitionerByIdQuery,
  useCreatePractitionerMutation,
  useUpdatePractitionerMutation,
  useTogglePractitionerActiveMutation,
  useGetActiveAppointablePractitionerQuery
  useGetPractitionerByUserIdQuery,
  useLazyGetPractitionerByUserIdQuery,
  useExistsPractitionerByUserIdQuery,
  useLazyExistsPractitionerByUserIdQuery,
} = PractitionerService;
