import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery,
  useGetDiagnosticsTestRadiologyListQuery,
  useGetDiagnosticsTestCatalogHeaderListQuery
} from '@/services/setupService';
import { Form } from 'rsuite';
import { newApDiagnosticTestRadiology } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';

const Radiology = ({ diagnosticsTest, diagnosticTestRadiology, setDiagnosticTestRadiology}) => {

  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
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
        value: '862828331135792' //TODO Add the LOV 'Radkey'

      }
    ]
  });
  const { data: radCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_REAGENTS');
  const { data: radiologyDetailsQueryResponse } = useGetDiagnosticsTestRadiologyListQuery(listRequest);
  const { data: CatalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);
  
  // Effects
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
    setListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [diagnosticsTest.key]);

  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestRadiology(prevState => ({
        ...prevState,
        testKey: diagnosticsTest.key
      }));
    }
  }, [diagnosticsTest]);


  useEffect(() => {
    if (radiologyDetailsQueryResponse?.object?.length > 0) {
      setDiagnosticTestRadiology(radiologyDetailsQueryResponse?.object[0]);
    } else {
      setDiagnosticTestRadiology({ ...newApDiagnosticTestRadiology })
    }
  }, [radiologyDetailsQueryResponse]);

  return (
      <Form fluid>
         <div className="container-of-two-fields-service">
          <div className="container-of-field-service">
        <MyInput
          width="100%"
          menuMaxHeight={200}          
          fieldLabel="Category"
          fieldName="radCategoryLkey"
          fieldType="select"
          selectData={radCategoriesLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        </div>
        <div className="container-of-field-service">
        <MyInput
           width="100%"
          menuMaxHeight={200}          
          fieldName="radCatalogKey"
          fieldType="select"
          selectData={CatalogListResponseData?.object ?? []}
          selectDataLabel="description"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        </div>
        </div>
        <br/>
         <div className="container-of-two-fields-service">
          <div className="container-of-field-service">
        <MyInput
           width="100%"
          menuMaxHeight={200}          
          fieldName="reagents"
          fieldType="select"
          selectData={reagentLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        </div>
        <div className="container-of-field-service">
        <MyInput width="100%" fieldName="imageDuration" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
       </div>
       </div>
       <br/>
         <div className="container-of-two-fields-service">
          <div className="container-of-field-service">
        <MyInput width="100%" fieldType="number" fieldName="turnaroundTime" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        </div>
        <div className="container-of-field-service">
        <MyInput
          width="100%"
         menuMaxHeight={200}          
          fieldName="turnaroundTimeUnitLkey"
          selectData={timeUnitLovQueryResponse?.object ?? []}
          fieldType="select"
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
      </div>
        </div>
        <br/>
        <MyInput width="100%" fieldType="textarea" fieldName="medicalIndications" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width="100%" fieldType="textarea" fieldName="associatedRisks" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width="100%" fieldType="textarea" fieldName="testInstructions" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
      </Form>
  );
};
export default Radiology;