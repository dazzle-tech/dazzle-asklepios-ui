import { BaseQuery } from "@/newApi";
import {
  PolicyAssignment,
  PolicyAssignmentCreateDTO,
  PolicyAssignmentUpdateDTO,
  PolicyResourceType,
} from "@/types/model-types-new";
import { createApi } from "@reduxjs/toolkit/dist/query/react";


export const PolicyAssignmentService = createApi({
  reducerPath: "policyAssignmentApi",
  baseQuery: BaseQuery,
  tagTypes: ["PolicyAssignment"],
  endpoints: (builder) => ({
    // Get all
    getAllPolicyAssignments: builder.query<PolicyAssignment[], void>({
      query: () => ({
        url: "/api/setup/policy-assignments",
        method: "GET",
      }),
      providesTags: ["PolicyAssignment"],
    }),

    // Get by id
    getPolicyAssignmentById: builder.query<PolicyAssignment, number>({
      query: (id) => ({
        url: `/api/setup/policy-assignments/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "PolicyAssignment", id }],
    }),

    // Get all by resource
    getPolicyAssignmentsByResource: builder.query<
      PolicyAssignment[],
      { resourceType: PolicyResourceType; resourceId: number }
    >({
      query: ({ resourceType, resourceId }) => ({
        url: "/api/setup/policy-assignments/resource",
        method: "GET",
        params: {
          resourceType,
          resourceId,
        },
      }),
      providesTags: ["PolicyAssignment"],
    }),

    // Get active by facility and resource
    getActivePolicyAssignmentsByFacilityAndResource: builder.query<
      PolicyAssignment[],
      {
        facilityId: number;
        resourceType: PolicyResourceType;
        resourceId: number;
      }
    >({
      query: ({ facilityId, resourceType, resourceId }) => ({
        url: "/api/setup/policy-assignments/active",
        method: "GET",
        params: {
          facilityId,
          resourceType,
          resourceId,
        },
      }),
      providesTags: ["PolicyAssignment"],
    }),

    // Create
    createPolicyAssignment: builder.mutation<
      PolicyAssignment,
      PolicyAssignmentCreateDTO
    >({
      query: (body) => ({
        url: "/api/setup/policy-assignments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PolicyAssignment"],
    }),

    // Update
    updatePolicyAssignment: builder.mutation<
      PolicyAssignment,
      PolicyAssignmentUpdateDTO
    >({
      query: (body) => ({
        url: "/api/setup/policy-assignments",
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PolicyAssignment", id },
        "PolicyAssignment",
      ],
    }),

    // Toggle Active
    togglePolicyAssignmentActive: builder.mutation<PolicyAssignment, number>({
      query: (id) => ({
        url: `/api/setup/policy-assignments/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PolicyAssignment", id },
        "PolicyAssignment",
      ],
    }),
  }),
});

export const {
  useGetAllPolicyAssignmentsQuery,
  useLazyGetAllPolicyAssignmentsQuery,

  useGetPolicyAssignmentByIdQuery,
  useLazyGetPolicyAssignmentByIdQuery,

  useGetPolicyAssignmentsByResourceQuery,
  useLazyGetPolicyAssignmentsByResourceQuery,

  useGetActivePolicyAssignmentsByFacilityAndResourceQuery,
  useLazyGetActivePolicyAssignmentsByFacilityAndResourceQuery,

  useCreatePolicyAssignmentMutation,
  useUpdatePolicyAssignmentMutation,
  useTogglePolicyAssignmentActiveMutation,
} = PolicyAssignmentService;