import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, Modal, Pagination, Panel, Table, Checkbox, TagPicker, List } from 'rsuite';
import CheckIcon from '@rsuite/icons/Check';
import CloseIcon from '@rsuite/icons/Close';
import PageIcon from '@rsuite/icons/Page';
import EventDetailIcon from '@rsuite/icons/EventDetail';
import {
  FlexboxGrid,
  Grid,
  Row,
  Col,
  Text,
  InputGroup,
  SelectPicker,
  DatePicker,
  Dropdown
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetFacilitiesQuery,
  useGetDepartmentsQuery,
  useSaveDepartmentMutation,
  useGetDiagnosticsTestNormalRangeListQuery,
  useSaveDiagnosticsTestNormalRangeMutation,
  useGetLovsQuery,
  useRemoveDiagnosticsTestNormalRangeMutation
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { Form, Stack, Divider, PanelGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import { MdSave } from 'react-icons/md';
import { Plus, Trash } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetLovValuesByCodeQuery,
  useGetDiagnosticsTestLaboratoryListQuery
} from '@/services/setupService';
import { ApDiagnosticTestNormalRange } from '@/types/model-types';
import { newApDiagnosticTestNormalRange } from '@/types/model-types-constructor';
const NormalRangeSetup = ({ popUpOpen, setPopUpOpen, diagnosticsTest }) => {
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });
  const [lovCode, setLovCode] = useState('');
  const [preKey, setPreKey] = useState('');
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  const { data: conditionLovQueryResponse } = useGetLovValuesByCodeQuery('NORANGE_CONDITIONS');
  const { data: testResultTypeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_RESULT_TYPE');
  const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery(
    'LAB_NORMRANGE_VALUE_TYPE'
  );
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
  const [normalRangeListRequest, setNormalRangeListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [isActive, setIsActive] = useState(false);
  const dispatch = useAppDispatch();
  const [itemsListRequest, setItemsListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  const { data: labrotoryDetailsQueryResponse } =
    useGetDiagnosticsTestLaboratoryListQuery(listRequest);
  const { data: normalRangeListResponse, refetch: refetchNormalRange } =
    useGetDiagnosticsTestNormalRangeListQuery(listRequest);
  const [saveDiagnosticsTestNormalRange, saveDiagnosticsTestNormalRangeMutation] =
    useSaveDiagnosticsTestNormalRangeMutation();
  const [removeDiagnosticsTestNormalRange, removeDiagnosticsTestNormalRangeMutation] =
    useRemoveDiagnosticsTestNormalRangeMutation();
  const [searchKeyword, setSearchKeyword] = useState('');
  const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
    skip: !searchKeyword || searchKeyword == ''
  });

  const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.lovCode} - ${item.lovName}`
  }));

  const isSelected = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.key) {
      return 'selected-row';
    } else return '';
  };

  const handleNew = () => {
    setIsActive(true);
    setDiagnosticTestNormalRange({
      ...newApDiagnosticTestNormalRange,
      ageToUnitLkey: null,
      ageFromUnitLkey: null,
      normalRangeTypeLkey: null,
      resultLovKey: null
    });
  };

  const handleSave = async () => {
    try {
      await saveDiagnosticsTestNormalRange({
        diagnosticTestNormalRange: { ...diagnosticTestNormalRange, testKey: diagnosticsTest.key },
        lov: selectedLOVs
      }).unwrap();
      refetchNormalRange();
      dispatch(notify('Normal Range Saved Successfully'));
    } catch (error) {
      console.error('Error saving Normal Range:', error);
    }
  };

  const handleRemove = () => {
    removeDiagnosticsTestNormalRange({
      ...diagnosticTestNormalRange,
      deletedBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchNormalRange());
    dispatch(notify('Deleted Successfully '));
  };

  useEffect(() => {
    if (diagnosticTestNormalRange) {
      setSelectedLOVs(diagnosticTestNormalRange.lovList);
    } else {
      setDiagnosticTestNormalRange(newApDiagnosticTestNormalRange);
    }
  }, [diagnosticTestNormalRange]);
  const handleSearch = value => {
    setSearchKeyword(value);
  };
  useEffect(() => {
    if (searchKeyword?.trim() !== '') {
      setListLovRequest({
        ...listLovRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'lov_code',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          },
          {
            fieldName: 'lov_name',
            operator: 'containsIgnoreCase',
            value: searchKeyword
          }
        ]
      });
    }
  }, [searchKeyword]);
  useEffect(() => {
    setDiagnosticTestNormalRange({
      ...newApDiagnosticTestNormalRange,
      ageToUnitLkey: null,
      ageFromUnitLkey: null,
      normalRangeTypeLkey: null,
      resultLovKey: null
    });
    if (saveDiagnosticsTestNormalRangeMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestNormalRangeMutation.data]);

  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
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

    setDiagnosticTestNormalRange(prevState => ({
      ...prevState,
      testKey: diagnosticsTest.key
    }));

    setLovCode(null);
  }, [diagnosticsTest.key]);

  return (
    <Modal open={popUpOpen} size="full" overflow>
      <Modal.Title>
        <Translate>Add/Edit Normal Range Setup</Translate>
      </Modal.Title>
      <Modal.Body>
        <Form layout="inline" fluid>
          <MyInput
            disabled={!isActive}
            fieldName="genderLkey"
            fieldType="select"
            selectData={genderLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />

          <MyInput
            width={100}
            disabled={!isActive}
            fieldName="ageFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
          <MyInput
            disabled={!isActive}
            fieldName="ageFromUnitLkey"
            fieldType="select"
            selectData={ageunitsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
          <MyInput
            width={100}
            disabled={!isActive}
            fieldName="ageTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
          <MyInput
            disabled={!isActive}
            fieldName="ageToUnitLkey"
            fieldType="select"
            selectData={ageunitsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
          <MyInput
            disabled={!isActive}
            fieldName="conditionLkey"
            fieldType="select"
            selectData={conditionLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        </Form>
        <Form layout="inline" fluid style={{ display: 'flex' }}>
          <MyInput
            disabled={true}
            fieldName="resultUnitLkey"
            fieldType="select"
            selectData={ValueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={labrotoryDetailsQueryResponse?.object[0]}
            setRecord={''}
          />

          <MyInput
            disabled={!isActive}
            fieldName="resultTypeLkey"
            fieldType="select"
            selectData={testResultTypeLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />

          {diagnosticTestNormalRange.resultTypeLkey === '6209569237704618' && (
            <MyInput
              fieldName="normalRangeTypeLkey"
              fieldType="select"
              selectData={normalRangeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          )}

          {diagnosticTestNormalRange.normalRangeTypeLkey === '6221150241292558' && (
            <>
              <MyInput
                width={100}
                fieldLabel=""
                fieldName="rangeFrom"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />

              <MyInput
                width={100}
                fieldLabel="-"
                fieldName="rangeTo"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
            </>
          )}

          {diagnosticTestNormalRange.normalRangeTypeLkey === '6221162489019880' && (
            <MyInput
              width={100}
              fieldLabel=""
              fieldName="rangeFrom"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          )}

          {diagnosticTestNormalRange.normalRangeTypeLkey === '6221175556193180' && (
            <MyInput
              width={100}
              fieldLabel=""
              fieldName="rangeTo"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          )}

          {diagnosticTestNormalRange.resultTypeLkey === '6209578532136054' && (
            <>
              <InputGroup disabled={!isActive} inside style={{ width: '300px', marginTop: '20px' }}>
                <Input placeholder={'Search LOV'} value={searchKeyword} onChange={handleSearch} />
                <InputGroup.Button>
                  <SearchIcon />
                </InputGroup.Button>
              </InputGroup>
              {searchKeyword && (
                <Dropdown.Menu
                  className="dropdown-menuresult"
                  style={{
                    position: 'absolute',
                    zIndex: 9999,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {modifiedData &&
                    modifiedData?.map(mod => (
                      <Dropdown.Item
                        key={mod.key}
                        eventKey={mod.key}
                        onClick={() => {
                          setDiagnosticTestNormalRange({
                            ...diagnosticTestNormalRange,
                            resultLovKey: mod.key
                          });
                          setLovCode(mod.lovCode);
                          setSearchKeyword('');
                        }}
                      >
                        <span style={{ marginRight: '19px' }}>{mod.lovCode}</span>
                        <span>{mod.lovName}</span>
                      </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
              )}
              <Input
                disabled={true}
                style={{ width: '300px' }}
                value={
                  lovListResponseData?.object.find(
                    item => item.key === diagnosticTestNormalRange?.resultLovKey
                  )
                    ? `${
                        lovListResponseData.object.find(
                          item => item.key === diagnosticTestNormalRange?.resultLovKey
                        )?.lovCode
                      }, ${
                        lovListResponseData.object.find(
                          item => item.key === diagnosticTestNormalRange?.resultLovKey
                        )?.lovName
                      }`
                    : ''
                }
              />

              <MyInput
                width={360}
                column
                fieldLabel="Lovs"
                selectData={lovQueryResponse?.object ?? []}
                fieldType="multyPicker"
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName="lovList"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
            </>
          )}

          <br />
        </Form>
        <Form layout="inline" fluid>
          <MyInput
            disabled={!isActive}
            width={400}
            fieldName="criticalValue"
            fieldType="checkbox"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />

          {diagnosticTestNormalRange.criticalValue === true && (
            <>
              <MyInput
                width={100}
                fieldLabel="Less Than"
                fieldName="criticalValueLessThan"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
              <MyInput
                width={100}
                fieldLabel="More Than"
                fieldName="criticalValueMoreThan"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
            </>
          )}
        </Form>
        <Form layout="inline" fluid>
          <ButtonToolbar style={{ margin: '6px' }}>
            <IconButton
              size="xs"
              appearance="primary"
              color="blue"
              icon={<Plus />}
              onClick={handleNew}
            />
            <IconButton
              disabled={!isActive}
              size="xs"
              onClick={handleSave}
              appearance="primary"
              color="green"
              icon={<MdSave />}
            />
            <IconButton
              disabled={!diagnosticTestNormalRange.key}
              size="xs"
              onClick={handleRemove}
              appearance="primary"
              color="red"
              icon={<Trash />}
            />
          </ButtonToolbar>
          <Table
            rowClassName={isSelected}
            bordered
            data={normalRangeListResponse?.object ?? []}
            onRowClick={rowData => {
              setDiagnosticTestNormalRange(rowData);
            }}
          >
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Gender</Table.HeaderCell>
              <Table.Cell>
                {rowData =>
                  rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
                }
              </Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Age From - To</Table.HeaderCell>
              <Table.Cell>
                {rowData => (
                  <Text>
                    {rowData.ageFrom}
                    {rowData.ageFromUnitLvalue
                      ? rowData.ageFromUnitLvalue.lovDisplayVale
                      : rowData.ageFromUnitLkey}{' '}
                    - {rowData.ageTo}
                    {rowData.ageToUnitLvalue
                      ? rowData.ageToUnitLvalue.lovDisplayVale
                      : rowData.ageToUnitLkey}
                  </Text>
                )}
              </Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Normal Range</Table.HeaderCell>
              <Table.Cell>
                {rowData =>
                  rowData.resultTypeLkey === '6209569237704618' ? (
                    <Text>
                      {rowData.rangeFrom} - {rowData.rangeTo}
                    </Text>
                  ) : (
                    <Text>
                      {rowData.rangeFrom} {rowData.rangeTo}
                    </Text>
                  )
                }
              </Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>LOV Values</Table.HeaderCell>
              <Table.Cell>{rowData => <Text>{rowData.lovList}</Text>}</Table.Cell>
            </Table.Column>
            {/*
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Resource Type</Table.HeaderCell>
                  <Table.Cell>
                  {rowData => rowData.resourceTypeLvalue ? rowData.resourceTypeLvalue.lovDisplayVale : rowData.resourceTypeLkey}
                 
                  </Table.Cell>
                </Table.Column> */}
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Condition</Table.HeaderCell>
              <Table.Cell>
                {rowData =>
                  rowData.conditionLvalue
                    ? rowData.conditionLvalue.lovDisplayVale
                    : rowData.conditionLkey
                }
              </Table.Cell>
            </Table.Column>
            <Table.Column flexGrow={1}>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.Cell>
                {rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')}
              </Table.Cell>
            </Table.Column>
          </Table>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Stack spacing={2} divider={<Divider vertical />}>
          <Button appearance="primary" color="red" onClick={() => setPopUpOpen(false)}>
            Cancel
          </Button>
        </Stack>
      </Modal.Footer>
    </Modal>
  );
};

export default NormalRangeSetup;
