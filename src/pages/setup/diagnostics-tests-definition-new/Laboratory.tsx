import { initialListRequest} from '@/types/types';
import React, { useState, useEffect } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
  newApDiagnosticTestLaboratory,
} from '@/types/model-types-constructor';
import { Form } from 'rsuite';
const Laboratory = ({ diagnosticsTest, diagnosticTestLaboratory,setDiagnosticTestLaboratory }) => {
  const [popupOpen, setPopupOpen] = useState(false);
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
        value: '862810597620632' //TODO Add the LOV 'Labkey'
      }
    ]
  });
  const [labListRequest, setLabListRequest] = useState({
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
        fieldName: 'test_key',
        operator: 'match',
        value: diagnosticsTest.key || undefined
      }
    ]
  });
  // Fetch Catalog list response
  const { data: CatalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);
  // Fetch Lab Reagents Lov response
  const { data: LabReagentsLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  // Fetch Categories Lov response
  const { data: CategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  // Fetch Time Unit Lov response
  const { data: TimeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  // Fetch Value Unit Lov response
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  // Fetch Sample Container Lov response
  const { data: SampleContainerLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SAMPLE_CONTAINER');
  // Fetch Lab Tube Type Lov response
  const { data: LabTubeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  // Fetch Tube Color Lov response
  const { data: TubeColorLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  // Fetch labrotory Details list response
  const { data: labrotoryDetailsQueryResponse } = useGetDiagnosticsTestLaboratoryListQuery(labListRequest);

  // Effects
  useEffect(() => {
    if (diagnosticTestLaboratory.isProfile === true && diagnosticTestLaboratory.key === null) {
      setPopupOpen(!popupOpen);
    }
  }, [diagnosticTestLaboratory?.isProfile]);

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
    setLabListRequest(prevRequest => ({
      ...prevRequest,
      filters: updatedFilters
    }));
  }, [diagnosticsTest.key]);

  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestLaboratory(prevState => ({
        ...prevState,
        testKey: diagnosticsTest.key
      }));
    }
  }, [diagnosticsTest]);

  useEffect(() => {
    if (labrotoryDetailsQueryResponse?.object?.length > 0) {
      setDiagnosticTestLaboratory(labrotoryDetailsQueryResponse?.object[0]);
    } else {
      setDiagnosticTestLaboratory({ ...newApDiagnosticTestLaboratory });
    }
  }, [labrotoryDetailsQueryResponse]);

  return (
      <Form fluid>
          <div className='container-of-three-fields-diagnostic'>
            <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'
          menuMaxHeight={200}
          fieldName="categoryLkey"
          fieldType="select"
          selectData={CategoriesLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
         <div className='field-in-three-fields-diagnostics' >
        <MyInput
          width="100%"
          menuMaxHeight={200}
          fieldName="labCatalogKey"
          fieldType="select"
          selectData={CatalogListResponseData?.object ?? []}
          selectDataLabel="description"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'
          fieldName="propertyLkey"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       </div>
       <br/>
        <div className='container-of-three-fields-diagnostic' >
          <div className='field-in-three-fields-diagnostics'>
        <MyInput
            width='100%'
          fieldName="timing"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       <div className='field-in-three-fields-diagnostics'>
        <MyInput
           width='100%'
          fieldName="systemLkey"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       <div className='field-in-three-fields-diagnostics'>
        <MyInput
           width='100%'           
          fieldName="scaleLkey"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
            width='100%'           
          fieldName="methodLkey"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
           width='100%'
          menuMaxHeight={200}         
          fieldName="reagentsLkey"
          fieldType="select"
          selectData={LabReagentsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
            width='100%'         
          fieldType="number"
          fieldName="testDurationTime"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
            width='100%'
          menuMaxHeight={200}        
          fieldName="timeUnitLkey"
          fieldType="select"
          selectData={TimeUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
            width='100%'           
          fieldName="resultType"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
            width='100%'
          menuMaxHeight={200}
           
          fieldName="resultUnitLkey"
          fieldType="select"
          selectData={ValueUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className='container-of-three-fields-diagnostic'>
          <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'
          menuMaxHeight={200}     
          fieldName="sampleContainerLkey"
          fieldType="select"
          selectData={SampleContainerLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'          
          fieldType="number"
          fieldName="sampleVolume"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'
          menuMaxHeight={200}          
          fieldName="sampleVolumeUnitLkey"
          fieldType="select"
          selectData={ValueUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
          width="100%"
          menuMaxHeight={200}           
          fieldName="tubeColorLkey"
          fieldType="select"
          selectData={TubeColorLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
           width="100%"
          menuMaxHeight={200}          
          fieldName="tubeTypeLkey"
          fieldType="select"
          selectData={LabTubeTypeLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
           width="100%"         
          fieldName="testDescription"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
           width="100%"   
          fieldName="sampleHandling"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          <div className="container-of-field-diagnostic">
        <MyInput
           width="100%"          
          fieldType="number"
          fieldLabel="Turnaround Time"
          fieldName="	turnaroundTime"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
          width="100%"
          menuMaxHeight={200}     
          fieldName="turnaroundTimeUnitLkey"
          fieldType="select"
          selectData={TimeUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
      </div>
      <br/>
        <MyInput
          width="100%"
          fieldType="checkbox"
          fieldName="isProfile"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />

        <MyInput
           width="100%"          
          fieldType="textarea"
          fieldName="preparationRequirements"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        <MyInput
           width="100%"           
          fieldType="textarea"
          fieldName="medicalIndications"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        <MyInput
           width="100%"           
          fieldType="textarea"
          fieldName="associatedRisks"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        <MyInput
           width="100%"          
          fieldType="textarea"
          fieldName="testInstructions"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
      </Form>

     
  );
};

export default Laboratory;
