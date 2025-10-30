import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDiagnosticsTestPathologyListQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Form } from 'rsuite';
import { newApDiagnosticTestPathology } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';

const Pathology = ({ diagnosticsTest, diagnosticTestPathology, setDiagnosticTestPathology }) => {
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      }
    ]
  });

  const [catalogListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'type_lkey',
        operator: 'match',
        value: '862842242812880' //TODO Add the LOV 'Pathkey'
      }
    ]
  });
  // Fetch catalog List response
  const { data: catalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);
  // Fetch time Unit Lov response
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  // Fetch reagent Lov response
  const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('PATH_REAGENTS');
  // Fetch specimens Lov response
  const { data: specimensLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SPECIMENS');
  // Fetch category Lov response
  const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
   // Fetch procedurw Lov response
  const { data: procedurwLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  // Fetch pathology Details list response
  const { data: pathologyDetailsQueryResponse } = useGetDiagnosticsTestPathologyListQuery(listRequest);

  // Effects
  useEffect(() => {
    const updatedFilters = [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      }
    ];
    setListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [diagnosticsTest.key]);

  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestPathology(prevState => ({
        ...prevState,
        testKey: diagnosticsTest.key
      }));
    }
  }, [diagnosticsTest]);

  useEffect(() => {
    if (pathologyDetailsQueryResponse?.object?.length > 0) {
      setDiagnosticTestPathology(pathologyDetailsQueryResponse?.object[0]);
    } else {
      setDiagnosticTestPathology({ ...newApDiagnosticTestPathology });
    }
  }, [pathologyDetailsQueryResponse]);

  return (
    <Form fluid>
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldLabel="Category"
            fieldName="pathologyCategoryLkey"
            selectData={categoryLovQueryResponse?.object ?? []}
            fieldType="select"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="pathCatalogKey"
            fieldType="select"
            selectData={catalogListResponseData?.object ?? []}
            selectDataLabel="description"
            selectDataValue="key"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
      </div>
      <br />
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="reagents"
            fieldType="select"
            selectData={reagentLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="specimenTypeLkey"
            fieldType="select"
            selectData={specimensLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
      </div>
      <br />
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="analysisProcedureLkey"
            fieldType="select"
            selectData={procedurwLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            fieldName="turnaroundTime"
            record={diagnosticTestPathology}
            setRecord={setDiagnosticTestPathology}
          />
        </div>
      </div>
      <br />
      <MyInput
        width="100%"
        menuMaxHeight={200}
        fieldName="timeUnitLkey"
        selectData={timeUnitLovQueryResponse?.object ?? []}
        fieldType="select"
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="testDescription"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="sampleHandling"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="criticalValues"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="preparationRequirements"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="medicalIndications"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="associatedRisks"
        record={diagnosticTestPathology}
        setRecord={setDiagnosticTestPathology}
      />
    </Form>
  );
};

export default Pathology;
