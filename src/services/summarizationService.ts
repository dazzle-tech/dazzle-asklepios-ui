import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';

export interface SummarizationBody {
  text: string;
}

export interface SummarizationResponse {
  summary: string;
}

export const summarizationService = createApi({
  reducerPath: 'summarizationApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    summarizeText: builder.mutation<SummarizationResponse, SummarizationBody>({
      query: body => ({
        url: `/encounter/api/summarization/summarize`,
        method: 'POST',
        body
      }),
      onQueryStarted,
      transformResponse: (response: any) => {
        return response; // backend already provides { summary: ... }
      }
    }),

    summarizationHealth: builder.query<{ status: string }, void>({
      query: () => ({
        url: `/encounter/api/summarization/health`
      }),
      onQueryStarted
    })
  })
});

export const { useSummarizeTextMutation, useSummarizationHealthQuery } = summarizationService;
