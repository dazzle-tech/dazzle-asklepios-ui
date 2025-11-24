import React, { useState, useEffect } from 'react';
import {
  useSaveCatalogDiagnosticsTestMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import { Checkbox, Form } from 'rsuite';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import { ApCatalogDiagnosticTest } from '@/types/model-types';
import MyTable from '@/components/MyTable';
import ChildModal from '@/components/ChildModal';
import MyInput from '@/components/MyInput';
import { MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetAllDiagnosticTestsByNameAndTypeQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useAddTestsToCatalogMutation, useGetCatalogTestsQuery, useRemoveTestFromCatalogMutation } from '@/services/setup/catalog/catalogTestService';


const Tests = ({ open, setOpen, diagnosticsTestCatalogHeader }) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ value: '' });
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openConfirmDeleteTest, setOpenConfirmDeleteTest] = useState<boolean>(false);
  const [pageIndexTable1, setPageIndexTable1] = useState(0);
  const [rowsPerPageTable1, setRowsPerPageTable1] = useState(5);
  const [combinedArrayTable1, setCombinedArrayTable1] = useState([]);
  const [paginatedDataTable1, setPaginatedDataTable1] = useState([]);
  const [selectedTestOnTable1, setSelectedTestOnTable1] = useState();
   const [selectedTestKeys, setSelectedTestKeys] = useState([]); // arr of keys for selected tests
  const [pageIndexTable2, setPageIndexTable2] = useState(0);
  const [rowsPerPageTable2, setRowsPerPageTable2] = useState(5);
  const [combinedArrayTable2, setCombinedArrayTable2] = useState([]);
  const [paginatedDataTable2, setPaginatedDataTable2] = useState([]);
  const [selectedTestOnTable2, setSelectedTestOnTable2] = useState();
 
  const [paginationParamsForAllTests, setPaginationParamsForAllTests] = useState({
        page: 0,
        size: 5,
        sort: 'id,asc',
        timestamp: Date.now()
      });
  // Fetch diagnostics test list response(all tests for specific type)

  const {data: diagnosticsListResponse} = useGetAllDiagnosticTestsByNameAndTypeQuery({ type: diagnosticsTestCatalogHeader.type,name: record['value'], ...paginationParamsForAllTests });
  // Fetch selected diagnostics test list response for catalog
  // const catalogDiagnosticsTestListResponse = useGetCatalogDiagnosticsTestListQuery(
  //   diagnosticsTestCatalogHeader.key
  // );

  const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: 'id,asc',
      timestamp: Date.now()
    });
    
 const { data: catalogDiagnosticsTestListResponse } =
  useGetCatalogTestsQuery(
    {
      catalogId: diagnosticsTestCatalogHeader?.id,
      ...paginationParams, // page, size, sort
    },
    {
      skip: !diagnosticsTestCatalogHeader?.id,
    }
  );


  // remove test
  const [removeTest] = useRemoveTestFromCatalogMutation();
  // save tests
  const [saveCatalogDiagnosticsTest] = useSaveCatalogDiagnosticsTestMutation();

  const [addTestsToCatalog] = useAddTestsToCatalogMutation();

   // class name for selected row
  const isSelectedOnTable1 = rowData => {
    if (rowData && selectedTestOnTable1 && rowData === selectedTestOnTable1) {
      return 'selected-row';
    } else return '';
  };

 // class name for selected row
  const isSelectedOnTable2 = rowData => {
    if (rowData && selectedTestOnTable2 && rowData === selectedTestOnTable2) {
      return 'selected-row';
    } else return '';
  };
   // Icons column (delete)
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
      key: 'internalCode',
      title: 'Test Code'
    },
    {
      key: 'testName',
      title: 'Test Name'
    },
    {
      key: 'internationalCodeOne',
      title: 'International Code'
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
      title: 'Test Name',
    },
    {
      key: 'internalCode',
      title: 'Code',
    } 
  ];

  // Handle page change in navigation
  const handlePageChangeTable1 = (_: unknown, newPage: number) => {
    setPageIndexTable1(newPage);
  };

  // Handle change rows per page in navigation
  const handleRowsPerPageChangeTable1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageTable1(parseInt(event.target.value, 10));
    setPageIndexTable1(0);
  };

   // Handle page change in navigation
  const handlePageChangeTable2 = (_: unknown, newPage: number) => {
    setPageIndexTable2(newPage);
  };

  // Handle change rows per page in navigation
  const handleRowsPerPageChangeTable2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageTable2(parseInt(event.target.value, 10));
    setPageIndexTable2(0);
  };
  
  // handle delete test from selected list
  const handleDeleteTestFromDialog = () => {
    setOpenConfirmDeleteTest(false);
    removeTest({
      catalogId: diagnosticsTestCatalogHeader?.id,
      testId: selectedTestOnTable1
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
      }).catch(() => {
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
    console.log(diagnosticsTestCatalogHeader);
    addTestsToCatalog({catalogId: diagnosticsTestCatalogHeader?.id, body: {testIds: selectedRows}})
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
              height={350}
              rowClassName={isSelectedOnTable1}
              onRowClick={rowData => {
                setSelectedTestOnTable1(rowData);
              }}
              // data={paginatedDataTable1 ?? []}
              data={catalogDiagnosticsTestListResponse?.data?.testIds ?? []}
              // loading={catalogDiagnosticsTestListResponse.isFetching}
              columns={tableColumns}
              page={pageIndexTable1}
              rowsPerPage={rowsPerPageTable1}
              totalCount={totalCountForCatalogTests}
              onPageChange={handlePageChangeTable1}
              onRowsPerPageChange={handleRowsPerPageChangeTable1}
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

              // data={diagnosticsListResponse?.data ?? []}
              rowClassName={isSelectedOnTable2}
              onRowClick={rowData => {
                setSelectedTestOnTable2(rowData);
              }}
              columns={tableAddTestColumns}
               page={pageIndexTable2}
              rowsPerPage={rowsPerPageTable2}
              totalCount={combinedArrayTable2?.length}
              onPageChange={handlePageChangeTable2}
              onRowsPerPageChange={handleRowsPerPageChangeTable2}
            />
          </div>
        );
    }
  };
  //Effects
//  useEffect(() => {
//     setCombinedArrayTable1(Object.values(catalogDiagnosticsTestListResponse?.data ?? {}));
//     setSelectedTestKeys(catalogDiagnosticsTestListResponse?.data?.map(item => item.key) ?? []);
//   }, [catalogDiagnosticsTestListResponse]);

  useEffect(() => {
    console.log("in effect");
    setCombinedArrayTable2(diagnosticsListResponse?.data?.filter(
    item =>
      // item.name.toLowerCase().includes(record['value'].toLowerCase()) &&
      !catalogDiagnosticsTestListResponse?.data?.testIds.includes(item.id)
  ));
  }, [diagnosticsListResponse, selectedTestKeys, catalogDiagnosticsTestListResponse]);

  useEffect(() => {
    setPaginatedDataTable1(
      combinedArrayTable1?.slice(pageIndexTable1 * rowsPerPageTable1, pageIndexTable1 * rowsPerPageTable1 + rowsPerPageTable1)
    );
  }, [combinedArrayTable1, pageIndexTable1, rowsPerPageTable1]);
  useEffect(() => {
    setPaginatedDataTable2(
      combinedArrayTable2?.slice(pageIndexTable2 * rowsPerPageTable2, pageIndexTable2 * rowsPerPageTable2 + rowsPerPageTable2)
    );
  }, [combinedArrayTable2, pageIndexTable2, rowsPerPageTable2]);

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
