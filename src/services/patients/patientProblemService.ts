import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { PatientProblem } from '@/types/model-types-new';

type Id = number;
type PagedParams = { page: number; size: number; sort?: string };

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: any;
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const patientProblemService = createApi({
  reducerPath: 'patientProblemApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientProblem'],

  endpoints: builder => ({
    /* LIST */
    getPatientProblems: builder.query<PagedResult<PatientProblem>, { patientId: Id } & PagedParams>(
      {
        query: ({ patientId, page, size, sort = 'id,desc' }) => ({
          url: '/api/patient/problems',
          params: { patientId, page, size, sort }
        }),
        transformResponse: mapPaged,
        providesTags: ['PatientProblem']
      }
    ),

    /* CREATE */
    addPatientProblem: builder.mutation<PatientProblem, PatientProblem>({
      query: body => ({
        url: '/api/patient/problems',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientProblem']
    }),

    /* UPDATE */
    updatePatientProblem: builder.mutation<PatientProblem, PatientProblem>({
      query: body => ({
        url: '/api/patient/problems',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientProblem']
    }),

    /* DELETE */
    deletePatientProblem: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/problems/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PatientProblem']
    })
  })
});
export const {
  useGetPatientProblemsQuery,
  useLazyGetPatientProblemsQuery,
  useAddPatientProblemMutation,
  useUpdatePatientProblemMutation,
  useDeletePatientProblemMutation
} = patientProblemService;