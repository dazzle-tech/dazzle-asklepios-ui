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
import { useEnumOptions } from '@/services/enumsApi';

const AddNormalRange = ({
  diagnosticTestNormalRange,
  setDiagnosticTestNormalRange,
  laboratory

}) => {
  const [lovCode, setLovCode] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest });
  
  const gender = useEnumOptions('Gender');
  const condition = useEnumOptions('Condition');
  const ageunit = useEnumOptions('AgeUnit');
  const resulttype = useEnumOptions('TestResultType');
  const rangetype = useEnumOptions('NormalRangeType');


  // Fetch normal Range Lov response
  const { data: normalRangeLovQueryResponse } = useGetLovValuesByCodeQuery(
    'LAB_NORMRANGE_VALUE_TYPE'
  );

  // Fetch labrotory Details list response
  // const { data: labrotoryDetailsQueryResponse } =
  //   useGetDiagnosticsTestLaboratoryListQuery();
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
    console.log("🟦 Selected Normal Range:", diagnosticTestNormalRange);
  }, [diagnosticTestNormalRange]);


console.log(diagnosticTestNormalRange.lovKeys);

  return (
    <Form fluid>
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">

          <MyInput
            width="%100%"
            fieldLabel="Gender"
            fieldType="select"
            fieldName="gender"
            selectData={gender ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="condition"
            fieldType="select"
            selectData={condition ?? []}
            selectDataLabel="label"
            selectDataValue="value"
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
            fieldName="ageFromUnit"
            fieldType="select"
            selectData={ageunit ?? []}
            selectDataLabel="label"
            selectDataValue="value"
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
            fieldName="ageToUnit"
            fieldType="select"
            selectData={ageunit ?? []}
            selectDataLabel="label"
            selectDataValue="value"
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
            fieldName="resultUnit"
            fieldType="select"
            selectData={ValueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={laboratory}
            setRecord={()=>{}}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            required
            width="100%"
            fieldName="resultType"
            fieldType="select"
            selectData={resulttype ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        </div>
      </div>
      <br />
      {diagnosticTestNormalRange?.resultType === 'NUMBER' && (

        <MyInput
          width="100%"
          fieldName="normalRangeType"
          fieldType="select"
          selectData={rangetype ?? []}
          selectDataValue="value"
          selectDataLabel="label"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
          menuMaxHeight={100}
        />
      )}
      {diagnosticTestNormalRange?.resultType === 'NUMBER' &&
        diagnosticTestNormalRange.normalRangeType  === 'RANGE' && (
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
      {diagnosticTestNormalRange?.resultType  === 'NUMBER' &&
        diagnosticTestNormalRange.normalRangeType  === 'LESS_THAN' && (
          <MyInput
            width="100%"
            fieldLabel="Less Than"
            fieldName="rangeFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange?.resultType  === 'NUMBER' &&
        diagnosticTestNormalRange.normalRangeType  === 'MORE_THAN' && (
          <MyInput
            width="100%"
            fieldLabel="More Than"
            fieldName="rangeTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange?.resultType  === 'LOV' && (
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
                          resultLov: mod.key
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
                item => item.key === diagnosticTestNormalRange?.resultLov
              )
                ? `${lovListResponseData.object.find(
                  item => item.key === diagnosticTestNormalRange?.resultLov
                )?.lovCode
                }, ${lovListResponseData.object.find(
                  item => item.key === diagnosticTestNormalRange?.resultLov
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
            fieldName="lovKeys"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
            menuMaxHeight={120}
          />
        </>
      )}

      {diagnosticTestNormalRange?.resultType  === 'NUMBER' && (

      <MyInput
        width="100%"
        fieldName="criticalValue"
        fieldType="checkbox"
        record={diagnosticTestNormalRange}
        setRecord={setDiagnosticTestNormalRange}
      />)}

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
