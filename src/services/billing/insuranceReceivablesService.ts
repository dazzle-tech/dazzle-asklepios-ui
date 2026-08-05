import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { InsurancePayerReceivablesSummaryResponse } from '@/types/model-types-new';

export type { InsurancePayerReceivablesSummaryResponse };

type ReceivablesParams = {
  facilityId?: number | null;
};

export const insuranceReceivablesApi = createApi({
  reducerPath: 'insuranceReceivablesApi',
  baseQuery: BaseQuery,
  tagTypes: ['InsuranceReceivables'],

  endpoints: builder => ({
    getInsuranceReceivablesByPayer: builder.query<
      InsurancePayerReceivablesSummaryResponse[],
      ReceivablesParams | void
    >({
      query: params => ({
        url: '/api/patient/billing/insurance-receivables/payers',
        method: 'GET',
        params:
          params?.facilityId != null
            ? { facilityId: params.facilityId }
            : undefined
      }),
      providesTags: ['InsuranceReceivables']
    })
  })
});

export const { useGetInsuranceReceivablesByPayerQuery } = insuranceReceivablesApi;
