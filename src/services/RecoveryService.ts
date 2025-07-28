import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
export const recoveryService=createApi({
    reducerPath:'recoveryApi',
    baseQuery:baseQuery,
    endpoints:builder=>({

    })

});
export const {}=recoveryService;