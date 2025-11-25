import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetVaccinesQuery,
  useLazyGetVaccinesByNameQuery,
  useLazyGetVaccinesByRoaQuery,
  useLazyGetVaccinesByTypeQuery,
  useToggleVaccineActiveMutation
} from '@/services/vaccine/vaccineService';
import { newVaccine as newVaccineModel } from '@/types/model-types-constructor-new';
import { Vaccine as VaccineModel } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useMemo, useState } from 'react';
import { FaSyringe, FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { Form, Panel } from 'rsuite';
import AddEditVaccine from './AddEditVaccine';
import DoesSchedule from './DoesSchedule';
import './styles.less';

const Vaccine: React.FC = () => {
  const dispatch = useAppDispatch();

  // Core state
  const [vaccine, setVaccine] = useState<VaccineModel>({ ...newVaccineModel });
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [dosesPopupOpen, setDosesPopupOpen] = useState(false);
  const [edit_new, setEdit_new] = useState(false);

  // Filter state
  const [recordOfFilter, setRecordOfFilter] = useState<{
    filter: '' | 'name' | 'type' | 'roa';
    value: any;
  }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<VaccineModel[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Unfiltered pagination (main API)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Filtered pagination
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: 'id,desc'
  });

  // Enums
  const vaccineTypeOptions = useEnumOptions('VaccineType');
  const roa = useEnumOptions('RouteOfAdministration');

  // Data (main)
  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetVaccinesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  // Lazy queries used for filters
  const [fetchByName, byNameResult] = useLazyGetVaccinesByNameQuery();
  const [fetchByType, byTypeResult] = useLazyGetVaccinesByTypeQuery();
  const [fetchByRoa, byRoaResult] = useLazyGetVaccinesByRoaQuery();

  // Derived values
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : pageData?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );

  // Header page setUp
  useEffect(() => {
    dispatch(setPageCode('Vaccine'));
    dispatch(setDivContent('Vaccine'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Centralized reset to unfiltered
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0, size: prev.size, sort: 'id,desc' }));
    setPaginationParams(prev => ({
      ...prev,
      page: 0,
      size: prev.size,
      sort: 'id,asc',
      timestamp: Date.now()
    }));
    refetch();
  };

  // Unified refetch respecting current mode
  const refetchList = async () => {
    if (isFiltered) {
      await handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        filterPagination.size,
        filterPagination.sort?.toLowerCase().startsWith('id,asc')
          ? 'id,desc'
          : filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      await refetch();
    }
  };

  // Run the proper filter
  const runFilterQuery = async (
    fieldName: 'name' | 'type' | 'roa',
    value: any,
    page = 0,
    size = paginationParams.size,
    sort?: string
  ) => {
    if (!value && value !== 0) return undefined;
    const effectiveSort = sort ?? (isFiltered ? filterPagination.sort : paginationParams.sort);

    // NOTE: append dummy ts to break RTK Query arg equality
    const common = { page, size, sort: effectiveSort, ts: Date.now() } as const;
    if (fieldName === 'name') return await fetchByName({ name: String(value), ...common }).unwrap();
    if (fieldName === 'type') return await fetchByType({ type: String(value), ...common }).unwrap();
    if (fieldName === 'roa') return await fetchByRoa({ roa: String(value), ...common }).unwrap();
    return undefined;
  };

  // Apply/clear filter
  const handleFilterChange = async (
    fieldName: '' | 'name' | 'type' | 'roa',
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) {
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName as any, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      dispatch(notify({ msg: 'Failed to filter vaccines', sev: 'error' }));
      resetToUnfiltered();
    }
  };

  // Auto revert when value cleared
  useEffect(() => {
    if (!recordOfFilter.value && recordOfFilter.value !== 0 && isFiltered) {
      resetToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfFilter.value]);

  // Sorting
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [sortColumn, setSortColumn] = useState('id');
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, sort: sortValue, page: 0 }));
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        filterPagination.size,
        sortValue
      );
    } else {
      setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0, timestamp: Date.now() }));
    }
  };

  // Pagination
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
      // If you have a helper to parse link headers, use it; otherwise fall back
      try {
        const { page, size } = (PaginationPerPage as any).extractPaginationFromLink
          ? (PaginationPerPage as any).extractPaginationFromLink(targetLink)
          : { page: newPage, size: paginationParams.size };
        setPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
      } catch {
        PaginationPerPage.handlePageChange(
          _,
          newPage,
          paginationParams,
          linksMap,
          setPaginationParams
        );
      }
    } else {
      PaginationPerPage.handlePageChange(
        _,
        newPage,
        paginationParams,
        linksMap,
        setPaginationParams
      );
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        newSize,
        filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

  // Actions
  const handleEdit = (row?: VaccineModel) => {
    if (row?.id) setVaccine(row);
    setEdit_new(true);
    setOpenAddEdit(true);
  };

  const [toggleActive] = useToggleVaccineActiveMutation();
  const handleToggleActive = async () => {
    if (!vaccine?.id) return;
    try {
      const res = await toggleActive({ id: vaccine.id }).unwrap();

      if (isFiltered) {
        await handleFilterChange(
          recordOfFilter.filter,
          recordOfFilter.value,
          filterPagination.page,
          filterPagination.size,
          filterPagination.sort
        );
      } else {
        await refetch();
      }

      dispatch(
        notify({
          msg: res.isActive ? 'Vaccine Activated Successfully' : 'Vaccine Deactivated Successfully',
          sev: 'success'
        })
      );
      setVaccine({ ...newVaccineModel });
    } finally {
      setOpenConfirm(false);
    }
  };

  // Selected row helper
  const isSelected = (row: VaccineModel) => (row?.id === vaccine?.id ? 'selected-row' : '');

  // Filters UI
  const filterFields = [
    { label: 'Vaccine Name', value: 'name' },
    { label: 'Type', value: 'type' },
    { label: 'Roa', value: 'roa' }
  ];

  const filters = () => {
    const selected = recordOfFilter.filter;

    let dynamicInput: React.ReactNode = (
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
        width={220}
      />
    );

    if (selected === 'type') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={vaccineTypeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(u: any) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          searchable={false}
        />
      );
    } else if (selected === 'name') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      );
    } else if (selected === 'roa') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={roa ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(u: any) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          searchable={false}
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
          setRecord={(u: any) => setRecordOfFilter({ filter: u.filter, value: '' })}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="170px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
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

  // Columns
  const tableColumns = [
    { key: 'name', title: <Translate>Vaccine Name</Translate>, flexGrow: 4 },
    {
      key: 'roa',
      title: <Translate>ROA</Translate>,
      flexGrow: 4,
      render: (row: VaccineModel) => formatEnumString(row?.roa)
    },
    { key: 'atcCode', title: <Translate>ATC Code</Translate>, flexGrow: 3 },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (row: VaccineModel) => formatEnumString(row?.type)
    },
    {
      key: 'numberOfDoses',
      title: <Translate>Doses Number</Translate>,
      flexGrow: 2,
      render: (row: VaccineModel) => formatEnumString(row?.numberOfDoses)
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: rowData =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: VaccineModel) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => handleEdit(row)}
          />
          <FaSyringe
            className="icons-style"
            title="Does Schedule"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              setVaccine(row);
              if (!row?.id) {
                dispatch(notify('Please select a vaccine first.'));
                return;
              }
              setDosesPopupOpen(true);
            }}
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setVaccine(row);
                setConfirmMode('deactivate');
                setOpenConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setVaccine(row);
                setConfirmMode('reactivate');
                setOpenConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <Panel>
      <MyTable
        height={450}
        data={tableData}
        totalCount={totalCount}
        loading={
          isFetching ||
          byNameResult?.isFetching ||
          byTypeResult?.isFetching ||
          byRoaResult?.isFetching
        }
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: VaccineModel) => setVaccine(row)}
        filters={filters()}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setOpenAddEdit(true);
                setVaccine({ ...newVaccineModel });
                setEdit_new(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditVaccine
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        vaccine={vaccine}
        setVaccine={setVaccine}
        edit_new={edit_new}
        setEdit_new={setEdit_new}
        refetch={refetchList}
      />

      <DoesSchedule open={dosesPopupOpen} setOpen={setDosesPopupOpen} vaccine={vaccine} />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Vaccine"
        actionButtonFunction={handleToggleActive}
        actionType={confirmMode}
      />
    </Panel>
  );
};

export default Vaccine;
