import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { extractPaginationFromLink } from '@/utils/paginationHelper';

import { newCountry } from '@/types/model-types-constructor-new';
import { Country } from '@/types/model-types-new';

import {
  useAddCountryMutation,
  useGetCountriesQuery,
  useLazyGetCountryByCodeQuery,
  useLazyGetCountryByNameQuery,
  useToggleCountryActiveMutation,
  useUpdateCountryMutation
} from '@/services/setup/country/countryService';

import { useEnumOptions } from '@/services/enumsApi';

type Props = {
  onSelect: (c: Country | null) => void;
  selectedCountry: Country | null;
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      if (m.includes('must be greater')) return 'value is too small';
      if (m.includes('must be less')) return 'value is too large';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

const COUNTRY_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Country payload is required.',
  'id.required': 'Country id is required.',
  'unique.country.namecode': 'Country name or code already exists.',
  'db.constraint': 'Database constraint violation.',
  'db.duplicate.primarykey':
    'A system configuration issue was detected. Please contact support.',
  notfound: 'Country not found.'
};
const CountrySection: React.FC<Props> = ({ onSelect, selectedCountry }) => {
  const dispatch = useAppDispatch();

  const enumOptions = useEnumOptions('CountryName');
  const enumLabelMap = useMemo(
    () => Object.fromEntries(enumOptions.map(o => [o.value, o.label])),
    [enumOptions]
  );
  const [countryForEdit, setCountryForEdit] = useState<Country>({ ...newCountry });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [selectedForToggle, setSelectedForToggle] = useState<Country | null>(null);

  // Filter state
  const [recordOfCountryFilter, setRecordOfCountryFilter] = useState<{
    filter: string;
    value: any;
  }>({
    filter: '',
    value: ''
  });
  const [isCountryFiltered, setIsCountryFiltered] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [filteredCountriesTotal, setFilteredCountriesTotal] = useState<number>(0);
  const [filteredCountriesLinks, setFilteredCountriesLinks] = useState<any | undefined>(undefined);

  // Unfiltered pagination
  const [countryPaginationParams, setCountryPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Filtered pagination
  const [countryFilterPagination, setCountryFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const countryFilterFields = [
    { label: 'Country Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  // Main data query
  const {
    data: countriesResp,
    isFetching: countriesFetching,
    refetch: refetchCountries
  } = useGetCountriesQuery({
    page: countryPaginationParams.page,
    size: countryPaginationParams.size,
    sort: countryPaginationParams.sort
  });

  // Lazy queries for filtering
  const [fetchCountryByName, byNameResult] = useLazyGetCountryByNameQuery();
  const [fetchCountryByCode, byCodeResult] = useLazyGetCountryByCodeQuery();

  const [addCountry] = useAddCountryMutation();
  const [updateCountry] = useUpdateCountryMutation();
  const [toggleCountryActive] = useToggleCountryActiveMutation();

  // Derived values
  const countryTotalCount = useMemo(
    () => (isCountryFiltered ? filteredCountriesTotal : countriesResp?.totalCount ?? 0),
    [isCountryFiltered, filteredCountriesTotal, countriesResp?.totalCount]
  );

  const countryLinks = (isCountryFiltered ? filteredCountriesLinks : countriesResp?.links) || {};

  const countryTableData = useMemo(
    () => (isCountryFiltered ? filteredCountries : countriesResp?.data ?? []),
    [isCountryFiltered, filteredCountries, countriesResp?.data]
  );

  // Centralized reset to unfiltered
  const resetCountryToUnfiltered = () => {
    setIsCountryFiltered(false);
    setFilteredCountries([]);
    setFilteredCountriesTotal(0);
    setFilteredCountriesLinks(undefined);
    setCountryFilterPagination(prev => ({ ...prev, page: 0 }));
    setCountryPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));
    refetchCountries();
  };

  // Unified refetch respecting current mode
  const refetchList = async () => {
    if (isCountryFiltered) {
      await handleCountryFilterChange(
        recordOfCountryFilter.filter,
        recordOfCountryFilter.value,
        countryFilterPagination.page,
        countryFilterPagination.size,
        countryFilterPagination.sort
      );
    } else {
      setCountryPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetchCountries();
    }
  };

  // Run filter query
  const runCountryFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = countryFilterPagination.size,
    sort = countryFilterPagination.sort
  ) => {
    if (!value && value !== 0) return undefined;

    // NOTE: append dummy ts to break RTK Query cache
    const common = { page, size, sort, ts: Date.now() } as const;

    if (fieldName === 'name') {
      return await fetchCountryByName({ name: value, ...common } as any).unwrap();
    } else if (fieldName === 'code') {
      return await fetchCountryByCode({ code: value, ...common } as any).unwrap();
    }
    return undefined;
  };

  // Apply/clear filter
  const handleCountryFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = countryFilterPagination.size,
    sort = countryFilterPagination.sort
  ) => {
    if (!value && value !== 0) {
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
      dispatch(notify({ msg: 'Failed to filter countries', sev: 'warning' }));
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
      setCountryPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
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

  // Auto revert when value cleared
  useEffect(() => {
    if (!recordOfCountryFilter.value && recordOfCountryFilter.value !== 0 && isCountryFiltered) {
      resetCountryToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfCountryFilter.value]);

  const handleSaveCountry = async (payload: Country) => {
    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Country name is required', sev: 'warning' }));
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

      setCountryForEdit({ ...newCountry });
      await refetchList();
    } catch (err: any) {
      handleCrudError(err, dispatch, COUNTRY_ERROR_MAP);
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedForToggle?.id) return;
    try {
      await toggleCountryActive({ id: selectedForToggle.id }).unwrap();

      // Refresh بنفس طريقة Vaccine
      if (isCountryFiltered) {
        await handleCountryFilterChange(
          recordOfCountryFilter.filter,
          recordOfCountryFilter.value,
          countryFilterPagination.page,
          countryFilterPagination.size,
          countryFilterPagination.sort
        );
      } else {
        await refetchCountries();
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
          sev: 'warning'
        })
      );
    } finally {
      setOpenDeleteConfirm(false);
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
          selectData={enumOptions}
          selectDataLabel="label"
          selectDataValue="value"
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
      <Form layout="inline" fluid className="flex-dis-row">
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          column
          selectData={countryFilterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfCountryFilter}
          setRecord={(updated: any) =>
            setRecordOfCountryFilter({ filter: updated.filter, value: '' })
          }
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width={170}
        />
        {dynamicInput}
        <div className="margin-top-25">
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

  const countryColumns = [
    {
      key: 'name',
      title: <Translate>Country Name</Translate>,
      flexGrow: 3,
      render: (row: Country) => enumLabelMap[row.name] || enumLabelMap[row.code] || row.name
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
            onClick={() => setCountryForEdit(row)}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              fill="var(--primary-pink)"
              size={24}
              onClick={() => {
                setSelectedForToggle(row);
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
                setSelectedForToggle(row);
                setDeleteMode('reactivate');
                setOpenDeleteConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];
const filters = (<div className="inputs-dis-flex">
                  <div className="geo-inline-form">
                    <Form fluid layout="inline" className="flex-dis-row">
                      <MyInput
                        fieldName="name"
                        fieldType="select"
                        column
                        fieldLabel="Country Name"
                        record={countryForEdit}
                        setRecord={setCountryForEdit}
                        selectData={enumOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        width={220}
                        required
                      />
                      <MyInput
                        fieldName="code"
                        fieldType="text"
                        fieldLabel="Code"
                        column
                        record={countryForEdit}
                        setRecord={setCountryForEdit}
                        width={120}
                        required
                      />
                      <div className="margin-top-37">
                        <MyButton
                          color="var(--deep-blue)"
                          width="80px"
                          onClick={() => handleSaveCountry(countryForEdit)}
                        >
                          Save
                        </MyButton>
                      </div>
                      <div className="margin-top-37">
                        <MyButton
                          color="var(--primary-gray)"
                          width="80px"
                          onClick={() => setCountryForEdit({ ...newCountry })}
                        >
                          Clear
                        </MyButton>
                      </div>
                    </Form>
                  </div>

                  {countryFiltersUI()}
                 </div>);

  return (
    <>
      <SectionContainer
        title={<Translate>Country</Translate>}
        content={
          <>
            <MyTable
              data={countryTableData}
              columns={countryColumns}
              totalCount={countryTotalCount}
              page={isCountryFiltered ? countryFilterPagination.page : countryPaginationParams.page}
              rowsPerPage={
                isCountryFiltered ? countryFilterPagination.size : countryPaginationParams.size
              }
              onPageChange={handleCountryPageChange}
              filters={filters}
              onRowsPerPageChange={handleCountryRowsPerPageChange}
              loading={countriesFetching || byNameResult?.isFetching || byCodeResult?.isFetching}
              onRowClick={row => onSelect(row as Country)}
              rowClassName={row =>
                selectedCountry && row.id === selectedCountry.id ? 'selected-row' : ''
              }
            />
          </>
        }
      />

      <DeletionConfirmationModal
        open={openDeleteConfirm}
        setOpen={setOpenDeleteConfirm}
        itemToDelete="Country"
        actionButtonFunction={handleConfirmToggle}
        actionType={deleteMode}
      />
    </>
  );
};

export default CountrySection;
