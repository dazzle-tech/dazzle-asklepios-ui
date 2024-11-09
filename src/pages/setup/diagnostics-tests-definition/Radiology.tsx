import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useSaveDiagnosticsRadiologyTestMutation,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { Form, IconButton, Panel } from 'rsuite';

import { ApDiagnosticTestRadiology} from '@/types/model-types';
import { newApDiagnosticTestRadiology } from '@/types/model-types-constructor';
import { Check } from '@rsuite/icons';
import { initialListRequest, ListRequest } from '@/types/types';

const Radiology = ({diagnosticsTest}) => {
   
    const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState<ApDiagnosticTestRadiology>({ ...newApDiagnosticTestRadiology });
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest});
    const { data: internationalCodesLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
    const { data: radCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
    const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
    const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_REAGENTS');
    const [saveDiagnosticsTestRadiology, saveDiagnosticsTestRadiologyMutation] = useSaveDiagnosticsRadiologyTestMutation();
  

    useEffect(() => {
      const updatedFilters =[
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


    const handleSaveBasicInfo = () => {
      
      setDiagnosticTestRadiology({
        ...diagnosticTestRadiology,
        createdBy: 'Administrator',
        testKey: diagnosticsTest.key

      });
      saveDiagnosticsTestRadiology(diagnosticTestRadiology).unwrap();
                  };   
  
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
                <MyInput
                    width={250}
                    column
                    fieldLabel="Category"
                    fieldName="radCategoryLkey"
                    fieldType="select"
                    selectData={radCategoriesLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology}
                />
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
          <IconButton
                onClick={handleSaveBasicInfo}
                appearance="primary"
                color="green"
                icon={<Check />}
              >
                <Translate> {"Save"} </Translate>
              </IconButton>
      </Panel>
      
    );
  };
  
  export default Radiology;