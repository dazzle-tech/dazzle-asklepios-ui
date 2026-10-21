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

export type PolicyCoverageClass = {
  id: number;
  name: string;
  isActive?: boolean;
  coverageContractId?: number | null;
  guarantorType?: string | null;
  coverageName?: string | null;
};

const toList = <T,>(res: T[] | { data?: T[] } | null | undefined): T[] =>
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
    }),

    getPolicyCoverageClasses: builder.query<
      PolicyCoverageClass[],
      { insuranceCompanyId: number; policyId: number }
    >({
      query: ({ insuranceCompanyId, policyId }) => ({
        url: `/api/setup/nphies-payers/${insuranceCompanyId}/policies/${policyId}/classes`,
        method: 'GET'
      }),
      transformResponse: (res: PolicyCoverageClass[] | { data?: PolicyCoverageClass[] }) => toList(res)
    })
  })
});

export const {
  useGetInsuranceCompanyPoliciesQuery,
  useCreateInsuranceCompanyPolicyMutation,
  useGetPolicyCoverageClassesQuery
} = InsuranceCompanyPolicyService;
