import React, { useState, useEffect } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import PolicyAssignmentManager from '@/components/PolicyAssignment';
import { formatEnumString } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Tests from './Tests';
import AddEditCatalog from './AddEditCatalog';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import {
  useDeleteCatalogMutation,
  useGetCatalogsQuery
} from '@/services/setup/catalog/catalogService';
import { CatalogResponseVM } from '@/types/model-types-new';
import { newCatalogResponseVM } from '@/types/model-types-constructor-new';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';

const Catalog = () => {
  const dispatch = useAppDispatch();
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND (catalogs have no active flag).
  const emptyHeaderFilters = { name: '', type: '', departmentId: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  const [popupOpen, setPopupOpen] = useState(false);
  const [openTestsPopup, setOpenTestsPopup] = useState<boolean>(false);
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState<boolean>(false);
  const [selectedCatalogForPolicyAssignment, setSelectedCatalogForPolicyAssignment] =
    useState<CatalogResponseVM | null>(null);
  const [openConfirmDeleteCatalog, setOpenConfirmDeleteCatalog] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader] =
    useState<CatalogResponseVM>({ ...newCatalogResponseVM });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  //Fetch diagnostics test catalog header list Response
  const {
    data: diagnosticsTestCatalogHeaderListResponse,
    refetch,
    isFetching
  } = useGetCatalogsQuery({ ...paginationParams, ...appliedFilters });
  const { data: departmentListResponse } = useGetAllDepartmentsWithoutPaginationQuery({});
  const [deleteCatalog] = useDeleteCatalogMutation();

  const testTypeEnum = useEnumOptions('TestType');
  // Header page setUp
  const divContent = 'Catalog';


  useEffect(() => {
  dispatch(setPageCode('Catalog'));
  dispatch(setDivContent(divContent));
  
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);
  // Pagination values
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const totalCount = diagnosticsTestCatalogHeaderListResponse?.totalCount ?? 0;
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

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

  // Icons column (Edit ,delete, Tests)
  const iconsForActions = (rowData: CatalogResponseVM) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDiagnosticsTestCatalogHeader(rowData);
          setPopupOpen(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setDiagnosticsTestCatalogHeader(rowData);
          setOpenConfirmDeleteCatalog(true);
        }}
      />
      <FaListAlt
        className="icons-style"
        title="Tests"
        size={21}
        fill="var(--primary-gray)"
        onClick={() => {
          setDiagnosticsTestCatalogHeader(rowData);
          setOpenTestsPopup(true);
        }}
      />
      <FontAwesomeIcon
        icon={faClipboardList}
        title="Policy Assignment"
        className="icons-style"
        style={{ color: 'var(--deep-blue)', cursor: 'pointer' }}
        size="lg"
        onClick={() => {
          setSelectedCatalogForPolicyAssignment(rowData);
          setOpenPolicyAssignmentModal(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: 'Catalog Name',
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'type',
      title: 'Type',
      width: 170,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(testTypeEnum ?? [])],
      render: (row: any) => (row?.type ? formatEnumString(row?.type) : '')
    },
    {
      key: 'departmentName',
      title: 'Department',
      width: 200,
      ...headerSearch('departmentId'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(departmentListResponse ?? []).map((d: any) => ({ label: d.name ?? '', value: String(d.id) }))
      ]
    },
    {
      key: 'description',
      title: 'Description'
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: (rowData: CatalogResponseVM) => iconsForActions(rowData)
    }
  ];

  // handle click on add new button (open the pop up of add/edit catalog)
  const handleNew = () => {
    setDiagnosticsTestCatalogHeader({ ...newCatalogResponseVM });
    setPopupOpen(true);
  };

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);
    const sortValue = `${sortColumn},${sortType}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0, timestamp: Date.now() }));
  };

  // handle delete catalog
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

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        totalCount={totalCount}
        data={diagnosticsTestCatalogHeaderListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
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
          setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
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
      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={setOpenPolicyAssignmentModal}
        title="Catalog Policy Assignment"
        bodyheight="70vh"
        size="70vw"
        hideBack
        hideActionBtn
        content={
          selectedCatalogForPolicyAssignment ? (
            <PolicyAssignmentManager
              resourceType="CATALOG"
              resourceId={selectedCatalogForPolicyAssignment.id ?? 0}
              facilityId={selectedCatalogForPolicyAssignment.facilityId ?? 0}
              showHeader={false}
            />
          ) : null
        }
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
