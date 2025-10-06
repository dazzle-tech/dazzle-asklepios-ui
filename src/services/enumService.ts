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
    
    }),
});
export const {
   
    useGetGenderQuery,
} = enumService;

