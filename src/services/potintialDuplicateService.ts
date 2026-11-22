import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

export const potintialService = createApi({
  reducerPath: 'potintialApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    // Optional filters are ANDed by the backend; empty ones are left out.
    // A plain string is still accepted as the rule filter.
    getDuplicationCandidates: builder.query({
      query: (
        filters?:
          | string
          | {
              role?: string;
              isActive?: boolean;
              /** Duplication fields that must be on / off */
              fieldsTrue?: string[];
              fieldsFalse?: string[];
            }
      ) => {
        const f = typeof filters === 'string' ? { role: filters } : filters ?? {};
        return {
          url: '/api/setup/duplication-candidates',
          params: {
            role: f.role?.trim() || undefined,
            isActive: f.isActive,
            fieldsTrue: f.fieldsTrue?.length ? f.fieldsTrue.join(',') : undefined,
            fieldsFalse: f.fieldsFalse?.length ? f.fieldsFalse.join(',') : undefined,
          },
        };
      },
    }),

    // GET /api/setup/duplication-candidates/by-rule/{rule}
    getDuplicationCandidatesByRule: builder.query({
      query: ({ rule }: { rule: string }) =>
        `/api/setup/duplication-candidates/by-rule/${encodeURIComponent(rule)}`,
    }),

    // GET /api/setup/duplication-candidates/by-status?isActive=
    getDuplicationCandidatesByStatus: builder.query({
      query: ({ isActive }: { isActive: string }) => ({
        url: '/api/setup/duplication-candidates/by-status',
        params: { isActive },
      }),
    }),

    // GET /api/setup/duplication-candidates/by-field?field=&value=
    getDuplicationCandidatesByField: builder.query({
      query: ({ field, value }: { field: string; value: string }) => ({
        url: '/api/setup/duplication-candidates/by-field',
        params: { field, value },
      }),
    }),

    createDuplicationCandidate: builder.mutation({
      query: (candidate) => ({
        url: '/api/setup/duplication-candidates',
        method: 'POST',
        body: candidate,
      }),
    }),

    updateDuplicationCandidate: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/setup/duplication-candidates/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),

    deactivateDuplicationCandidate: builder.mutation({
      query: (id) => ({
        url: `/api/setup/duplication-candidates/deactivate/${id}`,
        method: 'PUT',
      }),
    }),

    getDuplicationCandidateById: builder.query({
      query: (id: number) =>
        `/api/setup/duplication-candidates/${id}`,
    }),

    deleteDuplicationCandidate: builder.mutation({
      query: (id: number) => ({
        url: `/api/setup/duplication-candidates/${id}`,
        method: 'DELETE',
      }),
    }),

    reactivateDuplicationCandidate: builder.mutation({
      query: (id) => ({
        url: `/api/setup/duplication-candidates/reactivate/${id}`,
        method: 'PUT',
      }),
    }),
    getAvailableForRole: builder.query({
      query: (roleId: number) => `/api/setup/duplication-candidates/available-for-role/${roleId}`,
    }),
  }),
});

export const {
  useGetDuplicationCandidatesQuery,
  useLazyGetDuplicationCandidatesByRuleQuery,
  useLazyGetDuplicationCandidatesByStatusQuery,
  useLazyGetDuplicationCandidatesByFieldQuery,
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
  useDeactivateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation,
  useGetAvailableForRoleQuery,
  useGetDuplicationCandidateByIdQuery,
  useDeleteDuplicationCandidateMutation,
} = potintialService;
