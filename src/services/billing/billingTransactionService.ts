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
  PreviewDefaultServicesPricingRequest,
  PreviewDefaultServicesPricingResult,
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
      'BillingRefund',
      'PatientFinancialInvoices'
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
              refreshKey?: number;
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

        previewDefaultServicesPricing:
          builder.mutation<
            PreviewDefaultServicesPricingResult,
            {
              encounterId: BillingId;
              body: PreviewDefaultServicesPricingRequest;
            }
          >({
            query: ({
              encounterId,
              body
            }) => ({
              url:
                `/api/patient/billing/encounters/${encodeURIComponent(
                  String(encounterId)
                )}/preview-default-services-pricing`,

              method: 'POST',

              body
            })
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

            invalidatesTags: (
              _result,
              _error,
              arg
            ) => [
              'BillingPayment',
              'BillingWallet',
              'PatientFinancialInvoices',
              {
                type: 'PatientLedgerSummary',
                id: arg.patientId
              },
              {
                type:
                  'EncounterBillingSummary',
                id: String(
                  arg.encounterId
                )
              },
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
            async queryFn(body, _api, _extraOptions, baseQuery) {
              const controller = new AbortController();
              const timeoutId = window.setTimeout(
                () => controller.abort(),
                90_000
              );

              try {
                const result = await baseQuery({
                  url: '/api/patient/billing/checkout',
                  method: 'POST',
                  body,
                  signal: controller.signal
                });

                if (result.error) {
                  const aborted =
                    controller.signal.aborted ||
                    (result.error.status === 'FETCH_ERROR' &&
                      String(result.error.error ?? '')
                        .toLowerCase()
                        .includes('abort'));

                  if (aborted) {
                    return {
                      error: {
                        status: 'TIMEOUT',
                        data: {
                          message:
                            'Checkout timed out after 90 seconds. Restart the patient service, then try again.'
                        }
                      }
                    };
                  }

                  return { error: result.error };
                }

                return {
                  data: result.data as BillingCheckoutResult
                };
              } catch (error: unknown) {
                const aborted =
                  error instanceof DOMException &&
                  error.name === 'AbortError';

                return {
                  error: {
                    status: aborted ? 'TIMEOUT' : 'FETCH_ERROR',
                    data: {
                      message: aborted
                        ? 'Checkout timed out after 90 seconds. Check the patient service logs and try again.'
                        : 'Unable to reach the billing server. Confirm the backend is running.'
                    }
                  }
                };
              } finally {
                window.clearTimeout(timeoutId);
              }
            },

            invalidatesTags: [
              'BillingCheckout',
              'BillingWallet',
              'EncounterBillingSummary',
              'PatientLedgerSummary'
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
  usePreviewDefaultServicesPricingMutation,

  useCreateAdvancePaymentMutation,

  useGetBillingPaymentByIdQuery,
  useLazyGetBillingPaymentByIdQuery,

  useCheckoutBillingChargeMutation,

  useCancelBillingServiceMutation,

  useRefundBillingPaymentMutation,

  useReverseBillingRefundMutation
} =
  billingTransactionService;
