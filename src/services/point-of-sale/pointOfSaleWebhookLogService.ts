import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/query/react";

export type PointOfSaleWebhookLogDTO = {
  id: number;
  transactionId?: number | null;
  orderId?: string | null;
  externalTransactionId?: string | null;
  responseCode?: string | null;
  responseMessage?: string | null;
  transactionStatus?: string | null;
  rrn?: string | null;
  authCode?: string | null;
  terminalId?: string | null;
  merchantId?: string | null;
  processingStatus?: string | null;
  processed?: boolean | null;
  createdDate?: string | null;
};

export type PointOfSaleWebhookLogFilter = {
  externalTransactionId?: string;
  orderId?: string;
  responseCode?: string;
  processingStatus?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type PointOfSaleWebhookLogPageResult = {
  data: PointOfSaleWebhookLogDTO[];
  totalCount: number;
  links?: {
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
  };
};

const mapPagedResult = (response: any): PointOfSaleWebhookLogPageResult => {
  if (Array.isArray(response)) {
    return {
      data: response,
      totalCount: response.length,
    };
  }

  return {
    data: response?.data ?? response?.content ?? [],
    totalCount: Number(response?.totalCount ?? response?.total ?? 0),
    links: response?.links,
  };
};

export const pointOfSaleWebhookLogService = createApi({
  reducerPath: 'pointOfSaleWebhookLogService',
  baseQuery: BaseQuery,
  tagTypes: ['PointOfSaleWebhookLog'],
  endpoints: (builder) => ({
    getWebhookLogs: builder.query<
      PointOfSaleWebhookLogPageResult,
      PointOfSaleWebhookLogFilter
    >({
      query: ({ page = 0, size = 10, sort = 'createdDate,desc', ...filter }) => ({
        url: '/api/patient/point-of-sale-webhook-logs',
        params: {
          ...filter,
          page,
          size,
          sort,
        },
      }),
      transformResponse: mapPagedResult,
      providesTags: ['PointOfSaleWebhookLog'],
    }),
  }),
});

export const {
  useGetWebhookLogsQuery,
} = pointOfSaleWebhookLogService;
