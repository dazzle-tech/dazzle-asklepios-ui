import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../newApi'; 
export const enumService = createApi({
  reducerPath: 'enumApi',
  baseQuery: BaseQuery,
    endpoints: builder => ({
        getGender: builder.query({
            query: () => ({
                url: '/api/enum/gender',
                method: 'GET',
            }), 
        }),
        getEnumByName: builder.query({
            query: ({enumName}) => ({
                url: `/api/setup/enum/${enumName}`,
                method: 'GET',
            }), 
        }),
    }),
});
export const {
    useGetEnumByNameQuery,
    useGetGenderQuery,
} = enumService;

