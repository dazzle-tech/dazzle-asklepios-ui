import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

type PagedParams = { page: number; size: number; sort?: string };
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

export const diagnosticTestProfileService = createApi({
  reducerPath: 'diagnosticTestProfileApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticTestProfile'],

  endpoints: builder => ({
    // Get all profiles (paginated)
    getAllDiagnosticTestProfiles: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/diagnostic-test-profiles',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['DiagnosticTestProfile']
    }),

    // Get profiles by testId
    getDiagnosticTestProfilesByTestId: builder.query<
      PagedResult<any>,
      { testId: number; page: number; size: number; sort?: string }
    >({
      query: ({ testId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/diagnostic-test-profiles/by-test/${testId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['DiagnosticTestProfile']
    }),

    // Create new profile
    createDiagnosticTestProfile: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/diagnostic-test-profiles',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DiagnosticTestProfile']
    }),

    // Update profile
    updateDiagnosticTestProfile: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/diagnostic-test-profiles/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DiagnosticTestProfile']
    }),

    // Delete profile
    deleteDiagnosticTestProfile: builder.mutation<void, number>({
      query: id => ({
        url: `/api/setup/diagnostic-test-profiles/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DiagnosticTestProfile']
    }),

    // Delete all profiles for a test
    deleteDiagnosticTestProfilesByTestId: builder.mutation<void, number>({
      query: testId => ({
        url: `/api/setup/diagnostic-test-profiles/by-test/${testId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DiagnosticTestProfile']
    }),

    // Get active LAB profiles by testIds (bulk)
    getActiveLabProfilesByTestIds: builder.mutation<
      Record<number, any[]>,
      number[]
    >({
      query: testIds => ({
        url: '/api/setup/diagnostic-test-profiles/by-test-ids/for-lab',
        method: 'POST',
        body: testIds
      })
    }),

    getLabProfileIdsByTestId: builder.query<number[], number>({
      query: testId => ({
        url: `/api/setup/diagnostic-test-profiles/internal/by-test/${testId}/lab-profile-ids`,
        method: 'GET'
      }),
      providesTags: ['DiagnosticTestProfile']
    }),

    getLabProfilesByTestId: builder.query<any[], number>({
      query: testId => ({
        url: `/api/setup/diagnostic-test-profiles/by-test/${testId}/for-lab`,
        method: 'GET'
      }),
      providesTags: ['DiagnosticTestProfile']
    }),

    getDiagnosticTestProfileResultType: builder.query<string, number>({
      query: id => ({
        url: `/api/setup/diagnostic-test-profiles/${id}/result-type`,
        method: 'GET'
      })
    }),

    getDiagnosticTestProfilesByIds: builder.mutation<any[], number[]>({
      query: ids => ({
        url: `/api/setup/diagnostic-test-profiles/by-ids`,
        method: 'POST',
        body: ids
      })
    }),



    // Toggle active status
    toggleDiagnosticTestActive: builder.mutation({
      query: id => ({
        url: `/api/setup/diagnostic-test-profiles/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['DiagnosticTestProfile']
    })
  })
});

export const {
  useGetAllDiagnosticTestProfilesQuery,
  useGetDiagnosticTestProfilesByTestIdQuery,
  useCreateDiagnosticTestProfileMutation,
  useUpdateDiagnosticTestProfileMutation,
  useDeleteDiagnosticTestProfileMutation,
  useDeleteDiagnosticTestProfilesByTestIdMutation,
  useToggleDiagnosticTestActiveMutation,
  useGetActiveLabProfilesByTestIdsMutation,
  useGetLabProfileIdsByTestIdQuery,
  useGetLabProfilesByTestIdQuery,
  useGetDiagnosticTestProfileResultTypeQuery,
  useGetDiagnosticTestProfilesByIdsMutation
} = diagnosticTestProfileService;

