import Translate from '@/components/Translate';
import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Form, Panel } from 'rsuite';

import { ApDiagnosticTestRadiology} from '@/types/model-types';
import { newApDiagnosticTestRadiology } from '@/types/model-types-constructor';

const Radiology = () => {
   
    const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState<ApDiagnosticTestRadiology>({ ...newApDiagnosticTestRadiology });
    const { data: internationalCodesLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
    const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_REAGENTS');
      
  
    return (
      
      <Panel
        header={
          <h3 className="title">
            <Translate>Radiology</Translate>
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
                    record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology}
                />
                <MyInput width={250} column fieldLabel="Code" fieldName="childCodeLkey" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
                <MyInput width={250} column fieldLabel="Radiology Catalog" fieldName="" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
                <MyInput width={250} column fieldLabel="Category" fieldName="radCategoryLkey" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
                <MyInput
                    width={250}
                    column
                    fieldName="reagents"
                    fieldType="select"
                    selectData={reagentLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology}
                />
                <MyInput width={250} column fieldName="imageDuration" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
                <MyInput width={250} column fieldName="time unit"
                          selectData={timeUnitLovQueryResponse?.object ?? []}
                          fieldType="select"
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology}
                />
          
          </Form>

      </Panel>
      
    );
  };
  
  export default Radiology;