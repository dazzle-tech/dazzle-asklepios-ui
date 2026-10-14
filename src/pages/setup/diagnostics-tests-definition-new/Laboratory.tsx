import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetAllAnalyzersQuery } from '@/services/setup/analyzerService';
import {
  useGetLovValuesByCodeQuery,
  useGetLovValuesBulkByKeysQuery
} from '@/services/setupService';
import { newLaboratory } from '@/types/model-types-constructor-new';
import React, { useEffect, useMemo } from 'react';
import { Form } from 'rsuite';
const Laboratory = ({ diagnosticsTest, diagnosticTestLaboratory,setDiagnosticTestLaboratory }) => {
 
  const {data:getLaboratory}=useGetLaboratoryByTestIdQuery(diagnosticsTest?.id ,{ skip: !diagnosticsTest?.id });
 
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
  // Fetch Analyzers list
  const { data: analyzersResponse } = useGetAllAnalyzersQuery();
  // Resolve analyzer type display labels by LOV key (same as LovValueCell)
  const analyzerTypeKeys = useMemo(
    () =>
      Array.from(
        new Set(
          (analyzersResponse ?? [])
            .map((a: any) => String(a?.type ?? '').trim())
            .filter(Boolean)
        )
      ),
    [analyzersResponse]
  );
  const { data: analyzerTypeLovResponse } = useGetLovValuesBulkByKeysQuery(analyzerTypeKeys, {
    skip: analyzerTypeKeys.length === 0
  });
  const analyzerOptions = useMemo(() => {
    const typeLabelByKey: Record<string, string> = {};
    (analyzerTypeLovResponse?.object ?? []).forEach((lov: any) => {
      typeLabelByKey[String(lov.key)] = lov.lovDisplayVale;
    });
    return (analyzersResponse ?? []).map((a: any) => ({
      ...a,
      label: typeLabelByKey[String(a.type)] ?? a.code ?? ''
    }));
  }, [analyzersResponse, analyzerTypeLovResponse]);

  const selectedAnalyzerCode = useMemo(
    () => analyzerOptions.find((a: any) => a.id === diagnosticTestLaboratory?.analyzerId)?.code ?? '',
    [analyzerOptions, diagnosticTestLaboratory?.analyzerId]
  );


  //Enums
  const systems=useEnumOptions("System");
  const scales=useEnumOptions("Scale");
  const properties=useEnumOptions("Property");
  const methods=useEnumOptions("Method");
  const timings=useEnumOptions("Timing");


 useEffect(() => {
    if (getLaboratory) {
      setDiagnosticTestLaboratory(getLaboratory);
    }
    else {
      setDiagnosticTestLaboratory({ ...newLaboratory });
    }
  }, [getLaboratory]);

  useEffect(() => {
    if (diagnosticsTest) {
      setDiagnosticTestLaboratory(prevState => ({
        ...prevState,
        testId: diagnosticsTest.id
      }));
    }
  }, [diagnosticsTest]);

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
      <Form fluid dir={dir}>
          <div className="container-of-two-fields-diagnostic">
            <div className="container-of-field-diagnostic">
        <MyInput
          width='100%'
          menuMaxHeight={200}
          fieldName="analyzerId"
          fieldLabel="Analyzer"
          fieldType="select"
          selectData={analyzerOptions}
          selectDataLabel="label"
          selectDataValue="id"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
          disabled
          width='100%'
          fieldName="analyzerCode"
          fieldLabel="Analyzer Code"
          record={{ analyzerCode: selectedAnalyzerCode }}
          setRecord={() => {}}
        />
        </div>
        </div>
        <br/>
          <div className='container-of-three-fields-diagnostic'>
            <div className='field-in-three-fields-diagnostics'>
        <MyInput
          required
          width='100%'
          menuMaxHeight={200}
          fieldName="category"
          fieldType="select"
          selectData={CategoriesLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       
       <div className='field-in-three-fields-diagnostics'>
        
        <MyInput
            width='100%'
          menuMaxHeight={200}
           
          fieldName="property"
          fieldType="select"
          selectData={properties ?? []}
          selectDataLabel="label"
          selectDataValue="value"
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
          menuMaxHeight={200}
          fieldName="timing"
          fieldType="select"
          selectData={timings ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       <div className='field-in-three-fields-diagnostics'>
      
         <MyInput
            width='100%'
          menuMaxHeight={200}
          fieldName="system"
          fieldType="select"
          selectData={systems ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
       <div className='field-in-three-fields-diagnostics'>
       
         <MyInput
            width='100%'
          menuMaxHeight={200}
          fieldName="scale"
          fieldType="select"
          selectData={scales ?? []}
          selectDataLabel="label"
          selectDataValue="value"
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
          menuMaxHeight={200}
          fieldType='select'         
          fieldName="method"
          selectData={methods ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
           width='100%'
          menuMaxHeight={200}         
          fieldName="reagents"
          fieldType="select"
          selectData={LabReagentsLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
          fieldName="timeUnit"
          fieldType="select"
          selectData={TimeUnitLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
          fieldName="sampleContainer"
          fieldType="select"
          selectData={SampleContainerLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
          fieldName="sampleVolumeUnit"
          fieldType="select"
          selectData={ValueUnitLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
          fieldName="tubeColor"
          fieldType="select"
          selectData={TubeColorLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
           width="100%"
          menuMaxHeight={200}          
          fieldName="tubeType"
          fieldType="select"
          selectData={LabTubeTypeLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
          fieldName="turnaroundTime"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        <div className="container-of-field-diagnostic">
        <MyInput
          width="100%"
          menuMaxHeight={200}     
          fieldName="turnaroundTimeUnit"
          fieldType="select"
          selectData={TimeUnitLovQueryResponse?.object ?? []}
           selectDataLabel="lovDisplayVale"
 disableByField='isValid'

          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
      </div>
      <br/>
    

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
