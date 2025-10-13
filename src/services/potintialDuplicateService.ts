import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

export const potintialService = createApi({
  reducerPath: 'potintialApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    getDuplicationCandidates: builder.query({
      query: (role?: string) =>
        role
          ? `/api/setup/duplication-candidates?role=${role}`
          : '/api/setup/duplication-candidates',
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
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
  useDeactivateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation,
  useGetAvailableForRoleQuery,
} = potintialService;
