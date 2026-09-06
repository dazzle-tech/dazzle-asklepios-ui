import {
  PointOfSaleTransactionDTO,
  usePurchaseMutation,
  useRefreshTransactionStatusMutation,
} from '@/services/point-of-sale/PointOfSaleTransactionService';

import { isCreditCardPaymentMethod }
  from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

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

export const getEnteredPaymentAmount = (
  enteredAmount: unknown
): number => {

  const amount = Number(enteredAmount);

  return Number.isFinite(amount) &&
    amount > 0
    ? Number(amount)
    : 0;
};

export const useCreditCardMachinePayment = () => {

  const [purchase] =
  usePurchaseMutation();

const [refreshTransactionStatus] =
  useRefreshTransactionStatusMutation();
const waitForFinalStatus = async (
  transactionId: number
): Promise<PointOfSaleTransactionDTO> => {

  const maxAttempts = 5;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    await new Promise(resolve =>
      setTimeout(resolve, 3000)
    );

    const transaction =
      await refreshTransactionStatus(
        transactionId
      ).unwrap();

    if (
      transaction.transactionStatus ===
      'APPROVED'
    ) {

      return transaction;
    }

    if (
      transaction.transactionStatus ===
      'DECLINED'
    ) {

      return transaction;
    }
  }

  return {
  ok: false,
  amount: 0,
  message:
    'POS terminal did not return a final status.'
};
};
  const processCreditCardMachinePayment =
    async (
      request: CreditCardMachinePaymentRequest
    ): Promise<CreditCardMachinePaymentResult> => {

      const amount =
        getEnteredPaymentAmount(
          request.amount
        );

      console.log(
        'processCreditCardMachinePayment'
      );

      if (amount <= 0) {

        return {
          ok: false,
          amount: 0,
          message:
            'Enter a credit card payment amount greater than zero.'
        };
      }

      try {

        console.log(
          'POS PURCHASE REQUEST',
          {
            patientId:
              request.patientId,

            encounterId:
              request.encounterId,

            amount
          }
        );

        const posResponse =
          await purchase({

            patientId:
              Number(
                request.patientId
              ),

            sourceType:
              'ENCOUNTER',

            sourceReferenceId:
              Number(
                request.encounterId
              ),

            amount

          }).unwrap();

        console.log(
          'POS PURCHASE RESPONSE',
          posResponse
        );

       if (
  posResponse.transactionStatus !==
  'PROCESSING'
) {

  return {
    ok: false,
    amount: 0,
    message:
      posResponse.responseMessage ??
      'Failed to initiate POS transaction.'
  };
}

const finalTransaction =
  await waitForFinalStatus(
    posResponse.id
  );

if (
  finalTransaction.transactionStatus !==
  'APPROVED'
) {

  return {
    ok: false,
    amount: 0,
    processorReference:
      finalTransaction.externalTransactionId,
    message:
      finalTransaction.responseMessage ??
      'POS transaction declined.'
  };
}

return {
  ok: true,
  amount,
  authorizationCode:
    finalTransaction.authCode,
  processorReference:
    finalTransaction.externalTransactionId,
  message:
    'POS payment approved.'
};

      } catch (error) {

        console.error(
          'POS PURCHASE ERROR',
          error
        );

        return {

          ok: false,

          amount: 0,

          message:
            'Failed to initiate POS transaction.'

        };
      }
    };

  const collectCreditCardAmountOrSkip =
    async (
      paymentMethodCode:
        string | null | undefined,

      enteredAmount:
        unknown,

      options?: Omit<
        CreditCardMachinePaymentRequest,
        'amount' |
        'paymentMethodCode'
      > & {
        onAmount?: (
          amount: number
        ) => void | Promise<void>;
      }
    ) => {

      if (
        !isCreditCardPaymentMethod(
          paymentMethodCode
        )
      ) {

        return {

          proceed: true,

          skipped: true,

          amount:
            getEnteredPaymentAmount(
              enteredAmount
            )

        };
      }

      const amount =
        getEnteredPaymentAmount(
          enteredAmount
        );

      await options?.onAmount?.(
        amount
      );

      const result =
        await processCreditCardMachinePayment({

          amount,

          paymentMethodCode:
            String(
              paymentMethodCode
            ),

          currency:
            options?.currency,

          patientId:
            options?.patientId,

          encounterId:
            options?.encounterId,

          facilityId:
            options?.facilityId

        });

      return {

        proceed:
          result.ok,

        skipped: false,

        amount:
          result.amount,

        result

      };
    };

  return {
    processCreditCardMachinePayment,
    collectCreditCardAmountOrSkip,
  };
};