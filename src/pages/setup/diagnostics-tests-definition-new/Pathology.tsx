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
import { useGetPathologyByTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestPathologyService';

const Pathology = ({ diagnosticsTest, diagnosticTestPathology, setDiagnosticTestPathology }) => {
 
  // Fetch time Unit Lov response
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  // Fetch specimens Lov response
  const { data: specimensLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SPECIMENS');
  // Fetch category Lov response
  const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('PATH_CATEGORY');
   // Fetch procedurw Lov response
  const { data: procedurwLovQueryResponse } = useGetLovValuesByCodeQuery('PATH_ANALYSIS_PROC');
 
const {data:pathologyData}=useGetPathologyByTestIdQuery(diagnosticsTest?.id,{ skip: !diagnosticsTest?.id });
  // Effects
 

  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestPathology(prevState => ({
        ...prevState,
        testId: diagnosticsTest.id
      }));
    }
  }, [diagnosticsTest]);
  useEffect(() => {
    if (pathologyData) {
      setDiagnosticTestPathology(pathologyData);
    }
    else {
      setDiagnosticTestPathology({ ...newApDiagnosticTestPathology, testId: diagnosticsTest?.id });
    }
  }, [pathologyData]);


  return (
    <Form fluid>
      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            required
            width="100%"
            menuMaxHeight={200}
            fieldLabel="Category"
            fieldName="category"
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
            fieldName="specimenType"
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
            fieldName="analysisProcedure"
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
            fieldType='number'
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
        fieldName="timeUnit"
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
