import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
    ApDiagnosticOrderTestsNotes,
    ApDiagnosticOrderTestsResult,
    ApDiagnosticOrderTestsSamples,
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
        getResultNormalRange: builder.query({
            query: ({ patientKey, testKey }) => ({
                url: `/lab/get-result-normal-range?patientKey=${encodeURIComponent(patientKey)}&testKey=${encodeURIComponent(testKey)}`
            }),
            onQueryStarted: onQueryStarted,
            transformResponse: (response: any) => response.object,
            keepUnusedDataFor: 5
        }),
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
    useGetResultNormalRangeQuery
} = labService;