import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

export type PagedParams = {
  page: number;
  size: number;
  sort?: string;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: {
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
  };
};

export type CoverageContractedInsurance = {
  insurancePayerId: number;
  nphiesId?: string | null;
  name: string;
  nameAr?: string | null;
  payorId?: number | null;
  payorName?: string | null;
  contractCount?: number;
  isActive?: boolean;
};

export type CoverageLookupItem = {
  id: number;
  code?: string | null;
  name: string;
  extra?: string | null;
  encounterType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive?: boolean;
  relatedId?: number | null;
  relatedName?: string | null;
  payerId?: number | null;
  payerName?: string | null;
};

export type CoverageContract = {
  id?: number;
  guarantorType?: string;
  companyId?: number;
  companyName?: string;
  companyCode?: string;
  code?: string;
  policyNumber?: string;
  coverageBasis?: string;
  insurancePayerId?: number;
  insurancePayerName?: string;
  priceListSetupId?: number;
  priceListName?: string;
  startDate?: string | null;
  endDate?: string | null;
  priceListEffectiveFrom?: string | null;
  priceListEffectiveTo?: string | null;
  parentPayerId?: number | null;
  parentPayerName?: string | null;
  classId?: number | null;
  className?: string | null;
  approvalCoverageCompany?: string | null;
  isActive?: boolean;
};

export type CoverageClass = {
  id?: number;
  coverageContractId?: number;
  name?: string;
  isActive?: boolean;
};

export type CoverageCopayment = {
  id?: number;
  encounterType?: string;
  valueType?: string;
  valueAmount?: number | string;
  discountOnExcluded?: boolean;
  discountOnCash?: boolean;
  discountOnExceededCash?: boolean;
  isActive?: boolean;
};

export type CoverageTerm = {
  id?: number;
  termType?: string;
  diagnosisScope?: string;
  diagnosisId?: number | null;
  diagnosisCode?: string | null;
  diagnosisName?: string | null;
  facilityId?: number;
  facilityName?: string;
  allDepartments?: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
  encounterType?: string | null;
  periodBasis?: string | null;
  coverageBasis?: string | null;
  valueType?: string;
  limitValue?: number | string;
  isActive?: boolean;
};

export type CoverageTermItem = {
  id?: number;
  categoryScope?: string;
  billingItemType?: string | null;
  serviceId?: number | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  valueType?: string;
  limitValue?: number | string;
  isActive?: boolean;
};

export type CoverageDiscount = {
  id?: number;
  targetType?: string;
  billingItemType?: string | null;
  serviceId?: number | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  encounterType?: string;
  discountType?: string;
  discountValue?: number | string;
  isActive?: boolean;
};

export type CoverageExclusion = {
  id?: number;
  exclusionType?: string;
  billingItemType?: string | null;
  serviceId?: number | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  allDiagnoses?: boolean;
  diagnosisId?: number | null;
  diagnosisCode?: string | null;
  diagnosisName?: string | null;
  encounterType?: string;
  excludedResult?: string;
  isActive?: boolean;
};

export type CoveragePreApproval = {
  id?: number;
  approvalScope?: string;
  facilityId?: number | null;
  facilityName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  encounterType?: string | null;
  isActive?: boolean;
};

export type CoveragePreApprovalItem = {
  id?: number;
  itemType?: string;
  serviceCategory?: string | null;
  serviceId?: number | null;
  serviceCode?: string | null;
  serviceName?: string | null;
  allDiagnoses?: boolean;
  diagnosisId?: number | null;
  diagnosisCode?: string | null;
  diagnosisName?: string | null;
  isActive?: boolean;
};

export type CoverageContractResolveRequest = {
  insurancePayerId?: number | null;
  payerNphiesId?: string | null;
  tpaId?: number | null;
  tpaName?: string | null;
  policyNumber?: string | null;
  className?: string | null;
  encounterType?: string | null;
  asOfDate?: string | null;
  facilityId?: number | null;
  departmentId?: number | null;
  diagnosisIds?: number[] | null;
  billingItemType?: string | null;
  catalogItemId?: number | null;
};

export type CoverageReading = {
  termId?: number | null;
  itemId?: number | null;
  categoryScope?: string | null;
  billingItemType?: string | null;
  serviceId?: number | null;
  valueType?: string | null;
  limitValue?: number | string | null;
  periodBasis?: string | null;
  coverageBasis?: string | null;
};

export type CoverageContractResolveResponse = {
  matched: boolean;
  matchReason?: string | null;
  contract?: CoverageContract | null;
  copayment?: CoverageCopayment | null;
  coverageConfigured?: boolean;
  uncovered?: boolean;
  coverage?: CoverageReading | null;
  limit?: CoverageReading | null;
  cashLimit?: CoverageReading | null;
  discount?: CoverageDiscount | null;
  exclusion?: CoverageExclusion | null;
  preApproval?: CoveragePreApprovalReading | null;
};

export type CoveragePreApprovalReading = {
  preApprovalId?: number | null;
  itemId?: number | null;
  approvalScope?: string | null;
  facilityId?: number | null;
  departmentId?: number | null;
  encounterType?: string | null;
  itemType?: string | null;
  serviceCategory?: string | null;
  serviceId?: number | null;
  allDiagnoses?: boolean;
  diagnosisId?: number | null;
};

const toContractPayload = (body: CoverageContract) => ({
  ...(body.id != null ? { id: body.id } : {}),
  guarantorType: body.guarantorType,
  companyId: body.companyId,
  code: body.code,
  policyNumber: body.policyNumber,
  coverageBasis: body.coverageBasis,
  insurancePayerId: body.insurancePayerId,
  priceListSetupId: body.priceListSetupId,
  parentPayerId: body.parentPayerId,
  approvalCoverageCompany: body.approvalCoverageCompany || null,
  isActive: body.isActive
});

const firstDefined = <T>(...values: Array<T | null | undefined>): T | null => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value) !== '') {
      return value;
    }
  }
  return null;
};

export const normalizeCoverageLookupItem = (
  item: CoverageLookupItem | null | undefined
): CoverageLookupItem | null => {
  if (!item) {
    return null;
  }
  return {
    ...item,
    startDate: firstDefined(item.startDate, item.effectiveFrom),
    endDate: firstDefined(item.endDate, item.effectiveTo),
    relatedId: firstDefined(item.relatedId, item.payerId),
    relatedName: firstDefined(item.relatedName, item.payerName)
  };
};

export const normalizeCoverageContract = (
  contract: CoverageContract | null | undefined
): CoverageContract => {
  if (!contract) {
    return contract as CoverageContract;
  }
  const row = contract as CoverageContract & Record<string, any>;
  const guarantorType = firstDefined(row.guarantorType, row.guarantor_type);
  const companyId = firstDefined(row.companyId, row.company_id);
  const insurancePayerId = firstDefined(
    row.insurancePayerId,
    row.insurance_payer_id,
    String(guarantorType || '').toUpperCase() === 'INSURANCE' ? companyId : null
  );
  return {
    ...contract,
    guarantorType,
    companyId,
    companyName: firstDefined(row.companyName, row.company_name),
    companyCode: firstDefined(row.companyCode, row.company_code),
    code: firstDefined(row.code, row.coverageCode),
    policyNumber: firstDefined(row.policyNumber, row.policy_number),
    insurancePayerId,
    insurancePayerName: firstDefined(row.insurancePayerName, row.insurance_payer_name),
    parentPayerId: firstDefined(row.parentPayerId, row.parent_payer_id),
    parentPayerName: firstDefined(row.parentPayerName, row.parent_payer_name) ?? '',
    classId: firstDefined(row.classId, row.class_id),
    className: firstDefined(row.className, row.class_name),
    priceListName: firstDefined(row.priceListName, row.price_list_name),
    isActive: firstDefined(row.isActive, row.is_active) ?? row.isActive,
    startDate: firstDefined(contract.startDate, contract.priceListEffectiveFrom, row.start_date),
    endDate: firstDefined(contract.endDate, contract.priceListEffectiveTo, row.end_date)
  };
};

const toList = <T>(res: T[] | { data?: T[]; content?: T[] } | null | undefined): T[] => {
  if (Array.isArray(res)) {
    return res;
  }
  if (Array.isArray((res as any)?.data)) {
    return (res as any).data;
  }
  if (Array.isArray((res as any)?.content)) {
    return (res as any).content;
  }
  return [];
};

const toPagedResult = <T>(
  res: T[] | { data?: T[]; content?: T[] },
  meta: any,
  mapItem?: (item: T) => T
): PagedResult<T> => {
  const h = meta?.response?.headers;
  const data = toList(res).map(item => (mapItem ? mapItem(item) : item));
  return {
    data,
    totalCount: Number(h?.get('X-Total-Count') ?? data.length),
    links: parseLinkHeader(h?.get('Link'))
  };
};

const toLookupPagedResult = (res: CoverageLookupItem[], meta: any) =>
  toPagedResult(res, meta, item => normalizeCoverageLookupItem(item) as CoverageLookupItem);

const toContractPagedResult = (res: CoverageContract[], meta: any) =>
  toPagedResult(res, meta, item => normalizeCoverageContract(item));

export const coverageManagementService = createApi({
  reducerPath: 'coverageManagementApi',
  baseQuery: BaseQuery,
  tagTypes: [
    'CoverageContract',
    'CoverageClass',
    'CoverageCopayment',
    'CoverageTerm',
    'CoverageTermItem',
    'CoverageDiscount',
    'CoverageExclusion',
    'CoveragePreApproval',
    'CoveragePreApprovalItem'
  ],
  endpoints: builder => ({
    searchCoverageContracts: builder.query<
      PagedResult<CoverageContract>,
      PagedParams & {
        guarantorType?: string;
        companyId?: number;
        insurancePayerId?: number;
        isActive?: boolean;
        search?: string;
      }
    >({
      query: ({ page, size, sort = 'id,desc', ...params }) => ({
        url: '/api/setup/coverage-contracts',
        method: 'GET',
        params: { page, size, sort, ...params }
      }),
      transformResponse: (res: CoverageContract[], meta) => toContractPagedResult(res, meta),
      providesTags: ['CoverageContract']
    }),
    searchContractedInsurances: builder.query<
      PagedResult<CoverageContractedInsurance>,
      PagedParams & { search?: string }
    >({
      query: ({ page, size, sort = 'nameEn,asc', search }) => ({
        url: '/api/setup/coverage-contracts/lookups/contracted-insurances',
        params: { page, size, sort, ...(search ? { search } : {}) }
      }),
      transformResponse: (res: CoverageContractedInsurance[], meta) =>
        toPagedResult(res, meta),
      providesTags: ['CoverageContract']
    }),
    getCoverageContract: builder.query<CoverageContract, number>({
      query: id => `/api/setup/coverage-contracts/${id}`,
      transformResponse: (res: CoverageContract) => normalizeCoverageContract(res),
      providesTags: (_r, _e, id) => [{ type: 'CoverageContract', id }]
    }),
    createCoverageContract: builder.mutation<CoverageContract, CoverageContract>({
      query: body => ({
        url: '/api/setup/coverage-contracts',
        method: 'POST',
        body: toContractPayload(body)
      }),
      transformResponse: (res: CoverageContract) => normalizeCoverageContract(res),
      invalidatesTags: ['CoverageContract']
    }),
    updateCoverageContract: builder.mutation<CoverageContract, CoverageContract>({
      query: body => ({
        url: '/api/setup/coverage-contracts',
        method: 'PUT',
        body: toContractPayload(body)
      }),
      transformResponse: (res: CoverageContract) => normalizeCoverageContract(res),
      invalidatesTags: ['CoverageContract']
    }),
    toggleCoverageContractActive: builder.mutation<CoverageContract, number>({
      query: id => ({ url: `/api/setup/coverage-contracts/${id}/toggle-active`, method: 'PATCH' }),
      transformResponse: (res: CoverageContract) => normalizeCoverageContract(res),
      invalidatesTags: ['CoverageContract']
    }),
    searchCoverageCompanies: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { guarantorType: string; search?: string }
    >({
      query: ({ page, size, sort, guarantorType, search }) => ({
        url: '/api/setup/coverage-contracts/lookups/companies',
        params: {
          page,
          size,
          sort: sort ?? (guarantorType === 'INSURANCE' ? 'nameEn,asc' : 'name,asc'),
          guarantorType,
          ...(search ? { search } : {})
        }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageInsurancePayers: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { search?: string }
    >({
      query: ({ page, size, sort = 'nameEn,asc', search }) => ({
        url: '/api/setup/coverage-contracts/lookups/insurance-payers',
        params: { page, size, sort, ...(search ? { search } : {}) }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageTpaInsurancePayers: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { tpaId: number; search?: string }
    >({
      query: ({ page, size, tpaId, search }) => ({
        url: '/api/setup/coverage-contracts/lookups/tpa-insurance-payers',
        params: { page, size, tpaId, ...(search ? { search } : {}) }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoveragePriceLists: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { nphiesPayerId: number; search?: string }
    >({
      query: ({ page, size, nphiesPayerId, search }) => ({
        url: '/api/setup/coverage-contracts/lookups/price-lists',
        params: {
          page,
          size,
          nphiesPayerId,
          ...(search ? { search } : {})
        }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageFacilities: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { search?: string }
    >({
      query: ({ page, size, sort = 'name,asc', search }) => ({
        url: '/api/setup/coverage-contracts/lookups/facilities',
        params: { page, size, sort, search }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageDepartments: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { facilityId: number; search?: string }
    >({
      query: ({ page, size, sort = 'name,asc', facilityId, search }) => ({
        url: '/api/setup/coverage-contracts/lookups/departments',
        params: { page, size, sort, facilityId, search }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageServices: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { search?: string; category?: string }
    >({
      query: ({ page, size, sort = 'name,asc', search, category }) => ({
        url: '/api/setup/coverage-contracts/lookups/services',
        params: { page, size, sort, search, category }
      }),
      transformResponse: toLookupPagedResult
    }),
    searchCoverageDiagnoses: builder.query<
      PagedResult<CoverageLookupItem>,
      PagedParams & { search?: string }
    >({
      query: ({ page, size, sort = 'code,asc', search }) => ({
        url: '/api/setup/coverage-contracts/lookups/diagnoses',
        params: { page, size, sort, search }
      }),
      transformResponse: toLookupPagedResult
    }),
    listCoverageClasses: builder.query<
      PagedResult<CoverageClass>,
      PagedParams & { contractId: number; isActive?: boolean }
    >({
      query: ({ contractId, page, size, sort = 'id,desc', isActive }) => ({
        url: `/api/setup/coverage-contracts/${contractId}/classes`,
        params: {
          page,
          size,
          sort,
          ...(typeof isActive === 'boolean' ? { isActive } : {})
        }
      }),
      transformResponse: (res: CoverageClass[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageClass']
    }),
    createCoverageClass: builder.mutation<CoverageClass, CoverageClass>({
      query: body => ({
        url: '/api/setup/coverage-classes',
        method: 'POST',
        body
      }),
      invalidatesTags: ['CoverageClass']
    }),
    updateCoverageClass: builder.mutation<CoverageClass, CoverageClass>({
      query: body => ({
        url: '/api/setup/coverage-classes',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['CoverageClass']
    }),
    toggleCoverageClassActive: builder.mutation<CoverageClass, number>({
      query: id => ({ url: `/api/setup/coverage-classes/${id}/toggle-active`, method: 'PATCH' }),
      invalidatesTags: ['CoverageClass']
    }),
    listCopayments: builder.query<
      PagedResult<CoverageCopayment>,
      PagedParams & { classId: number; isActive?: boolean }
    >({
      query: ({ classId, page, size, sort = 'id,desc', isActive }) => ({
        url: `/api/setup/coverage-classes/${classId}/copayments`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: (res: CoverageCopayment[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageCopayment']
    }),
    saveCopayment: builder.mutation<CoverageCopayment, { classId: number; body: CoverageCopayment }>({
      query: ({ classId, body }) => ({
        url: `/api/setup/coverage-classes/${classId}/copayments`,
        method: body.id ? 'PUT' : 'POST',
        body
      }),
      invalidatesTags: ['CoverageCopayment']
    }),
    listTerms: builder.query<
      PagedResult<CoverageTerm>,
      PagedParams & { classId: number; termType: string; isActive?: boolean }
    >({
      query: ({ classId, termType, page, size, sort = 'id,desc', isActive }) => ({
        url: `/api/setup/coverage-classes/${classId}/terms`,
        params: { page, size, sort, termType, isActive }
      }),
      transformResponse: (res: CoverageTerm[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageTerm']
    }),
    saveTerm: builder.mutation<CoverageTerm, { classId: number; body: CoverageTerm }>({
      query: ({ classId, body }) => ({
        url: `/api/setup/coverage-classes/${classId}/terms`,
        method: body.id ? 'PUT' : 'POST',
        body
      }),
      invalidatesTags: ['CoverageTerm']
    }),
    listTermItems: builder.query<
      PagedResult<CoverageTermItem>,
      PagedParams & { termId: number; isActive?: boolean }
    >({
      query: ({ termId, page, size, sort = 'id,desc', isActive }) => ({
        url: `/api/setup/coverage-classes/terms/${termId}/items`,
        params: {
          page,
          size,
          sort,
          ...(typeof isActive === 'boolean' ? { isActive } : {})
        }
      }),
      transformResponse: (res: CoverageTermItem[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageTermItem']
    }),
    saveTermItem: builder.mutation<CoverageTermItem, { termId: number; body: CoverageTermItem }>({
      query: ({ termId, body }) => ({
        url: `/api/setup/coverage-classes/terms/${termId}/items`,
        method: body.id ? 'PUT' : 'POST',
        body
      }),
      invalidatesTags: ['CoverageTermItem']
    }),
    listDiscounts: builder.query<
      PagedResult<CoverageDiscount>,
      PagedParams & { classId?: number; tpaId?: number; isActive?: boolean }
    >({
      query: ({ classId, tpaId, page, size, sort = 'id,desc', isActive }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/discounts`
          : `/api/setup/coverage-classes/${classId}/discounts`,
        params: {
          page,
          size,
          sort,
          ...(typeof isActive === 'boolean' ? { isActive } : {})
        }
      }),
      transformResponse: (res: CoverageDiscount[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageDiscount']
    }),
    createDiscount: builder.mutation<
      CoverageDiscount,
      { classId?: number; tpaId?: number; body: CoverageDiscount }
    >({
      query: ({ classId, tpaId, body }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/discounts`
          : `/api/setup/coverage-classes/${classId}/discounts`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['CoverageDiscount']
    }),
    deactivateDiscount: builder.mutation<CoverageDiscount, number>({
      query: id => ({
        url: `/api/setup/coverage-contracts/discounts/${id}/deactivate`,
        method: 'PATCH'
      }),
      invalidatesTags: ['CoverageDiscount']
    }),
    listExclusions: builder.query<
      PagedResult<CoverageExclusion>,
      PagedParams & { classId?: number; tpaId?: number; isActive?: boolean }
    >({
      query: ({ classId, tpaId, page, size, sort = 'id,desc', isActive }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/exclusions`
          : `/api/setup/coverage-classes/${classId}/exclusions`,
        params: {
          page,
          size,
          sort,
          ...(typeof isActive === 'boolean' ? { isActive } : {})
        }
      }),
      transformResponse: (res: CoverageExclusion[], meta) => toPagedResult(res, meta),
      providesTags: ['CoverageExclusion']
    }),
    createExclusion: builder.mutation<
      CoverageExclusion,
      { classId?: number; tpaId?: number; body: CoverageExclusion }
    >({
      query: ({ classId, tpaId, body }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/exclusions`
          : `/api/setup/coverage-classes/${classId}/exclusions`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['CoverageExclusion']
    }),
    deactivateExclusion: builder.mutation<CoverageExclusion, number>({
      query: id => ({
        url: `/api/setup/coverage-contracts/exclusions/${id}/deactivate`,
        method: 'PATCH'
      }),
      invalidatesTags: ['CoverageExclusion']
    }),
    listPreApprovals: builder.query<
      PagedResult<CoveragePreApproval>,
      PagedParams & { classId?: number; tpaId?: number; isActive?: boolean }
    >({
      query: ({ classId, tpaId, page, size, sort = 'id,desc', isActive }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/pre-approvals`
          : `/api/setup/coverage-classes/${classId}/pre-approvals`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: (res: CoveragePreApproval[], meta) => toPagedResult(res, meta),
      providesTags: ['CoveragePreApproval']
    }),
    savePreApproval: builder.mutation<
      CoveragePreApproval,
      { classId?: number; tpaId?: number; body: CoveragePreApproval }
    >({
      query: ({ classId, tpaId, body }) => ({
        url: tpaId
          ? `/api/setup/tpa-definitions/${tpaId}/pre-approvals`
          : `/api/setup/coverage-classes/${classId}/pre-approvals`,
        method: body.id ? 'PUT' : 'POST',
        body
      }),
      invalidatesTags: ['CoveragePreApproval']
    }),
    listPreApprovalItems: builder.query<
      PagedResult<CoveragePreApprovalItem>,
      PagedParams & { preApprovalId: number; isActive?: boolean }
    >({
      query: ({ preApprovalId, page, size, sort = 'id,desc', isActive }) => ({
        url: `/api/setup/coverage-classes/pre-approvals/${preApprovalId}/items`,
        params: { page, size, sort, isActive }
      }),
      transformResponse: (res: CoveragePreApprovalItem[], meta) => toPagedResult(res, meta),
      providesTags: ['CoveragePreApprovalItem']
    }),
    createPreApprovalItem: builder.mutation<
      CoveragePreApprovalItem,
      { preApprovalId: number; body: CoveragePreApprovalItem }
    >({
      query: ({ preApprovalId, body }) => ({
        url: `/api/setup/coverage-classes/pre-approvals/${preApprovalId}/items`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['CoveragePreApprovalItem']
    }),
    deactivatePreApprovalItem: builder.mutation<CoveragePreApprovalItem, number>({
      query: id => ({
        url: `/api/setup/coverage-contracts/pre-approval-items/${id}/deactivate`,
        method: 'PATCH'
      }),
      invalidatesTags: ['CoveragePreApprovalItem']
    }),
    resolveCoverageContract: builder.query<
      CoverageContractResolveResponse,
      CoverageContractResolveRequest
    >({
      query: body => ({
        url: '/api/setup/coverage-contracts/resolve',
        method: 'POST',
        body
      })
    })
  })
});

export const {
  useSearchCoverageContractsQuery,
  useSearchContractedInsurancesQuery,
  useGetCoverageContractQuery,
  useCreateCoverageContractMutation,
  useUpdateCoverageContractMutation,
  useToggleCoverageContractActiveMutation,
  useListCoverageClassesQuery,
  useCreateCoverageClassMutation,
  useUpdateCoverageClassMutation,
  useToggleCoverageClassActiveMutation,
  useSearchCoverageCompaniesQuery,
  useSearchCoverageInsurancePayersQuery,
  useSearchCoverageTpaInsurancePayersQuery,
  useSearchCoveragePriceListsQuery,
  useSearchCoverageFacilitiesQuery,
  useSearchCoverageDepartmentsQuery,
  useSearchCoverageServicesQuery,
  useSearchCoverageDiagnosesQuery,
  useListCopaymentsQuery,
  useSaveCopaymentMutation,
  useListTermsQuery,
  useSaveTermMutation,
  useListTermItemsQuery,
  useSaveTermItemMutation,
  useListDiscountsQuery,
  useCreateDiscountMutation,
  useDeactivateDiscountMutation,
  useListExclusionsQuery,
  useCreateExclusionMutation,
  useDeactivateExclusionMutation,
  useListPreApprovalsQuery,
  useSavePreApprovalMutation,
  useListPreApprovalItemsQuery,
  useCreatePreApprovalItemMutation,
  useDeactivatePreApprovalItemMutation,
  useResolveCoverageContractQuery
} = coverageManagementService;
