import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import type { InsuranceCompanyPolicy } from '@/types/model-types-new';

export type InsuranceCompanyPolicySave = {
  policyName: string;
  policyNumber: string;
  policyCode: string;
  validFrom: string;
  validTo: string;
};

const toList = (res: InsuranceCompanyPolicy[] | { data?: InsuranceCompanyPolicy[] }) =>
  Array.isArray(res) ? res : res?.data ?? [];

export const InsuranceCompanyPolicyService = createApi({
  reducerPath: 'insuranceCompanyPolicyApi',
  baseQuery: BaseQuery,
  tagTypes: ['InsuranceCompanyPolicy'],
  endpoints: builder => ({
    getInsuranceCompanyPolicies: builder.query<InsuranceCompanyPolicy[], number>({
      query: insuranceCompanyId => ({
        url: `/api/setup/nphies-payers/${insuranceCompanyId}/policies`,
        method: 'GET'
      }),
      transformResponse: toList,
      providesTags: (_result, _error, insuranceCompanyId) => [
        { type: 'InsuranceCompanyPolicy', id: insuranceCompanyId }
      ]
    }),

    createInsuranceCompanyPolicy: builder.mutation<
      InsuranceCompanyPolicy,
      { insuranceCompanyId: number; body: InsuranceCompanyPolicySave }
    >({
      query: ({ insuranceCompanyId, body }) => ({
        url: `/api/setup/nphies-payers/${insuranceCompanyId}/policies`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { insuranceCompanyId }) => [
        { type: 'InsuranceCompanyPolicy', id: insuranceCompanyId }
      ]
    })
  })
});

export const {
  useGetInsuranceCompanyPoliciesQuery,
  useCreateInsuranceCompanyPolicyMutation
} = InsuranceCompanyPolicyService;
