import Translate from '@/components/Translate';
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Form, Panel } from 'rsuite';

import { ApDiagnosticTestPathology} from '@/types/model-types';
import { newApDiagnosticTestPathology } from '@/types/model-types-constructor';

const Pathology = () => {
   
    const [diagnosticTestPathology, setDiagnosticTestPathology] = useState<ApDiagnosticTestPathology>({ ...newApDiagnosticTestPathology });
    const { data: internationalCodesLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
    const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('PATH_REAGENTS');
    const { data: specimensLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SPECIMENS');
    const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
    const { data: procedurwLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');

      
  
    return (
      
      <Panel
        header={
          <h3 className="title">
            <Translate>Pathology</Translate>
          </h3>
        }
      >
        <hr />
                  <Form layout="inline" fluid>
                <MyInput
                    width={250}
                    column
                    fileldLabel="International Coding Type"
                    fieldName="InternationalCodingTypeLkey"
                    selectData={internationalCodesLovQueryResponse?.object ?? []}
                    fieldType="select"
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology}
                />
                <MyInput width={250} column fieldLabel="Code" fieldName="childCodeLkey" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
                <MyInput width={250} column fieldLabel="Pathology Catalog" fieldName="" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
                <MyInput 
                    width={250} 
                    column
                    fieldLabel="Category"
                    fieldName="pathologyCategoryLkey"
                    selectData={categoryLovQueryResponse?.object ?? []}
                    record={diagnosticTestPathology}
                    setRecord={setDiagnosticTestPathology}
                />
                <MyInput
                    width={250}
                    column
                    fieldName="reagents"
                    fieldType="select"
                    selectData={reagentLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology}
                />
                 <MyInput
                    width={250}
                    column
                    fieldName="specimenTypeLkey"
                    fieldType="select"
                    selectData={specimensLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology}
                />
                <MyInput width={250}
                    column
                    fieldName="analysisProcedureLkey"
                    fieldType="select"
                    selectData={procedurwLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestPathology}
                    setRecord={setDiagnosticTestPathology} />

                <MyInput width={250}
                    column
                    fieldName="turnaroundTime"
                    record={diagnosticTestPathology}
                    setRecord={setDiagnosticTestPathology}
                />         

                <MyInput  width={250} 
                          column 
                          fieldName="timeUnitLkey"
                          selectData={timeUnitLovQueryResponse?.object ?? []}
                          fieldType="select"
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={diagnosticTestPathology} 
                          setRecord={setDiagnosticTestPathology}
                />
          
          </Form>

      </Panel>
      
    );
  };
  
  export default Pathology;