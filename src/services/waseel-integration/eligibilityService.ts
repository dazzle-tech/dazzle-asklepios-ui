import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import type {
  EligibilityCheckRequest,
  EligibilityCheckResult
} from '@/types/model-types-new';

export const eligibilityApi = createApi({
  reducerPath: 'eligibilityApi',
  baseQuery: BaseQuery,

  endpoints: builder => ({
    checkEligibility: builder.mutation<EligibilityCheckResult, EligibilityCheckRequest>({
      query: body => ({
        url: '/api/patient/internal/waseel/eligibility/check',
        method: 'POST',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const { useCheckEligibilityMutation } = eligibilityApi;
