import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAgeGroup from './AddEditAgeGroup';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetAgeGroupsQuery,
  useAddAgeGroupMutation,
  useUpdateAgeGroupMutation,
  useDeleteAgeGroupMutation,
  useLazyGetAgeGroupsByLabelQuery,
  useLazyGetAgeGroupsByFromAgeQuery,
  useLazyGetAgeGroupsByToAgeQuery,
  useLazyGetAgeGroupsByFacilityQuery,
} from '@/services/setup/ageGroupService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString, conjureValueBasedOnIDFromList } from '@/utils';
import { AgeGroup } from '@/types/model-types-new';
import { newAgeGroup } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

const AgeGroupSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Core state
  const [ageGroup, setAgeGroup] = useState<AgeGroup>({ ...newAgeGroup });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Filter state
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Mutations
  const [addAgeGroup] = useAddAgeGroupMutation();
  const [updateAgeGroup] = useUpdateAgeGroupMutation();
  const [deleteAgeGroup] = useDeleteAgeGroupMutation();

  // Lazy queries used for filters
  const [fetchByLabel] = useLazyGetAgeGroupsByLabelQuery();
  const [fetchByFromAge] = useLazyGetAgeGroupsByFromAgeQuery();
  const [fetchByToAge] = useLazyGetAgeGroupsByToAgeQuery();
  const [fetchByFacility] = useLazyGetAgeGroupsByFacilityQuery();

  // Unfiltered pagination (main API)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // Filtered pagination
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
  });

  // Enums and facilities
  const ageGroupOptions = useEnumOptions('AgeGroupType');
  const { data: pageData, isFetching, refetch } = useGetAgeGroupsQuery(
    { page: paginationParams.page, size: paginationParams.size, sort: paginationParams.sort }
  );
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  // Derived table values
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : pageData?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );

  // Available filters
  const filterFields = [
    { label: 'Facility', value: 'facilityId' },
    { label: 'Age Group', value: 'ageGroup' },
    { label: 'From Age', value: 'fromAge' },
    { label: 'To Age', value: 'toAge' },
  ];

  // Open "Add new"
  const handleNew = () => {
    setAgeGroup({ ...newAgeGroup });
    setPopupOpen(true);
  };

  // Helper to coerce numbers
  const numberOrUndefined = (v: any) =>
    v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v);

  /**
   * Centralized: reset to the unfiltered main API list & original pagination logic.
   * This restores Link-header pagination and the default sort 'id,asc'.
   */
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0, size: prev.size, sort: 'id,desc' })); // keep default for next time
    setPaginationParams(prev => ({ ...prev, page: 0, size: prev.size, sort: 'id,asc', timestamp: Date.now() }));
    refetch(); // trigger main API refresh now
  };

  /**
   * Save (add or update) and refresh list correctly for current view (filtered/unfiltered).
   */
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!ageGroup.id;

    const effectiveFacilityId = ageGroup.facilityId;

    if (!effectiveFacilityId) {
      dispatch(notify({ msg: 'Please select a facility.', sev: 'error' }));
      return;
    }

    const payload: any = {
      ...ageGroup,
      facilityId: effectiveFacilityId,
      fromAge: numberOrUndefined(ageGroup.fromAge),
      toAge: numberOrUndefined(ageGroup.toAge),
    };

    try {
      let saved;
      if (isUpdate) {
        saved = await updateAgeGroup({
          id: ageGroup.id!,
          facilityId: effectiveFacilityId,
          ...payload,
        }).unwrap();

        dispatch(notify({ msg: 'Age Group updated successfully', sev: 'success' }));
      } else {
        saved = await addAgeGroup({
          facilityId: effectiveFacilityId,
          ...payload,
        }).unwrap();

        dispatch(notify({ msg: 'Age Group added successfully', sev: 'success' }));
      }
      if (isFiltered) {
        const nextSort =
          !filterPagination.sort || filterPagination.sort.toLowerCase().startsWith('id,asc')
            ? 'id,desc'
            : filterPagination.sort;

        setFilterPagination(prev => ({ ...prev, page: 0, sort: nextSort }));
        await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size, nextSort);
      } else {
        setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
        refetch();
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          ageGroup: 'Age Group',
          fromAge: 'From Age',
          toAge: 'To Age',
          fromAgeUnit: 'From Age Unit',
          toAgeUnit: 'To Age Unit',
          isActive: 'Active',
          facilityId: 'Facility',
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater')) return 'value is too small';
          if (m.includes('must be less')) return 'value is too large';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        dispatch(notify({ msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix, sev: 'error' }));
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;

      const keyMap: Record<string, string> = {
        facilityrequired: 'Facility id is required.',
        'payload.required': 'Age Group payload is required.',
        'unique.facility.ageGroup': 'Age Group label or age range already exists in this facility.',
        'facility.mismatch': 'Age Group does not belong to the selected facility.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Age Group not found.',
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };


  /**
   * Run the correct filter query with explicit sort to avoid mixing with unfiltered sort.
   */
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = paginationParams.size,
    sort?: string
  ) => {
    if (!value && value !== 0) return undefined;

    const effectiveSort = sort ?? (isFiltered ? filterPagination.sort : paginationParams.sort);

    if (fieldName === 'facilityId') {
      return await fetchByFacility({ facilityId: Number(value), page, size, sort: effectiveSort }).unwrap();
    } else if (fieldName === 'ageGroup') {
      return await fetchByLabel({ label: String(value), page, size, sort: effectiveSort }).unwrap();
    } else if (fieldName === 'fromAge') {
      return await fetchByFromAge({ fromAge: String(value), page, size, sort: effectiveSort }).unwrap();
    } else if (fieldName === 'toAge') {
      return await fetchByToAge({ toAge: String(value), page, size, sort: effectiveSort }).unwrap();
    }
    return undefined;
  };

  /**
   * Apply or clear a filter. If cleared, we explicitly revert to main API logic.
   */
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) {
      // Clear filter and revert to unfiltered main API + Link header logic
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      // If something goes wrong, fallback to unfiltered logic as well
      resetToUnfiltered();
    }
  };

  /**
   * Delete a row and refresh correctly in both modes.
   */
  const handleDelete = async () => {
    setOpenConfirm(false);
    if (!ageGroup?.id) return;
    try {
      await deleteAgeGroup({ id: ageGroup.id }).unwrap();
      dispatch(notify({ msg: 'Age Group deleted successfully', sev: 'success' }));
      if (isFiltered) {
        await handleFilterChange(
          recordOfFilter.filter,
          recordOfFilter.value,
          filterPagination.page,
          filterPagination.size,
          filterPagination.sort
        );
      } else {
        refetch();
      }
    } catch {
      dispatch(notify({ msg: 'Failed to delete age group', sev: 'error' }));
    }
  };

  /**
   * Pagination: in filtered mode re-run the same filter with the new page/size/sort.
   * In unfiltered mode follow Link headers.
   */
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
      );
      return;
    }

    const currentPage = paginationParams.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;
    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  /**
   * Rows per page change: keep filter pagination when filtered; otherwise update unfiltered.
   */
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize, filterPagination.sort);
    } else {
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

  // Selected row helper
  const isSelected = (row: any) => (row?.id === ageGroup?.id ? 'selected-row' : '');

  // Row actions (edit/delete)
  const iconsForActions = (row: AgeGroup) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setAgeGroup(row);
          setPopupOpen(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setAgeGroup(row);
          setOpenConfirm(true);
        }}
      />
    </div>
  );

  // Table columns (with facility label)
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(facilityListResponse ?? [], row?.facilityId, 'name')}
        </span>
      ),
    },
    {
      key: 'ageGroup',
      title: <Translate>Age Group</Translate>,
      flexGrow: 4,
      render: (row: any) => (row?.ageGroup ? formatEnumString(row?.ageGroup) : ''),
    },
    {
      key: 'fromAge',
      title: <Translate>Age From Unit</Translate>,
      flexGrow: 3,
      render: (row: any) => `${row?.fromAge ?? ''} ${row?.fromAgeUnit ?? ''}`,
    },
    {
      key: 'toAge',
      title: <Translate>Age To Unit</Translate>,
      flexGrow: 3,
      render: (row: any) => `${row?.toAge ?? ''} ${row?.toAgeUnit ?? ''}`,
    },

    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => iconsForActions(row),
    },
  ];

  // Filters UI
  const filters = () => {
    const selectedFilter = recordOfFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'facilityId') {
      dynamicInput = (
        <MyInput
          width={250}
          fieldLabel=""
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
        />
      );
    } else if (selectedFilter === 'ageGroup') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={ageGroupOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          searchable={false}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Value"
          width={220}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="170px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            // If value is empty => clear and revert to main API
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
              // Apply filter with current filter pagination sort
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort || 'id,desc'
              );
            }
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

  // Header setup and resize listener
  useEffect(() => {
    const divContent = 'Age Group';
    dispatch(setPageCode('Age_Group'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-revert when filter value is cleared (e.g., user deletes the input)
  useEffect(() => {
    if (!recordOfFilter.value && recordOfFilter.value !== 0 && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row) => setAgeGroup(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />
      <AddEditAgeGroup
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        agegroups={ageGroup as any}
        setAgeGroups={setAgeGroup as any}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Age Group"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default AgeGroupSetup;
