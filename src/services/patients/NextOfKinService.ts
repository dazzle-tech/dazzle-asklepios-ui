import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;



export const NextOfKinService = createApi({
  reducerPath: 'nextOfKinApi',
  baseQuery: BaseQuery,
  tagTypes: ['NextOfKin'],
  endpoints: builder => ({
    // GET all next-of-kin for patient
    getNextOfKinByPatient: builder.query<modelTypes.NextOfKin[], { patientId: Id }>({
      query: ({ patientId }) => ({
        url: `/api/patient/${patientId}/next-of-kin`
      }),
      providesTags: (res, _err, { patientId }) =>
        res
          ? [
              ...res.map(n => ({ type: 'NextOfKin' as const, id: n.id })),
              { type: 'NextOfKin' as const, id: `LIST-${patientId}` }
            ]
          : [{ type: 'NextOfKin' as const, id: `LIST-${patientId}` }]
    }),

    // POST create
    addNextOfKin: builder.mutation<modelTypes.NextOfKin, modelTypes.NextOfKinCreateDTO>({
      query: data => ({
        url: `/api/patient/next-of-kin`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (_res, _err, dto) => [
        { type: 'NextOfKin' as const, id: `LIST-${(dto as any)?.patientId ?? 'UNKNOWN'}` }
      ]
    }),

    // PUT update
    updateNextOfKin: builder.mutation<
      modelTypes.NextOfKin,
      { id: Id; data: modelTypes.NextOfKinUpdateDTO; patientId?: Id }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/next-of-kin/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_res, _err, { id, patientId }) => [
        { type: 'NextOfKin' as const, id },
        ...(patientId ? [{ type: 'NextOfKin' as const, id: `LIST-${patientId}` }] : [])
      ]
    }),

    // DELETE hard delete
    deleteNextOfKin: builder.mutation<void, { id: Id; patientId?: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/next-of-kin/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_res, _err, { id, patientId }) => [
        { type: 'NextOfKin' as const, id },
        ...(patientId ? [{ type: 'NextOfKin' as const, id: `LIST-${patientId}` }] : [])
      ]
    })
  })
});

export const {
  useGetNextOfKinByPatientQuery,
  useLazyGetNextOfKinByPatientQuery,

  useAddNextOfKinMutation,
  useUpdateNextOfKinMutation,
  useDeleteNextOfKinMutation
} = NextOfKinService;