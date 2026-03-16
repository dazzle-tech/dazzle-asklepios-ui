import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export interface ExternalTest {
  id?: number;
  testId: number;
  facilityName: string;
  reason: string;

  createdBy: string;
  createdDate: string;
}

export interface ExternalTestCreateDTO {
  testId: number;
  facilityName?: string;
  reason?: string;
}

export const externalTestService = createApi({
  reducerPath: 'externalTestApi',
  baseQuery: BaseQuery,
  tagTypes: ['ExternalTest'],
  endpoints: builder => ({

    createExternalTest: builder.mutation<
      ExternalTest,
      ExternalTestCreateDTO
    >({
      query: body => ({
        url: '/api/patient/external-test',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ExternalTest'],
    }),

    getExternalTestByTestId: builder.query<
      ExternalTest,
      number
    >({
      query: testId => ({
        url: `/api/patient/external-test/${testId}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, testId) => [
        { type: 'ExternalTest', id: testId },
      ],
    }),

    deleteExternalTestByTestId: builder.mutation<
      void,
      number
    >({
      query: testId => ({
        url: `/api/patient/external-test/${testId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, testId) => [
        { type: 'ExternalTest', id: testId },
      ],
    }),

  }),
});

export const {
  useCreateExternalTestMutation,
  useGetExternalTestByTestIdQuery,
  useLazyGetExternalTestByTestIdQuery,
  useDeleteExternalTestByTestIdMutation,
} = externalTestService;
