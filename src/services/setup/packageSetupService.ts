import { BaseQuery } from './../../newApi';
import { createApi } from '@reduxjs/toolkit/query/react';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

export type PackageItemType =
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PATHOLOGY'
  | 'SERVICE'
  | 'PROCEDURE'
  | 'MEDICATION'
  | 'VACCINE';

export interface PackageSetupItem {
  id?: number;
  itemType: PackageItemType;
  /** Empty for a category line (a whole item type). */
  sourceId: number | null;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  isActive?: boolean;
  isCategory?: boolean;
  /** Category lines: how many times the same item can be counted; empty = no limit. */
  maxRepeat?: number | null;
  /** The discount setup record the line is linked to (the item-discount pricing option). */
  discountId?: number | null;
}

export interface PackageSetup {
  id?: number;
  code: string;
  name: string;
  description?: string | null;
  price: number | string | null;
  isActive: boolean;
  /** 'YYYY-MM-DD'; empty = no limit on that side. */
  validFrom?: string | null;
  validTo?: string | null;
  discountId?: number | null;
  discountCode?: string | null;
  discountName?: string | null;
  /** true = any department, otherwise only departmentIds. */
  allDepartments?: boolean;
  departmentIds?: number[];
  /** true = the visit's default service is cancelled when the package is given. */
  overrideDefaultService?: boolean;
  itemCount?: number;
  activeItemCount?: number;
  items: PackageSetupItem[];
}

export interface PackageItemLookup {
  itemType: PackageItemType;
  sourceId: number;
  code: string;
  name: string;
  price?: number | null;
}

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const packageSetupService = createApi({
  reducerPath: 'packageSetupApi',
  baseQuery: BaseQuery,
  tagTypes: ['PackageSetup'],
  endpoints: builder => ({
    // Optional filters are ANDed by the backend; empty ones are left out
    getPackages: builder.query<
      PagedResult<PackageSetup>,
      PagedParams & { code?: string; name?: string; price?: string; isActive?: string }
    >({
      query: ({ page, size, sort = 'id,desc', code, name, price, isActive }) => ({
        url: '/api/setup/packages',
        params: {
          page,
          size,
          sort,
          code: code?.trim() || undefined,
          name: name?.trim() || undefined,
          price: String(price ?? '').trim() || undefined,
          isActive: isActive === '' ? undefined : isActive
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['PackageSetup']
    }),

    getPackage: builder.query<PackageSetup, Id>({
      query: id => ({ url: `/api/setup/packages/${id}` }),
      providesTags: ['PackageSetup']
    }),

    addPackage: builder.mutation<PackageSetup, Omit<PackageSetup, 'id'>>({
      query: body => ({ url: '/api/setup/packages', method: 'POST', body }),
      invalidatesTags: ['PackageSetup']
    }),

    updatePackage: builder.mutation<PackageSetup, PackageSetup & { id: Id }>({
      query: ({ id, ...body }) => ({ url: `/api/setup/packages/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PackageSetup']
    }),

    togglePackageActive: builder.mutation<PackageSetup, { id: Id }>({
      query: ({ id }) => ({ url: `/api/setup/packages/${id}/toggle-active`, method: 'PATCH' }),
      invalidatesTags: ['PackageSetup']
    }),

    // Active items of one type, searched by name or code, from their own setup tables
    lookupPackageItems: builder.query<
      PagedResult<PackageItemLookup>,
      PagedParams & { itemType: PackageItemType; search?: string }
    >({
      query: ({ itemType, search, page, size }) => ({
        url: '/api/setup/packages/item-lookup',
        params: { itemType, search: search?.trim() || undefined, page, size }
      }),
      transformResponse: mapPaged
    })
  })
});

export const {
  useGetPackagesQuery,
  useGetPackageQuery,
  useLazyGetPackageQuery,
  useAddPackageMutation,
  useUpdatePackageMutation,
  useTogglePackageActiveMutation,
  useLookupPackageItemsQuery
} = packageSetupService;
