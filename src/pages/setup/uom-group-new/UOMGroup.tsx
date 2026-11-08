import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditUom from './AddEditUom';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import { newUOMGroup } from '@/types/model-types-constructor-new';
import {
  useDeleteUOMGroupMutation,
  useGetAllUOMGroupsQuery,
  useLazyGetUOMGroupsByDescriptionQuery,
  useLazyGetUOMGroupsByNameQuery
} from '@/services/setup/uom-group/uomGroupService';
import { uomGroup } from '@/types/model-types-new';
import MyInput from '@/components/MyInput';

type FilterState = {
  filter: string;
  value: any;
};

const initialFilterState: FilterState = {
  filter: '',
  value: ''
};

const filterFields = [
  { label: 'Group Name', value: 'name' },
  { label: 'Description', value: 'description' }
];

const UOMGroup = () => {
  const dispatch = useAppDispatch();
  const [uomGroup, setUomGroup] = useState<uomGroup>({ ...newUOMGroup });
  const [uomGrpupOpen, setUomGroupOpen] = useState(false);
  // Filter being edited in the filter bar, and the one the table currently shows
  const [recordOfFilter, setRecordOfFilter] = useState<FilterState>(initialFilterState);
  const [activeFilter, setActiveFilter] = useState<FilterState>(initialFilterState);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<uomGroup[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  // Filtered pagination (independent state)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });
  const [openConfirmDeleteUOMGroupModal, setOpenConfirmDeleteUOMGroupModal] =
    useState<boolean>(false);
  // Pagination values
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  // Fetch uom groups list response
  const {
    data: uomGroupsListResponse,
    refetch: refetchUomGroups,
    isFetching
  } = useGetAllUOMGroupsQuery({ name: '', ...paginationParams });
  const [fetchByName] = useLazyGetUOMGroupsByNameQuery();
  const [fetchByDescription] = useLazyGetUOMGroupsByDescriptionQuery();
  // delete group
  const [deleteUomGroup] = useDeleteUOMGroupMutation();
  // number of all groups
  const totalCount = isFiltered ? filteredTotal : uomGroupsListResponse?.totalCount ?? 0;
  const tableData = isFiltered ? filteredData : uomGroupsListResponse?.data ?? [];
  // Header page setUp
  const divContent = 'UOM Groups';


useEffect(() => {
  dispatch(setPageCode('UOM_Groups'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  // ===== Filtering =====
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page: number,
    size: number,
    sort: string
  ) => {
    const params = { page, size, sort };
    const text = String(value).trim();

    if (fieldName === 'name') {
      return await fetchByName({ ...params, name: text }).unwrap();
    } else if (fieldName === 'description') {
      return await fetchByDescription({ ...params, description: text }).unwrap();
    }

    return undefined;
  };

  // Reset to main list
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setActiveFilter(initialFilterState);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  };

  // Apply/Clear filters
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!fieldName || value === null || value === undefined || String(value).trim() === '') {
      resetToUnfiltered();
      return;
    }

    setIsFilterLoading(true);
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setActiveFilter({ filter: fieldName, value });
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      dispatch(notify({ msg: 'Failed to load UOM groups', sev: 'error' }));
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Reload whatever the table shows after add/edit/delete
  const refreshList = () => {
    if (isFiltered) {
      handleFilterChange(activeFilter.filter, activeFilter.value, filterPagination.page);
      return;
    }
    refetchUomGroups();
  };

  const handleSearch = () => {
    handleFilterChange(recordOfFilter.filter, recordOfFilter.value);
  };

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && uomGroup && rowData.id === uomGroup.id) {
      return 'selected-row';
    } else return '';
  };

  // handle click on Add New button
  const handleUomGroupNew = () => {
    setUomGroupOpen(true);
    setUomGroup({ ...newUOMGroup });
  };

const handleDeleteUomGroup = async () => {
  setOpenConfirmDeleteUOMGroupModal(false);

  try {
    await deleteUomGroup(uomGroup?.id).unwrap();

    refreshList();

    dispatch(
      notify({
        msg: 'The UOM group was deleted successfully',
        sev: 'success'
      })
    );
  } catch (error: any) {
    const detail = error?.data?.detail || '';
    const message = error?.data?.message || '';

    const isForeignKeyError =
      detail.includes('foreign key constraint') ||
      detail.includes('still referenced') ||
      message.includes('db.constraint');

    dispatch(
      notify({
        msg: isForeignKeyError
          ? 'Cannot delete this UOM group because it is linked to other records.'
          : 'Failed to delete this UOM group',
        sev: 'error'
      })
    );
  }
};
  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      handleFilterChange(activeFilter.filter, activeFilter.value, newPage);
      return;
    }
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleRowsPerPageChange = e => {
    const newSize = Number(e.target.value);
    if (isFiltered) {
      handleFilterChange(activeFilter.filter, activeFilter.value, 0, newSize);
      return;
    }
    setPaginationParams({
      ...paginationParams,
      size: newSize,
      page: 0,
      timestamp: Date.now()
    });
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;
    if (isFiltered) {
      handleFilterChange(activeFilter.filter, activeFilter.value, 0, filterPagination.size, sortValue);
      return;
    }
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  // Icons column (Edite, delete)
  const iconsForActions = () => (
    <div className="container-of-icons">
      {/* delete  when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setUomGroupOpen(true)}
        // onClick={() => setPopupOpen(true)}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteUOMGroupModal(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: 'Group Name',
      flexGrow: 4
    },
    {
      key: 'description',
      title: 'Description',
      flexGrow: 4
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // filters
  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: FilterState) =>
          setRecordOfFilter({
            filter: updated.filter,
            value: ''
          })
        }
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Enter Value"
        width={220}
        enterClick={handleSearch}
      />

      <MyButton color="var(--deep-blue)" onClick={handleSearch} width="80px">
        Search
      </MyButton>
    </Form>
  );

  // Effects

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        totalCount={totalCount}
        data={tableData}
        loading={isFiltered ? isFilterLoading : isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setUomGroup(rowData);
        }}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleUomGroupNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
        dontTranslateData 
      />

      <AddEditUom
        open={uomGrpupOpen}
        setOpen={setUomGroupOpen}
        uom={uomGroup}
        setUom={setUomGroup}
        refetchUomGroups={refreshList}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteUOMGroupModal}
        setOpen={setOpenConfirmDeleteUOMGroupModal}
        itemToDelete="UOM group"
        actionButtonFunction={() => handleDeleteUomGroup()}
        actionType="delete"
      />
    </Panel>
  );
};

export default UOMGroup;
