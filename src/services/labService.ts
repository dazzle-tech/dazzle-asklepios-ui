import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
    ApDiagnosticOrderTestsNotes,
    ApDiagnosticOrderTestsResult,
    ApDiagnosticOrderTestsSamples,
    ApLabResultLog
} from '@/types/model-types';
export const labService = createApi({
    reducerPath: 'labApi',
    baseQuery: baseQuery,
    endpoints: builder => ({
        getOrderTestNotesByTestId: builder.query({
            query: (testid: string) => ({
                headers: {
                    testid
                },
                url: `/lab/diagnostic-order-test-notes-list`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5

        }),
        saveDiagnosticOrderTestNotes: builder.mutation({
            query: (note: ApDiagnosticOrderTestsNotes) => ({
                url: `/lab/save-diagnostic-order-tests-notes`,
                method: 'POST',
                body: note
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getOrderTestSamplesByTestId: builder.query({
            query: (testid: string) => ({
                headers: {
                    testid
                },
                url: `/lab/diagnostic-order-test-samples-list`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5

        }),
        saveDiagnosticOrderTestSamples: builder.mutation({
            query: (note: ApDiagnosticOrderTestsSamples) => ({
                url: `/lab/save-diagnostic-order-tests-sample`,
                method: 'POST',
                body: note
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getOrderTestResultNotesByResultId: builder.query({
            query: (resultid: string) => ({
                headers: {
                    resultid
                },
                url: `/lab/diagnostic-order-tests-result-notes-list`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5

        }),
        saveDiagnosticOrderTestResultsNotes: builder.mutation({
            query: (note: ApDiagnosticOrderTestsSamples) => ({
                url: `/lab/save-diagnostic-order-tests-result-notes`,
                method: 'POST',
                body: note
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getDiagnosticOrderTestResult: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/lab/diagnostic-order-test-result-list?${fromListRequestToQueryParams(listRequest)}`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5
        }),
        saveDiagnosticOrderTestResult: builder.mutation({
            query: (order: ApDiagnosticOrderTestsResult) => ({
                url: `/lab/save-diagnostic-order-tests-result`,
                method: 'POST',
                body: order
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        saveDiagnosticTestResult: builder.mutation({
            query: (order: ApDiagnosticOrderTestsResult) => ({
                url: `/lab/save-diagnostic-tests-result`,
                method: 'POST',
                body: order
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getResultNormalRange: builder.query({
            query: ({ patientKey, testKey, testProfileKey }) => ({
                url: `/lab/get-result-normal-range?patientKey=${encodeURIComponent(patientKey)}&testKey=${encodeURIComponent(testKey)}testProfileKey=${encodeURIComponent(testProfileKey)}`
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => response.object,
            keepUnusedDataFor: 5
        }),
        getLabResultLogList: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/lab/lab-order-test-list?${fromListRequestToQueryParams(listRequest)}`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5
        }),
        saveLabResultLog: builder.mutation({
            query: (log: ApLabResultLog) => ({
                url: `/lab/save-lab-result-log`,
                method: 'POST',
                body: log
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => {
                return response.object;
            }
        }),
        getGroupTests: builder.query({
            query: (listRequest: ListRequest) => ({
                url: `/lab/get-test-group-by?${fromListRequestToQueryParams(listRequest)}`
            }),
            onQueryStarted: onQueryStarted,
            keepUnusedDataFor: 5
        }),
        deleteTestResults: builder.mutation({
            query: (key: string) => ({
                url: `/lab/delete-test-results?testKey=${key}`,
                method: 'DELETE'
            }),
            onQueryStarted: onQueryStarted
        })
        ,


    })
});
export const {
    useGetOrderTestNotesByTestIdQuery,
    useSaveDiagnosticOrderTestNotesMutation,
    useGetOrderTestSamplesByTestIdQuery,
    useSaveDiagnosticOrderTestSamplesMutation,
    useGetOrderTestResultNotesByResultIdQuery,
    useSaveDiagnosticOrderTestResultsNotesMutation,
    useGetDiagnosticOrderTestResultQuery,
    useSaveDiagnosticOrderTestResultMutation,
    useGetResultNormalRangeQuery,
    useSaveDiagnosticTestResultMutation,
    useGetLabResultLogListQuery,
    useSaveLabResultLogMutation,
    useGetGroupTestsQuery,
    useDeleteTestResultsMutation
} = labService;