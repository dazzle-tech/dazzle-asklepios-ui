import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
    ApDiagnosticOrderTestsRadReport,
    ApDiagnosticOrderTestsReportNotes,
} from '@/types/model-types';
export const radService = createApi({
    reducerPath: 'radApi',
    baseQuery: baseQuery,
    endpoints: builder => ({
   
        saveDiagnosticOrderTestRadReport: builder.mutation({
            query: (note: ApDiagnosticOrderTestsRadReport) => ({
                url: `/rad/save-diagnostic-order-tests-rad-report`,
                method: 'POST',
                body: note
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getDiagnosticOrderTestRadReportList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/rad/diagnostic-order-test-rad-report-list?${fromListRequestToQueryParams(listRequest)}`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5
        }),

        getDiagnosticOrderTestReportNotesByReportId: builder.query({
                 query: (reportid: string) => ({
                     headers: {
                         reportid
                     },
                     url: `/rad/diagnostic-order-tests-report-notes-list`
                 }),
                 onQueryStarted: onQueryStarted,
                 keepUnusedDataFor: 5
     
             }),
             saveDiagnosticOrderTestReportNotes: builder.mutation({
                 query: (note:ApDiagnosticOrderTestsReportNotes) => ({
                     url: `/rad/save-diagnostic-order-tests-report-notes`,
                     method: 'POST',
                     body: note
                 }),
                 onQueryStarted: onQueryStarted,
                 transformResponse: (response: any) => {
                     return response.object;
                 }
             }),
    })
});
export const {

   useSaveDiagnosticOrderTestRadReportMutation,
    useGetDiagnosticOrderTestRadReportListQuery,
    useGetDiagnosticOrderTestReportNotesByReportIdQuery,
    useSaveDiagnosticOrderTestReportNotesMutation
 
} = radService ;