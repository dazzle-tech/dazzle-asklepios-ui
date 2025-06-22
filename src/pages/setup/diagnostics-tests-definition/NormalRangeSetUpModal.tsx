import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetDiagnosticsTestNormalRangeListQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsTestNormalRangeMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Dropdown, Form, Input, InputGroup } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaChartLine } from 'react-icons/fa';
import { initialListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApDiagnosticTestNormalRange } from '@/types/model-types';
import { newApDiagnosticTestNormalRange } from '@/types/model-types-constructor';
import SearchIcon from '@rsuite/icons/Search';
import AddNormalRange from './AddNormalRange';

const NormalRangeSetupModal = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [showChild, setShowChild] = useState<boolean>(false);
  // const [lovCode, setLovCode] = useState('');
  // const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLOVs, setSelectedLOVs] = useState([]);
  const [diagnosticTestNormalRange, setDiagnosticTestNormalRange] =
    useState<ApDiagnosticTestNormalRange>({
      ...newApDiagnosticTestNormalRange
    });
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
  // const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });
  // // Fetch lov List response
  // const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
  //   skip: !searchKeyword || searchKeyword == ''
  // });
  // // Fetch gender Lov response
  // const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  // // Fetch age units Lov response
  // const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
  // // Fetch condition Lov response
  // const { data: conditionLovQueryResponse } = useGetLovValuesByCodeQuery('NORANGE_CONDITIONS');
  // // Fetch test Result Type Lov response
  // const { data: testResultTypeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_RESULT_TYPE');
  // // Fetch normal Range Lov response
  // const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery(
  //   'LAB_NORMRANGE_VALUE_TYPE'
  // );
  // // Fetch lov response
  // const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
  // // Fetch Value Unit Lov response
  // const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch normal Range List response
  const {
    data: normalRangeListResponse,
    refetch: refetchNormalRange,
    isFetching
  } = useGetDiagnosticsTestNormalRangeListQuery(listRequest);
  // Fetch labrotory Details response
  // const { data: labrotoryDetailsQueryResponse } =
  //   useGetDiagnosticsTestLaboratoryListQuery(listRequestQuery);
  // save Diagnostics Test Normal Range
  const [saveDiagnosticsTestNormalRange, saveDiagnosticsTestNormalRangeMutation] =
    useSaveDiagnosticsTestNormalRangeMutation();
  // customise item appears on the selected lov list
  // const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
  //   ...item,
  //   combinedLabel: `${item.lovCode} - ${item.lovName}`
  // }));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && diagnosticTestNormalRange && rowData.key === diagnosticTestNormalRange.key) {
      return 'selected-row';
    } else return '';
  };

  //Table columns
  const tableColumns = [
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
      key: 'LovValues',
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

  // // handle search about lov
  // const handleSearch = value => {
  //   setSearchKeyword(value);
  // };

  // // handle save diagnostics Test Normal Range
  // const handleSave = async () => {
  //   try {
  //     await saveDiagnosticsTestNormalRange({
  //       diagnosticTestNormalRange: { ...diagnosticTestNormalRange, testKey: diagnosticsTest.key },
  //       lov: selectedLOVs
  //     }).unwrap();
  //     refetchNormalRange();
  //     dispatch(notify('Normal Range Saved Successfully'));
  //   } catch (error) {
  //     console.error('Error saving Normal Range:', error);
  //   }
  // };

  // save in normal range
  // handle save diagnostics Test Normal Range
  const handleSave = async () => {
    try {
      await saveDiagnosticsTestNormalRange({
        diagnosticTestNormalRange: { ...diagnosticTestNormalRange, testKey: diagnosticsTest.key },
        lov: selectedLOVs
      }).unwrap();
      refetchNormalRange();
      setDiagnosticTestNormalRange({
      ...newApDiagnosticTestNormalRange,
      ageToUnitLkey: null,
      ageFromUnitLkey: null,
      normalRangeTypeLkey: null,
      resultLovKey: null
    });
      dispatch(notify('Normal Range Saved Successfully'));
    } catch (error) {
      console.error('Error saving Normal Range:', error);
    }
  };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button-practitioners">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setShowChild(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={normalRangeListResponse?.object ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelected}
              onRowClick={rowData => {
                setDiagnosticTestNormalRange(rowData);
              }}
              sortColumn={listRequest.sortBy}
              sortType={listRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              }}
            />
          </Form>
        );
    }
  };
  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <AddNormalRange
        diagnosticTestNormalRange={diagnosticTestNormalRange}
        setDiagnosticTestNormalRange={setDiagnosticTestNormalRange}
        listRequestQuery={listRequestQuery}
      />
      // <Form fluid>
      //   <MyInput
      //     width="100%"
      //     max
      //     fieldName="genderLkey"
      //     fieldType="select"
      //     selectData={genderLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     fieldName="ageFrom"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     fieldName="ageFromUnitLkey"
      //     fieldType="select"
      //     selectData={ageunitsLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     fieldName="ageTo"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     fieldName="ageToUnitLkey"
      //     fieldType="select"
      //     selectData={ageunitsLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     menuMaxHeight={200}
      //     fieldName="conditionLkey"
      //     fieldType="select"
      //     selectData={conditionLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   <MyInput
      //     width="100%"
      //     disabled={true}
      //     fieldName="resultUnitLkey"
      //     fieldType="select"
      //     selectData={ValueUnitLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={labrotoryDetailsQueryResponse?.object[0]}
      //     setRecord={''}
      //   />
      //   <MyInput
      //     width="100%"
      //     fieldName="resultTypeLkey"
      //     fieldType="select"
      //     selectData={testResultTypeLovQueryResponse?.object ?? []}
      //     selectDataLabel="lovDisplayVale"
      //     selectDataValue="key"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   {diagnosticTestNormalRange.resultTypeLkey === '6209569237704618' && (
      //     <MyInput
      //       width="100%"
      //       fieldName="normalRangeTypeLkey"
      //       fieldType="select"
      //       selectData={normalRangeLovQueryResponse?.object ?? []}
      //       selectDataLabel="lovDisplayVale"
      //       selectDataValue="key"
      //       record={diagnosticTestNormalRange}
      //       setRecord={setDiagnosticTestNormalRange}
      //     />
      //   )}
      //   {diagnosticTestNormalRange.normalRangeTypeLkey === '6221150241292558' && (
      //     <>
      //       <MyInput
      //         width="100%"
      //         fieldLabel=""
      //         fieldName="rangeFrom"
      //         record={diagnosticTestNormalRange}
      //         setRecord={setDiagnosticTestNormalRange}
      //       />
      //       <MyInput
      //         width="100%"
      //         fieldLabel="-"
      //         fieldName="rangeTo"
      //         record={diagnosticTestNormalRange}
      //         setRecord={setDiagnosticTestNormalRange}
      //       />
      //     </>
      //   )}
      //   {diagnosticTestNormalRange.normalRangeTypeLkey === '6221162489019880' && (
      //     <MyInput
      //       width="100%"
      //       fieldLabel=""
      //       fieldName="rangeFrom"
      //       record={diagnosticTestNormalRange}
      //       setRecord={setDiagnosticTestNormalRange}
      //     />
      //   )}
      //   {diagnosticTestNormalRange.normalRangeTypeLkey === '6221175556193180' && (
      //     <MyInput
      //       width="100%"
      //       fieldLabel=""
      //       fieldName="rangeTo"
      //       record={diagnosticTestNormalRange}
      //       setRecord={setDiagnosticTestNormalRange}
      //     />
      //   )}
      //   {/* baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaack */}
      //   {diagnosticTestNormalRange.resultTypeLkey === '6209578532136054' && (
      //     <>
      //      <div style={{ position: 'relative', width: '250px', marginTop: '20px' }}>
      //       <InputGroup
      //         inside
      //          style={{ width: '250px', marginTop: '20px' }}
      //       >

      //         <Input placeholder="Search LOV" value={searchKeyword} onChange={handleSearch} />
      //         <InputGroup.Button>
      //           <SearchIcon />
      //         </InputGroup.Button>
      //       </InputGroup>
      //       {searchKeyword && (
      //         <Dropdown.Menu
      //           // className="dropdown-menuresult"
      //           style={{
      //             position: 'absolute',
      //             zIndex: 9999,
      //             maxHeight: '200px',
      //             width: '250px',
      //             overflowY: 'auto',
      //             backgroundColor: 'white',
      //             border: '1px solid #ccc',
      //             boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
      //           }}
      //         >
      //           {modifiedData &&
      //             modifiedData?.map(mod => (
      //               <Dropdown.Item
      //                 key={mod.key}
      //                 eventKey={mod.key}
      //                 onClick={() => {
      //                   setDiagnosticTestNormalRange({
      //                     ...diagnosticTestNormalRange,
      //                     resultLovKey: mod.key
      //                   });
      //                   setLovCode(mod.lovCode);
      //                   setSearchKeyword('');
      //                 }}
      //               >
      //                 <span style={{ marginRight: '19px' }}>{mod.lovCode}</span>
      //                 <span>{mod.lovName}</span>
      //               </Dropdown.Item>
      //             ))}
      //         </Dropdown.Menu>
      //       )}
      //       </div>
      //       <br />
      //       <Input
      //         disabled={true}
      //         // style={{ width: '300px' }}
      //         value={
      //           lovListResponseData?.object.find(
      //             item => item.key === diagnosticTestNormalRange?.resultLovKey
      //           )
      //             ? `${
      //                 lovListResponseData.object.find(
      //                   item => item.key === diagnosticTestNormalRange?.resultLovKey
      //                 )?.lovCode
      //               }, ${
      //                 lovListResponseData.object.find(
      //                   item => item.key === diagnosticTestNormalRange?.resultLovKey
      //                 )?.lovName
      //               }`
      //             : ''
      //         }
      //       />
      //       <br />
      //       <MyInput
      //         width="100%"
      //         fieldLabel="Lovs"
      //         selectData={lovQueryResponse?.object ?? []}
      //         fieldType="multyPicker"
      //         selectDataLabel="lovDisplayVale"
      //         selectDataValue="key"
      //         fieldName="lovList"
      //         record={diagnosticTestNormalRange}
      //         setRecord={setDiagnosticTestNormalRange}
      //        menuMaxHeight={200}
      //       />
      //     </>

      //   )}

      //   <MyInput
      //     width="100%"
      //     fieldName="criticalValue"
      //     fieldType="checkbox"
      //     record={diagnosticTestNormalRange}
      //     setRecord={setDiagnosticTestNormalRange}
      //   />
      //   {diagnosticTestNormalRange.criticalValue === true && (
      //     <>
      //       <MyInput
      //         width="100%"
      //         fieldLabel="Less Than"
      //         fieldName="criticalValueLessThan"
      //         record={diagnosticTestNormalRange}
      //         setRecord={setDiagnosticTestNormalRange}
      //       />
      //       <MyInput
      //         width="100%"
      //         fieldLabel="More Than"
      //         fieldName="criticalValueMoreThan"
      //         record={diagnosticTestNormalRange}
      //         setRecord={setDiagnosticTestNormalRange}
      //       />
      //     </>
      //   )}
      // </Form>
    );
  };
  // Effects
  useEffect(() => {
    setListRequest({
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
  }, [diagnosticsTest]);

  // useEffect(() => {
  //   if (searchKeyword?.trim() !== '') {
  //     setListLovRequest({
  //       ...listLovRequest,
  //       filterLogic: 'or',
  //       filters: [
  //         {
  //           fieldName: 'lov_code',
  //           operator: 'containsIgnoreCase',
  //           value: searchKeyword
  //         },
  //         {
  //           fieldName: 'lov_name',
  //           operator: 'containsIgnoreCase',
  //           value: searchKeyword
  //         }
  //       ]
  //     });
  //   }
  // }, [searchKeyword]);

  useEffect(() => {
    if (diagnosticTestNormalRange) {
      setSelectedLOVs(diagnosticTestNormalRange?.lovList);
    } else {
      setDiagnosticTestNormalRange(newApDiagnosticTestNormalRange);
    }
  }, [diagnosticTestNormalRange]);

  useEffect(() => {
    setDiagnosticTestNormalRange({
      ...newApDiagnosticTestNormalRange,
      ageToUnitLkey: null,
      ageFromUnitLkey: null,
      normalRangeTypeLkey: null,
      resultLovKey: null
    });
    if (saveDiagnosticsTestNormalRangeMutation.data) {
      setListRequestQuery({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDiagnosticsTestNormalRangeMutation.data]);

  return (
    <ChildModal
      actionButtonLabel={diagnosticsTest?.key ? 'Save' : 'Create'}
      hideActionBtn
      actionChildButtonFunction={handleSave}
      open={open}
      setOpen={setOpen}
      showChild={showChild}
      setShowChild={setShowChild}
      title="Normal Ranges"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Normal Ranges', icon: <FaChartLine /> }]}
      childStep={[{ title: 'Normal Range Info', icon: <FaChartLine /> }]}
      childTitle={diagnosticTestNormalRange?.key ? 'Edit Normal Range' : 'New Normal Range'}
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default NormalRangeSetupModal;
