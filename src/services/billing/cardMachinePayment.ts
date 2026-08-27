import { isCreditCardPaymentMethod } from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

export type CreditCardMachinePaymentRequest = {
  amount: number;
  paymentMethodCode: string;
  currency?: string | null;
  patientId?: number | null;
  encounterId?: number | null;
  facilityId?: number | null;
};

export type CreditCardMachinePaymentResult = {
  ok: boolean;
  amount: number;
  authorizationCode?: string | null;
  processorReference?: string | null;
  cardLastFour?: string | null;
  message?: string | null;
};

export const getEnteredPaymentAmount = (enteredAmount: unknown): number => {
  const amount = Number(enteredAmount);
  return Number.isFinite(amount) && amount > 0 ? Number(amount) : 0;
};

/**
 * Called from payment Confirm when the method is credit card.
 * `request.amount` is the amount entered in the payment dialog.
 *
 * Plug the Visa / POS machine backend API in here and use `request.amount`.
 * Return `{ ok: false }` (or throw) to stop the billing confirm.
 */
export async function processCreditCardMachinePayment(
  request: CreditCardMachinePaymentRequest
): Promise<CreditCardMachinePaymentResult> {
  const amount = getEnteredPaymentAmount(request.amount);

  if (amount <= 0) {
    return {
      ok: false,
      amount: 0,
      message: 'Enter a credit card payment amount greater than zero.'
    };
  }

  // TODO: call Visa / POS machine API with `amount`.
  return { ok: true, amount };
}

export async function collectCreditCardAmountOrSkip(
  paymentMethodCode: string | null | undefined,
  enteredAmount: unknown,
  options?: Omit<CreditCardMachinePaymentRequest, 'amount' | 'paymentMethodCode'> & {
    onAmount?: (amount: number) => void | Promise<void>;
  }
): Promise<{
  proceed: boolean;
  skipped: boolean;
  amount: number;
  result?: CreditCardMachinePaymentResult;
}> {
  if (!isCreditCardPaymentMethod(paymentMethodCode)) {
    return {
      proceed: true,
      skipped: true,
      amount: getEnteredPaymentAmount(enteredAmount)
    };
  }

  const amount = getEnteredPaymentAmount(enteredAmount);

  await options?.onAmount?.(amount);

  const result = await processCreditCardMachinePayment({
    amount,
    paymentMethodCode: String(paymentMethodCode),
    currency: options?.currency,
    patientId: options?.patientId,
    encounterId: options?.encounterId,
    facilityId: options?.facilityId
  });

  return {
    proceed: result.ok,
    skipped: false,
    amount: result.amount,
    result
  };
}
