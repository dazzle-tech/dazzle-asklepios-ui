import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest, ListRequestAllValues } from '@/types/types';
import { fromListRequestToQueryParams, fromListRequestAllValueToQueryParams } from '@/utils';
import {
  ApInventoryTransaction,
  ApInventoryTransactionAttachment,
  ApInventoryTransactionProduct,
  ApInventoryTransfer,
  ApInventoryTransferProduct
} from '@/types/model-types';

export const inventoryService = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: baseQuery,
  endpoints: builder => ({

    getInventoryTransactions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/transaction/inventory-transaction-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeInventoryTransaction: builder.mutation({
      query: (transaction: ApInventoryTransaction) => ({
        url: `/transaction/remove-inventory-transaction`,
        method: 'POST',
        body: transaction,
      }),
    }),
    saveInventoryTransaction: builder.mutation({
      query: (transaction: ApInventoryTransaction) => ({
        url: `/transaction/save-inventory-transaction`,
        method: 'POST',
        body: transaction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getInventoryTransactionsAttachment: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/transaction/inventory-transaction-attachment-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeInventoryTransactionAttachment: builder.mutation({
      query: (transactionattachment: ApInventoryTransactionAttachment) => ({
        url: `/transaction/remove-inventory-transaction-attachment`,
        method: 'POST',
        body: transactionattachment,
      }),
    }),
    saveInventoryTransactionAttachment: builder.mutation({
      query: (transactionattachment: ApInventoryTransactionAttachment) => ({
        url: `/transaction/save-inventory-transaction-attachment`,
        method: 'POST',
        body: transactionattachment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    inventoryTransactionAttachmentByKey: builder.query({
      query: (data: { key: string }) => ({
        url: `/transaction/attachment-bykey`,
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),
    getInventoryTransactionsProduct: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/transaction/inventory-transaction-product-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeInventoryTransactionProduct: builder.mutation({
      query: (transaction: ApInventoryTransactionProduct) => ({
        url: `/transaction/remove-inventory-transaction-product`,
        method: 'POST',
        body: transaction,
      }),
    }),
      saveInventoryTransactionProductList: builder.mutation({
      query: (products: any) => ({
        url: `/transaction/save-inventory-transaction-product-list`,
        method: 'POST',
        body: products
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveInventoryTransactionProduct: builder.mutation({
      query: (transaction: ApInventoryTransactionProduct) => ({
        url: `/transaction/save-inventory-transaction-product`,
        method: 'POST',
        body: transaction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    confirmTransProductStockIn: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/transaction/confirm-trans-product-stock-in`,
        method: 'POST',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
       confirmTransProductStockOut: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/transaction/confirm-trans-product-stock-out`,
        method: 'POST',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getInventoryTransfer: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/transaction/inventory-transfer-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeInventoryTransfer: builder.mutation({
      query: (transaction: ApInventoryTransfer) => ({
        url: `/transaction/remove-inventory-transfer`,
        method: 'POST',
        body: transaction,
      }),
    }),
    saveInventoryTransfer: builder.mutation({
      query: (transaction: ApInventoryTransfer) => ({
        url: `/transaction/save-inventory-transfer`,
        method: 'POST',
        body: transaction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getInventoryTransferProduct: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/transaction/inventory-transfer-product-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    removeInventoryTransferProduct: builder.mutation({
      query: (transaction: ApInventoryTransferProduct) => ({
        url: `/transaction/remove-inventory-transfer-product`,
        method: 'POST',
        body: transaction,
      }),
    }),
    saveInventoryTransferProduct: builder.mutation({
      query: (transaction: ApInventoryTransferProduct) => ({
        url: `/transaction/save-inventory-transfer-product`,
        method: 'POST',
        body: transaction
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getQtyInBaseUom: builder.query({
      query: ({ quantity, transUnit, toBaseUnit, uomGroup }) => ({
        url: `/transaction/qty_in_base_uom`,
        method: 'GET',
        params: {
          quantity,
          "trans-unit": transUnit,
          "to-base-unit": toBaseUnit,
          "uom-group": uomGroup
        },
      }),
    }),
       saveInventoryTransferProductApproved: builder.mutation({
          query: (TransferProductRecords: ApInventoryTransferProduct[]) => ({
            url: `/transaction/save-inventory-transfer-product-approved`,
            method: 'POST',
            body: TransferProductRecords
          }),
          onQueryStarted: onQueryStarted,
          transformResponse: (response: any) => {
            return response.object;
          }
    
        }),
               saveInventoryTransferProductRejected: builder.mutation({
          query: (TransferProductRecords: ApInventoryTransferProduct[]) => ({
            url: `/transaction/save-inventory-transfer-product-rejected`,
            method: 'POST',
            body: TransferProductRecords
          }),
          onQueryStarted: onQueryStarted,
          transformResponse: (response: any) => {
            return response.object;
          }
    
        }),
  })

});

export const {
  useGetInventoryTransactionsQuery,
  useRemoveInventoryTransactionMutation,
  useSaveInventoryTransactionMutation,
  useGetInventoryTransactionsAttachmentQuery,
  useRemoveInventoryTransactionAttachmentMutation,
  useSaveInventoryTransactionAttachmentMutation,
  useInventoryTransactionAttachmentByKeyQuery,
  useGetInventoryTransactionsProductQuery,
  useRemoveInventoryTransactionProductMutation,
  useSaveInventoryTransactionProductMutation,
  useSaveInventoryTransactionProductListMutation,
  useConfirmTransProductStockInMutation,
  useConfirmTransProductStockOutMutation,
  useGetInventoryTransferQuery,
  useRemoveInventoryTransferMutation,
  useSaveInventoryTransferMutation,
  useGetInventoryTransferProductQuery,
  useRemoveInventoryTransferProductMutation,
  useSaveInventoryTransferProductMutation,
  useGetQtyInBaseUomQuery,
  useLazyGetQtyInBaseUomQuery,
  useSaveInventoryTransferProductApprovedMutation,
  useSaveInventoryTransferProductRejectedMutation
} = inventoryService;
