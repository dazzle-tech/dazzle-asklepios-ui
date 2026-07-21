import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

import * as modelTypes from '@/types/model-types-new';

export const autoPopulationService = createApi({
  reducerPath: 'autoPopulationApi',
  baseQuery: BaseQuery,
  tagTypes: ['AutoPopulation'],

  endpoints: builder => ({

   autoPopulate: builder.mutation<
      modelTypes.AutoPopulationResponse,
      modelTypes.AutoPopulateRequest
    >({
      query: body => ({
        url: 'api/analytics/auto-Population/auto-populate',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AutoPopulation']
    })


  })
});

export const {
  useAutoPopulateMutation
} = autoPopulationService;