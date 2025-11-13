import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import './styles.less';
import {
  useSaveDiagnosticsTestCatalogHeaderMutation,
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDepartmentsQuery
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import { ApDiagnosticTestCatalogHeader } from '@/types/model-types';
import { newApDiagnosticTestCatalogHeader } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  conjureValueBasedOnKeyFromList,
  addFilterToListRequest,
  fromCamelCaseToDBName
} from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Tests from './Tests';
import AddEditCatalog from './AddEditCatalog';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
const Catalog = () => {
  const dispatch = useAppDispatch();
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openTestsPopup, setOpenTestsPopup] = useState<boolean>(false);
  const [openConfirmDeleteCatalog, setOpenConfirmDeleteCatalog] = useState<boolean>(false);
  const [stateOfDeleteCatalog, setStateOfDeleteCatalog] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader] =
    useState<ApDiagnosticTestCatalogHeader>({ ...newApDiagnosticTestCatalogHeader });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [departmentListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  //Fetch diagnostics test catalog header list Response
  const {
    data: diagnosticsTestCatalogHeaderListResponse,
    refetch,
    isFetching
  } = useGetDiagnosticsTestCatalogHeaderListQuery(listRequest);
   const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5
      ,
      sort: "id,asc",
      timestamp: Date.now(),
    });


  // Fetch department list Response
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  // save diagnostics test catalog header
  const [saveDiagnosticsTestCatalogHeader, saveDiagnosticTestCatalogHeaderMutation] =
    useSaveDiagnosticsTestCatalogHeaderMutation();
  // Header page setUp
  const divContent = (
   "Catalog"
  );
  dispatch(setPageCode('Catalog'));
  dispatch(setDivContent(divContent));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = diagnosticsTestCatalogHeaderListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Catalog Name', value: 'description' },
    { label: 'Type', value: 'typeLkey' },
    { label: 'Department', value: 'departmentKey' },
    { label: 'Status', value: 'deleted_at' }
  ];
  // class name for selected row
  const isSelected = rowData => {
    if (
      rowData &&
      diagnosticsTestCatalogHeader &&
      rowData.key === diagnosticsTestCatalogHeader.key
    ) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit ,reactive/Deactivate, Tests)
  const iconsForActions = (rowData: any) => (
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
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteCatalog('deactivate');
            setOpenConfirmDeleteCatalog(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteCatalog('reactivate');
            setOpenConfirmDeleteCatalog(true);
          }}
        />
      )}
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
      key: 'description',
      title: <Translate>Catalog Name</Translate>
    },
    {
      key: 'typeLkey',
      title: <Translate>Type</Translate>,
      render: rowData => (rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey)
    },
    {
      key: 'departmentKey',
      title: <Translate>Department</Translate>,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            departmentListResponse?.object ?? [],
            rowData.departmentKey,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'deleted_at',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
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
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );
  // handle click on add new button (open the pop up of add/edit catalog)
  const handleNew = () => {
    setDiagnosticsTestCatalogHeader({ ...newApDiagnosticTestCatalogHeader });
    setPopupOpen(true);
  };
  // handle Save catalog
  const handleSave = () => {
    
    setPopupOpen(false);
    saveDiagnosticsTestCatalogHeader(diagnosticsTestCatalogHeader)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Catalog has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Catalog', sev: 'error' }));
      });
  };
  // Ha
  // ndle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  // handle deactivate catalog
  const handleDeactivate = () => {
    setOpenConfirmDeleteCatalog(false);
    saveDiagnosticsTestCatalogHeader({ ...diagnosticsTestCatalogHeader, isValid: false })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The Catalog was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Catalog',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate catalog
  const handleReactivate = () => {
    setOpenConfirmDeleteCatalog(false);
    saveDiagnosticsTestCatalogHeader({ ...diagnosticsTestCatalogHeader, isValid: true })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The Catalog was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Catalog',
            sev: 'error'
          })
        );
      });
  };
  // update list when filter is changed
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // update list when filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    if (saveDiagnosticTestCatalogHeaderMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticTestCatalogHeaderMutation.data]);

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
        data={diagnosticsTestCatalogHeaderListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDiagnosticsTestCatalogHeader(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
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
        setDiagnosticsTestCatalogHeader={setDiagnosticsTestCatalogHeader}
        departmentListResponse={departmentListResponse}
        width={width}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteCatalog}
        setOpen={setOpenConfirmDeleteCatalog}
        itemToDelete="Catalog"
        actionButtonFunction={
          stateOfDeleteCatalog == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteCatalog}
      />
    </Panel>
  );
};

export default Catalog;
