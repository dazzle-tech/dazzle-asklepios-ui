import { createListenerMiddleware } from '@reduxjs/toolkit';

import { patientPackageService } from '@/services/patient/patientPackageService';

/**
 * Orders made on the usual screens (tests, procedures, services) are taken from the visit's package by the
 * backend, but those mutations live on other API slices, so the package panel would only see it at its next
 * poll. Refetch the patient packages as soon as one of them succeeds (only open panels refetch).
 */
const ORDER_API_PREFIXES = [
  'diagnosticOrderApi/',
  'diagnosticOrderTestApi/',
  'patientProcedureApi/',
  'patientServicesAndProductsService/'
];

type MutationFulfilledAction = {
  type?: string;
  meta?: { arg?: { type?: string } };
};

const isOrderMutationFulfilled = (action: unknown): action is MutationFulfilledAction => {
  const candidate = action as MutationFulfilledAction;
  const type = candidate.type;
  return (
    candidate.meta?.arg?.type === 'mutation' &&
    typeof type === 'string' &&
    type.endsWith('/fulfilled') &&
    ORDER_API_PREFIXES.some(prefix => type.startsWith(prefix))
  );
};

export const patientPackageRefreshMiddleware = createListenerMiddleware();

patientPackageRefreshMiddleware.startListening({
  predicate: isOrderMutationFulfilled,
  effect: (_action, api) => {
    api.dispatch(patientPackageService.util.invalidateTags(['PatientPackage']));
  }
});
