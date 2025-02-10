import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {
  useSaveDiagnosticsRadiologyTestMutation,
  useGetLovValuesByCodeQuery,
  useGetDiagnosticsTestPathologyListQuery,
  useGetDiagnosticsTestRadiologyListQuery,
  useGetDiagnosticsTestCatalogHeaderListQuery
} from '@/services/setupService';
import { Form, IconButton, Panel } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { ApDiagnosticTestRadiology } from '@/types/model-types';
import { newApDiagnosticTestRadiology } from '@/types/model-types-constructor';
import { Check } from '@rsuite/icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';

const Radiology = ({ diagnosticsTest }) => {

  const dispatch = useAppDispatch();
  const [diagnosticTestRadiology, setDiagnosticTestRadiology] = useState<ApDiagnosticTestRadiology>({ ...newApDiagnosticTestRadiology });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
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
        value: '862828331135792' //TODO Add the LOV 'Radkey'

      }
    ]
  });
  const { data: internationalCodesLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
  const { data: radCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');
  const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: reagentLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_REAGENTS');
  const [saveDiagnosticsTestRadiology, saveDiagnosticsTestRadiologyMutation] = useSaveDiagnosticsRadiologyTestMutation();
  const { data: radiologyDetailsQueryResponse } = useGetDiagnosticsTestRadiologyListQuery(listRequest);
  const { data: CatalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);

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
      console.log("hellllllllo" + diagnosticsTest.key)
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


  const handleSaveRad = () => {

    setDiagnosticTestRadiology({
      ...diagnosticTestRadiology,
      createdBy: 'Administrator',
      testKey: diagnosticsTest.key

    });
    saveDiagnosticsTestRadiology(diagnosticTestRadiology).unwrap();
    dispatch(notify('Radiology Details Saved Successfully'));
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
          fieldLabel="Category"
          fieldName="radCategoryLkey"
          fieldType="select"
          selectData={radCategoriesLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        <MyInput
          width={250}
          column
          fieldName="radCatalogKey"
          fieldType="select"
          selectData={CatalogListResponseData?.object ?? []}
          selectDataLabel="description"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        <MyInput
          width={250}
          column
          fieldName="reagents"
          fieldType="select"
          selectData={reagentLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        <MyInput width={250} column fieldName="imageDuration" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width={250} column fieldType="number" fieldName="	turnaroundTime" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width={250}
          column
          fieldName="turnaroundTimeUnitLkey"
          selectData={timeUnitLovQueryResponse?.object ?? []}
          fieldType="select"
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={diagnosticTestRadiology}
          setRecord={setDiagnosticTestRadiology}
        />
        <MyInput width={400} column fieldType="textarea" fieldName="medicalIndications" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width={400} column fieldType="textarea" fieldName="associatedRisks" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />
        <MyInput width={400} column fieldType="textarea" fieldName="testInstructions" record={diagnosticTestRadiology} setRecord={setDiagnosticTestRadiology} />

      </Form>
      <IconButton
        onClick={handleSaveRad}
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