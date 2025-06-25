import React, { useState, useEffect } from 'react';
import {
  useGetCatalogDiagnosticsTestListQuery,
  useGetDiagnosticsTestListQuery,
  useRemoveCatalogDiagnosticTestMutation,
  useSaveCatalogDiagnosticsTestMutation
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaListAlt } from 'react-icons/fa';
import { Checkbox, Form } from 'rsuite';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import { ApCatalogDiagnosticTest } from '@/types/model-types';
import { newApCatalogDiagnosticTest } from '@/types/model-types-constructor';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import ChildModal from '@/components/ChildModal';
import MyInput from '@/components/MyInput';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

const Tests = ({ open, setOpen, diagnosticsTestCatalogHeader }) => {
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ value: '' });
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [openConfirmDeleteTest, setOpenConfirmDeleteTest] = useState<boolean>(false);
  const [catalogDiagnosticsTests, setCatalogDiagnosticsTests] = useState<ApCatalogDiagnosticTest[]>([]);
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
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'test_type_Lkey',
        operator: 'match',
        value: diagnosticsTestCatalogHeader.typeLkey
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  // Fetch diagnostics test list response(all tests for specific type)
  const {data: diagnosticsListResponse} = useGetDiagnosticsTestListQuery(listRequest);
  // Fetch selected diagnostics test list response for catalog
  const catalogDiagnosticsTestListResponse = useGetCatalogDiagnosticsTestListQuery(
    diagnosticsTestCatalogHeader.key
  );
  // remove test
  const [removeCatalogDiagnosticTest] = useRemoveCatalogDiagnosticTestMutation();
  // save tests
  const [saveCatalogDiagnosticsTest] = useSaveCatalogDiagnosticsTestMutation();

   // class name for selected row
  const isSelectedOnTable1 = rowData => {
    if (rowData && selectedTestOnTable1 && rowData.key === selectedTestOnTable1.key) {
      return 'selected-row';
    } else return '';
  };

 // class name for selected row
  const isSelectedOnTable2 = rowData => {
    if (rowData && selectedTestOnTable2 && rowData.key === selectedTestOnTable2.key) {
      return 'selected-row';
    } else return '';
  };
   // Icons column (delete)
  const iconsForActions = () => (
    <div className="container-of-icons-catalog">
      <MdDelete
        className="icons-catalog"
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
      title: <Translate>Test Code</Translate>
    },
    {
      key: 'testName',
      title: <Translate>Test Name</Translate>
    },
    {
      key: 'internationalCodeOne',
      title: <Translate>International Code</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  //Table columns
  const tableAddTestColumns = [
    {
      key: 'test',
      title: <Translate>Test</Translate>,
      render: rowData => (
        <Checkbox
          checked={selectedRows.includes(rowData.key)}
          onChange={() => handleCheckboxChange(rowData.key)}
        />
      )
    },
    {
      key: 'code',
      title: <Translate>Test Code</Translate>,
      render: rowData => rowData.internalCode
    },
    {
      key: 'name',
      title: <Translate>Test Name</Translate>,
      render: rowData => rowData.testName
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
    removeCatalogDiagnosticTest({
      diagnosticTest: selectedTestOnTable1,
      catalogKey: diagnosticsTestCatalogHeader.key
    })
      .unwrap()
      .then(() => {
        catalogDiagnosticsTestListResponse.refetch();
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
    let testsClone = [...catalogDiagnosticsTests];
    const objectsToSave = selectedRows.map(key => ({
      ...newApCatalogDiagnosticTest,
      testKey: key,
      catalogKey: diagnosticsTestCatalogHeader.key
    }));
    testsClone.push(...objectsToSave);
    saveCatalogDiagnosticsTest(objectsToSave)
      .unwrap()
      .then(() => {
        catalogDiagnosticsTestListResponse.refetch();
        // newList.refetch();
        dispatch(notify({ msg: 'The Tests have been saved successfully', sev: 'success' }));
      });
    setCatalogDiagnosticsTests(testsClone);
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
            <div className="container-of-add-new-button-catalog">
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
              data={paginatedDataTable1 ?? []}
              loading={catalogDiagnosticsTestListResponse.isFetching}
              columns={tableColumns}
              page={pageIndexTable1}
              rowsPerPage={rowsPerPageTable1}
              totalCount={combinedArrayTable1.length}
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
              data={paginatedDataTable2 ?? []}
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
 useEffect(() => {
    setCombinedArrayTable1(Object.values(catalogDiagnosticsTestListResponse?.data?.object ?? {}));
    setSelectedTestKeys(catalogDiagnosticsTestListResponse?.data?.object?.map(item => item.key) ?? []);
  }, [catalogDiagnosticsTestListResponse]);

  useEffect(() => {
    setCombinedArrayTable2(diagnosticsListResponse?.object?.filter(
    item =>
      item.testName.toLowerCase().includes(record['value'].toLowerCase()) &&
      !selectedTestKeys.includes(item.key)
  ));
  }, [diagnosticsListResponse, selectedTestKeys]);

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
    const updatedFilters = [
      {
        fieldName: 'test_type_Lkey',
        operator: 'match',
        value: diagnosticsTestCatalogHeader.typeLkey
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [diagnosticsTestCatalogHeader]);

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
