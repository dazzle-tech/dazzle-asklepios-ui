import React, { useState, useEffect } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import './styles.less';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  formatEnumString
} from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Tests from './Tests';
import AddEditCatalog from './AddEditCatalog';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { useDeleteCatalogMutation, useGetCatalogsQuery, useLazyGetCatalogByDepartmentQuery, useLazyGetCatalogByNameQuery, useLazyGetCatalogByTypeQuery } from '@/services/setup/catalog/catalogService';
import { CatalogResponseVM } from '@/types/model-types-new';
import { newCatalogResponseVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';

const Catalog = () => {
  const dispatch = useAppDispatch();
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openTestsPopup, setOpenTestsPopup] = useState<boolean>(false);
  const [openConfirmDeleteCatalog, setOpenConfirmDeleteCatalog] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader] =
    useState<CatalogResponseVM>({ ...newCatalogResponseVM });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [filterPagination, setFilterPagination] = useState({
      page: 0,
      size: 5,
      sort: 'id,asc'
    });
  //Fetch diagnostics test catalog header list Response
  const {
    data: diagnosticsTestCatalogHeaderListResponse,
    refetch,
    isFetching
  } = useGetCatalogsQuery(paginationParams);

  const [deleteCatalog] = useDeleteCatalogMutation();
 
  // Header page setUp
  const divContent = 'Catalog';
  dispatch(setPageCode('Catalog'));
  dispatch(setDivContent(divContent));
  // Pagination values
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  const [link, setLink] = useState({});
  const totalCount = diagnosticsTestCatalogHeaderListResponse?.totalCount ?? 0;

  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [filteredList, setFilteredList] = useState<CatalogResponseVM[]>([]);

  const [filteredTotal, setFilteredTotal] = useState<number>(0);  
  const {data: departmentListResponse} = useGetAllDepartmentsWithoutPaginationQuery({});


  const testTypeEnum = useEnumOptions('TestType');

  const [fetchByDepartment] = useLazyGetCatalogByDepartmentQuery();
    const [fetchByName] = useLazyGetCatalogByNameQuery();
    const [fetchByType] = useLazyGetCatalogByTypeQuery();

  // Available fields for filtering
  const filterFields = [
    { label: 'Catalog Name', value: 'name' },
    { label: 'Type', value: 'type' },
    { label: 'Department', value: 'departmentId' }
  ];
  // class name for selected row
  const isSelected = rowData => {
    if (
      rowData &&
      diagnosticsTestCatalogHeader &&
      rowData?.id === diagnosticsTestCatalogHeader?.id
    ) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit ,reactive/Deactivate, Tests)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteCatalog(true);
        }}
      />
      <FaListAlt
        className="icons-style"
        title="Tests"
        size={21}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenTestsPopup(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: 'Catalog Name'
    },
    {
      key: 'type',
      title: 'Type',
      render: (row: any) => (row?.type ? formatEnumString(row?.type) : '')
    },
    {
      key: 'departmentName',
      title: 'Department'
    },
    {
      key: 'description',
      title: 'Description'
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      {recordOfFilter['filter'] == 'departmentId' ? (
        <MyInput
              fieldName="value"
              fieldType="select"
              selectData={departmentListResponse ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={recordOfFilter}
              setRecord={setRecordOfFilter}
               menuMaxHeight={150}
              showLabel={false}
              searchable={false}
            />
      ) : recordOfFilter['filter'] == 'type' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={testTypeEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          searchable={false}
          showLabel={false}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );
  // handle click on add new button (open the pop up of add/edit catalog)
  const handleNew = () => {
    setDiagnosticsTestCatalogHeader({ ...newCatalogResponseVM });
    setPopupOpen(true);
  };

   // ──────────────────────────── PAGINATION ────────────────────────────
    const handlePageChange = (event, newPage) => {
      if (isFiltered) {
        handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
      } else {
        PaginationPerPage.handlePageChange(
          event,
          newPage,
          paginationParams,
          link,
          setPaginationParams
        );
      }
    };
 
    //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams({
        ...paginationParams,
        sort: sortValue,
        page: 0,
        timestamp: Date.now()
      });
    }
  };

  // handle deactivate catalog
  const handleDelete = () => {
    setOpenConfirmDeleteCatalog(false);
    deleteCatalog(diagnosticsTestCatalogHeader?.id)
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The Catalog was successfully Deleted',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deleted this Catalog',
            sev: 'error'
          })
        );
      });
  };

  // Handle filter change
    const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
      try {
        if (!field || !value) {
          setIsFiltered(false);
          setFilteredList([]);
          return;
        }
        const currentSize = size ?? filterPagination.size;
  
        let response;
        const params = {
          page,
          size: currentSize,
          sort: filterPagination.sort
        };
  
        if (field === 'type') {
          response = await fetchByType({ type: value, ...params }).unwrap();
        } else if (field === 'departmentId') {
          response = await fetchByDepartment({ departmentId: value, ...params }).unwrap();
        } else if (field === 'name') {
          response = await fetchByName({ name: value, ...params }).unwrap();
        } 
  
        setFilteredList(response.data ?? []);
        setFilteredTotal(response.totalCount ?? 0);
        setIsFiltered(true);
        setFilterPagination({ ...filterPagination, page, size: currentSize });
      } catch (error) {
        dispatch(notify({ msg: 'Failed to filter Catalog', sev: 'error' }));
        setIsFiltered(false);
      }
    };
  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      setLink(diagnosticsTestCatalogHeaderListResponse?.links);
    }, [diagnosticsTestCatalogHeaderListResponse?.links]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <MyTable
        height={450}
        totalCount={isFiltered ? filteredTotal : totalCount}
        data={isFiltered ? filteredList : diagnosticsTestCatalogHeaderListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDiagnosticsTestCatalogHeader(rowData);
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);

          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }
        }}
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
      <Tests
        open={openTestsPopup}
        setOpen={setOpenTestsPopup}
        diagnosticsTestCatalogHeader={diagnosticsTestCatalogHeader}
      />
      <AddEditCatalog
        open={popupOpen}
        setOpen={setPopupOpen}
        diagnosticsTestCatalogHeader={diagnosticsTestCatalogHeader}
        width={width}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteCatalog}
        setOpen={setOpenConfirmDeleteCatalog}
        itemToDelete="Catalog"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default Catalog;
