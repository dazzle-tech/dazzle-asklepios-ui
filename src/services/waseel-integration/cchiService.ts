import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { Patient, Address, PatientDocument, PatientInsurance } from '@/types/model-types-new';

export type CchiMappedPatientResponse = {
  patient: Patient;
  address: Address | null;
  document?: PatientDocument | null;
  insurance?: Partial<PatientInsurance> | null;
  insurances?: Partial<PatientInsurance>[] | null;
};

export type CchiFetchPatientResponse = CchiMappedPatientResponse & {
  alreadyExists: boolean;
  message?: string | null;
};

export const cchiApi = createApi({
  reducerPath: 'cchiApi',
  baseQuery: BaseQuery,

  endpoints: builder => ({
    getPatientFromCchi: builder.query<CchiFetchPatientResponse, string>({
      query: documentId => ({
        url: `/api/patient/cchi/${encodeURIComponent(documentId)}/fetch`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    fetchInsuranceFromCchi: builder.mutation<CchiMappedPatientResponse, number>({
      query: patientId => ({
        url: `/api/patient/${patientId}/cchi/fetch-insurance`,
        method: 'POST'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    refreshPatientFromCchi: builder.mutation<CchiMappedPatientResponse, number>({
      query: patientId => ({
        url: `/api/patient/${patientId}/cchi/refresh`,
        method: 'POST'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const {
  useLazyGetPatientFromCchiQuery,
  useFetchInsuranceFromCchiMutation,
  useRefreshPatientFromCchiMutation
} = cchiApi;
