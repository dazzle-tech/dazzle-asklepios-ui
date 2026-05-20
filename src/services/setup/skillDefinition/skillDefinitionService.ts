import { BaseQuery } from "@/newApi";
import { SkillDefinition, SkillDefinitionUpdateDTO, SkillDefinitionCreateDTO } from "@/types/model-types-new";
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

export const SkillDefinitionService = createApi({
  reducerPath: "skillDefinitionApi",
  baseQuery: BaseQuery,
  tagTypes: ["skillDefinition"],
  endpoints: (builder) => ({

    // List all (paginated)
    getAllskillDefinitions: builder.query<PagedResult<SkillDefinition>, PagedParams>({
      query: ({ page, size, sort = "id,desc" }) => ({
        url: "/api/setup/skill-definition",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: SkillDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["skillDefinition"],
    }),

    // List by facility (paginated)
    getskillDefinitionsByFacility: builder.query<PagedResult<SkillDefinition>, { facilityId: number } & PagedParams>({
      query: ({ facilityId, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/skill-definition/by-facility",
        method: "GET",
        params: { facilityId, page, size, sort },
      }),
      transformResponse: (response: SkillDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["skillDefinition"],
    }),

    // List by code (paginated)
    getskillDefinitionsByCode: builder.query<PagedResult<SkillDefinition>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/skill-definition/by-code",
        method: "GET",
        params: { code, page, size, sort },
      }),
      transformResponse: (response: SkillDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["skillDefinition"],
    }),

    // List by name (paginated)
    getskillDefinitionsByName: builder.query<PagedResult<SkillDefinition>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/skill-definition/by-name",
        method: "GET",
        params: { name, page, size, sort },
      }),
      transformResponse: (response: SkillDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["skillDefinition"],
    }),

    // List by type (paginated)
    getskillDefinitionsByType: builder.query<PagedResult<SkillDefinition>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = "id,desc" }) => ({
        url: "/api/setup/skill-definition/by-type",
        method: "GET",
        params: { type, page, size, sort },
      }),
      transformResponse: (response: SkillDefinition[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["skillDefinition"],
    }),

    // Get by id
    getskillDefinitionById: builder.query<SkillDefinition, number>({
      query: (id) => ({
        url: `/api/setup/skill-definition/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "skillDefinition", id }],
    }),

    // Create
    createskillDefinition: builder.mutation<SkillDefinition, SkillDefinitionCreateDTO>({
      query: (body) => ({
        url: "/api/setup/skill-definition",
        method: "POST",
        body,
      }),
      invalidatesTags: ["skillDefinition"],
    }),

    // Update
    updateskillDefinition: builder.mutation<SkillDefinition, SkillDefinitionUpdateDTO>({
      query: (body) => ({
        url: "/api/setup/skill-definition",
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "skillDefinition", id },
        "skillDefinition",
      ],
    }),

    // Toggle Active
    toggleskillDefinitionActive: builder.mutation<SkillDefinition, number>({
      query: (id) => ({
        url: `/api/setup/skill-definition/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (r, e, id) => [
        { type: "skillDefinition", id },
        "skillDefinition",
      ],
    }),
  }),
});

export const {
  useGetAllskillDefinitionsQuery,
  useLazyGetAllskillDefinitionsQuery,
  useGetskillDefinitionsByFacilityQuery,
  useLazyGetskillDefinitionsByFacilityQuery,
  useGetskillDefinitionsByCodeQuery,
  useLazyGetskillDefinitionsByCodeQuery,
  useGetskillDefinitionsByNameQuery,
  useLazyGetskillDefinitionsByNameQuery,
  useGetskillDefinitionByIdQuery,
  useLazyGetskillDefinitionByIdQuery,
  useCreateskillDefinitionMutation,
  useUpdateskillDefinitionMutation,
  useToggleskillDefinitionActiveMutation,
} = SkillDefinitionService;
