import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/query/react';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

/** How a MedFrequency value is split into doses, e.g. EVERY_2_HOURS -> 2 HOURS */
export interface MedFrequencySetup {
  id?: number;
  frequency: string | null;
  frequencyNumber: number | string | null;
  frequencyUnit: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export const newMedFrequencySetup: MedFrequencySetup = {
  id: undefined,
  frequency: null,
  frequencyNumber: '',
  frequencyUnit: null,
  isActive: true
};

const mapPaged = (response: MedFrequencySetup[], meta: any): PagedResult<MedFrequencySetup> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

type FilterParams = { page: number; size: number; sort?: string };

type SetupBody = { frequency: string; frequencyNumber: number; frequencyUnit: string };

export const medFrequencySetupService = createApi({
  reducerPath: 'medFrequencySetupApi',
  baseQuery: BaseQuery,
  tagTypes: ['MedFrequencySetup'],
  endpoints: builder => ({
    getAllMedFrequencySetups: builder.query<PagedResult<MedFrequencySetup>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup/med-frequency-setup',
        params: { page, size, sort, ...(timestamp ? { timestamp } : {}) }
      }),
      transformResponse: mapPaged,
      providesTags: ['MedFrequencySetup']
    }),

    getMedFrequencySetupsByFrequencyNumber: builder.query<PagedResult<MedFrequencySetup>, FilterParams & { frequencyNumber: number | string }>({
      query: ({ frequencyNumber, ...params }) => ({
        url: `/api/setup/med-frequency-setup/by-frequency-number/${frequencyNumber}`,
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['MedFrequencySetup']
    }),

    getMedFrequencySetupsByFrequencyUnit: builder.query<PagedResult<MedFrequencySetup>, FilterParams & { frequencyUnit: string }>({
      query: ({ frequencyUnit, ...params }) => ({
        url: `/api/setup/med-frequency-setup/by-frequency-unit/${frequencyUnit}`,
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['MedFrequencySetup']
    }),

    getMedFrequencySetupsByStatus: builder.query<PagedResult<MedFrequencySetup>, FilterParams & { isActive: boolean | string }>({
      query: ({ isActive, ...params }) => ({
        url: `/api/setup/med-frequency-setup/by-status/${isActive}`,
        params
      }),
      transformResponse: mapPaged,
      providesTags: ['MedFrequencySetup']
    }),

    // Frequency is unique: the result is a single setup (404 when none)
    getMedFrequencySetupByFrequency: builder.query<MedFrequencySetup, string>({
      query: frequency => `/api/setup/med-frequency-setup/by-frequency/${frequency}`,
      providesTags: ['MedFrequencySetup']
    }),

    createMedFrequencySetup: builder.mutation<MedFrequencySetup, SetupBody>({
      query: body => ({
        url: '/api/setup/med-frequency-setup',
        method: 'POST',
        body
      }),
      invalidatesTags: ['MedFrequencySetup']
    }),

    updateMedFrequencySetup: builder.mutation<MedFrequencySetup, { id: number } & SetupBody>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/med-frequency-setup/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['MedFrequencySetup']
    }),

    toggleMedFrequencySetupActive: builder.mutation<MedFrequencySetup, number>({
      query: id => ({
        url: `/api/setup/med-frequency-setup/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MedFrequencySetup']
    })
  })
});

export const {
  useGetAllMedFrequencySetupsQuery,
  useGetMedFrequencySetupsByStatusQuery,
  useLazyGetMedFrequencySetupsByFrequencyNumberQuery,
  useLazyGetMedFrequencySetupsByFrequencyUnitQuery,
  useLazyGetMedFrequencySetupsByStatusQuery,
  useLazyGetMedFrequencySetupByFrequencyQuery,
  useCreateMedFrequencySetupMutation,
  useUpdateMedFrequencySetupMutation,
  useToggleMedFrequencySetupActiveMutation
} = medFrequencySetupService;
