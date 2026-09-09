import {
  PointOfSaleTransactionDTO,
  usePurchaseMutation,
  useRefreshTransactionStatusMutation,
} from '@/services/point-of-sale/PointOfSaleTransactionService';

import { isCreditCardPaymentMethod }
  from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { useState } from 'react';

export type CreditCardMachinePaymentRequest = {
  amount: number;
  paymentMethodCode: string;
  currency?: string | null;
  patientId?: number | null;

  sourceType:
  | 'ENCOUNTER'
  | 'WALLET_BALANCE';

  sourceReferenceId?: number | null;

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
 const [isProcessingCard, setIsProcessingCard] =useState(false);
 console.log('isProcessingCard', isProcessingCard);
  const [purchase] =
    usePurchaseMutation();

  const [refreshTransactionStatus] =
    useRefreshTransactionStatusMutation();
  const waitForFinalStatus = async (
    transactionId: number
  ): Promise<PointOfSaleTransactionDTO> => {

    const maxAttempts = 20;

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
        'Transaction is still being processed. Please check the transaction status later.'
    };
  };
  const getPosErrorMessage = (
  message?: string
) => {

  const errorMessage =
    message?.toLowerCase() ?? '';

  if (
    errorMessage.includes('i/o error') ||
    errorMessage.includes('resourceaccessexception') ||
    errorMessage.includes('connectexception')
  ) {
    return 'Payment service is currently unavailable. Please try again later.';
  }

  if (
    errorMessage.includes('timeout')
  ) {
    return 'The payment service did not respond in time. Please try again.';
  }

  return (
    message ??
    'Unable to process the card payment at this time.'
  );
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
  setIsProcessingCard(true);
      try {
        const posResponse =
          await purchase({
            patientId: Number(
              request.patientId
            ),

            sourceType:
              request.sourceType,

            sourceReferenceId:
              request.sourceReferenceId != null
                ? Number(
                  request.sourceReferenceId
                )
                : null,

            amount
          }).unwrap();



        if (
          posResponse.transactionStatus !==
          'PROCESSING'
        ) {

          return {
            ok: false,
            amount: 0,
            message:
             getPosErrorMessage(
                posResponse.responseMessage
              )
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
          const getPosMessage = (
            code?: string,
            message?: string
          ) => {
            switch (code) {

              case '993':
                return 'PIN entry timed out. Please try again.';

              case '987':
                return 'Transaction was cancelled on the terminal.';

              case '116':
                return 'Insufficient funds.';

              case '423':
                return 'Terminal is currently busy. Please try again in a few moments.';

              case '1008':
                return 'Terminal is not registered. Please contact support.';

              default:
                return message ?? 'Transaction failed.';
            }
          };
          return {
            ok: false,
            amount: 0,
            processorReference:
              finalTransaction.externalTransactionId,
            message: getPosMessage(
              finalTransaction.responseCode,
              finalTransaction.responseMessage
            )
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

      } 
      catch (error) {

        console.error(
          'POS PURCHASE ERROR',
          error
        );

        return {

          ok: false,

          amount: 0,

          message:
            getPosErrorMessage(
              error?.message
            )

        };
      }
      finally {
        setIsProcessingCard(false);
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
            String(paymentMethodCode),

          currency:
            options?.currency,

          patientId:
            options?.patientId,

          sourceType:
            options?.sourceType ??
            'ENCOUNTER',

          sourceReferenceId:
            options?.sourceReferenceId,

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
    isProcessingCard
  };
};