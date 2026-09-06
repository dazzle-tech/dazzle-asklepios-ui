import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLovsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import { Form, Input } from 'rsuite';
import './styles.less';

const AddNormalRange = ({
  diagnosticTestNormalRange,
  setDiagnosticTestNormalRange,
  diagnosticsTestProfile
}) => {
  const [lovCode, setLovCode] = useState('');
  const [listLovRequest, setListLovRequest] = useState({ ...initialListRequest, pageSize: 1000 });

  const gender = useEnumOptions('Gender');
  const condition = useEnumOptions('Condition');
  const ageunit = useEnumOptions('AgeUnit');
  const resultType = useEnumOptions('TestResultType');
  const rangetype = useEnumOptions('NormalRangeType');

  //   useGetDiagnosticsTestLaboratoryListQuery();
  // Fetch lov response
  const { data: lovQueryResponse } = useGetLovValuesByCodeQuery(lovCode);
  // Fetch Value Unit Lov response
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch lov List response
  const { data: lovListResponseData } = useGetLovsQuery(listLovRequest, {
    skip: false
  });

  // Effects

  const resultLovDisplay = (() => {
    const key = diagnosticsTestProfile?.listOfValueId;
    if (!key) return '';

    if (!lovQueryResponse?.object?.length) return '';

    const found = lovQueryResponse.object.find(
      x => x.key == diagnosticsTestProfile.listOfValueId || x.lovCode == lovCode
    );

    return found ? `${found.lovCode}, ${found.lovName}` : '';
  })();

  useEffect(() => {
    if (!diagnosticsTestProfile?.listOfValueId) return;
    if (!lovListResponseData?.object?.length) return;

    const matched = lovListResponseData.object.find(
      x => x.key == diagnosticsTestProfile?.listOfValueId
    );

    if (matched) {
      setLovCode(matched.lovCode);
    }
  }, [lovListResponseData]);

  useEffect(() => {
    if (!diagnosticTestNormalRange?.lovKeys) return;

    setDiagnosticTestNormalRange(prev => ({
      ...prev,
      lovKeys: Array.isArray(prev.lovKeys)
        ? prev.lovKeys
        : String(prev.lovKeys)
          .split(',')
          .map(x => x.trim())
          .filter(Boolean)
    }));
  }, []);

useEffect(() => {
  if (!diagnosticsTestProfile?.resultType) return;

  setDiagnosticTestNormalRange(prev => ({
    ...prev,
    resultType: diagnosticsTestProfile.resultType
  }));
}, [diagnosticsTestProfile?.resultType]);

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Form fluid dir={dir}>
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
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
            disabled
            fieldName="resultUnit"
            fieldType="select"
            selectData={ValueUnitLovQueryResponse?.object ?? []}
             selectDataLabel="lovDisplayVale"
 disableByField='isValid'

            selectDataValue="key"
            record={diagnosticsTestProfile}
            setRecord={() => { }}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            fieldName="resultType"
            fieldType="select"
            selectData={resultType ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
            disabled
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
        diagnosticTestNormalRange.normalRangeType === 'RANGE' && (
          <>
            <div className="range-from-to-diagnostic">
              <div className="range-diagnostic">
                <MyInput
                  width="100%"
                  fieldName="rangeFrom"
                  record={diagnosticTestNormalRange}
                  setRecord={setDiagnosticTestNormalRange}
                />
              </div>
              <label>-</label>
              <div className="range-diagnostic">
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
      {diagnosticTestNormalRange?.resultType === 'NUMBER' &&
        diagnosticTestNormalRange.normalRangeType === 'LESS_THAN' && (
          <MyInput
            width="100%"
            fieldLabel="Less Than"
            fieldName="rangeTo"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange?.resultType === 'NUMBER' &&
        diagnosticTestNormalRange.normalRangeType === 'MORE_THAN' && (
          <MyInput
            width="100%"
            fieldLabel="More Than"
            fieldName="rangeFrom"
            record={diagnosticTestNormalRange}
            setRecord={setDiagnosticTestNormalRange}
          />
        )}
      {diagnosticTestNormalRange?.resultType === 'LOV' && (
        <>
          <Input className="search-result-diagnostic" disabled={true} value={resultLovDisplay} />
          <br />
          {diagnosticTestNormalRange.resultType === 'LOV' &&
            lovQueryResponse?.object &&
            diagnosticTestNormalRange.lovKeys && (
              <MyInput
                width="100%"
                fieldLabel="LOVS"
                selectData={lovQueryResponse.object}
                fieldType="multyPicker"
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="key"
                fieldName="lovKeys"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
                menuMaxHeight={120}
              />
            )}
        </>
      )}

      {diagnosticTestNormalRange?.resultType === 'NUMBER' && (
        <MyInput
          width="100%"
          fieldName="criticalValue"
          fieldType="checkbox"
          record={diagnosticTestNormalRange}
          setRecord={setDiagnosticTestNormalRange}
        />
      )}

      {diagnosticTestNormalRange?.criticalValue === true && (
        <>
          {diagnosticTestNormalRange?.normalRangeType === 'LESS_THAN' && (
            <div className="container-of-field-diagnostic">
              <MyInput
                width="100%"
                fieldLabel="More Than"
                fieldName="criticalValueMoreThan"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
            </div>
          )}

          {diagnosticTestNormalRange?.normalRangeType === 'MORE_THAN' && (
            <div className="container-of-field-diagnostic">
              <MyInput
                width="100%"
                fieldLabel="Less Than"
                fieldName="criticalValueLessThan"
                record={diagnosticTestNormalRange}
                setRecord={setDiagnosticTestNormalRange}
              />
            </div>
          )}

          {diagnosticTestNormalRange?.normalRangeType === 'RANGE' && (
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
        </>
      )}

    </Form>
  );
};
export default AddNormalRange;
