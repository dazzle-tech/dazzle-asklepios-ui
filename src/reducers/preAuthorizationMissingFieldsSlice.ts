import { createListenerMiddleware, createSlice, isRejectedWithValue, type PayloadAction } from '@reduxjs/toolkit';

import type {
  PreAuthorizationClaimType,
  PreAuthorizationMissingField
} from '@/services/waseel-integration/preAuthorizationService';

/** Error key the backend uses when Waseel mandatory fields are missing before a pre-authorization. */
export const MISSING_FIELDS_MESSAGE_KEY = 'error.preAuthorization.missingFields';

export type PreAuthorizationMissingFieldsDetails = {
  claimType: PreAuthorizationClaimType | null;
  fields: PreAuthorizationMissingField[];
};

type State = PreAuthorizationMissingFieldsDetails & { open: boolean };

const initialState: State = { open: false, claimType: null, fields: [] };

const preAuthorizationMissingFieldsSlice = createSlice({
  name: 'preAuthorizationMissingFields',
  initialState,
  reducers: {
    showMissingFields: (_state, action: PayloadAction<PreAuthorizationMissingFieldsDetails>) => ({
      open: true,
      ...action.payload
    }),
    hideMissingFields: () => initialState
  }
});

export const { showMissingFields, hideMissingFields } = preAuthorizationMissingFieldsSlice.actions;
export default preAuthorizationMissingFieldsSlice;

/**
 * The missing fields carried by an API error, or null for any other error.
 * Accepts an RTK Query error ({ data }) or a rejected action payload.
 */
export const readMissingFields = (error: unknown): PreAuthorizationMissingFieldsDetails | null => {
  const data = (error as { data?: Record<string, unknown> } | null)?.data;
  if (!data || data.messageKey !== MISSING_FIELDS_MESSAGE_KEY || !Array.isArray(data.missingFields)) {
    return null;
  }
  return {
    claimType: (data.claimType as PreAuthorizationClaimType) ?? null,
    fields: data.missingFields as PreAuthorizationMissingField[]
  };
};

/**
 * Any request rejected because Waseel mandatory fields are missing opens the missing-fields dialog,
 * whichever screen sent it (dental procedure, dental chart, patient billing).
 */
export const preAuthorizationMissingFieldsListener = createListenerMiddleware();

preAuthorizationMissingFieldsListener.startListening({
  matcher: isRejectedWithValue,
  effect: (action, api) => {
    const details = readMissingFields(action.payload);
    if (details && details.fields.length > 0) {
      api.dispatch(showMissingFields(details));
    }
  }
});
