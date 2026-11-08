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



const toUomGroupPage = (response: any[], meta: any): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const uomGroupService = createApi({
  reducerPath: "newUOMGroupApi",
  baseQuery: BaseQuery,
  tagTypes: ["UOMGroup"],
  endpoints: builder => ({

    // 🔹 Get all practitioners (paginated)
    getAllUOMGroups: builder.query({
      query: ({name , ...params }) => ({
    //  query: () => ({
        url: `/api/setup/uom-groups?name=${name}`,
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

      providesTags: ["UOMGroup"],
    }),


    // Table filters
    getUOMGroupsByName: builder.query<PagedResult<any>, PagedParams & { name: string }>({
      query: ({ name, page, size, sort }) => ({
        url: "/api/setup/uom-groups",
        method: "GET",
        params: { name, page, size, sort },
      }),
      transformResponse: toUomGroupPage,
      providesTags: ["UOMGroup"],
    }),

    getUOMGroupsByDescription: builder.query<PagedResult<any>, PagedParams & { description: string }>({
      query: ({ description, page, size, sort }) => ({
        url: `/api/setup/uom-groups/by-description/${encodeURIComponent(description)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: toUomGroupPage,
      providesTags: ["UOMGroup"],
    }),

    // 🔹 Get single practitioner
    getUOMGroupById: builder.query({
      query: id => ({
        url: `/api/setup/uom-groups/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "UOMGroup", id }],
    }),

    // 🔹 Create practitioner
    createUOMGroup: builder.mutation({
      query: uomGroup => ({
        url: "/api/setup/uom-groups",
        method: "POST",
        body: uomGroup,
      }),
      invalidatesTags: ["UOMGroup"],
    }),

    updateUOMGroup: builder.mutation({
      query: uomGroup => ({
        url: `/api/setup/uom-groups/${uomGroup?.id}`,
        method: "PUT",
        body: uomGroup,
      }),
      invalidatesTags: ["UOMGroup"],
    }),

    // 🔹 Create practitioner
    deleteUOMGroup: builder.mutation({
      query: id => ({
        url: `/api/setup/uom-groups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UOMGroup"],
    }),

    
    createUnit: builder.mutation({
      query: ({groupId, UomGroupUnit}) => ({
        url: `/api/setup/uom-groups/${groupId}/units`,
        method: "POST",
        body: UomGroupUnit,
      }),
      invalidatesTags: ["UOMGroup"],
    }),

    getAllUnitsByGroupId: builder.query({
      query: groupId => ({
        url: `/api/setup/uom-groups/${groupId}/units`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "UOMGroup", id }],
    }),

     deleteUOMUnit: builder.mutation({
      query: id => ({
        url: `/api/setup/uom-units/${id}`,
        method: "DELETE",
      }),
      // invalidatesTags: ["UOMGroup"],
    }),

   updateUOMUnit: builder.mutation({
      query: uomUnit => ({
        url: `/api/setup/uom-units/${uomUnit?.id}`,
        method: "PUT",
        body: uomUnit
      }),
      // invalidatesTags: ["UOMGroup"],
    }),

    createRelation: builder.mutation({
      query: ({groupId, UomGroupRelation}) => ({
        url: `/api/setup/uom-groups/relations/${groupId}`,
        method: "POST",
        body: UomGroupRelation,
      }),
      // invalidatesTags: ["UOMGroup"],
    }),

     getAllRelationByUOMGroup: builder.query({
      query: groupId => ({
        url: `/api/setup/uom-groups/relations/${groupId}`,
        method: "GET",
      }),
      // invalidatesTags: ["UOMGroup"],
    }),
    
    deleteUOMRelation: builder.mutation({
      query: ({groupId, id}) => ({
        url: `/api/setup/uom-groups/relations/${groupId}/${id}`,
        method: "DELETE",
      }),
      // invalidatesTags: ["UOMGroup"],
    }),

    updateUOMRelation: builder.mutation({
      query: ({groupId, uomRelation}) => ({
        url: `/api/setup/uom-groups/relations/${groupId}/${uomRelation?.id}`,
        method: "PUT",
        body: uomRelation
      }),
      // invalidatesTags: ["UOMGroup"],
    }),

  }),
});

export const {
    useGetAllUOMGroupsQuery,
    useLazyGetUOMGroupsByNameQuery,
    useLazyGetUOMGroupsByDescriptionQuery,
    useGetAllUnitsByGroupIdQuery,
    useDeleteUOMGroupMutation,
    useCreateUOMGroupMutation,
    useCreateUnitMutation,
    useGetUOMGroupByIdQuery,
    useDeleteUOMUnitMutation,
    useUpdateUOMUnitMutation,
    useCreateRelationMutation,
    useGetAllRelationByUOMGroupQuery,
    useUpdateUOMGroupMutation,
    useDeleteUOMRelationMutation,
    useUpdateUOMRelationMutation
} = uomGroupService;
