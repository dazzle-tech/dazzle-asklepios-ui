import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetVisitDurationsQuery,
  useDeleteVisitDurationMutation,
  useLazyGetVisitDurationsByTypeQuery
} from '@/services/setup/visitDurationService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Form, Panel } from 'rsuite';
import VisitDurationSetupModal from './VisitDurationSetupModal';
import { VisitDuration } from '@/types/model-types-new';
import { newVisitDuration } from '@/types/model-types-constructor-new';

type SortType = 'asc' | 'desc';

const VisitDurationSetup: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // sorting
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<SortType>('asc');

  //  pagination (unfiltered)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // pagination (filtered)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: 'id,desc'
  });

  // modal add/edit
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [record, setRecord] = useState<VisitDuration | null>({ ...newVisitDuration });

  // delete confirmation modal
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  //  Filter state
  const [recordOfFilter, setRecordOfFilter] = useState<{
    filter: '' | 'visitType';
    value: any;
  }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<VisitDuration[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // enum options للـ VisitType
  const visitTypeOptions = useEnumOptions('VisitType');

  // API data (main)
  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch
  } = useGetVisitDurationsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  // lazy query للفلترة بالسيرفر
  const [fetchByVisitType, byVisitTypeResult] = useLazyGetVisitDurationsByTypeQuery();

  const [deleteVisitDuration, { isLoading: isDeleting }] = useDeleteVisitDurationMutation();

  // ⛳ derived values (زي Vaccine)
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );

  const links = (isFiltered ? filteredLinks : pageData?.links) || {};

  const tableData: VisitDuration[] = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );

  //  reset to unfiltered mode
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);

    setFilterPagination(prev => ({ ...prev, page: 0, sort: 'id,desc' }));
    setPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: 'id,asc',
      timestamp: Date.now()
    }));

    refetch();
  };

  //  unified refetch respecting current mode
  const refetchList = async () => {
    if (isFiltered) {
      await handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        filterPagination.page,
        filterPagination.size,
        filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      await refetch();
    }
  };

  //  run filtered query (server-side)
  const runFilterQuery = async (
    fieldName: 'visitType',
    value: any,
    page = 0,
    size = filterPagination.size,
    sort?: string
  ) => {
    if (!value && value !== 0) return undefined;
    const effectiveSort = sort ?? (isFiltered ? filterPagination.sort : paginationParams.sort);

    const common = { page, size, sort: effectiveSort, ts: Date.now() } as const;

    if (fieldName === 'visitType') {
      return await fetchByVisitType({ visitType: String(value), ...common }).unwrap();
    }

    return undefined;
  };

  //  apply / clear filter
  const handleFilterChange = async (
    fieldName: '' | 'visitType',
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
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: 'Failed to filter visit durations', sev: 'error' } as any));
      resetToUnfiltered();
    }
  };

  //  auto revert when filter value cleared
  useEffect(() => {
    if (!recordOfFilter.value && recordOfFilter.value !== 0 && isFiltered) {
      resetToUnfiltered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordOfFilter.value]);

  // delete confirm
  const handleDeleteConfirm = async () => {
    if (selectedItemId == null) {
      setOpenConfirmDeleteModal(false);
      return;
    }

    try {
      await deleteVisitDuration({ id: selectedItemId }).unwrap();
      setOpenConfirmDeleteModal(false);
      setSelectedItemId(null);
      await refetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    {
      key: 'visitType',
      title: 'Visit Type',
      dataKey: 'visitType',
      width: 150,
      render: (row: VisitDuration) => formatEnumString(row?.visitType)
    },
    {
      key: 'durationInMinutes',
      title: 'Duration (mins)',
      dataKey: 'durationInMinutes',
      width: 150,
      render: (row: VisitDuration) =>
        row?.durationInMinutes != null ? `${row.durationInMinutes} mins` : ''
    },
    {
      key: 'resourceSpecific',
      title: 'Resource Specific',
      dataKey: 'resourceSpecific',
      width: 160,
      render: (row: VisitDuration) => (row?.resourceSpecific ? 'Yes' : 'No')
    },
    {
      key: 'actions',
      title: '',
      width: 120,
      render: (rowData: VisitDuration) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            id="icon0-0"
            size={24}
            className="icons-style"
            onClick={() => {
              setRecord(rowData);
              setModalMode('edit');
              setOpenModal(true);
            }}
          />
          <MdDelete
            className="icons-style"
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              if (!rowData.id) return;
              setSelectedItemId(rowData.id);
              setOpenConfirmDeleteModal(true);
            }}
          />
        </div>
      )
    }
  ];

  // header page setup
  useEffect(() => {
    const divContent = 'Visit Duration Setup';

    dispatch(setPageCode('Visit_Duration_Setup'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const filterFields = [{ label: 'Visit Type', value: 'visitType' }];

  const filters = () => {
    const selected = recordOfFilter.filter;

    let dynamicInput: React.ReactNode = (
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

    if (selected === 'visitType') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={visitTypeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(u: any) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          searchable={false}
          placeholder="Select Visit Type"
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
          onClick={() =>
            handleFilterChange(
              recordOfFilter.filter,
              recordOfFilter.value,
              0,
              filterPagination.size,
              filterPagination.sort || 'id,desc'
            )
          }
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };


  const handleSortChange = (column: string, type: SortType) => {
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
      setPaginationParams(prev => ({
        ...prev,
        sort: sortValue,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  //  pagination change
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
      try {
        const { page, size } = (PaginationPerPage as any).extractPaginationFromLink
          ? (PaginationPerPage as any).extractPaginationFromLink(targetLink)
          : { page: newPage, size: paginationParams.size };

        setPaginationParams(prev => ({
          ...prev,
          page,
          size,
          timestamp: Date.now()
        }));
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

  // rows per page
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
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  return (
    <Panel className="main-visit-duration-page-gaps">
      <MyTable
        data={tableData}
        columns={columns}
        filters={filters()}
        tableButtons={
          <Form fluid>
            <div className="bt-div">
              <div className="bt-right">
                <MyButton
                  prefixIcon={() => <PlusIcon />}
                  onClick={() => {
                    setModalMode('add');
                    setRecord({ ...newVisitDuration });
                    setOpenModal(true);
                  }}
                >
                  Add
                </MyButton>
              </div>
            </div>
          </Form>
        }
        height={470}
        loading={isLoading || isFetching || isDeleting || byVisitTypeResult.isFetching}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => handleSortChange(col, type as SortType)}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Visit Duration"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
      />

      {/* Add / Edit Modal */}
      <VisitDurationSetupModal
        open={openModal}
        setOpen={setOpenModal}
        mode={modalMode}
        record={record || undefined}
        onSuccess={refetchList}
      />
    </Panel>
  );
};

export default VisitDurationSetup;
