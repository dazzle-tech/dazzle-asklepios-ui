import Translate from '@/components/Translate';
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Form, Panel } from 'rsuite';

import { ApDiagnosticTestGenetics} from '@/types/model-types';
import { newApDiagnosticTestGenetics } from '@/types/model-types-constructor';

const Genetics = ({diagnosticsTest}) => {
   
    const [diagnosticTestGenetics, setDiagnosticTestGenetics] = useState<ApDiagnosticTestGenetics>({ ...newApDiagnosticTestGenetics });
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
            <Translate>Genetics</Translate>
          </h3>
        }
      >
        <hr />
                  <Form layout="inline" fluid>
                <MyInput width={250} column fieldLabel="Genetics Catalog" fieldName="" record={diagnosticTestGenetics} setRecord={setDiagnosticTestGenetics} />
                <MyInput 
                    width={250} 
                    column
                    fieldLabel="Category"
                    fieldName="pathologyCategoryLkey"
                    selectData={categoryLovQueryResponse?.object ?? []}
                    record={diagnosticTestGenetics}
                    setRecord={setDiagnosticTestGenetics}
                />
                 <MyInput
                    width={250}
                    column
                    fieldName="specimenTypeLkey"
                    fieldType="select"
                    selectData={specimensLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestGenetics} 
                    setRecord={setDiagnosticTestGenetics}
                />
                <MyInput width={250}
                    column
                    fieldName="methodologyLkey"
                    fieldType="select"
                    selectData={procedurwLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestGenetics}
                    setRecord={setDiagnosticTestGenetics} />

                <MyInput width={250}
                    column
                    fieldName="turnaroundTime"
                    record={diagnosticTestGenetics}
                    setRecord={setDiagnosticTestGenetics}
                />         

                <MyInput  width={250} 
                          column 
                          fieldName="timeUnitLkey"
                          selectData={timeUnitLovQueryResponse?.object ?? []}
                          fieldType="select"
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={diagnosticTestGenetics} 
                          setRecord={setDiagnosticTestGenetics}
                />
          
          </Form>

      </Panel>
      
    );
  };
  
  export default Genetics;