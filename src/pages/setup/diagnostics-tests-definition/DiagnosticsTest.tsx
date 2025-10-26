import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel, Form } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { RiFileList2Fill } from 'react-icons/ri';
import { FaChartLine } from 'react-icons/fa';
import { FaNewspaper } from 'react-icons/fa6';
import {
  useSaveDiagnosticsTestMutation,
  useGetDiagnosticsTestListQuery
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { ApDiagnosticTest } from '@/types/model-types';
import { newApDiagnosticTest } from '@/types/model-types-constructor';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import NormalRangeSetupModal from './NormalRangeSetUpModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditDiagnosticTest from './AddEditDiagnosticTest';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import Coding from './Coding';
import Profile from './Profile';
const DiagnosticsTest = () => {
  const dispatch = useAppDispatch();
  const [diagnosticsTest, setDiagnosticsTest] = useState<ApDiagnosticTest>({
    ...newApDiagnosticTest
  });
  const [normalRangePopupOpen, setNormalRangePopupOpen] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [openConfirmDiagnosticTest, setOpenConfirmDeleteDiagnosticTest] = useState<boolean>(false);
  const [stateOfDeleteDiagnosticTest, setStateOfDeleteDiagnosticTest] = useState<string>('delete');
  const [openCodingModal, setOpenCodingModal] = useState<boolean>(false);
  const [openProfileModal, setOpenProfileModal] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditDiagnosticTestPopup, setOpenAddEditDiagnosticTestPopup] =
    useState<boolean>(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch diagnostics test list response
  const {
    data: diagnosticsListResponse,
    refetch: refetchDiagnostics,
    isFetching
  } = useGetDiagnosticsTestListQuery(listRequest);
  // save Diagnostics Test
  const [saveDiagnosticsTest] = useSaveDiagnosticsTestMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = diagnosticsListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Type', value: 'testTypeLkey' },
    { label: 'Name', value: 'testName' },
    { label: 'Internal Code', value: 'internalCode' },
    { label: 'Standard Code', value: 'internationalCodeOne' },
    { label: 'Is Profile', value: 'internationalCodeOne' },
    { label: 'Status', value: 'deleted_at' }
  ];
  // Header page setUp
  const divContent = (
    <div className='page-title'>
      <h5><Translate>Diagnostics Tests Definition</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Diagnostics_Tests'));
  dispatch(setDivContent(divContent));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && diagnosticsTest && rowData.key === diagnosticsTest.key) {
      return 'selected-row';
    } else return '';
  };
  
  // Icons column (Edit, normalRange/profile, coding ,reactive/Deactivate)
  const iconsForActions = (rowData: any) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAddEditDiagnosticTestPopup(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteDiagnosticTest('deactivate');
            setOpenConfirmDeleteDiagnosticTest(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteDiagnosticTest('reactivate');
            setOpenConfirmDeleteDiagnosticTest(true);
          }}
        />
      )}
      {rowData?.profile ? (
        <RiFileList2Fill
          className="icons-style"
          title="Profile Setup"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setOpenProfileModal(true);
          }}
        />
      ) : (
        <FaChartLine
          className="icons-style"
          title="Normal Range Setup"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setNormalRangePopupOpen(true);
          }}
        />
      )}
      <FaNewspaper
        className="icons-style"
        title="Code"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenCodingModal(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'testTypeLkey',
      title: <Translate>Type</Translate>,
      render: rowData =>
        rowData.testTypeLvalue ? rowData.testTypeLvalue.lovDisplayVale : rowData.testTypeLkey
    },
    {
      key: 'testName',
      title: <Translate>Name</Translate>
    },
    {
      key: 'internalCode',
      title: <Translate>Internal Code</Translate>
    },
    {
      key: 'internationalCodeOne',
      title: <Translate>Standard Code</Translate>
    },
    {
      key: 'profile',
      title: <Translate>Is Profile</Translate>,
      render: rowData => (rowData.profile ? 'Yes' : 'No')
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
  
  // handle click on add new button
  const handleNew = () => {
    setOpenAddEditDiagnosticTestPopup(true);
    setDiagnosticsTest({ ...newApDiagnosticTest });
  };

  // handle deactivate diagnostic test
  const handleDeactivate = () => {
    setOpenConfirmDeleteDiagnosticTest(false);
    saveDiagnosticsTest({ ...diagnosticsTest, isValid: false })
      .unwrap()
      .then(() => {
        refetchDiagnostics();
        dispatch(
          notify({
            msg: 'The Diagnostic Test was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Diagnostic Test',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate diagnostic test
  const handleReactivate = () => {
    setOpenConfirmDeleteDiagnosticTest(false);
    saveDiagnosticsTest({ ...diagnosticsTest, isValid: true })
      .unwrap()
      .then(() => {
        refetchDiagnostics();
        dispatch(
          notify({
            msg: 'The Diagnostic Test was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Diagnostic Test',
            sev: 'error'
          })
        );
      });
  };

  // Handle page change in navigation
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

  // handle change filter
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
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

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
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

  return (
    <Panel>
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
      <MyTable
        height={450}
        data={diagnosticsListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDiagnosticsTest(rowData);
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
      />
      <AddEditDiagnosticTest
        open={openAddEditDiagnosticTestPopup}
        setOpen={setOpenAddEditDiagnosticTestPopup}
        diagnosticsTest={diagnosticsTest}
        setDiagnosticsTest={setDiagnosticsTest}
        width={width}
      />
      <NormalRangeSetupModal
        open={normalRangePopupOpen}
        setOpen={setNormalRangePopupOpen}
        diagnosticsTest={diagnosticsTest}
      />
      <DeletionConfirmationModal
        open={openConfirmDiagnosticTest}
        setOpen={setOpenConfirmDeleteDiagnosticTest}
        itemToDelete="Diagnostic Test"
        actionButtonFunction={
          stateOfDeleteDiagnosticTest == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteDiagnosticTest}
      />
      <Coding
        open={openCodingModal}
        setOpen={setOpenCodingModal}
        diagnosticsTest={diagnosticsTest}
      />
      <Profile
        open={openProfileModal}
        setOpen={setOpenProfileModal}
        diagnosticsTest={diagnosticsTest}
      />
    </Panel>
  );
};

export default DiagnosticsTest;
