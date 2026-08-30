import {
  usePurchaseMutation,
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

        return {

          ok: true,

          amount,

          authorizationCode:
            posResponse.authCode,

          processorReference:
            posResponse.externalTransactionId,

          message:
            'POS purchase request submitted successfully.'

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