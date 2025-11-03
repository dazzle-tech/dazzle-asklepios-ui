import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetLaboratoryByTestIdQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
const Laboratory = ({ diagnosticsTest, diagnosticTestLaboratory,setDiagnosticTestLaboratory }) => {
  const [popupOpen, setPopupOpen] = useState(false);
 
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


  //Enums
  const systems=useEnumOptions("System");
  const scales=useEnumOptions("Scale");
  const properties=useEnumOptions("Property");
  const methods=useEnumOptions("Method");
  const timings=useEnumOptions("Timing");

  // Effects
  useEffect(() => {
    if (diagnosticsTest.isProfile === true && diagnosticTestLaboratory.id === null) {
      setPopupOpen(!popupOpen);
    }
  }, [diagnosticsTest?.isProfile]);

 useEffect(() => {
    if (getLaboratory) {
      setDiagnosticTestLaboratory(getLaboratory);
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



  return (
      <Form fluid>
          <div className='container-of-three-fields-diagnostic'>
            <div className='field-in-three-fields-diagnostics'>
        <MyInput
          width='100%'
          menuMaxHeight={200}
          fieldName="category"
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
            width='100%'
          menuMaxHeight={200}
           
          fieldName="resultUnit"
          fieldType="select"
          selectData={ValueUnitLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
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
          selectDataValue="key"
          record={diagnosticTestLaboratory}
          setRecord={setDiagnosticTestLaboratory}
        />
        </div>
        </div>
        <br/>
        <div className="container-of-two-fields-diagnostic">
          
        <div className="container-of-field-diagnostic">
       
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
