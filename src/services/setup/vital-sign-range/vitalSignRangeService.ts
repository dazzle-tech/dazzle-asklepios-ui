import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

/** One age rule of a vital sign. Age bounds are whole months: [ageFromMonths, ageToMonths). */
export type VitalSignRange = {
  id: number;
  vitalSignKey: string;
  unit?: string | null;
  ageFromMonths: number;
  ageToMonths?: number | null;
  normalMin?: number | null;
  normalMax?: number | null;
};

export type VitalSignType = { vitalSignKey: string; unit: string };

export type VitalSignRangeBody = {
  ageFromMonths: number;
  ageToMonths: number | null;
  normalMin: number | null;
  normalMax: number | null;
};

export const vitalSignRangeService = createApi({
  reducerPath: 'vitalSignRangeApi',
  baseQuery: BaseQuery,
  tagTypes: ['VitalSignRange'],
  endpoints: builder => ({
    getVitalSignRanges: builder.query<VitalSignRange[], void>({
      query: () => ({
        url: '/api/setup/vital-sign-ranges',
        method: 'GET'
      }),
      providesTags: ['VitalSignRange']
    }),

    // The six vital signs (key + unit), so vital signs without any rule yet stay selectable.
    getVitalSignTypes: builder.query<VitalSignType[], void>({
      query: () => ({
        url: '/api/setup/vital-sign-ranges/vital-signs',
        method: 'GET'
      })
    }),

    createVitalSignRange: builder.mutation<
      VitalSignRange,
      VitalSignRangeBody & { vitalSignKey: string }
    >({
      query: body => ({
        url: '/api/setup/vital-sign-ranges',
        method: 'POST',
        body
      }),
      invalidatesTags: ['VitalSignRange']
    }),

    updateVitalSignRange: builder.mutation<
      VitalSignRange,
      { id: number; body: VitalSignRangeBody }
    >({
      query: ({ id, body }) => ({
        url: `/api/setup/vital-sign-ranges/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['VitalSignRange']
    })
  })
});

export const {
  useGetVitalSignRangesQuery,
  useGetVitalSignTypesQuery,
  useCreateVitalSignRangeMutation,
  useUpdateVitalSignRangeMutation
} = vitalSignRangeService;
