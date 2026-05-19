import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { Patient, Address } from '@/types/model-types-new';

export type CchiMappedPatientResponse = {
  patient: Patient;
  address: Address | null;
};

export const cchiApi = createApi({
  reducerPath: 'cchiApi',
  baseQuery: BaseQuery,

  endpoints: builder => ({
    getPatientFromCchi: builder.query<CchiMappedPatientResponse, string>({
      query: documentId => ({
        url: `/api/patient/internal/waseel/cchi/${documentId}/mapped`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const { useLazyGetPatientFromCchiQuery } = cchiApi;