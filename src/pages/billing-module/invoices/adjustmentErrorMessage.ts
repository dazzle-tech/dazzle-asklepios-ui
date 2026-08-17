import { extractApiErrorMessage } from '@/utils/apiErrorMessage';

const ALLOCATION_BALANCE_MESSAGE =
  'This adjustment could not be applied because the amount already collected or reserved ' +
  'on the service is higher than the balance left after the change. Refund or unallocate ' +
  'the collected amount first, then issue the note again.';

const RESPONSIBILITY_BALANCE_MESSAGE =
  'This adjustment could not be applied because the patient and insurance shares no longer ' +
  'add up to the service net amount. Refresh the invoice and try again.';

const AMOUNTS_INCONSISTENT_MESSAGE =
  'This adjustment could not be applied because it would leave the billing amounts ' +
  'inconsistent. Review the quantity and price, then try again.';

const GENERIC_FAILURE_MESSAGE =
  'The note could not be issued because the billing amounts could not be recalculated. ' +
  'Refresh the invoice and try again, and contact support if it keeps failing.';

/**
 * Backend keys returned by the adjustment endpoints once a billing check
 * constraint rejects the write.
 */
export const ADJUSTMENT_CONSTRAINT_ERROR_MAP: Record<string, string> = {
  'creditNote.allocationBalance': ALLOCATION_BALANCE_MESSAGE,
  'debitNote.allocationBalance': ALLOCATION_BALANCE_MESSAGE,
  'discountCreditNote.allocationBalance': ALLOCATION_BALANCE_MESSAGE,
  'creditNote.responsibilityBalance': RESPONSIBILITY_BALANCE_MESSAGE,
  'debitNote.responsibilityBalance': RESPONSIBILITY_BALANCE_MESSAGE,
  'discountCreditNote.responsibilityBalance': RESPONSIBILITY_BALANCE_MESSAGE,
  'creditNote.amountsInconsistent': AMOUNTS_INCONSISTENT_MESSAGE,
  'debitNote.amountsInconsistent': AMOUNTS_INCONSISTENT_MESSAGE,
  'discountCreditNote.amountsInconsistent': AMOUNTS_INCONSISTENT_MESSAGE,
  'creditNote.dataIntegrity': GENERIC_FAILURE_MESSAGE,
  'debitNote.dataIntegrity': GENERIC_FAILURE_MESSAGE,
  'discountCreditNote.dataIntegrity': GENERIC_FAILURE_MESSAGE,
  'billing.cancel.allocationBalance': ALLOCATION_BALANCE_MESSAGE
};

const CONSTRAINT_MESSAGES: { needle: string; message: string }[] = [
  {
    needle: 'ck_billing_charge_line_allocation_balance',
    message: ALLOCATION_BALANCE_MESSAGE
  },
  {
    needle: 'ck_billing_charge_line_responsibility',
    message: RESPONSIBILITY_BALANCE_MESSAGE
  },
  {
    needle: 'ck_billing_charge_line',
    message: AMOUNTS_INCONSISTENT_MESSAGE
  },
  {
    needle: 'ck_financial_document',
    message: AMOUNTS_INCONSISTENT_MESSAGE
  }
];

const UNHELPFUL_MESSAGES = [
  'unexpected error',
  'internal server error',
  'could not execute batch',
  'dataintegrityviolationexception',
  'constraintviolationexception'
];

const stringifyPayload = (error: any): string => {
  const payload = error?.data ?? error?.error?.data ?? error?.message ?? error;

  if (typeof payload === 'string') {
    return payload.toLowerCase();
  }

  try {
    return JSON.stringify(payload ?? '').toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Turns billing check-constraint failures (which reach the client as a raw 500
 * or as a mapped 400 key) into an actionable message instead of a stack trace.
 */
export const extractAdjustmentErrorMessage = (
  error: any,
  keyMap: Record<string, string> = {}
): string => {
  const payload = stringifyPayload(error);
  const constraintHit = CONSTRAINT_MESSAGES.find(entry => payload.includes(entry.needle));

  if (constraintHit) {
    return constraintHit.message;
  }

  const message = extractApiErrorMessage(error, {
    ...ADJUSTMENT_CONSTRAINT_ERROR_MAP,
    ...keyMap
  });
  const normalized = message.toLowerCase();
  const status = Number(
    error?.status ?? error?.originalStatus ?? error?.error?.status ?? 0
  );

  if (
    status >= 500 ||
    UNHELPFUL_MESSAGES.some(unhelpful => normalized.includes(unhelpful))
  ) {
    return GENERIC_FAILURE_MESSAGE;
  }

  return message;
};
