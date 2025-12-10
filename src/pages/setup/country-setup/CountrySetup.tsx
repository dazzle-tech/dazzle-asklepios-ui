import React, { useState, useMemo, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyInput from '@/components/MyInput';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useGetCountriesQuery,
  useLazyGetCountryByNameQuery,
  useLazyGetCountryByCodeQuery,
  useAddCountryMutation,
  useUpdateCountryMutation,
  useToggleCountryActiveMutation
} from '@/services/setup/country/countryService';

import {
  useGetDistrictsByCountryQuery,
  useLazyGetDistrictsByCountryQuery,
  useAddDistrictMutation,
  useUpdateDistrictMutation,
  useToggleDistrictActiveMutation
} from '@/services/setup/country/countryDistrictService';

import {
  useGetCommunitiesByDistrictQuery,
  useLazyGetCommunitiesByDistrictQuery,
  useAddCommunityMutation,
  useUpdateCommunityMutation,
  useToggleCommunityActiveMutation
} from '@/services/setup/country/districtCommunityService';

import {
  useGetAreasByDistrictQuery,
  useLazyGetAreasByDistrictQuery,
  useAddAreaMutation,
  useUpdateAreaMutation,
  useToggleAreaActiveMutation
} from '@/services/setup/country/communityAreaService';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import {
  Country,
  CountryDistrict,
  DistrictCommunity,
  CommunityArea
} from '@/types/model-types-new';
import {
  newCountry,
  newCountryDistrict,
  newCommunityArea
} from '@/types/model-types-constructor-new';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

import './geo-hierarchy.less';
import SectionContainer from '@/components/SectionsoContainer';

const CountrySetup: React.FC = () => {
  const dispatch = useAppDispatch();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<CountryDistrict | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<DistrictCommunity | null>(null);
  const [selectedArea, setSelectedArea] = useState<CommunityArea | null>(null);

  const [countryForEdit, setCountryForEdit] = useState<Country>({ ...newCountry });
  const [districtForEdit, setDistrictForEdit] = useState<CountryDistrict>({ ...newCountryDistrict });
  const [communityForEdit, setCommunityForEdit] = useState<DistrictCommunity>({
    id: undefined,
    districtId: 0,
    name: '',
    isActive: true
  });
  const [areaForEdit, setAreaForEdit] = useState<CommunityArea>({ ...newCommunityArea });

  const [showCountryForm, setShowCountryForm] = useState(false);
  const [showDistrictForm, setShowDistrictForm] = useState(false);
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [deleteType, setDeleteType] = useState<'country' | 'district' | 'community' | 'area'>(
    'country'
  );

  const { data: lovResponse } = useGetLovValuesByCodeQuery('CNTRY');

  const [recordOfCountryFilter, setRecordOfCountryFilter] = useState<{
    filter: string;
    value: any;
  }>({ filter: '', value: '' });
  const [isCountryFiltered, setIsCountryFiltered] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [filteredCountriesTotal, setFilteredCountriesTotal] = useState<number>(0);
  const [filteredCountriesLinks, setFilteredCountriesLinks] = useState<any | undefined>(undefined);

  const [countryPaginationParams, setCountryPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [countryFilterPagination, setCountryFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const countryFilterFields = [
    { label: 'Country Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  const {
    data: countriesResp,
    isFetching: countriesFetching,
    refetch: refetchCountries
  } = useGetCountriesQuery({
    page: countryPaginationParams.page,
    size: countryPaginationParams.size,
    sort: countryPaginationParams.sort
  });

  const [fetchCountryByName] = useLazyGetCountryByNameQuery();
  const [fetchCountryByCode] = useLazyGetCountryByCodeQuery();

  const countryTotalCount = useMemo(
    () => (isCountryFiltered ? filteredCountriesTotal : countriesResp?.totalCount ?? 0),
    [isCountryFiltered, filteredCountriesTotal, countriesResp?.totalCount]
  );
  const countryLinks = (isCountryFiltered ? filteredCountriesLinks : countriesResp?.links) || {};
  const countryTableData = useMemo(
    () => (isCountryFiltered ? filteredCountries : countriesResp?.data ?? []),
    [isCountryFiltered, filteredCountries, countriesResp?.data]
  );

  const resetCountryToUnfiltered = () => {
    setIsCountryFiltered(false);
    setFilteredCountries([]);
    setFilteredCountriesTotal(0);
    setFilteredCountriesLinks(undefined);
    setCountryFilterPagination(prev => ({ ...prev, page: 0 }));
    setCountryPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));
    refetchCountries();
  };

  const runCountryFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = countryFilterPagination.size,
    sort = countryFilterPagination.sort
  ) => {
    if (!value && value !== 0) return undefined;

    if (fieldName === 'name') {
      return await fetchCountryByName({ name: value, page, size, sort }).unwrap();
    } else if (fieldName === 'code') {
      return await fetchCountryByCode({ code: value, page, size, sort }).unwrap();
    }
    return undefined;
  };

  const handleCountryFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = countryFilterPagination.size,
    sort = countryFilterPagination.sort
  ) => {
    if (!value) {
      resetCountryToUnfiltered();
      return;
    }
    try {
      const resp = await runCountryFilterQuery(fieldName, value, page, size, sort);
      setFilteredCountries(resp?.data ?? []);
      setFilteredCountriesTotal(resp?.totalCount ?? 0);
      setFilteredCountriesLinks(resp?.links || {});
      setIsCountryFiltered(true);
      setCountryFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetCountryToUnfiltered();
    }
  };

  const handleCountryPageChange = (_: unknown, newPage: number) => {
    if (isCountryFiltered) {
      handleCountryFilterChange(
        recordOfCountryFilter.filter,
        recordOfCountryFilter.value,
        newPage,
        countryFilterPagination.size,
        countryFilterPagination.sort
      );
      return;
    }

    const currentPage = countryPaginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && countryLinks.next) targetLink = countryLinks.next;
    else if (newPage < currentPage && countryLinks.prev) targetLink = countryLinks.prev;
    else if (newPage === 0 && countryLinks.first) targetLink = countryLinks.first;
    else if (newPage > currentPage + 1 && countryLinks.last) targetLink = countryLinks.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setCountryPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now()
      }));
    }
  };

  const handleCountryRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isCountryFiltered) {
      setCountryFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleCountryFilterChange(
        recordOfCountryFilter.filter,
        recordOfCountryFilter.value,
        0,
        newSize,
        countryFilterPagination.sort
      );
    } else {
      setCountryPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const countryFiltersUI = () => {
    const selected = recordOfCountryFilter.filter;

    const dynamicInput =
      selected === 'name' ? (
        <MyInput
          width={250}
          column
          fieldLabel=""
          fieldType="select"
          fieldName="value"
          selectData={lovResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={recordOfCountryFilter}
          setRecord={setRecordOfCountryFilter}
          menuMaxHeight={200}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          column
          record={recordOfCountryFilter}
          setRecord={setRecordOfCountryFilter}
          showLabel={false}
          placeholder={selected === 'code' ? 'Enter Country Code' : 'Enter Value'}
          width={220}
        />
      );

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          column
          selectData={countryFilterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfCountryFilter}
          setRecord={(updated: any) => {
            setRecordOfCountryFilter({ filter: updated.filter, value: '' });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="170px"
        />
        {dynamicInput}
        <div style={{ marginTop: '24px' }}>
          <MyButton
            color="var(--deep-blue)"
            onClick={() => {
              if (!recordOfCountryFilter.value && recordOfCountryFilter.value !== 0) {
                resetCountryToUnfiltered();
              } else {
                handleCountryFilterChange(
                  recordOfCountryFilter.filter,
                  recordOfCountryFilter.value,
                  0,
                  countryFilterPagination.size,
                  countryFilterPagination.sort
                );
              }
            }}
            width="80px"
          >
            Search
          </MyButton>
        </div>
      </Form>
    );
  };

  useEffect(() => {
    if (!recordOfCountryFilter.value && isCountryFiltered) {
      resetCountryToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfCountryFilter.value]);

  const [recordOfDistrictFilter, setRecordOfDistrictFilter] = useState<{
    filter: string;
    value: any;
  }>({ filter: '', value: '' });
  const [isDistrictFiltered, setIsDistrictFiltered] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState<CountryDistrict[]>([]);
  const [filteredDistrictTotal, setFilteredDistrictTotal] = useState<number>(0);

  const [districtPaginationParams, setDistrictPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [districtFilterPagination, setDistrictFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const districtFilterFields = [
    { label: 'District Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  const countryId = selectedCountry?.id ?? 0;

  const {
    data: districtsResp,
    isFetching: districtsFetching,
    refetch: refetchDistricts
  } = useGetDistrictsByCountryQuery(
    {
      countryId: Number(countryId),
      page: districtPaginationParams.page,
      size: districtPaginationParams.size,
      sort: districtPaginationParams.sort
    },
    { skip: !countryId }
  );

  const [fetchDistrictsByCountry] = useLazyGetDistrictsByCountryQuery();

  const districtTotalCount = useMemo(
    () => (isDistrictFiltered ? filteredDistrictTotal : districtsResp?.totalCount ?? 0),
    [isDistrictFiltered, filteredDistrictTotal, districtsResp?.totalCount]
  );

  const districtLinks = districtsResp?.links || {};

  const districtTableData = useMemo(() => {
    if (!isDistrictFiltered) return districtsResp?.data ?? [];

    const start = districtFilterPagination.page * districtFilterPagination.size;
    const end = start + districtFilterPagination.size;
    return filteredDistricts.slice(start, end);
  }, [
    isDistrictFiltered,
    filteredDistricts,
    districtsResp?.data,
    districtFilterPagination.page,
    districtFilterPagination.size
  ]);

  const resetDistrictToUnfiltered = () => {
    setIsDistrictFiltered(false);
    setFilteredDistricts([]);
    setFilteredDistrictTotal(0);

    setDistrictFilterPagination(prev => ({
      ...prev,
      page: 0,
      sort: 'id,desc'
    }));

    setDistrictPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetchDistricts();
  };

  const runDistrictFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';

    const totalFromServer = districtsResp?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    const resp = await fetchDistrictsByCountry({
      countryId: Number(countryId),
      page: 0,
      size: bigSize,
      sort: effectiveSort
    }).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CountryDistrict[] = all;

    if (fieldName === 'name') {
      filtered = all.filter(d => (d.name ?? '').toString().toLowerCase().includes(term));
    } else if (fieldName === 'code') {
      filtered = all.filter(d => (d.code ?? '').toString().toLowerCase().includes(term));
    }

    return {
      data: filtered,
      totalCount: filtered.length
    };
  };

  const handleDistrictFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = districtFilterPagination.size,
    sort = districtFilterPagination.sort
  ) => {
    if (!value) {
      resetDistrictToUnfiltered();
      return;
    }

    try {
      const resp = await runDistrictFilterQuery(fieldName, value, sort);

      const list = resp?.data ?? [];
      setFilteredDistricts(list);
      setFilteredDistrictTotal(resp?.totalCount ?? list.length);
      setIsDistrictFiltered(true);

      setDistrictFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetDistrictToUnfiltered();
    }
  };

  const handleDistrictPageChange = (_: unknown, newPage: number) => {
    if (isDistrictFiltered) {
      setDistrictFilterPagination(prev => ({ ...prev, page: newPage }));
      return;
    }

    const currentPage = districtPaginationParams.page;
    const linksMap = districtLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setDistrictPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleDistrictRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isDistrictFiltered) {
      setDistrictFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
    } else {
      setDistrictPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const districtFiltersUI = () => {
    const selectedFilter = recordOfDistrictFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'name') {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          column
          record={recordOfDistrictFilter}
          setRecord={setRecordOfDistrictFilter}
          placeholder="Enter District Name"
          width={170}
          showLabel={false}
        />
      );
    } else if (selectedFilter === 'code') {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          column
          record={recordOfDistrictFilter}
          setRecord={setRecordOfDistrictFilter}
          placeholder="Enter District Code"
          width={170}
          showLabel={false}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          column
          record={recordOfDistrictFilter}
          setRecord={setRecordOfDistrictFilter}
          placeholder="Enter Value"
          width={170}
          showLabel={false}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          column
          selectData={districtFilterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfDistrictFilter}
          setRecord={(updated: any) =>
            setRecordOfDistrictFilter({ filter: updated.filter, value: '' })
          }
          placeholder="Select Filter"
          searchable={false}
          width={170}
          showLabel={false}
        />

        {dynamicInput}

        <div style={{ marginTop: '24px' }}>

          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfDistrictFilter.value) {
                resetDistrictToUnfiltered();
              } else {
                handleDistrictFilterChange(
                  recordOfDistrictFilter.filter,
                  recordOfDistrictFilter.value,
                  0,
                  districtFilterPagination.size,
                  districtFilterPagination.sort || 'id,desc'
                );
              }
            }}
          >
            Search
          </MyButton>
        </div>
      </Form>
    );
  };

  useEffect(() => {
    if (!recordOfDistrictFilter.value && isDistrictFiltered) {
      resetDistrictToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfDistrictFilter.value]);

  const [recordOfCommunityFilter, setRecordOfCommunityFilter] = useState<{
    filter: string;
    value: any;
  }>({ filter: '', value: '' });
  const [isCommunityFiltered, setIsCommunityFiltered] = useState(false);
  const [filteredCommunities, setFilteredCommunities] = useState<DistrictCommunity[]>([]);
  const [filteredCommunityTotal, setFilteredCommunityTotal] = useState<number>(0);

  const [communityPaginationParams, setCommunityPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [communityFilterPagination, setCommunityFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const communityFilterFields = [{ label: 'Community Name', value: 'name' }];

  const districtId = selectedDistrict?.id ?? 0;

  const {
    data: communitiesResp,
    isFetching: communitiesFetching,
    refetch: refetchCommunities
  } = useGetCommunitiesByDistrictQuery(
    {
      districtId,
      page: communityPaginationParams.page,
      size: communityPaginationParams.size,
      sort: communityPaginationParams.sort
    },
    { skip: districtId === 0 }
  );

  const [fetchCommunitiesByDistrict] = useLazyGetCommunitiesByDistrictQuery();

  const communityTotalCount = useMemo(
    () => (isCommunityFiltered ? filteredCommunityTotal : communitiesResp?.totalCount ?? 0),
    [isCommunityFiltered, filteredCommunityTotal, communitiesResp?.totalCount]
  );

  const communityLinks = communitiesResp?.links || {};

  const communityTableData = useMemo(() => {
    if (!isCommunityFiltered) return communitiesResp?.data ?? [];

    const start = communityFilterPagination.page * communityFilterPagination.size;
    const end = start + communityFilterPagination.size;
    return filteredCommunities.slice(start, end);
  }, [
    isCommunityFiltered,
    communitiesResp?.data,
    filteredCommunities,
    communityFilterPagination.page,
    communityFilterPagination.size
  ]);

  const resetCommunityToUnfiltered = () => {
    setIsCommunityFiltered(false);
    setFilteredCommunities([]);
    setFilteredCommunityTotal(0);

    setCommunityFilterPagination(prev => ({
      ...prev,
      page: 0,
      sort: 'id,desc'
    }));

    setCommunityPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetchCommunities();
  };

  const runCommunityFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';

    const totalFromServer = communitiesResp?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    const resp = await fetchCommunitiesByDistrict({
      districtId,
      page: 0,
      size: bigSize,
      sort: effectiveSort
    }).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: DistrictCommunity[] = all;

    if (fieldName === 'name') {
      filtered = all.filter(c => (c.name ?? '').toString().toLowerCase().includes(term));
    }

    return {
      data: filtered,
      totalCount: filtered.length
    };
  };

  const handleCommunityFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = communityFilterPagination.size,
    sort = communityFilterPagination.sort
  ) => {
    if (!value) {
      resetCommunityToUnfiltered();
      return;
    }

    try {
      const resp = await runCommunityFilterQuery(fieldName, value, sort);

      const list = resp?.data ?? [];
      setFilteredCommunities(list);
      setFilteredCommunityTotal(resp?.totalCount ?? list.length);
      setIsCommunityFiltered(true);

      setCommunityFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetCommunityToUnfiltered();
    }
  };

  const handleCommunityPageChange = (_: unknown, newPage: number) => {
    if (isCommunityFiltered) {
      setCommunityFilterPagination(prev => ({ ...prev, page: newPage }));
      return;
    }

    const currentPage = communityPaginationParams.page;
    const linksMap = communityLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setCommunityPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleCommunityRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isCommunityFiltered) {
      setCommunityFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
    } else {
      setCommunityPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const communityFiltersUI = () => {
    const selectedFilter = recordOfCommunityFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'name') {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          column
          showLabel={false}
          placeholder="Enter Community Name"
          record={recordOfCommunityFilter}
          setRecord={setRecordOfCommunityFilter}
          width={150}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          column
          showLabel={false}
          placeholder="Enter Value"
          record={recordOfCommunityFilter}
          setRecord={setRecordOfCommunityFilter}
          width={150}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <MyInput
          fieldType="select"
          fieldName="filter"
          column
          showLabel={false}
          selectData={communityFilterFields}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfCommunityFilter}
          setRecord={(v: any) => setRecordOfCommunityFilter({ filter: v.filter, value: '' })}
          placeholder="Select Filter"
          searchable={false}
          width={150}
        />
        {dynamicInput}
        <div style={{ marginTop: '24px' }}>

          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfCommunityFilter.value) {
                resetCommunityToUnfiltered();
              } else {
                handleCommunityFilterChange(
                  recordOfCommunityFilter.filter,
                  recordOfCommunityFilter.value,
                  0,
                  communityFilterPagination.size,
                  communityFilterPagination.sort || 'id,desc'
                );
              }
            }}
          >
            Search
          </MyButton>
        </div>
      </Form>
    );
  };

  useEffect(() => {
    if (!recordOfCommunityFilter.value && isCommunityFiltered) {
      resetCommunityToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfCommunityFilter.value]);

  const [recordOfAreaFilter, setRecordOfAreaFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isAreaFiltered, setIsAreaFiltered] = useState(false);
  const [filteredAreas, setFilteredAreas] = useState<CommunityArea[]>([]);
  const [filteredAreaTotal, setFilteredAreaTotal] = useState<number>(0);

  const [areaPaginationParams, setAreaPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [areaFilterPagination, setAreaFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const areaFilterFields = [{ label: 'Area Name', value: 'name' }];

  const communityId = selectedCommunity?.id ?? 0;

  const {
    data: areasResp,
    isFetching: areasFetching,
    refetch: refetchAreas
  } = useGetAreasByDistrictQuery(
    {
      districtId: communityId,
      page: areaPaginationParams.page,
      size: areaPaginationParams.size,
      sort: areaPaginationParams.sort
    },
    { skip: communityId === 0 }
  );

  const [fetchAreasByDistrict] = useLazyGetAreasByDistrictQuery();

  const areaTotalCount = useMemo(
    () => (isAreaFiltered ? filteredAreaTotal : areasResp?.totalCount ?? 0),
    [isAreaFiltered, filteredAreaTotal, areasResp?.totalCount]
  );

  const areaLinks = areasResp?.links || {};

  const areaTableData = useMemo(() => {
    if (!isAreaFiltered) return areasResp?.data ?? [];

    const start = areaFilterPagination.page * areaFilterPagination.size;
    const end = start + areaFilterPagination.size;
    return filteredAreas.slice(start, end);
  }, [
    isAreaFiltered,
    filteredAreas,
    areasResp?.data,
    areaFilterPagination.page,
    areaFilterPagination.size
  ]);

  const resetAreaToUnfiltered = () => {
    setIsAreaFiltered(false);
    setFilteredAreas([]);
    setFilteredAreaTotal(0);

    setAreaFilterPagination(prev => ({
      ...prev,
      page: 0,
      sort: 'id,desc'
    }));

    setAreaPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetchAreas();
  };

  const runAreaFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';

    const totalFromServer = areasResp?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    const resp = await fetchAreasByDistrict({
      districtId: communityId,
      page: 0,
      size: bigSize,
      sort: effectiveSort
    }).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CommunityArea[] = all;

    if (fieldName === 'name') {
      filtered = all.filter(a => (a.name ?? '').toString().toLowerCase().includes(term));
    }

    return {
      data: filtered,
      totalCount: filtered.length
    };
  };

  const handleAreaFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = areaFilterPagination.size,
    sort = areaFilterPagination.sort
  ) => {
    if (!value) {
      resetAreaToUnfiltered();
      return;
    }

    try {
      const resp = await runAreaFilterQuery(fieldName, value, sort);

      const list = resp?.data ?? [];
      setFilteredAreas(list);
      setFilteredAreaTotal(resp?.totalCount ?? list.length);
      setIsAreaFiltered(true);

      setAreaFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetAreaToUnfiltered();
    }
  };

  const handleAreaPageChange = (_: unknown, newPage: number) => {
    if (isAreaFiltered) {
      setAreaFilterPagination(prev => ({ ...prev, page: newPage }));
      return;
    }

    const currentPage = areaPaginationParams.page;
    const linksMap = areaLinks || {};
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setAreaPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  const handleAreaRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isAreaFiltered) {
      setAreaFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
    } else {
      setAreaPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const areaFiltersUI = () => {
    const selectedFilter = recordOfAreaFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'name') {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          column
          showLabel={false}
          placeholder="Enter Area Name"
          record={recordOfAreaFilter}
          setRecord={setRecordOfAreaFilter}
          width={170}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldType="text"
          fieldName="value"
          column
          showLabel={false}
          placeholder="Enter Value"
          record={recordOfAreaFilter}
          setRecord={setRecordOfAreaFilter}
          width={170}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <MyInput
          fieldType="select"
          fieldName="filter"
          column
          showLabel={false}
          selectData={areaFilterFields}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfAreaFilter}
          setRecord={(v: any) => setRecordOfAreaFilter({ filter: v.filter, value: '' })}
          placeholder="Select Filter"
          searchable={false}
          width={170}
        />
        {dynamicInput}
        <div style={{ marginTop: '24px' }}>

          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfAreaFilter.value) {
                resetAreaToUnfiltered();
              } else {
                handleAreaFilterChange(
                  recordOfAreaFilter.filter,
                  recordOfAreaFilter.value,
                  0,
                  areaFilterPagination.size,
                  areaFilterPagination.sort || 'id,desc'
                );
              }
            }}
          >
            Search
          </MyButton>
        </div>
      </Form>
    );
  };

  useEffect(() => {
    if (!recordOfAreaFilter.value && isAreaFiltered) {
      resetAreaToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfAreaFilter.value]);

  const [addCountry] = useAddCountryMutation();
  const [updateCountry] = useUpdateCountryMutation();
  const [toggleCountryActive] = useToggleCountryActiveMutation();

  const [addDistrict] = useAddDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [toggleDistrictActive] = useToggleDistrictActiveMutation();

  const [addCommunity] = useAddCommunityMutation();
  const [updateCommunity] = useUpdateCommunityMutation();
  const [toggleCommunityActive] = useToggleCommunityActiveMutation();

  const [addArea] = useAddAreaMutation();
  const [updateArea] = useUpdateAreaMutation();
  const [toggleAreaActive] = useToggleAreaActiveMutation();

  const handleSaveCountry = async (payload: Country) => {
    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Country name is required', sev: 'error' }));
      return;
    }

    try {
      if (payload.id) {
        await updateCountry(payload).unwrap();
        dispatch(notify({ msg: 'Country updated successfully', sev: 'success' }));
      } else {
        await addCountry({ ...payload, isActive: payload.isActive ?? true }).unwrap();
        dispatch(notify({ msg: 'Country added successfully', sev: 'success' }));
      }
      setShowCountryForm(false);
      setCountryForEdit({ ...newCountry });
      resetCountryToUnfiltered();
    } catch {
      dispatch(notify({ msg: 'Failed to save country', sev: 'error' }));
    }
  };

  const handleSaveDistrict = async (payload: CountryDistrict) => {
    if (!countryId) return;
    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'District name is required', sev: 'error' }));
      return;
    }

    try {
      const body: CountryDistrict = {
        ...payload,
        countryId,
        isActive: payload.isActive ?? true
      };
      if (body.id) {
        await updateDistrict({ countryId, id: body.id, ...body }).unwrap();
        dispatch(notify({ msg: 'District updated successfully', sev: 'success' }));
      } else {
        await addDistrict({ countryId, ...body }).unwrap();
        dispatch(notify({ msg: 'District added successfully', sev: 'success' }));
      }
      setShowDistrictForm(false);
      setDistrictForEdit({ ...newCountryDistrict });
      resetDistrictToUnfiltered();
    } catch {
      dispatch(notify({ msg: 'Failed to save district', sev: 'error' }));
    }
  };

  const handleSaveCommunity = async (payload: DistrictCommunity) => {
    if (!districtId) return;
    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Community name is required', sev: 'error' }));
      return;
    }

    try {
      const body: DistrictCommunity = {
        ...payload,
        districtId,
        isActive: payload.isActive ?? true
      };
      if (body.id) {
        await updateCommunity({
          districtId,
          id: body.id,
          body
        }).unwrap();
        dispatch(notify({ msg: 'Community updated successfully', sev: 'success' }));
      } else {
        await addCommunity({ districtId, ...body }).unwrap();
        dispatch(notify({ msg: 'Community added successfully', sev: 'success' }));
      }
      setShowCommunityForm(false);
      setCommunityForEdit({
        id: undefined,
        districtId,
        name: '',
        isActive: true
      });
      resetCommunityToUnfiltered();
    } catch {
      dispatch(notify({ msg: 'Failed to save community', sev: 'error' }));
    }
  };

  const handleSaveArea = async (payload: CommunityArea) => {
    if (!communityId) return;
    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Area name is required', sev: 'error' }));
      return;
    }

    try {
      const body: CommunityArea = {
        ...payload,
        communityId,
        isActive: payload.isActive ?? true
      };
      if (body.id) {
        await updateArea({
          districtId: communityId,
          id: body.id,
          body
        }).unwrap();
        dispatch(notify({ msg: 'Area updated successfully', sev: 'success' }));
      } else {
        await addArea({
          districtId: communityId,
          ...body
        }).unwrap();
        dispatch(notify({ msg: 'Area added successfully', sev: 'success' }));
      }
      setShowAreaForm(false);
      setAreaForEdit({ ...newCommunityArea, communityId });
      resetAreaToUnfiltered();
    } catch {
      dispatch(notify({ msg: 'Failed to save area', sev: 'error' }));
    }
  };

  const handleConfirmToggle = async () => {
    try {
      if (deleteType === 'country' && selectedCountry?.id) {
        await toggleCountryActive({ id: selectedCountry.id }).unwrap();
        resetCountryToUnfiltered();
      } else if (deleteType === 'district' && selectedDistrict?.id) {
        await toggleDistrictActive({ id: selectedDistrict.id }).unwrap();
        resetDistrictToUnfiltered();
      } else if (deleteType === 'community' && selectedCommunity?.id) {
        await toggleCommunityActive({ id: selectedCommunity.id }).unwrap();
        resetCommunityToUnfiltered();
      } else if (deleteType === 'area' && selectedArea?.id) {
        await toggleAreaActive({ id: selectedArea.id }).unwrap();
        resetAreaToUnfiltered();
      }
      dispatch(
        notify({
          msg: deleteMode === 'deactivate' ? 'Deactivated successfully' : 'Activated successfully',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg: deleteMode === 'deactivate' ? 'Failed to deactivate' : 'Failed to activate',
          sev: 'error'
        })
      );
    } finally {
      setOpenDeleteConfirm(false);
    }
  };

  const countryColumns = [
    {
      key: 'name',
      title: <Translate>Country Name</Translate>,
      flexGrow: 3,
      render: (row: Country) =>
        conjureValueBasedOnKeyFromList(lovResponse?.object ?? [], row.name, 'lovDisplayVale')
    },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 2 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      width: 90,
      render: (row: Country) =>
        row.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 1,
      render: (row: Country) => (
        <div className="container-of-icons">
          <MdModeEdit
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setCountryForEdit(row);
              setShowCountryForm(true);
            }}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              fill="var(--primary-pink)"
              size={24}
              onClick={() => {
                setSelectedCountry(row);
                setDeleteType('country');
                setDeleteMode('deactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setSelectedCountry(row);
                setDeleteType('country');
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  const districtColumns = [
    { key: 'name', title: <Translate>District Name</Translate>, flexGrow: 3 },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 2 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      width: 90,
      render: (row: CountryDistrict) =>
        row.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 1,
      render: (row: CountryDistrict) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setDistrictForEdit(row);
              setShowDistrictForm(true);
            }}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              fill="var(--primary-pink)"
              size={24}
              onClick={() => {
                setSelectedDistrict(row);
                setDeleteType('district');
                setDeleteMode('deactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              fill="var(--primary-gray)"
              size={24}
              onClick={() => {
                setSelectedDistrict(row);
                setDeleteType('district');
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  const communityColumns = [
    { key: 'name', title: <Translate>Community Name</Translate>, flexGrow: 3 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      width: 90,
      render: (row: DistrictCommunity) =>
        row.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 1,
      render: (row: DistrictCommunity) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setCommunityForEdit(row);
              setShowCommunityForm(true);
            }}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setSelectedCommunity(row);
                setDeleteType('community');
                setDeleteMode('deactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setSelectedCommunity(row);
                setDeleteType('community');
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  const areaColumns = [
    { key: 'name', title: <Translate>Area Name</Translate>, flexGrow: 3 },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      width: 90,
      render: (row: CommunityArea) =>
        row.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 1,
      render: (row: CommunityArea) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setAreaForEdit(row);
              setShowAreaForm(true);
            }}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              fill="var(--primary-pink)"
              size={20}
              onClick={() => {
                setSelectedArea(row);
                setDeleteType('area');
                setDeleteMode('deactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              fill="var(--primary-gray)"
              size={24}
              onClick={() => {
                setSelectedArea(row);
                setDeleteType('area');
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];



 return (
  <Panel className="geo-hierarchy-container">
    <div className="geo-columns">
      <SectionContainer
        title={<Translate>Country</Translate>}
        minHeight={600}
        action={
          <MyButton
            color="var(--deep-blue)"
            width="90px"
            prefixIcon={() => <AddOutlineIcon />}
            onClick={() => {
              setCountryForEdit({ ...newCountry, isActive: true });
              setShowCountryForm(true);
            }}
          >
            Add
          </MyButton>
        }
        content={
          <>
            {showCountryForm && (
              <div className="geo-inline-form">
                <Form fluid layout="inline" className="flex-dis-row">
                  <MyInput
                    fieldName="name"
                    fieldType="select"
                    column
                    fieldLabel="Country Name"
                    record={countryForEdit}
                    setRecord={setCountryForEdit}
                    selectData={lovResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    placeholder="Select country"
                    width={220}
                  />
                  <MyInput
                    fieldName="code"
                    fieldType="text"
                    fieldLabel="Code"
                    column
                    record={countryForEdit}
                    setRecord={setCountryForEdit}
                    placeholder="Code"
                    width={120}
                  />

                  <div style={{ marginTop: '36px' }}>
                    <MyButton
                      color="var(--deep-blue)"
                      width="80px"
                      onClick={() => handleSaveCountry(countryForEdit)}
                    >
                      Save
                    </MyButton>
                  </div>

                  <div style={{ marginTop: '36px' }}>
                    <MyButton
                      color="var(--primary-gray)"
                      width="80px"
                      onClick={() => {
                        setShowCountryForm(false);
                        setCountryForEdit({ ...newCountry });
                      }}
                    >
                      Cancel
                    </MyButton>
                  </div>
                </Form>
              </div>
            )}

            {countryFiltersUI()}

            <MyTable
              data={countryTableData}
              columns={countryColumns}
              totalCount={countryTotalCount}
              page={
                isCountryFiltered
                  ? countryFilterPagination.page
                  : countryPaginationParams.page
              }
              rowsPerPage={
                isCountryFiltered
                  ? countryFilterPagination.size
                  : countryPaginationParams.size
              }
              onPageChange={handleCountryPageChange}
              onRowsPerPageChange={handleCountryRowsPerPageChange}
              loading={countriesFetching}
              filters={null}
              onRowClick={row => {
                setSelectedCountry(row as Country);
                setSelectedDistrict(null);
                setSelectedCommunity(null);
                setSelectedArea(null);
              }}
              rowClassName={row =>
                selectedCountry && row.id === selectedCountry.id ? 'selected-row' : ''
              }
            />
          </>
        }
      />

      {selectedCountry && (
        <SectionContainer
          title={<Translate>Districts</Translate>}
          minHeight={600}
          content={
            <>
              {showDistrictForm && (
                <div className="geo-inline-form">
                  <Form fluid layout="inline">
                    <MyInput
                      fieldName="name"
                      fieldType="text"
                      column
                      fieldLabel="District Name"
                      record={districtForEdit}
                      setRecord={setDistrictForEdit}
                      placeholder="Enter district name"
                      width={200}
                    />
                    <MyInput
                      fieldName="code"
                      fieldType="text"
                      column
                      fieldLabel="Code"
                      record={districtForEdit}
                      setRecord={setDistrictForEdit}
                      placeholder="Code"
                      width={120}
                    />
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--deep-blue)"
                        width="80px"
                        onClick={() => handleSaveDistrict(districtForEdit)}
                      >
                        Save
                      </MyButton>
                    </div>
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--primary-gray)"
                        width="80px"
                        onClick={() => {
                          setShowDistrictForm(false);
                          setDistrictForEdit({ ...newCountryDistrict });
                        }}
                      >
                        Cancel
                      </MyButton>
                    </div>
                  </Form>
                </div>
              )}
              {districtFiltersUI()}
              <MyTable
                data={districtTableData}
                columns={districtColumns}
                totalCount={districtTotalCount}
                page={
                  isDistrictFiltered
                    ? districtFilterPagination.page
                    : districtPaginationParams.page
                }
                rowsPerPage={
                  isDistrictFiltered
                    ? districtFilterPagination.size
                    : districtPaginationParams.size
                }
                onPageChange={handleDistrictPageChange}
                onRowsPerPageChange={handleDistrictRowsPerPageChange}
                loading={districtsFetching}
                filters={null}
                onRowClick={row => {
                  setSelectedDistrict(row as CountryDistrict);
                  setSelectedCommunity(null);
                  setSelectedArea(null);
                }}
                rowClassName={row =>
                  selectedDistrict && row.id === selectedDistrict.id ? 'selected-row' : ''
                }
              />
            </>
          }
          action={
            <MyButton
              color="var(--deep-blue)"
              width="90px"
              prefixIcon={() => <AddOutlineIcon />}
              disabled={!selectedCountry}
              onClick={() => {
                if (!selectedCountry) return;
                setDistrictForEdit({
                  ...newCountryDistrict,
                  countryId: selectedCountry.id!,
                  isActive: true
                });
                setShowDistrictForm(true);
              }}
            >
              Add
            </MyButton>
          }
        />
      )}

      {selectedDistrict && (
        <SectionContainer
          title={<Translate>Communities</Translate>}
          minHeight={600}
          content={
            <>
              {showCommunityForm && (
                <div className="geo-inline-form">
                  <Form fluid layout="inline">
                    <MyInput
                      fieldName="name"
                      fieldType="text"
                      column
                      fieldLabel="Community Name"
                      record={communityForEdit}
                      setRecord={setCommunityForEdit}
                      placeholder="Enter community name"
                      width={220}
                    />
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--deep-blue)"
                        width="80px"
                        onClick={() => handleSaveCommunity(communityForEdit)}
                      >
                        Save
                      </MyButton>
                    </div>
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--primary-gray)"
                        width="80px"
                        onClick={() => {
                          setShowCommunityForm(false);
                          setCommunityForEdit({
                            id: undefined,
                            districtId,
                            name: '',
                            isActive: true
                          });
                        }}
                      >
                        Cancel
                      </MyButton>
                    </div>
                  </Form>
                </div>
              )}
              {communityFiltersUI()}
              <MyTable
                data={communityTableData}
                columns={communityColumns}
                totalCount={communityTotalCount}
                page={
                  isCommunityFiltered
                    ? communityFilterPagination.page
                    : communityPaginationParams.page
                }
                rowsPerPage={
                  isCommunityFiltered
                    ? communityFilterPagination.size
                    : communityPaginationParams.size
                }
                onPageChange={handleCommunityPageChange}
                onRowsPerPageChange={handleCommunityRowsPerPageChange}
                loading={communitiesFetching}
                filters={null}
                onRowClick={row => {
                  setSelectedCommunity(row as DistrictCommunity);
                  setSelectedArea(null);
                }}
                rowClassName={row =>
                  selectedCommunity && row.id === selectedCommunity.id ? 'selected-row' : ''
                }
              />
            </>
          }
          action={
            <MyButton
              color="var(--deep-blue)"
              width="90px"
              prefixIcon={() => <AddOutlineIcon />}
              disabled={!selectedDistrict}
              onClick={() => {
                if (!selectedDistrict) return;
                setCommunityForEdit({
                  id: undefined,
                  districtId: selectedDistrict.id!,
                  name: '',
                  isActive: true
                });
                setShowCommunityForm(true);
              }}
            >
              Add
            </MyButton>
          }
        />
      )}

      {selectedCommunity && (
        <SectionContainer
          title={<Translate>Areas</Translate>}
          minHeight={600}
          content={
            <>
              {showAreaForm && (
                <div className="geo-inline-form">
                  <Form fluid layout="inline">
                    <MyInput
                      fieldName="name"
                      fieldType="text"
                      column
                      fieldLabel="Area Name"
                      record={areaForEdit}
                      setRecord={setAreaForEdit}
                      placeholder="Enter area name"
                      width={220}
                    />
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--deep-blue)"
                        width="80px"
                        onClick={() => handleSaveArea(areaForEdit)}
                      >
                        Save
                      </MyButton>
                    </div>
                    <div style={{ marginTop: '36px' }}>
                      <MyButton
                        color="var(--primary-gray)"
                        width="80px"
                        onClick={() => {
                          setShowAreaForm(false);
                          setAreaForEdit({ ...newCommunityArea, communityId });
                        }}
                      >
                        Cancel
                      </MyButton>
                    </div>
                  </Form>
                </div>
              )}
              {areaFiltersUI()}
              <MyTable
                data={areaTableData}
                columns={areaColumns}
                totalCount={areaTotalCount}
                page={
                  isAreaFiltered ? areaFilterPagination.page : areaPaginationParams.page
                }
                rowsPerPage={
                  isAreaFiltered ? areaFilterPagination.size : areaPaginationParams.size
                }
                onPageChange={handleAreaPageChange}
                onRowsPerPageChange={handleAreaRowsPerPageChange}
                loading={areasFetching}
                filters={null}
                onRowClick={row => setSelectedArea(row as CommunityArea)}
                rowClassName={row =>
                  selectedArea && row.id === selectedArea.id ? 'selected-row' : ''
                }
              />
            </>
          }
          action={
            <MyButton
              color="var(--deep-blue)"
              width="90px"
              prefixIcon={() => <AddOutlineIcon />}
              disabled={!selectedCommunity}
              onClick={() => {
                if (!selectedCommunity) return;
                setAreaForEdit({
                  ...newCommunityArea,
                  communityId: selectedCommunity.id!,
                  isActive: true
                });
                setShowAreaForm(true);
              }}
            >
              Add
            </MyButton>
          }
        />
      )}
    </div>

    <DeletionConfirmationModal
      open={openDeleteConfirm}
      setOpen={setOpenDeleteConfirm}
      itemToDelete={
        deleteType === 'country'
          ? 'Country'
          : deleteType === 'district'
          ? 'District'
          : deleteType === 'community'
          ? 'Community'
          : 'Area'
      }
      actionButtonFunction={handleConfirmToggle}
      actionType={deleteMode}
    />
  </Panel>
);

};

export default CountrySetup;
