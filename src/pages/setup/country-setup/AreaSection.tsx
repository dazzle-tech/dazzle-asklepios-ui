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

import { newCommunityArea } from '@/types/model-types-constructor-new';
import { CommunityArea } from '@/types/model-types-new';

import {
  useAddAreaMutation,
  useGetAreasByDistrictQuery,
  useLazyGetAreasByDistrictQuery,
  useToggleAreaActiveMutation,
  useUpdateAreaMutation
} from '@/services/setup/country/communityAreaService';

type Props = {
  communityId: number;
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

const AREA_ERROR_MAP: Record<string, string> = {
  'community.required': 'Community is required.',
  'payload.required': 'Area payload is required.',
  'id.required': 'Area id is required.',
  'unique.communityArea.name': 'Area name already exists for this community.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Area not found.'
};

const AreaSection: React.FC<Props> = ({ communityId }) => {
  const dispatch = useAppDispatch();

  const [selectedArea, setSelectedArea] = useState<CommunityArea | null>(null);
  const [areaForEdit, setAreaForEdit] = useState<CommunityArea>({
    ...newCommunityArea,
    communityId: Number(communityId)
  });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [selectedForToggle, setSelectedForToggle] = useState<CommunityArea | null>(null);

  // Filter state
  const [recordOfAreaFilter, setRecordOfAreaFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isAreaFiltered, setIsAreaFiltered] = useState(false);
  const [filteredAreas, setFilteredAreas] = useState<CommunityArea[]>([]);
  const [filteredAreaTotal, setFilteredAreaTotal] = useState<number>(0);

  // Unfiltered pagination
  const [areaPaginationParams, setAreaPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Filtered pagination
  const [areaFilterPagination, setAreaFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const areaFilterFields = [{ label: 'Area Name', value: 'name' }];

  // Main data query
  const {
    data: areasResp,
    isFetching: areasFetching,
    refetch: refetchAreas
  } = useGetAreasByDistrictQuery(
    {
      districtId: Number(communityId),
      page: areaPaginationParams.page,
      size: areaPaginationParams.size,
      sort: areaPaginationParams.sort
    },
    { skip: Number(communityId) === 0 }
  );

  // Lazy query for filtering - with result tracking
  const [fetchAreasByDistrict, filterQueryResult] = useLazyGetAreasByDistrictQuery();

  const [addArea] = useAddAreaMutation();
  const [updateArea] = useUpdateAreaMutation();
  const [toggleAreaActive] = useToggleAreaActiveMutation();

  // Derived values
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

  // Centralized reset to unfiltered
  const resetAreaToUnfiltered = () => {
    setIsAreaFiltered(false);
    setFilteredAreas([]);
    setFilteredAreaTotal(0);

    setAreaFilterPagination(prev => ({ ...prev, page: 0, sort: 'id,desc' }));
    setAreaPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));

    refetchAreas();
  };

  // Unified refetch respecting current mode
  const refetchList = async () => {
    if (isAreaFiltered) {
      await handleAreaFilterChange(
        recordOfAreaFilter.filter,
        recordOfAreaFilter.value,
        areaFilterPagination.page,
        areaFilterPagination.size,
        areaFilterPagination.sort
      );
    } else {
      setAreaPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetchAreas();
    }
  };

  // Run filter query with cache-busting timestamp
  const runAreaFilterQuery = async (fieldName: string, value: any, sort?: string) => {
    if (!value) return undefined;

    const effectiveSort = sort ?? 'id,desc';
    const totalFromServer = areasResp?.totalCount ?? 1000;
    const bigSize = totalFromServer || 1000;

    // NOTE: append dummy ts to break RTK Query cache
    const resp = await fetchAreasByDistrict({
      districtId: Number(communityId),
      page: 0,
      size: bigSize,
      sort: effectiveSort,
      ts: Date.now() // Cache buster
    } as any).unwrap();

    const all = resp?.data ?? [];
    const term = String(value).toLowerCase();

    let filtered: CommunityArea[] = all;
    if (fieldName === 'name')
      filtered = all.filter(a => (a.name ?? '').toString().toLowerCase().includes(term));

    return { data: filtered, totalCount: filtered.length };
  };

  // Apply/clear filter
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
      dispatch(notify({ msg: 'Failed to filter areas', sev: 'error' }));
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
      setAreaPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

  // Auto revert when value cleared
  useEffect(() => {
    if (!recordOfAreaFilter.value && recordOfAreaFilter.value !== 0 && isAreaFiltered) {
      resetAreaToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfAreaFilter.value]);

  useEffect(() => {
    setSelectedArea(null);
    setAreaForEdit({ ...newCommunityArea, communityId: Number(communityId) });
    resetAreaToUnfiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const handleSaveArea = async (payload: CommunityArea) => {
    if (!communityId) return;

    if (!payload.name?.trim()) {
      dispatch(notify({ msg: 'Area name is required', sev: 'error' }));
      return;
    }

    try {
      const body: CommunityArea = {
        ...payload,
        communityId: Number(communityId),
        isActive: payload.isActive ?? true
      };

      if (body.id) {
        await updateArea({ districtId: Number(communityId), id: body.id, body }).unwrap();
        dispatch(notify({ msg: 'Area updated successfully', sev: 'success' }));
      } else {
        await addArea({ districtId: Number(communityId), ...body }).unwrap();
        dispatch(notify({ msg: 'Area added successfully', sev: 'success' }));
      }

      setAreaForEdit({ ...newCommunityArea, communityId: Number(communityId) });
      await refetchList();
    } catch (err: any) {
      handleCrudError(err, dispatch, AREA_ERROR_MAP);
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedForToggle?.id) return;
    try {
      await toggleAreaActive({ id: selectedForToggle.id }).unwrap();

      // Refresh matching Country/District pattern
      if (isAreaFiltered) {
        await handleAreaFilterChange(
          recordOfAreaFilter.filter,
          recordOfAreaFilter.value,
          areaFilterPagination.page,
          areaFilterPagination.size,
          areaFilterPagination.sort
        );
      } else {
        await refetchAreas();
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

  const areaFiltersUI = () => {
    const selectedFilter = recordOfAreaFilter.filter;

    const dynamicInput = (
      <MyInput
        fieldType="text"
        fieldName="value"
        column
        showLabel={false}
        placeholder={selectedFilter === 'name' ? 'Enter Area Name' : 'Enter Value'}
        record={recordOfAreaFilter}
        setRecord={setRecordOfAreaFilter}
        width={170}
      />
    );

    return (
      <Form layout="inline" fluid className="flex-dis-row">
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
        <div className="margin-top-25">
          <MyButton
            color="var(--deep-blue)"
            width="80px"
            onClick={() => {
              if (!recordOfAreaFilter.value && recordOfAreaFilter.value !== 0) {
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
            onClick={() => setAreaForEdit(row)}
          />
          {row.isActive ? (
            <MdDelete
              className="icons-style"
              fill="var(--primary-pink)"
              size={20}
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
        title={<Translate>Areas</Translate>}
        content={
          <>
            <div className="inputs-dis-flex">
              <div className="geo-inline-form">
                <Form fluid layout="inline" className="form-of-filters-set-up">
                  <MyInput
                    fieldName="name"
                    fieldType="text"
                    column
                    fieldLabel="Area Name"
                    record={areaForEdit}
                    setRecord={setAreaForEdit}
                    width={220}
                  />
                  <div className="margin-top-37">
                    <MyButton
                      color="var(--deep-blue)"
                      width="80px"
                      onClick={() => handleSaveArea(areaForEdit)}
                    >
                      Save
                    </MyButton>
                  </div>
                  <div className="margin-top-37">
                    <MyButton
                      color="var(--primary-gray)"
                      width="80px"
                      onClick={() =>
                        setAreaForEdit({ ...newCommunityArea, communityId: Number(communityId) })
                      }
                    >
                      Clear
                    </MyButton>
                  </div>
                </Form>
              </div>

              {areaFiltersUI()}
            </div>

            <MyTable
              data={areaTableData}
              columns={areaColumns}
              totalCount={areaTotalCount}
              page={isAreaFiltered ? areaFilterPagination.page : areaPaginationParams.page}
              rowsPerPage={isAreaFiltered ? areaFilterPagination.size : areaPaginationParams.size}
              onPageChange={handleAreaPageChange}
              onRowsPerPageChange={handleAreaRowsPerPageChange}
              loading={areasFetching || filterQueryResult?.isFetching}
              filters={null}
              onRowClick={row => setSelectedArea(row as CommunityArea)}
              rowClassName={row =>
                selectedArea && row.id === selectedArea.id ? 'selected-row' : ''
              }
            />
          </>
        }
      />

      <DeletionConfirmationModal
        open={openDeleteConfirm}
        setOpen={setOpenDeleteConfirm}
        itemToDelete="Area"
        actionButtonFunction={handleConfirmToggle}
        actionType={deleteMode}
      />
    </>
  );
};

export default AreaSection;
