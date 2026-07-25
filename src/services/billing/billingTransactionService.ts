import {
  createApi
} from '@reduxjs/toolkit/query/react';

import {
  BaseQuery
} from '../../newApi';

import type {
  BillingCancellationRequest,
  BillingCancellationResult,
  BillingCheckoutRequest,
  BillingCheckoutResult,
  BillingPaymentResult,
  BillingRefundRequest,
  BillingRefundResult,
  BillingRefundReversalRequest,
  BillingRefundReversalResult,
  CreateAdvancePaymentRequest,
  EncounterBillingSummary,
  PrepareDefaultServicesRequest,
  PrepareDefaultServicesResult,
  WaseelCoverageDetails
} from '@/types/model-types-new';

export type BillingId =
  number | string;

export const billingTransactionService =
  createApi({
    reducerPath:
      'billingTransactionService',

    baseQuery:
      BaseQuery,

    tagTypes: [
      'EncounterBillingSummary',
      'PreparedDefaultServices',
      'BillingPayment',
      'BillingWallet',
      'BillingCheckout',
      'BillingRefund'
    ],

    endpoints:
      builder => ({
        getEncounterBillingSummary:
          builder.query<
            EncounterBillingSummary,
            {
              encounterId:
                BillingId;

              timestamp?: number;
            }
          >({
            query: ({
              encounterId
            }) => ({
              url:
                `/api/patient/billing/encounters/${encodeURIComponent(
                  String(
                    encounterId
                  )
                )}/summary`,

              method:
                'GET'
            }),

            providesTags: (
              _result,
              _error,
              args
            ) => [
              {
                type:
                  'EncounterBillingSummary',

                id:
                  String(
                    args.encounterId
                  )
              },

              'BillingWallet'
            ]
          }),

        getWaseelCoverage:
          builder.query<
            WaseelCoverageDetails,
            {
              patientId: BillingId;
              patientInsuranceId?: BillingId | null;
            }
          >({
            query: ({
              patientId,
              patientInsuranceId
            }) => ({
              url:
                `/api/patient/billing/patients/${encodeURIComponent(
                  String(patientId)
                )}/waseel-coverage`,

              method: 'GET',

              params:
                patientInsuranceId == null
                  ? undefined
                  : {
                      patientInsuranceId
                    }
            })
          }),

        prepareDefaultServices:
          builder.mutation<
            PrepareDefaultServicesResult,
            {
              encounterId:
                BillingId;

              body:
                PrepareDefaultServicesRequest;
            }
          >({
            query: ({
              encounterId,
              body
            }) => ({
              url:
                `/api/patient/billing/encounters/${encodeURIComponent(
                  String(
                    encounterId
                  )
                )}/prepare-default-services`,

              method:
                'POST',

              body
            }),

            invalidatesTags: (
              _result,
              _error,
              args
            ) => [
              'PreparedDefaultServices',

              {
                type:
                  'EncounterBillingSummary',

                id:
                  String(
                    args.encounterId
                  )
              },

              'BillingWallet'
            ]
          }),

        createAdvancePayment:
          builder.mutation<
            BillingPaymentResult,
            CreateAdvancePaymentRequest
          >({
            query:
              body => ({
                url:
                  '/api/patient/billing/payments/advance',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'BillingPayment',
              'BillingWallet',
              'EncounterBillingSummary'
            ]
          }),

        getBillingPaymentById:
          builder.query<
            BillingPaymentResult,
            {
              paymentId:
                BillingId;
            }
          >({
            query: ({
              paymentId
            }) => ({
              url:
                `/api/patient/billing/payments/${encodeURIComponent(
                  String(
                    paymentId
                  )
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'BillingPayment'
            ]
          }),

        checkoutBillingCharge:
          builder.mutation<
            BillingCheckoutResult,
            BillingCheckoutRequest
          >({
            query:
              body => ({
                url:
                  '/api/patient/billing/checkout',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'BillingCheckout',
              'BillingWallet',
              'EncounterBillingSummary'
            ]
          }),

        cancelBillingService:
          builder.mutation<
            BillingCancellationResult,
            BillingCancellationRequest
          >({
            query:
              body => ({
                url:
                  '/api/patient/billing/cancel-service',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'BillingWallet',
              'EncounterBillingSummary'
            ]
          }),

        refundBillingPayment:
          builder.mutation<
            BillingRefundResult,
            BillingRefundRequest
          >({
            query:
              body => ({
                url:
                  '/api/patient/billing/refund',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'BillingRefund',
              'BillingPayment',
              'BillingWallet',
              'EncounterBillingSummary'
            ]
          }),

        reverseBillingRefund:
          builder.mutation<
            BillingRefundReversalResult,
            BillingRefundReversalRequest
          >({
            query:
              body => ({
                url:
                  '/api/patient/billing/refund/reverse',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'BillingRefund',
              'BillingPayment',
              'BillingWallet',
              'EncounterBillingSummary'
            ]
          })
      })
  });

export const {
  useGetEncounterBillingSummaryQuery,
  useLazyGetEncounterBillingSummaryQuery,
  useGetWaseelCoverageQuery,

  usePrepareDefaultServicesMutation,

  useCreateAdvancePaymentMutation,

  useGetBillingPaymentByIdQuery,
  useLazyGetBillingPaymentByIdQuery,

  useCheckoutBillingChargeMutation,

  useCancelBillingServiceMutation,

  useRefundBillingPaymentMutation,

  useReverseBillingRefundMutation
} =
  billingTransactionService;
