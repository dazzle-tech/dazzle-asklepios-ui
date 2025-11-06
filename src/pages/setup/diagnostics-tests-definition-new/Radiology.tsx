import MyInput from '@/components/MyInput';
import { useGetRadiologyByTestIdQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { newRadiology } from '@/types/model-types-constructor-new';
import React, { useEffect } from 'react';
import { Form } from 'rsuite';

const Radiology = ({ diagnosticsTest, diagnosticTestRadiology, setDiagnosticTestRadiology }) => {


  // Fetch rad Categories Lov response
  const { data: radCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  // Fetch time Unit Lov response
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  const{data:radiologiData}=useGetRadiologyByTestIdQuery(diagnosticsTest?.id!,{ skip: !diagnosticsTest?.id });




  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestRadiology(prevState => ({
        ...prevState,
        testID: diagnosticsTest.id
      }));
    }
  }, [diagnosticsTest]);

  useEffect(() => {
    if (radiologiData) {
      setDiagnosticTestRadiology(radiologiData);
    }
    else {
      setDiagnosticTestRadiology({...newRadiology });}

  }, [radiologiData]);

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
            fieldType="select"
            selectData={radCategoriesLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestRadiology}
            setRecord={setDiagnosticTestRadiology}
          />
        </div>
        <div className="container-of-field-diagnostic">
           <MyInput
            width="100%"
            fieldName="imageDuration"
            fieldType="number"
            record={diagnosticTestRadiology}
            setRecord={setDiagnosticTestRadiology}
            rightAddon="min"
          />
        </div>
      </div>
      <br />

      <div className="container-of-two-fields-diagnostic">
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            fieldType="number"
            fieldName="turnaroundTime"
            record={diagnosticTestRadiology}
            setRecord={setDiagnosticTestRadiology}
          />
        </div>
        <div className="container-of-field-diagnostic">
          <MyInput
            width="100%"
            menuMaxHeight={200}
            fieldName="turnaroundTimeUnit"
            selectData={timeUnitLovQueryResponse?.object ?? []}
            fieldType="select"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestRadiology}
            setRecord={setDiagnosticTestRadiology}
          />
        </div>
      </div>
      <br />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="medicalIndications"
        record={diagnosticTestRadiology}
        setRecord={setDiagnosticTestRadiology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="associatedRisks"
        record={diagnosticTestRadiology}
        setRecord={setDiagnosticTestRadiology}
      />
      <MyInput
        width="100%"
        fieldType="textarea"
        fieldName="testInstructions"
        record={diagnosticTestRadiology}
        setRecord={setDiagnosticTestRadiology}
      />
    </Form>
  );
};
export default Radiology;
