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
  // Child modal content
  const AddNormalRange = ({diagnosticTestNormalRange, setDiagnosticTestNormalRange, listRequestQuery}) => {

    const [lovCode, setLovCode] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');

     // Fetch gender Lov response
      const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
      // Fetch age units Lov response
      const { data: ageunitsLovQueryResponse } = useGetLovValuesByCodeQuery('AGE_UNITS');
      // Fetch condition Lov response
      const { data: conditionLovQueryResponse } = useGetLovValuesByCodeQuery('NORANGE_CONDITIONS');
      // Fetch test Result Type Lov response
      const { data: testResultTypeLovQueryResponse } = useGetLovValuesByCodeQuery('TEST_RESULT_TYPE');
      // Fetch normal Range Lov response
      const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery(
        'LAB_NORMRANGE_VALUE_TYPE'
      );

      const { data: labrotoryDetailsQueryResponse } =
          useGetDiagnosticsTestLaboratoryListQuery(listRequestQuery);

       // Fetch lov response
        const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
        // Fetch Value Unit Lov response
        const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');

         const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });
          // Fetch lov List response
          const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
            skip: !searchKeyword || searchKeyword == ''
          });

          const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.lovCode} - ${item.lovName}`
  }));

   // handle search about lov
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
            <InputGroup
              inside
               style={{ width: '250px', marginTop: '20px' }}
            >

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
  export default AddNormalRange;