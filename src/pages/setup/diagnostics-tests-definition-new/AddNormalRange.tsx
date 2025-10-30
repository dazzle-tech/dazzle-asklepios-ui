import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Dropdown, Form, Input, InputGroup } from 'rsuite';
import './styles.less';
import { initialListRequest } from '@/types/types';
import SearchIcon from '@rsuite/icons/Search';

const AddNormalRange = ({
  diagnosticTestNormalRange,
  setDiagnosticTestNormalRange,
  listRequestQuery
}) => {
  const [lovCode, setLovCode] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });

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
  // Fetch labrotory Details list response
  const { data: labrotoryDetailsQueryResponse } =
    useGetDiagnosticsTestLaboratoryListQuery(listRequestQuery);
  // Fetch lov response
  const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
  // Fetch Value Unit Lov response
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch lov List response
  const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
    skip: !searchKeyword || searchKeyword == ''
  });
  // customise item appears on the list
  const modifiedData = (lovListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.lovCode} - ${item.lovName}`
  }));

  // handle search about lov
  const handleSearch = value => {
    setSearchKeyword(value);
  };

  // Effects
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
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
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
        </div>
        <div className="container-of-field-diagnostic">
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
        </div>
      </div>
      <br />
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            fieldName="ageFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        </div>
        <div className="container-of-field-diagnostic">
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
        </div>
      </div>
      <br />
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            fieldName="ageTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        </div>
        <div className="container-of-field-diagnostic">
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
        </div>
      </div>
      <br />
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
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
        </div>
        <div className="container-of-field-diagnostic">
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
        </div>
      </div>
      <br />
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
          menuMaxHeight={100}
        />
      )}
      {diagnosticTestNormalRange.resultTypeLkey === '6209569237704618' &&
        diagnosticTestNormalRange.normalRangeTypeLkey === '6221150241292558' && (
          <>
            <div className='range-from-to-diagnostic'>
              <div className='range-diagnostic'>
                <MyInput
                  width="100%"
                  fieldName="rangeFrom"
                  record={diagnosticTestNormalRange}
                  setRecord={setDiagnosticTestNormalRange}
                />
              </div>
              <label>-</label>
              <div className='range-diagnostic'>
                <MyInput
                  width="100%"
                  fieldName="rangeTo"
                  record={diagnosticTestNormalRange}
                  setRecord={setDiagnosticTestNormalRange}
                />
              </div>
            </div>
            <br />
          </>
        )}
      {diagnosticTestNormalRange.resultTypeLkey === '6209569237704618' &&
        diagnosticTestNormalRange.normalRangeTypeLkey === '6221162489019880' && (
          <MyInput
            width="100%"
            fieldLabel="Less Than"
            fieldName="rangeFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange.resultTypeLkey === '6209569237704618' &&
        diagnosticTestNormalRange.normalRangeTypeLkey === '6221175556193180' && (
          <MyInput
            width="100%"
            fieldLabel="More Than"
            fieldName="rangeTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange.resultTypeLkey === '6209578532136054' && (
        <>
          <div className='container-of-menu-diagnostic'>
            <InputGroup className='search-input-diagnostic' inside >
              <Input placeholder="Search LOV" value={searchKeyword} onChange={handleSearch} />
              <InputGroup.Button>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>
            {searchKeyword && (
              <Dropdown.Menu
                // className="dropdown-menuresult"
                className='menu-diagnostic'
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
                      <span>{mod.lovCode}</span>
                      <span>{mod.lovName}</span>
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            )}
          </div>
          <br />
          <Input
            className='search-result-diagnostic'
            disabled={true}
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
            fieldLabel="LOVS"
            selectData={lovQueryResponse?.object ?? []}
            fieldType="multyPicker"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldName="lovList"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
            menuMaxHeight={120}
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
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
            <MyInput
              width="100%"
              fieldLabel="Less Than"
              fieldName="criticalValueLessThan"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          </div>
          <div className="container-of-field-diagnostic">
            <MyInput
              width="100%"
              fieldLabel="More Than"
              fieldName="criticalValueMoreThan"
              record={diagnosticTestNormalRange}
              setRecord={setDiagnosticTestNormalRange}
            />
          </div>
        </div>
      )}
    </Form>
  );
};
export default AddNormalRange;
