import { createListenerMiddleware } from '@reduxjs/toolkit';

import { patientPaymentsService } from '@/services/encounters/patientPaymentsService';

/**
 * Sidebar wallet / remaining balance come from patientPaymentsService.
 * Credit, debit, payment, and checkout mutations live on other API slices, so
 * their invalidatesTags do not refresh that query. Refetch it after a movement
 * succeeds, without changing how the balance is calculated.
 */
const BILLING_MOVEMENT_ENDPOINTS = new Set([
  'createCreditNote',
  'createDebitNote',
  'createDiscountCreditNote',
  'collectInvoiceBalance',
  'syncInvoicePayments',
  'createAdvancePayment',
  'checkoutBillingCharge',
  'cancelBillingService',
  'refundBillingPayment',
  'reverseBillingRefund',
  'prepareDefaultServices',
  'generateInvoices',
  'financialCloseEncounter',
  'closeEncounterForBilling',
  'createPayment',
  'updatePayment',
  'createPaymentAllocation',
  'updatePaymentAllocation',
  'createPatientServiceOrProduct',
  'updatePatientServiceOrProduct',
  'deletePatientServiceOrProduct',
  'createBulkPatientServicesOrProducts',
  'payRejectedPreAuthorizationItemAsCash'
]);

type MutationFulfilledAction = {
  type?: string;
  meta?: {
    arg?: {
      type?: string;
      endpointName?: string;
    };
  };
};

const isBillingMovementFulfilled = (action: unknown): action is MutationFulfilledAction => {
  const candidate = action as MutationFulfilledAction;
  const endpointName = candidate.meta?.arg?.endpointName;

  return (
    candidate.meta?.arg?.type === 'mutation' &&
    typeof candidate.type === 'string' &&
    candidate.type.endsWith('/fulfilled') &&
    endpointName != null &&
    BILLING_MOVEMENT_ENDPOINTS.has(endpointName)
  );
};

export const patientBillingSidebarRefreshMiddleware = createListenerMiddleware();

patientBillingSidebarRefreshMiddleware.startListening({
  predicate: isBillingMovementFulfilled,
  effect: (_action, api) => {
    api.dispatch(
      patientPaymentsService.util.invalidateTags(['PatientLedgerSummary', 'PatientBalance'])
    );
  }
});
