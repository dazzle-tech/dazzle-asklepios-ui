import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../newApi';

export type EnumMap = Record<string, string[]>;

export const enumsApi = createApi({
  reducerPath: 'enumsApi',
  baseQuery: BaseQuery,
  endpoints: (builder) => ({
    getEnums: builder.query<EnumMap, void>({
      query: () => '/api/setup/enums',
      async onQueryStarted(arg, api) { await onQueryStarted(arg, api); },
      transformResponse: (data: EnumMap) => {
        // optional: sort values for stable UI
        const out: EnumMap = {};
        Object.keys(data).forEach(k => out[k] = [...(data[k] ?? [])].sort());
        return out;
      },
    }),
  }),
});

export const { useGetEnumsQuery, useLazyGetEnumsQuery } = enumsApi;
