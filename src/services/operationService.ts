import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';


export const operationService = createApi({
    reducerPath: 'operationApi',
    baseQuery: baseQuery,
    endpoints: builder => ({
        getOperationRequestsList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/operation-request-list?${fromListRequestToQueryParams(listRequest)}`
            }),
            onQueryStarted,
            keepUnusedDataFor: 5
        }),
        saveOperationRequests: builder.mutation({
            query: (data) => ({
                url: `/operation/save-operation-request`,
                method: 'POST',
                body: data
            }),
            onQueryStarted,
            transformResponse: (response: any) => response
        }),


        // 🟢 GET operation list
        getOperationList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/operation-list?${fromListRequestToQueryParams(listRequest)}`,
                method: 'GET'
            })
        }),

        // 🟢 GET operation coding list
        getOperationCodingList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/operation-coding-list?${fromListRequestToQueryParams(listRequest)}`,
                method: 'GET'
            })
        }),

        // 🟢 GET operation price list
        getOperationPriceListList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/operation-price-list-list?${fromListRequestToQueryParams(listRequest)}`,
                method: 'GET'
            })
        }),

         // 🟢 GET operation care plan list
        getOperationCarePlan: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/operation-care-plan-list?${fromListRequestToQueryParams(listRequest)}`,
                method: 'GET'
            })
        }),

        //Get operation checkList
          getPreOperationChecklistList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/operation/pre-operation-checklist-list?${fromListRequestToQueryParams(listRequest)}`,
                method: 'GET'
            })
        }),



 // 🟡 POST save operation care plan
      saveOperationCarePlan: builder.mutation({
            query: (data) => ({
                url: `/operation/save-operation-care-plan`,
                method: 'POST',
                body: data
            }),
            onQueryStarted,
            transformResponse: (response: any) => response
        }),
        // 🟡 POST save operation
        saveOperation: builder.mutation({
            query: (body) => ({
                url: `/operation/save-operation`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        // 🟡 POST remove operation
        removeOperation: builder.mutation({
            query: (body) => ({
                url: `/operation/remove-operation`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        // 🟡 POST save operation coding
        saveOperationCoding: builder.mutation({
            query: (body) => ({
                url: `/operation/save-operation-coding`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        //Post save operation checkList
          savePreOperationChecklist: builder.mutation({
            query: (body) => ({
                url: `/operation/save-pre-operation-checklist`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        // 🟡 POST remove operation coding
        removeOperationCoding: builder.mutation({
            query: (body) => ({
                url: `/operation/remove-coding`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        // 🟡 POST save operation price list
        saveOperationPriceList: builder.mutation({
            query: (body) => ({
                url: `/operation/save-operation-price-list`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),

        // 🟡 POST remove operation price list
        removeOperationPriceList: builder.mutation({
            query: (body) => ({
                url: `/operation/remove-price-list`,
                method: 'POST',
                body
            }),
            onQueryStarted: onQueryStarted,
        }),
        //get operation was requested
        getRequestedOperation: builder.query({
            query: ({ encounterKey, patientKey }) => ({
                url: `/operation/operation-request-by-status?encounterKey=${encounterKey}&patientKey=${patientKey}`,
                method: 'GET'
            }),
            onQueryStarted
        }),

       


       

    })
});



export const {
    useGetOperationRequestsListQuery,
    useSaveOperationRequestsMutation,
    useGetOperationListQuery,
    useGetOperationCodingListQuery,
    useGetOperationPriceListListQuery,
    useGetOperationCarePlanQuery,
    useGetPreOperationChecklistListQuery,

    useSaveOperationMutation,
    useSavePreOperationChecklistMutation,
    useRemoveOperationMutation,
    useSaveOperationCarePlanMutation,

    useSaveOperationCodingMutation,
    useRemoveOperationCodingMutation,

    useSaveOperationPriceListMutation,
    useRemoveOperationPriceListMutation,
    useGetRequestedOperationQuery
} = operationService;
