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

import { newCountryDistrict } from '@/types/model-types-constructor-new';
import { CountryDistrict } from '@/types/model-types-new';

import {
  useAddDistrictMutation,
  useGetDistrictsByCountryQuery,
  useLazyGetDistrictsByCountryQuery,
  useToggleDistrictActiveMutation,
  useUpdateDistrictMutation
} from '@/services/setup/country/countryDistrictService';

type Props = {
  countryId: number;
  onSelect: (d: CountryDistrict | null) => void;
  selectedDistrict: CountryDistrict | null;
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

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

const DISTRICT_ERROR_MAP: Record<string, string> = {
  'country.required': 'Country is required.',
  'payload.required': 'District payload is required.',
  'id.required': 'District id is required.',
  'unique.countryDistrict.namecode': 'District name or code already exists for this country.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'District not found.'
};

const DistrictSection: React.FC<Props> = ({ countryId, onSelect, selectedDistrict }) => {
  const dispatch = useAppDispatch();

  const [districtForEdit, setDistrictForEdit] = useState<CountryDistrict>({
    ...newCountryDistrict
  });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [selectedForToggle, setSelectedForToggle] = useState<CountryDistrict | null>(null);

  // Filter state
  const [recordOfDistrictFilter, setRecordOfDistrictFilter] = useState<{
    filter: string;
    value: any;
  }>({
    filter: '',
    value: ''
  });
  const [isDistrictFiltered, setIsDistrictFiltered] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState<CountryDistrict[]>([]);
  const [filteredDistrictTotal, setFilteredDistrictTotal] = useState<number>(0);

  // Unfiltered pagination
  const [districtPaginationParams, setDistrictPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Filtered pagination
  const [districtFilterPagination, setDistrictFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const districtFilterFields = [
    { label: 'District Name', value: 'name' },
    { label: 'Code', value: 'code' }
  ];

  // Main data query
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

  // Lazy query for filtering - with result tracking
  const [fetchDistrictsByCountry, filterQueryResult] = useLazyGetDistrictsByCountryQuery();

  const [addDistrict] = useAddDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [toggleDistrictActive] = useToggleDistrictActiveMutation();

  // Derived values
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

  // Centralized reset to unfiltered
  const resetDistrictToUnfiltered = () => {
    setIsDistrictFiltered(false);
    setFilteredDistricts([]);
    setFilteredDistrictTotal(0);

    setDistrictFilterPagination(prev => ({ ...prev, page: 0, sort: 'id,desc' }));
    setDistrictPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetchDistricts();
  };

  // Unified refetch respecting current mode
  const refetchList = async () => {
    if (isDistrictFiltered) {
      await handleDistrictFilterChange(
        recordOfDistrictFilter.filter,
        recordOfDistrictFilter.value,
        districtFilterPagination.page,
        districtFilterPagination.size,
        districtFilterPagination.sort
      );
    } else {
      setDistrictPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetchDistricts();
    }
  };

  // Run filter query with cache-busting timestamp
  const runDistrictFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';
    const totalFromServer = districtsResp?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    // NOTE: append dummy ts to break RTK Query cache
    const resp = await fetchDistrictsByCountry({
      countryId: Number(countryId),
      page: 0,
      size: bigSize,
      sort: effectiveSort,
      ts: Date.now() // Cache buster
    } as any).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CountryDistrict[] = all;

    if (fieldName === 'name')
      filtered = all.filter(d => (d.name ?? '').toString().toLowerCase().includes(term));
    else if (fieldName === 'code')
      filtered = all.filter(d => (d.code ?? '').toString().toLowerCase().includes(term));

    return { data: filtered, totalCount: filtered.length };
  };

  // Apply/clear filter
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
      dispatch(notify({ msg: 'Failed to filter districts', sev: 'error' }));
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

  // Auto revert when value cleared
  useEffect(() => {
    if (!recordOfDistrictFilter.value && recordOfDistrictFilter.value !== 0 && isDistrictFiltered) {
      resetDistrictToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfDistrictFilter.value]);

  const handleSaveDistrict = async (payload: CountryDistrict) => {
    if (!countryId) return;

    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'District name is required', sev: 'error' }));
      return;
    }

    try {
      const body: CountryDistrict = { ...payload, countryId, isActive: payload.isActive ?? true };

      if (body.id) {
        await updateDistrict({ countryId, id: body.id, ...body }).unwrap();
        dispatch(notify({ msg: 'District updated successfully', sev: 'success' }));
      } else {
        await addDistrict({ countryId, ...body }).unwrap();
        dispatch(notify({ msg: 'District added successfully', sev: 'success' }));
      }

      setDistrictForEdit({ ...newCountryDistrict });
      await refetchList();
    } catch (err: any) {
      handleCrudError(err, dispatch, DISTRICT_ERROR_MAP);
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedForToggle?.id) return;
    try {
      await toggleDistrictActive({ id: selectedForToggle.id }).unwrap();

      // Refresh matching Country pattern
      if (isDistrictFiltered) {
        await handleDistrictFilterChange(
          recordOfDistrictFilter.filter,
          recordOfDistrictFilter.value,
          districtFilterPagination.page,
          districtFilterPagination.size,
          districtFilterPagination.sort
        );
      } else {
        await refetchDistricts();
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

  const districtFiltersUI = () => {
    const selectedFilter = recordOfDistrictFilter.filter;

    const dynamicInput = (
      <MyInput
        fieldName="value"
        fieldType="text"
        column
        record={recordOfDistrictFilter}
        setRecord={setRecordOfDistrictFilter}
        placeholder={selectedFilter === 'code' ? 'Enter District Code' : 'Enter District Name'}
        width={170}
        showLabel={false}
      />
    );

    return (
      <Form fluid className="form-of-filters-country-set-up">
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

          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfDistrictFilter.value && recordOfDistrictFilter.value !== 0) {
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
      </Form>
    );
  };

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
            onClick={() => setDistrictForEdit(row)}
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
              fill="var(--primary-gray)"
              size={24}
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

  return (
    <>
      <SectionContainer
        title={<Translate>Districts</Translate>}
        content={
          <>
          <Form fluid>
            <div className="country-set-up-headers-setup-container">
                <div className='form-of-filters-set-up'>
                  <MyInput
                    fieldName="name"
                    fieldType="text"
                    fieldLabel="District Name"
                    record={districtForEdit}
                    setRecord={setDistrictForEdit}
                    width={200}
                    required
                  />
                  <MyInput
                    fieldName="code"
                    fieldType="text"
                    fieldLabel="Code"
                    record={districtForEdit}
                    setRecord={setDistrictForEdit}
                    width={120}
                    required
                  />
                  <div className="form-of-filters-country-set-up">
                    <MyButton
                      color="var(--deep-blue)"
                      width="80px"
                      onClick={() => handleSaveDistrict(districtForEdit)}
                    >
                      Save
                    </MyButton>
                    <MyButton
                      color="var(--primary-gray)"
                      width="80px"
                      onClick={() => setDistrictForEdit({ ...newCountryDistrict })}
                    >
                      Clear
                    </MyButton>
                  </div>
                </div>
              <div>
                  {districtFiltersUI()}
                </div>
            </div>
          </Form>

            <MyTable
              data={districtTableData}
              columns={districtColumns}
              totalCount={districtTotalCount}
              page={
                isDistrictFiltered ? districtFilterPagination.page : districtPaginationParams.page
              }
              rowsPerPage={
                isDistrictFiltered ? districtFilterPagination.size : districtPaginationParams.size
              }
              onPageChange={handleDistrictPageChange}
              onRowsPerPageChange={handleDistrictRowsPerPageChange}
              loading={districtsFetching || filterQueryResult?.isFetching}
              filters={null}
              onRowClick={row => onSelect(row as CountryDistrict)}
              rowClassName={row =>
                selectedDistrict && row.id === selectedDistrict.id ? 'selected-row' : ''
              }
            />
          </>
        }
      />

      <DeletionConfirmationModal
        open={openDeleteConfirm}
        setOpen={setOpenDeleteConfirm}
        itemToDelete="District"
        actionButtonFunction={handleConfirmToggle}
        actionType={deleteMode}
      />
    </>
  );
};

export default DistrictSection;
