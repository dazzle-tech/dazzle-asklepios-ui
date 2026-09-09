import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface CreatePointOfSaleTransactionDTO {
  patientId: number;

  sourceType: "ENCOUNTER" | "WALLET_BALANCE";

  sourceReferenceId: number;

  amount: number;
}
export interface GenerateWebhookUrlRequest {
  clientId: string;
  terminalId: string;
  secretKey: string;
  baseUrl: string;
  webhookPath: string;
  signatureAlgorithm: string;
  tokenExpiryHours: string;
  retryAttempts: string;
}

export interface GenerateWebhookUrlResponse {
  success: boolean;
  message: string;
  webhookUrl: string;
  generatedAt: string;
  expiresAt: string;
}
export interface PointOfSaleTransactionDTO {
  id: number;

  patientId: number;

  patientPaymentId?: number;

  configurationId: number;

  sourceType: string;

  sourceReferenceId: number;

  orderId: string;

  externalTransactionId?: string;

  transactionType: string;

  transactionStatus: string;

  amount: number;

  currencyCode?: string;

  responseCode?: string;

  responseMessage?: string;

  rrn?: string;

  authCode?: string;

  terminalId?: string;

  merchantId?: string;

  batchNo?: string;

  paymentMethod?: string;

  schemeLabel?: string;

  transactionDate?: string;

  webhookReceived?: boolean;

  stanNo?: string;

  productInfo?: string;

  merchantName?: string;

  merchantAddress?: string;

  ecrTransactionReferenceNumber?: string;

  applicationVersion?: string;
}

export const PointOfSaleTransactionService = createApi({
  reducerPath: "pointOfSaleTransactionApi",
  baseQuery: BaseQuery,

  tagTypes: [
    "PointOfSaleTransaction",
  ],

  endpoints: builder => ({

    purchase: builder.mutation<
      PointOfSaleTransactionDTO,
      CreatePointOfSaleTransactionDTO
    >({
      query: body => ({
        url: "/api/patient/point-of-sale-transactions/purchase",
        method: "POST",
        body,
      }),

      invalidatesTags: [
        "PointOfSaleTransaction",
      ],
    }),

    refreshTransactionStatus: builder.mutation<
      PointOfSaleTransactionDTO,
      number
    >({
      query: id => ({
        url:
          `/api/patient/point-of-sale-transactions/transactions/${id}/refresh-status`,
        method: "POST",
      }),

      invalidatesTags: [
        "PointOfSaleTransaction",
      ],
    }),

  }),
});

export const {

  usePurchaseMutation,

  useRefreshTransactionStatusMutation,

} = PointOfSaleTransactionService;