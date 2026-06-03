import { BaseQuery } from "@/newApi";
import { PolicyDefinition, PolicyDefinitionCreateDTO, PolicyDefinitionUpdateDTO } from "@/types/model-types-new";
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

// --------- Types ----------
// export type PolicyDefinition = {
//   id?: number;
//   facilityId?: number;
//   facility?: any;
//   code: string;
//   name: string;
//   description?: string | null;
//   isActive?: boolean;
//   createdDate?: string;
//   lastModifiedDate?: string;
// };

// export type PolicyDefinitionCreateDTO = {
//   facilityId: number;
//   code: string;
//   name: string;
//   description?: string | null;
//   isActive: boolean;
// };

// export type PolicyDefinitionUpdateDTO = {
//   id: number;
//   facilityId: number;
//   code: string;
//   name: string;
//   description?: string | null;
//   isActive: boolean;
// };

export const PolicyDefinitionService = createApi({
  reducerPath: "policyDefinitionApi",
  baseQuery: BaseQuery,
  tagTypes: ["PolicyDefinition"],
  endpoints: (builder) => ({

    // List all (paginated)
    getAllPolicyDefinitions: builder.query<PagedResult<PolicyDefinition>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),
     // List all active(paginated)
    getAllActivePolicyDefinitions: builder.query<PagedResult<PolicyDefinition>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition/active",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),

    // List by facility (paginated)
    getPolicyDefinitionsByFacility: builder.query<PagedResult<PolicyDefinition>, { facilityId: number } & PagedParams>({
      query: ({ facilityId, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition/by-facility",
        method: "GET",
        params: { facilityId, page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),
      // active List by facility (paginated)
    getActivePolicyDefinitionsByFacility: builder.query<PagedResult<PolicyDefinition>, { facilityId: number } & PagedParams>({
      query: ({ facilityId, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition/active/by-facility",
        method: "GET",
        params: { facilityId, page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),

    // List by code (paginated)
    getPolicyDefinitionsByCode: builder.query<PagedResult<PolicyDefinition>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition/by-code",
        method: "GET",
        params: { code, page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),

    // List by name (paginated)
    getPolicyDefinitionsByName: builder.query<PagedResult<PolicyDefinition>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/policy-definition/by-name",
        method: "GET",
        params: { name, page, size, sort },
      }),
      transformResponse: (response: PolicyDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PolicyDefinition"],
    }),

    // Get by id
    getPolicyDefinitionById: builder.query<PolicyDefinition, number>({
      query: (id) => ({
        url: `/api/setup/policy-definition/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "PolicyDefinition", id }],
    }),

    // Create
    createPolicyDefinition: builder.mutation<PolicyDefinition, PolicyDefinitionCreateDTO>({
      query: (body) => ({
        url: "/api/setup/policy-definition",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PolicyDefinition"],
    }),

    // Update
    updatePolicyDefinition: builder.mutation<PolicyDefinition, PolicyDefinitionUpdateDTO>({
      query: (body) => ({
        url: "/api/setup/policy-definition",
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "PolicyDefinition", id },
        "PolicyDefinition",
      ],
    }),

    // Toggle Active
    togglePolicyDefinitionActive: builder.mutation<PolicyDefinition, number>({
      query: (id) => ({
        url: `/api/setup/policy-definition/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (r, e, id) => [
        { type: "PolicyDefinition", id },
        "PolicyDefinition",
      ],
    }),
  }),
});

export const {
  useGetAllPolicyDefinitionsQuery,
  useLazyGetAllPolicyDefinitionsQuery,
  useGetPolicyDefinitionsByFacilityQuery,
  useLazyGetPolicyDefinitionsByFacilityQuery,
  useGetPolicyDefinitionsByCodeQuery,
  useLazyGetPolicyDefinitionsByCodeQuery,
  useGetPolicyDefinitionsByNameQuery,
  useLazyGetPolicyDefinitionsByNameQuery,
  useGetPolicyDefinitionByIdQuery,
  useLazyGetPolicyDefinitionByIdQuery,
  useCreatePolicyDefinitionMutation,
  useUpdatePolicyDefinitionMutation,
  useTogglePolicyDefinitionActiveMutation,
  useGetActivePolicyDefinitionsByFacilityQuery,
  useLazyGetActivePolicyDefinitionsByFacilityQuery, 
  useGetAllActivePolicyDefinitionsQuery,
  useLazyGetAllActivePolicyDefinitionsQuery,
} = PolicyDefinitionService;
