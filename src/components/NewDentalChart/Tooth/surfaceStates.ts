/**
 * Surface and whole-tooth clinical state of one chart tooth, derived from its non-cancelled actions
 * and the dental action type (CONDITION → red, TREATMENT → green). Shared by the chart and the
 * Tooth Details preview so both draw the same state.
 */
export type SurfaceState = 'condition' | 'treatment';

// One entry per surface that has an active (non-cancelled) action on the
// tooth; condition takes priority over treatment if both exist on the same
// surface, matching the main tooth icon's own condition-over-treatment rule.
export const getSurfaceStates = (tooth: any, dentalActionsMap: any): Record<string, SurfaceState> => {
  const states: Record<string, SurfaceState> = {};
  (tooth?.actions ?? []).forEach((action: any) => {
    const actionType = dentalActionsMap?.[action.dentalActionId]?.type;
    if (actionType !== 'CONDITION' && actionType !== 'TREATMENT') return;
    if (states[action.surface] === 'condition') return;
    states[action.surface] = actionType === 'CONDITION' ? 'condition' : 'treatment';
  });
  return states;
};
