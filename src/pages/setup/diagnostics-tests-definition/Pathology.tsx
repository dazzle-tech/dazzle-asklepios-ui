import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDiagnosticsTestPathologyListQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsTestPathologyMutation
} from '@/services/setupService';
import { Form, IconButton, Panel } from 'rsuite';

import { ApDiagnosticTest, ApDiagnosticTestPathology } from '@/types/model-types';
import { newApDiagnosticTest, newApDiagnosticTestPathology } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { Check, Trash } from '@rsuite/icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

const Pathology = ({ diagnosticsTest }) => {
  const dispatch = useAppDispatch();

  const [listRequest, setListRequest] = useState({
      ...initialListRequest,
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
          value: diagnosticsTest.key  || undefined
  
        }
      ]
    });

  
  const [catalogListRequest, setCatalogListRequest] = useState({
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
        value: '862842242812880' //TODO Add the LOV 'Pathkey'

      }
    ]
  });


  const [diagnosticTestPathology, setDiagnosticTestPathology] = useState<ApDiagnosticTestPathology>({ ...newApDiagnosticTestPathology });
  const { data: catalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);
  const { data: internationalCodesLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('PATH_REAGENTS');
  const { data: specimensLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SPECIMENS');
  const { data: categoryLovQueryResponse } = useGetLovValuesByCodeQuery('MED_CATEGORY');
  const { data: procedurwLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  const [saveDiagnosticsTestPathology, saveDiagnosticsTestPathologyMutation] = useSaveDiagnosticsTestPathologyMutation();
  const { data: pathologyDetailsQueryResponse } = useGetDiagnosticsTestPathologyListQuery(listRequest);

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
    setListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
    }));
  }, [diagnosticsTest.key]);

  
    useEffect(() => {
      if (diagnosticsTest) {
        setDiagnosticTestPathology(prevState => ({
          ...prevState,
          testKey: diagnosticsTest.key
        }));
      }
    }, [diagnosticsTest]);

  useEffect(() => {
    if (pathologyDetailsQueryResponse?.object?.length > 0) {
      setDiagnosticTestPathology(pathologyDetailsQueryResponse?.object[0]);
    } else {
      setDiagnosticTestPathology({ ...newApDiagnosticTestPathology })
    }
  }, [pathologyDetailsQueryResponse]);

  const handleSavePath = () => {

    setDiagnosticTestPathology({
      ...diagnosticTestPathology,
      createdBy: 'Administrator',
      testKey: diagnosticsTest.key

    });
    saveDiagnosticsTestPathology(diagnosticTestPathology).unwrap();
    dispatch(notify('Pathology Details Saved Successfully'));
  };

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
          fieldLabel="Category"
          fieldName="pathologyCategoryLkey"
          selectData={categoryLovQueryResponse?.object ?? []}
          fieldType="select"
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestPathology}
          setRecord={setDiagnosticTestPathology}
        />
              <MyInput
           width={250}
           column
            fieldName="pathCatalogKey"
            fieldType="select"
            selectData={catalogListResponseData?.object ?? []}
            selectDataLabel="description"
            selectDataValue="key"
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
        <br/>
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

        <MyInput width={250}
          column
          fieldName="timeUnitLkey"
          selectData={timeUnitLovQueryResponse?.object ?? []}
          fieldType="select"
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestPathology}
          setRecord={setDiagnosticTestPathology}
        />

        <MyInput width={400} column fieldType="textarea" fieldName="testDescription" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
        <MyInput width={400} column fieldType="textarea" fieldName="sampleHandling" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
        <MyInput width={400} column fieldType="textarea" fieldName="criticalValues" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />

        <MyInput width={400} column fieldType="textarea" fieldName="preparationRequirements" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
        <MyInput width={400} column fieldType="textarea" fieldName="medicalIndications" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />
        <MyInput width={400} column fieldType="textarea" fieldName="associatedRisks" record={diagnosticTestPathology} setRecord={setDiagnosticTestPathology} />


      </Form>
      <IconButton
        onClick={handleSavePath}
        appearance="primary"
        color="green"
        icon={<Check />}
      >
        <Translate> {"Save"} </Translate>
      </IconButton>

    </Panel>

  );
};

export default Pathology;