import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export type DischargeReadinessRequest = {
  encounterId: number | string;
};

export type DischargeBlocker = {
  category: string;
  title: string;
  reason: string;
};

export type DischargePlan = {
  readiness_status: 'ready' | 'needs_review' | 'not_ready' | 'unclear' | string;
  readiness_reason: string;
  blockers: DischargeBlocker[];
  medication_reconciliation_concerns: string[];
  follow_up_considerations: string[];
  draft_discharge_summary: string;
  disclaimer: string;
};

export type DischargeReadinessResponse = {
  request_id?: string | null;
  discharge_plan: DischargePlan;
  summary: string;
  processing_metadata?: Record<string, any>;
};

export const smartDischargePlannerService = createApi({
  reducerPath: 'smartDischargePlannerApi',
  baseQuery: BaseQuery,
  tagTypes: ['DischargeReadiness'],
  endpoints: builder => ({
    assessDischargeReadiness: builder.mutation<DischargeReadinessResponse, DischargeReadinessRequest>({
      query: ({ encounterId }) => ({
        url: `/api/analytics/encounters/${encounterId}/discharge-readiness`,
        method: 'POST'
      })
    })
  })
});

export const { useAssessDischargeReadinessMutation } = smartDischargePlannerService;
