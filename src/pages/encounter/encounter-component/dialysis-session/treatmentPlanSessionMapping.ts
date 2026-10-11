import type { NephrologyTreatmentPlan } from '@/types/model-types-new';

/**
 * Explicit Treatment Plan → Dialysis Session field mapping.
 *
 * Intentionally NOT mapped (different clinical semantics / session-owned):
 * - dialysate → dialysateComposition
 * - targetWeight → targetDryWeight
 * - treatmentType, frequency, schedule, startDate, status
 * - Session Date / Times / Chair / Machine / Nurse / results / meds / flows
 *
 * Applied only when initializing a new session draft for a selected plan.
 * Never applied when restoring a saved Dialysis Session.
 */
export type TreatmentPlanMappedSessionFields = {
  dialysisDuration: number | null;
  durationType: string | null;
  dryWeight: number | null;
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  accessType: string | null;
  accessSite: string | null;
  otherAccessSite: string | null;
  nephrologistId: number | null;
};

export const TREATMENT_PLAN_MAPPED_SESSION_FIELD_KEYS = [
  'dialysisDuration',
  'durationType',
  'dryWeight',
  'bloodFlowRate',
  'dialysateFlowRate',
  'accessType',
  'accessSite',
  'otherAccessSite',
  'nephrologistId',
] as const satisfies ReadonlyArray<keyof TreatmentPlanMappedSessionFields>;

export const mapTreatmentPlanToSessionFields = (
  plan: NephrologyTreatmentPlan
): TreatmentPlanMappedSessionFields => ({
  dialysisDuration:
    plan.dialysisDuration === null || plan.dialysisDuration === undefined
      ? null
      : Number(plan.dialysisDuration),
  durationType: plan.durationType ?? null,
  dryWeight:
    plan.dryWeight === null || plan.dryWeight === undefined
      ? null
      : Number(plan.dryWeight),
  bloodFlowRate:
    plan.bloodFlowRate === null || plan.bloodFlowRate === undefined
      ? null
      : Number(plan.bloodFlowRate),
  dialysateFlowRate:
    plan.dialysateFlow === null || plan.dialysateFlow === undefined
      ? null
      : Number(plan.dialysateFlow),
  accessType: plan.dialysisAccess ?? null,
  accessSite: plan.accessSite ?? null,
  otherAccessSite:
    plan.accessSite === 'OTHER' ? plan.otherAccessSite?.trim() || null : null,
  nephrologistId:
    plan.nephrologistId == null ? null : Number(plan.nephrologistId),
});
