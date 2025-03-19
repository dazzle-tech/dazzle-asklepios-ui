import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, Checkbox  } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useSaveDiagnosticsTestCatalogHeaderMutation,
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDepartmentsQuery,
  useSaveCatalogDiagnosticsTestMutation,
  useGetCatalogDiagnosticsTestListQuery,
  useGetLovValuesByCodeQuery,
  useGetDiagnosticsTestListQuery,
  useGetDiagnosticsTestNotSelectedListQuery,
  useRemoveCatalogDiagnosticTestMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton, Text } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import CheckIcon from '@rsuite/icons/Check';
import { ApCatalogDiagnosticTest, ApDiagnosticTest, ApDiagnosticTestCatalogHeader } from '@/types/model-types';
import { newApCatalogDiagnosticTest, newApDiagnosticTest, newApDiagnosticTestCatalogHeader } from '@/types/model-types-constructor';
import { Form, Stack, Divider, InlineEdit, TagPicker } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  conjureValueBasedOnKeyFromList,
  addFilterToListRequest,
  fromCamelCaseToDBName
} from '@/utils';
import { Console } from 'console';
import NewDiagnosticsTest from '../diagnostics-tests-definition/NewDiagnosticsTest';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const Catalog = () => {
  const dispatch = useAppDispatch();
  const [diagnosticsTestCatalogHeader, setDiagnosticsTestCatalogHeader] = useState<ApDiagnosticTestCatalogHeader>({ ...newApDiagnosticTestCatalogHeader });
  const [catalogDiagnosticsTest, setCatalogDiagnosticsTest] = useState<ApCatalogDiagnosticTest>({
    ...newApCatalogDiagnosticTest
  });
  const [diagnosticsTestSelected, setDiagnosticsTestSelected] = useState<ApDiagnosticTest>({
    ...newApDiagnosticTest
  })
  const  [popupOpen, setPopupOpen] = useState(false);
  const [popupOpentest, setPopupOpentest] = useState(false);
  
  const { data: testTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Catalog</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Catalog'));
  dispatch(setDivContent(divContentHTML));
  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'test_type_lkey',
        operator: 'match',
        value: diagnosticsTestCatalogHeader.typeLkey || undefined, 
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined,
      },
    ];
    setDiagnosticsTestRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [diagnosticsTestCatalogHeader.typeLkey]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'test_type_lkey',
        operator: 'match',
        value: diagnosticsTestCatalogHeader.typeLkey || undefined, 
      },
    ];
    setDiagnosticsTestRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [diagnosticsTestCatalogHeader.typeLkey]);

  
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [diagnosticsTestRequest, setDiagnosticsTestRequest ] = useState<ListRequest>(
    {
      ...initialListRequest,
      pageSize: 100,
      sortBy: 'createdAt',
      sortType: 'desc',
      filters: [
        {
          fieldName: 'test_type_lkey',
          operator: 'match',
          value:  undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    }
  )

 
  
  const [saveDiagnosticsTestCatalogHeader, saveDiagnosticTestCatalogHeaderMutation] = useSaveDiagnosticsTestCatalogHeaderMutation();
  const [saveCatalogDiagnosticsTest, saveCatalogDiagnosticsTestMutation] = useSaveCatalogDiagnosticsTestMutation();
  const [removeCatalogDiagnosticTest, removeCatalogDiagnosticTestMutation] = useRemoveCatalogDiagnosticTestMutation();
  const { data: diagnosticsTest } = useGetDiagnosticsTestListQuery(diagnosticsTestRequest);
  const { data: diagnosticsTestCatalogHeaderListResponse } = useGetDiagnosticsTestCatalogHeaderListQuery(listRequest);
  const diagnosticsTestNotSelectedListResponse = useGetDiagnosticsTestNotSelectedListQuery({
    catalogKey: diagnosticsTestCatalogHeader.key  || undefined, 
    type: diagnosticsTestCatalogHeader.typeLkey || undefined
  });
  const catalogDiagnosticsTestListResponse = useGetCatalogDiagnosticsTestListQuery(  diagnosticsTestCatalogHeader.key);
  
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

  const [catalogDiagnosticsTests, setCatalogDiagnosticsTests] = useState<ApCatalogDiagnosticTest[]>([]);

  const handleDeleteTestFromDialog = (diagnosticsTest) => {
    removeCatalogDiagnosticTest({
      diagnosticTest: diagnosticsTest , 
      catalogKey: diagnosticsTestCatalogHeader.key
    });
    catalogDiagnosticsTestListResponse.refetch() ;
  }

  const handleNew = () => {
    setDiagnosticsTestCatalogHeader({...newApDiagnosticTestCatalogHeader})
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDiagnosticsTestCatalogHeader(diagnosticsTestCatalogHeader).unwrap();
  };

  const handleSaveTest = () => {
    setPopupOpentest(false);
    let testsClone = [...catalogDiagnosticsTests];
    const objectsToSave = selectedRows.map(key => ({
      ...newApCatalogDiagnosticTest,
      testKey: key,
      catalogKey: diagnosticsTestCatalogHeader.key,
    }),
    catalogDiagnosticsTestListResponse.refetch()
  );
    testsClone.push(...objectsToSave);
  
    saveCatalogDiagnosticsTest(objectsToSave)
      .unwrap();
    setCatalogDiagnosticsTests(testsClone);
  };
  


  useEffect(() => {
    if (saveDiagnosticTestCatalogHeaderMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticTestCatalogHeaderMutation.data]);

  useEffect(() => {
    if (catalogDiagnosticsTestListResponse) {
        setCatalogDiagnosticsTest(catalogDiagnosticsTestListResponse.data || []);
    }
}, [catalogDiagnosticsTestListResponse]);

  const isSelected = rowData => {
    if (rowData && diagnosticsTestCatalogHeader && rowData.key === diagnosticsTestCatalogHeader.key) {
      return 'selected-row';
    } else return '';
  };

  const [selectedRows, setSelectedRows] = useState([]);

  const handleCheckboxChange = (key) => {
    setSelectedRows((prev) => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };


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
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <Panel>
      <ButtonToolbar>
        <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleNew}>
          Add New
        </IconButton>
        <IconButton
          disabled={!diagnosticsTestCatalogHeader.key}
          appearance="primary"
          onClick={() => setPopupOpen(true)}
          color="green"
          icon={<EditIcon />}
        >
          Edit Selected
        </IconButton>
        <IconButton
           disabled={true || !diagnosticsTestCatalogHeader.key}
          appearance="primary"
          color="red"
          icon={<TrashIcon />}
        >
          Active/Deactivate
        </IconButton>
        <IconButton
          disabled={!diagnosticsTestCatalogHeader.key}
          appearance="primary"
          onClick={() => setPopupOpentest(true)}
          color="orange"
          icon={<AddOutlineIcon />}
        >
          Add test
        </IconButton>
      </ButtonToolbar>
      <hr />
      <Table
        height={400}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortColumn={(sortBy, sortType) => {
          if (sortBy)
            setListRequest({
              ...listRequest,
              sortBy,
              sortType
            });
        }}
        headerHeight={80}
        rowHeight={60}
        bordered
        cellBordered
        data={diagnosticsTestCatalogHeaderListResponse?.object ?? []}
        onRowClick={rowData => {
          setDiagnosticsTestCatalogHeader(rowData);
        }}
        rowClassName={isSelected}
      >
        <Column sortable flexGrow={2}>
          <HeaderCell align="center">
            <Input onChange={e => handleFilterChange('description', e)} />
            <Translate>Catalog Name</Translate>
          </HeaderCell>
          <Cell dataKey="description" />
        </Column>
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('typeLkey', e)} />
            <Translate>Type</Translate>
          </HeaderCell>
          <Cell>
              {rowData =>
                rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey
              }
            </Cell>
        </Column> 
        <Column sortable flexGrow={2}>
          <HeaderCell  align="center">
            <Input onChange={e => handleFilterChange('departmentKey', e)} />
            <Translate>Department</Translate>
          </HeaderCell>
          <Cell>
               {rowData => (
              <span>
                {conjureValueBasedOnKeyFromList(
                  departmentListResponse?.object ?? [],
                  rowData.departmentKey,
                  'name'

                )}
              </span>
            )}
          </Cell>
        </Column>
        <Column sortable flexGrow={3}>
            <HeaderCell  align="center">
              <Input onChange={e => handleFilterChange('deleted_at', e)} />
              <Translate>Status</Translate>
            </HeaderCell>
            <Cell>
            {rowData =>
              rowData.deletedAt === null  ? 'Active' : 'InActive' 
            }
            </Cell>
            </Column> 
        
      </Table>
      <div style={{ padding: 20 }}>
        <Pagination
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          maxButtons={5}
          size="xs"
          layout={['limit', '|', 'pager']}
          limitOptions={[5, 15, 30]}
          limit={listRequest.pageSize}
          activePage={listRequest.pageNumber}
          onChangePage={pageNumber => {
            setListRequest({ ...listRequest, pageNumber });
          }}
          onChangeLimit={pageSize => {
            setListRequest({ ...listRequest, pageSize });
          }}
          total={diagnosticsTestCatalogHeaderListResponse?.extraNumeric ?? 0}
        />
      </div>
      <br />
      {diagnosticsTestCatalogHeader.key && (
        <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Test</Translate>
            </h5>
          }
        >
          <Table
              bordered
              rowClassName={isSelected}
              data={catalogDiagnosticsTestListResponse.data?.object ?? []}
            >
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Test Code</Table.HeaderCell>
                <Table.Cell dataKey="internalCode"></Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell >Test Name</Table.HeaderCell>
                <Table.Cell dataKey="testName"></Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>International Code</Table.HeaderCell>
                <Table.Cell dataKey="internationalCodeOne"> 
             </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Delete</Table.HeaderCell>
                <Table.Cell> 
                {rowData => ( 
                   <IconButton
                     onClick={() => handleDeleteTestFromDialog(rowData)}
                     icon={<TrashIcon />}
                   />
                  )}
             </Table.Cell>
              </Table.Column>
            </Table>
        </Panel>
      )}

      <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Catalog</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
            <MyInput fieldName="typeLkey" 
             fieldType="select"
             selectData={testTypeLovQueryResponse?.object ?? []}
             selectDataLabel="lovDisplayVale"
             selectDataValue="key"
             record={diagnosticsTestCatalogHeader}
             setRecord={setDiagnosticsTestCatalogHeader} />
            <MyInput fieldName="departmentKey"  
              fieldType="select"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={diagnosticsTestCatalogHeader}
              setRecord={setDiagnosticsTestCatalogHeader}/>
            <MyInput fieldName="description" fieldLabel="Catalog Name" record={diagnosticsTestCatalogHeader} setRecord={setDiagnosticsTestCatalogHeader} />
           
            {/* <InlineEdit placeholder="Click to Add Test ..." showControls={false}>
          <InputPicker 
             style={{ width: 200 }}
             placeholder="per"
             data={diagnosticsTest?.object ?? []}
             value={catalogDiagnosticsTest.testKey}
             onChange={e =>
               setCatalogDiagnosticsTest({
                 ...catalogDiagnosticsTest,
                 testKey: String(e)
               })
             }
             labelKey="testName"
             valueKey="key"
          />
        </InlineEdit> */}


        {/* If we want to add test from New/Edit Dialog */}

         {/*<InlineEdit
    placeholder="Click to add test"
    style={{ width: 300 }}
  >
    <TagPicker
      block 
      style={{ width: 200 }} 
      placeholder="per" 
      data={diagnosticsTestNotSelectedListResponse.data?.object ?? []} 
      value={selectedRows} 
      onChange={selected => setSelectedRows(selected)} 
      labelKey="testName" 
      valueKey="key"
    />
  </InlineEdit>
  <Button appearance="primary" color="green" onClick={handleSaveTest}>
              Add
            </Button> */}
            {/* <Table
            
              bordered
              rowClassName={isSelected}
              onRowClick={rowData => {
                setDiagnosticsTestSelected(rowData);
                console.log(diagnosticsTestSelected)
              }}
              data={catalogDiagnosticsTestListResponse.data?.object ?? []}
            >
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Test Code</Table.HeaderCell>
                <Table.Cell dataKey="internalCode"></Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell >Test Name</Table.HeaderCell>
                <Table.Cell dataKey="testName"></Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>international Code</Table.HeaderCell>
                <Table.Cell dataKey="internationalCodeOne"> 
             </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Delete</Table.HeaderCell>
                <Table.Cell> 
                {rowData => ( 
                   <IconButton
                     onClick={() => handleDeleteTestFromDialog(rowData)}
                     icon={<TrashIcon />}
                   />
                  )}
             </Table.Cell>
              </Table.Column>
            </Table> */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
      <Modal open={popupOpentest} overflow>
        <Modal.Title>
          <Translate>Add Test</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form fluid>
          <Table
              bordered
              rowClassName={isSelected}
              data={diagnosticsTestNotSelectedListResponse.data?.object ?? []}
            >
              
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Test</Table.HeaderCell>
                <Table.Cell>
                {rowData => ( <Checkbox
                    checked={selectedRows.includes(rowData.key)}
                    onChange={() => handleCheckboxChange(rowData.key)}
                      />   )}
                </Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Test Code</Table.HeaderCell>
                <Table.Cell>{rowData => rowData.internalCode}</Table.Cell>
              </Table.Column>
              <Table.Column flexGrow={1}>
                <Table.HeaderCell>Test Name</Table.HeaderCell>
                <Table.Cell>{rowData => rowData.testName}</Table.Cell>
              </Table.Column>
            </Table>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={handleSaveTest}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setPopupOpentest(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
    </Panel>
  );
};

export default Catalog;
