import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetDiagnosticsTestNormalRangeListQuery,
  useGetDiagnosticsTestProfileListQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery,
  useRemoveDiagnosticsTestProfileMutation,
  useSaveDiagnosticsTestProfileMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Dropdown, Form, Input, InputGroup } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest } from '@/types/types';
import { MdDelete } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaChartLine } from 'react-icons/fa';
import { ApDiagnosticTestNormalRange, ApDiagnosticTestProfile } from '@/types/model-types';
import {
  newApDiagnosticTestNormalRange,
  newApDiagnosticTestProfile
} from '@/types/model-types-constructor';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import SearchIcon from '@rsuite/icons/Search';

const Profile = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  
   const [lovCode, setLovCode] = useState('');
  const [diagnosticsTestProfile, setDiagnosticsTestProfile] = useState<ApDiagnosticTestProfile>({
    ...newApDiagnosticTestProfile
  });
   const [searchKeyword, setSearchKeyword] = useState('');

  const [newDiagnosticsTestProfile, setNewDiagnosticsTestProfile] =
    useState<ApDiagnosticTestProfile>({
      ...newApDiagnosticTestProfile
    });

    const [listRequestQuery, setListRequestQuery] = useState({
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
 const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });

  const { data: unitsLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch gender Lov response
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // Fetch age units Lov response
  const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  // Fetch condition Lov response
  const { data: conditionLovQueryResponse } = useGetLovValuesByCodeQuery('NORANGE_CONDITIONS');
  // Fetch Value Unit Lov response
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch labrotory Details response
  const { data: labrotoryDetailsQueryResponse } =
    useGetDiagnosticsTestLaboratoryListQuery(listRequestQuery);
    // Fetch test Result Type Lov response
      const { data: testResultTypeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_RESULT_TYPE');
       // Fetch normal Range Lov response
        const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery(
          'LAB_NORMRANGE_VALUE_TYPE'
        );
        // Fetch lov response
          const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
        // Fetch lov List response
          const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
            skip: !searchKeyword || searchKeyword == ''
          });
          // customise item appears on the selected lov list
  const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.lovCode} - ${item.lovName}`
  }));
  const [openConfirmDeleteProfile, setOpenConfirmDeleteProfile] = useState<boolean>(false);
  const [saveDiagnosticsTestProfile] = useSaveDiagnosticsTestProfileMutation();
  const [removeDiagnosticsTestProfile] = useRemoveDiagnosticsTestProfileMutation();
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'diagnostic_test_key',
        operator: 'match',
        value: diagnosticsTest?.key || undefined || null
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const {
    data: diagnosticsTestProfileListResponse,
    refetch: refetchDiagnosticsTestProfile,
    isFetching
  } = useGetDiagnosticsTestProfileListQuery(listRequest);
  const [normalRangeListRequest, setNormalRangeListRequest] = useState({
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
      },
      {
        fieldName: 'is_profile',
        operator: 'match',
        value: true
      },
      {
        fieldName: 'profile_test_key',
        operator: 'match',
        value: diagnosticsTestProfile.key || undefined
      }
    ]
  });
  const {
    data: normalRangeListResponse,
    refetch: refetchNormalRange,
    isFetching: isFetchingNormalRanges
  } = useGetDiagnosticsTestNormalRangeListQuery(normalRangeListRequest);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });

    // handle search about lov
  const handleSearch = value => {
    setSearchKeyword(value);
  };

  useEffect(() => {
    refetchDiagnosticsTestProfile();
    setListRequest({
      ...initialListRequest,
      pageSize: 100,
      filters: [
        {
          fieldName: 'diagnostic_test_key',
          operator: 'match',
          value: diagnosticsTest?.key || undefined || null
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });
  }, [diagnosticsTest]);

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
    setNormalRangeListRequest({
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
        },
        {
          fieldName: 'is_profile',
          operator: 'match',
          value: true
        },
        {
          fieldName: 'profile_test_key',
          operator: 'match',
          value: diagnosticsTestProfile.key || undefined
        }
      ]
    });
    refetchNormalRange();
  }, [diagnosticsTestProfile, diagnosticsTest]);
  const isSelected = rowData => {
    if (rowData && diagnosticsTestProfile && rowData.key === diagnosticsTestProfile.key) {
      return 'selected-row';
    } else return '';
  };

  const isSelectedDiagnosticTestNormalRange = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons-practitioners">
      <MdDelete
        className="icons-practitioners"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteProfile(true);
        }}
      />
      <FaChartLine
        className="icons-practitioners"
        title="Test Normal Ranges"
        size={21}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChild(true);
        }}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'testName',
      title: <Translate>Test Name</Translate>,
      render: rowData => <span>{rowData.testName}</span>
    },
    {
      key: 'LovValues',
      title: <Translate>Result Unit</Translate>,
      render: rowData => (
        <span>
          {rowData.resultUnitLvalue
            ? rowData.resultUnitLvalue.lovDisplayVale
            : rowData.resultUnitLkey}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  //Table columns
  const tableNormalRangesColumns = [
    {
      key: 'gender',
      title: <Translate>Gender</Translate>,
      render: rowData =>
        rowData.genderLvalue ? rowData.genderLvalue.lovDisplayVale : rowData.genderLkey
    },
    {
      key: 'ageFromTo',
      title: <Translate>Age From - To</Translate>,
      render: rowData => (
        <span>
          {rowData.ageFrom}
          {rowData.ageFromUnitLvalue
            ? rowData.ageFromUnitLvalue.lovDisplayVale
            : rowData.ageFromUnitLkey}{' '}
          - {rowData.ageTo}
          {rowData.ageToUnitLvalue ? rowData.ageToUnitLvalue.lovDisplayVale : rowData.ageToUnitLkey}
        </span>
      )
    },
    {
      key: 'normalRange',
      title: <Translate>Normal Range</Translate>,
      render: rowData =>
        rowData.resultTypeLkey === '6209569237704618' ? (
          <span>
            {rowData.rangeFrom} - {rowData.rangeTo}
          </span>
        ) : (
          <span>
            {rowData.rangeFrom} {rowData.rangeTo}
          </span>
        )
    },
    {
      key: 'lovValues',
      title: <Translate>LOV Values</Translate>,
      render: rowData => <span>{rowData.lovList}</span>
    },
    {
      key: 'condition',
      title: <Translate>Condition</Translate>,
      render: rowData =>
        rowData.conditionLvalue ? rowData.conditionLvalue.lovDisplayVale : rowData.conditionLkey
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    }
  ];

  const handleSave = () => {
    saveDiagnosticsTestProfile({
      ...newDiagnosticsTestProfile,
      diagnosticTestKey: diagnosticsTest.key,
      createdBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Added Successfully '));

    setNewDiagnosticsTestProfile({
      ...newApDiagnosticTestProfile,
      diagnosticTestKey: diagnosticsTest.key,
      resultUnitLkey: null
    });
  };

  const handleRemove = () => {
    setOpenConfirmDeleteProfile(false);
    removeDiagnosticsTestProfile({
      ...diagnosticsTestProfile,
      deletedBy: 'Administrator'
    })
      .unwrap()
      .then(() => refetchDiagnosticsTestProfile());
    dispatch(notify('Deleted Successfully '));
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <MyInput
                  width={150}
                  showLabel={false}
                  placeholder="Test Name"
                  fieldName="testName"
                  record={newDiagnosticsTestProfile}
                  setRecord={setNewDiagnosticsTestProfile}
                />
                <MyInput
                  showLabel={false}
                  placeholder="Select Result Unit"
                  width={160}
                  menuMaxHeight={200}
                  fieldName="resultUnitLkey"
                  fieldType="select"
                  selectData={unitsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={newDiagnosticsTestProfile}
                  setRecord={setNewDiagnosticsTestProfile}
                />
              </div>
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={handleSave}
                width="109px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={380}
              data={diagnosticsTestProfileListResponse?.object ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelected}
              // filters={filters()}
              onRowClick={rowData => {
                setDiagnosticsTestProfile(rowData);
              }}
              // sortColumn={listRequest.sortBy}
              // sortType={listRequest.sortType}
              // onSortChange={(sortBy, sortType) => {
              //   if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              // }}
              // page={pageIndex}
              // rowsPerPage={rowsPerPage}
              // totalCount={totalCount}
              // onPageChange={handlePageChange}
              // onRowsPerPageChange={handleRowsPerPageChange}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteProfile}
              setOpen={setOpenConfirmDeleteProfile}
              itemToDelete="Profile Test"
              actionButtonFunction={handleRemove}
              actionType="Delete"
            />
            {/* <Table
                                    rowClassName={isSelected}
                                    bordered
                                    data={diagnosticsTestProfileListResponse?.object || []}
                                    onRowClick={rowData => {
                                        setDiagnosticsTestProfile(rowData);
                                    }}

                                >
                                    <Table.Column flexGrow={1}>
                                        <Table.HeaderCell>Test Name</Table.HeaderCell>
                                        <Table.Cell>
                                            {rowData => <Text>{rowData.testName}</Text>}
                                        </Table.Cell>
                                    </Table.Column>
                                    <Table.Column flexGrow={1}>
                                        <Table.HeaderCell>Result Unit</Table.HeaderCell>
                                        <Table.Cell>
                                            {rowData => <Text>{rowData.resultUnitLvalue ? rowData.resultUnitLvalue.lovDisplayVale : rowData.resultUnitLkey}</Text>}
                                        </Table.Cell>
                                    </Table.Column>
                                </Table> */}
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form fluid>
        <div className="container-of-add-new-button-practitioners">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            // onClick={() => {

            // }}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={380}
          data={normalRangeListResponse?.object ?? []}
          loading={isFetchingNormalRanges}
          columns={tableNormalRangesColumns}
          rowClassName={isSelectedDiagnosticTestNormalRange}
          // filters={filters()}
          onRowClick={rowData => {
            setDiagnosticTestNormalRange(rowData);
          }}
          // sortColumn={listRequest.sortBy}
          // sortType={listRequest.sortType}
          // onSortChange={(sortBy, sortType) => {
          //   if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
          // }}
          // page={pageIndex}
          // rowsPerPage={rowsPerPage}
          // totalCount={totalCount}
          // onPageChange={handlePageChange}
          // onRowsPerPageChange={handleRowsPerPageChange}
        />

        {/* <Table
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
                                               {rowData => <Text>{rowData.ageFrom}{rowData.ageFromUnitLvalue ? rowData.ageFromUnitLvalue.lovDisplayVale : rowData.ageFromUnitLkey} - {rowData.ageTo}{rowData.ageToUnitLvalue ? rowData.ageToUnitLvalue.lovDisplayVale : rowData.ageToUnitLkey}
       
                                               </Text>}
                                           </Table.Cell>
                                       </Table.Column>
                                       <Table.Column flexGrow={1}>
                                           <Table.HeaderCell>Normal Range</Table.HeaderCell>
                                           <Table.Cell>
                                               {rowData => (rowData.resultTypeLkey === '6209569237704618') ? <Text>{rowData.rangeFrom} - {rowData.rangeTo}</Text> : <Text>{rowData.rangeFrom} {rowData.rangeTo}</Text>}
                                           </Table.Cell>
                                       </Table.Column>
                                       <Table.Column flexGrow={1}>
                                           <Table.HeaderCell>LOV Values</Table.HeaderCell>
                                           <Table.Cell>
                                               {rowData => <Text>{rowData.lovList}</Text>}
                                           </Table.Cell>
                                       </Table.Column>
                                       <Table.Column flexGrow={1}>
                                           <Table.HeaderCell>Condition</Table.HeaderCell>
                                           <Table.Cell>
                                               {rowData => rowData.conditionLvalue ? rowData.conditionLvalue.lovDisplayVale : rowData.conditionLkey}
                                           </Table.Cell>
                                       </Table.Column>
                                       <Table.Column flexGrow={1}>
                                           <Table.HeaderCell>Status</Table.HeaderCell>
                                           <Table.Cell>
                                               {rowData =>
                                                   rowData.deletedAt === null ? 'Active' : 'InActive'
                                               }
                                           </Table.Cell>
                                       </Table.Column>
                                   </Table> */}
      </Form>
    );
  };

  //  const conjureFormContentOfSecondChildModal = stepNumber => {
  //   switch (stepNumber) {
  //     case 0:
  //       return (
  //           <div></div>
  //       );
  //     }
  //   };
  // Child modal content
  const conjureFormContentOfSecondChildModal = () => {
    return (
      <Form fluid>
        <MyInput
          width="100%"
          max
          fieldName="genderLkey"
          fieldType="select"
          selectData={genderLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
          fieldName="ageFrom"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
          fieldName="ageFromUnitLkey"
          fieldType="select"
          selectData={ageunitsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
          fieldName="ageTo"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
          fieldName="ageToUnitLkey"
          fieldType="select"
          selectData={ageunitsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
          menuMaxHeight={200}
          fieldName="conditionLkey"
          fieldType="select"
          selectData={conditionLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        <MyInput
          width="100%"
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
          width="100%"
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
            width="100%"
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
              width="100%"
              fieldLabel=""
              fieldName="rangeFrom"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
            <MyInput
              width="100%"
              fieldLabel="-"
              fieldName="rangeTo"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          </>
        )}
        {diagnosticTestNormalRange.normalRangeTypeLkey === '6221162489019880' && (
          <MyInput
            width="100%"
            fieldLabel=""
            fieldName="rangeFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
        {diagnosticTestNormalRange.normalRangeTypeLkey === '6221175556193180' && (
          <MyInput
            width="100%"
            fieldLabel=""
            fieldName="rangeTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
        {/* baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaack */}
        {diagnosticTestNormalRange.resultTypeLkey === '6209578532136054' && (
          <>
            <div style={{ position: 'relative', width: '250px', marginTop: '20px' }}>
              <InputGroup inside style={{ width: '250px', marginTop: '20px' }}>
                <Input placeholder="Search LOV" value={searchKeyword} onChange={handleSearch} />
                <InputGroup.Button>
                  <SearchIcon />
                </InputGroup.Button>
              </InputGroup>
              {searchKeyword && (
                <Dropdown.Menu
                  // className="dropdown-menuresult"
                  style={{
                    position: 'absolute',
                    zIndex: 9999,
                    maxHeight: '200px',
                    width: '250px',
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
            </div>
            <br />
            <Input
              disabled={true}
              // style={{ width: '300px' }}
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
            <br />
            <MyInput
              width="100%"
              fieldLabel="Lovs"
              selectData={lovQueryResponse?.object ?? []}
              fieldType="multyPicker"
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName="lovList"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
              menuMaxHeight={200}
            />
          </>
        )}

        <MyInput
          width="100%"
          fieldName="criticalValue"
          fieldType="checkbox"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
        {diagnosticTestNormalRange.criticalValue === true && (
          <>
            <MyInput
              width="100%"
              fieldLabel="Less Than"
              fieldName="criticalValueLessThan"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
            <MyInput
              width="100%"
              fieldLabel="More Than"
              fieldName="criticalValueMoreThan"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          </>
        )}
      </Form>
    );
  };

  return (
    <ChildModal
      actionButtonLabel="Save"
      //   actionButtonFunction={handleSave}
      hideActionBtn
      // actionChildButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      title="Profiles"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Normal Ranges', icon: <FaChartLine /> }]} // ارجع للأيقونات
      childStep={[{ title: 'Normal Range Info', icon: <FaChartLine /> }]} // ارجع للأيقونات
      childTitle="Nothin currently"
      childContent={conjureFormContentOfChildModal}
      //   mainSize = {width > 600 ? '570px' : '300px'}
      mainSize="sm"
    />
  );
};
export default Profile;
