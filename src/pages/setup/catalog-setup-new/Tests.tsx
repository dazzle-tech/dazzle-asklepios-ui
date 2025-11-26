import React, { useState, useEffect } from 'react';
import { useSaveCatalogDiagnosticsTestMutation } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import { Checkbox, Form } from 'rsuite';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import ChildModal from '@/components/ChildModal';
import MyInput from '@/components/MyInput';
import { MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useAddTestsToCatalogMutation,
  useGetCatalogTestsQuery,
  useRemoveTestFromCatalogMutation
} from '@/services/setup/catalog/catalogTestService';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { useGetAllDiagnosticTestsByNameAndTypeQuery, useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

const Tests = ({ open, setOpen, diagnosticsTestCatalogHeader }) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ value: '' });
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openConfirmDeleteTest, setOpenConfirmDeleteTest] = useState<boolean>(false);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const pageIndexTable1 = paginationParams.page;
  const rowsPerPageTable1 = paginationParams.size;
  const [selectedTestOnTable1, setSelectedTestOnTable1] = useState();
  const [combinedArrayTable2, setCombinedArrayTable2] = useState([]);
  const [selectedTestOnTable2, setSelectedTestOnTable2] = useState();

  const [paginationParamsForAllTests, setPaginationParamsForAllTests] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  // Fetch diagnostics test list response(all tests for specific type)

  const { data: diagnosticsListResponse } = useGetAllDiagnosticTestsByNameAndTypeQuery({
    type: diagnosticsTestCatalogHeader.type,
    name: record['value'],
    ...paginationParamsForAllTests
  });

  // Pagination values
  const pageIndexForAllTests = paginationParamsForAllTests.page;
  const rowsPerPageForAllTests = paginationParamsForAllTests.size;
  const [linkForAllTests, setLinkForAllTests] = useState({});
  const [sortColumnForAllTests, setSortColumnForAllTests] = useState('id');
  const [sortTypeForAllTests, setSortTypeForAllTests] = useState<'asc' | 'desc'>('asc');

  const { data: catalogDiagnosticsTestListResponse } = useGetCatalogTestsQuery(
    {
      catalogId: diagnosticsTestCatalogHeader?.id,
      ...paginationParams // page, size, sort
    },
    {
      skip: !diagnosticsTestCatalogHeader?.id
    }
  );

    const { data: catalogDiagnosticsTestListResponseWithoutPagination } = useGetCatalogTestsQuery(
    {
      catalogId: diagnosticsTestCatalogHeader?.id,
    },
    {
      skip: !diagnosticsTestCatalogHeader?.id
    }
  );

  console.log("catalogDiagnosticsTestListResponseWithoutPagination");
  console.log(catalogDiagnosticsTestListResponseWithoutPagination);

  const totalCountForCatalogTests = catalogDiagnosticsTestListResponse?.totalCount ?? 0;
  


  // remove test
  const [removeTest] = useRemoveTestFromCatalogMutation();
  // save tests
  const [saveCatalogDiagnosticsTest] = useSaveCatalogDiagnosticsTestMutation();

  const [addTestsToCatalog] = useAddTestsToCatalogMutation();
  const links = catalogDiagnosticsTestListResponse?.links;

  const isSelectedOnTable1 = rowData => {
    if (rowData && selectedTestOnTable1 && rowData === selectedTestOnTable1) {
      return 'selected-row';
    } else return '';
  };

  const isSelectedOnTable2 = rowData => {
    if (rowData && selectedTestOnTable2 && rowData === selectedTestOnTable2) {
      return 'selected-row';
    } else return '';
  };

  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteTest(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'code',
      title: 'Code'
    },
    {
      key: 'name',
      title: 'Name'

    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  //Table columns
  const tableAddTestColumns = [
    {
      key: 'test',
      title: 'Test',
      render: rowData => (
        <Checkbox
          checked={selectedRows.includes(rowData.id)}
          onChange={() => handleCheckboxChange(rowData.id)}
        />
      )
    },
    {
      key: 'name',
      title: 'Test Name'
    },
    {
      key: 'internalCode',
      title: 'Code'
    }

  ];

  // Handle page change in navigation
  const handlePageChangeTable1 = (_: unknown, newPage: number) => {
     // if (isFiltered) {
    //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    // }
    // else {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParams,
      links,
      setPaginationParams
    );
    // }
  };

  

  // Handle page change in navigation
  const handlePageChangeTable2 = (event, newPage) => {
    // if (isFiltered) {
    //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    // }
    // else {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParamsForAllTests,
      linkForAllTests,
      setPaginationParamsForAllTests
    );
    // }
  };

  // handle delete test from selected list
  const handleDeleteTestFromDialog = () => {
    setOpenConfirmDeleteTest(false);
    removeTest({
      catalogId: diagnosticsTestCatalogHeader?.id,
      testId: selectedTestOnTable1?.id

    })
      .unwrap()
      .then(() => {
        // catalogDiagnosticsTestListResponse.refetch();
        dispatch(
          notify({
            msg: 'The Test was successfully Deleted',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(

          notify({
            msg: 'Fail',
            sev: 'error'
          })
        );
      });
  };

  // handle save tests(on selected list)
  const handleSaveTest = () => {
 
    addTestsToCatalog({
      catalogId: diagnosticsTestCatalogHeader?.id,
      body: { testIds: selectedRows }
    })
      .unwrap()
      .then(() => {
        setSelectedRows([]);
        dispatch(notify({ msg: 'The Tests have been saved successfully', sev: 'success' }));
      });
  };


  // Handle test selection by checking the checkbox
  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => setOpenChild(true)}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={250}
              rowClassName={isSelectedOnTable1}
              onRowClick={rowData => {
                setSelectedTestOnTable1(rowData);
              }}
              totalCount={totalCountForCatalogTests}
              // data={paginatedDataTable1 ?? []}
              data={catalogDiagnosticsTestListResponse?.data?.tests ?? []}

              // loading={catalogDiagnosticsTestListResponse.isFetching}
              columns={tableColumns}
              page={pageIndexTable1}
              rowsPerPage={rowsPerPageTable1}
              onPageChange={handlePageChangeTable1}
              onRowsPerPageChange={e => {
                const newSize = Number(e.target.value);

                // if (isFiltered) {
                //   setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
                //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
                // } else {
                setPaginationParams({
                  ...paginationParams,
                  size: newSize,
                  page: 0,
                  timestamp: Date.now()
                });
                // }
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteTest}
              setOpen={setOpenConfirmDeleteTest}
              itemToDelete="Test"
              actionButtonFunction={handleDeleteTestFromDialog}
              actionType="delete"
            />
          </Form>
        );
    }
  };
  // Main modal content
  const conjureFormContentOfChildModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <div>
            <Form layout="inline">
              <MyInput
                fieldName="value"
                fieldType="text"
                record={record}
                setRecord={setRecord}
                showLabel={false}
                placeholder="Search by Name"
                width={'220px'}
                height={32}
              />
            </Form>
            <MyTable
              height={350}
              data={combinedArrayTable2 ?? []}
              totalCount={combinedArrayTable2?.length}
              // data={diagnosticsListResponse?.data?.filter(x => !(catalogDiagnosticsTestListResponse?.data?.tests?.map(item => item.id)).includes(x.id)) ?? []}
              // totalCount={diagnosticsListResponse?.totalCount ?? 0}
              rowClassName={isSelectedOnTable2}
              onRowClick={rowData => {
                setSelectedTestOnTable2(rowData);
              }}
              columns={tableAddTestColumns}
              page={pageIndexForAllTests}
              rowsPerPage={rowsPerPageForAllTests}
              onPageChange={handlePageChangeTable2}
              onRowsPerPageChange={e => {
                const newSize = Number(e.target.value);

                // if (isFiltered) {
                //   setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
                //   handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
                // } else {
                setPaginationParamsForAllTests({
                  ...paginationParamsForAllTests,
                  size: newSize,
                  page: 0,
                  timestamp: Date.now()
                });
                // }
              }}
            />
          </div>
        );
    }
  };

  useEffect(() => {
    const testIds = catalogDiagnosticsTestListResponseWithoutPagination?.data?.tests?.map(item => item.id);
    setLinkForAllTests(diagnosticsListResponse?.links);
    setCombinedArrayTable2(
      diagnosticsListResponse?.data?.filter(
        item =>
          !testIds?.includes(item.id)
      )
    );
  }, [diagnosticsListResponse, catalogDiagnosticsTestListResponseWithoutPagination]);

  

  useEffect(() => {

    setSelectedRows([]);
  }, [diagnosticsTestCatalogHeader]);

  return (
    <ChildModal
      actionChildButtonFunction={handleSaveTest}
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      title="Tests"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Tests', icon: <FaListAlt /> }]}
      childStep={[{ title: 'Add Tests', icon: <FaListAlt /> }]}
      childTitle="Add Tests"
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
      childSize="sm"
    />
  );
};
export default Tests;
