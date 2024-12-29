import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, List, Modal, Pagination, Panel, SelectPicker, Table, Carousel } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Accordion,  Checkbox, TagGroup, Tag, CheckboxGroup, InputGroup  } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetCatalogDiagnosticsTestListQuery,
  useGetDiagnosticsTestCatalogHeaderListQuery,
  useGetDiagnosticsTestLaboratoryListQuery,
  useGetLovValuesByCodeQuery,
  useGetServicesQuery,
  useSaveDiagnosticsTestLaboratoryMutation,
} from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApCdt, ApDiagnosticTestLaboratory } from '@/types/model-types';
import { newApCdt, newApDiagnosticTestLaboratory, newApServiceCdt } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';

import { ApActiveIngredient} from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { Check, Trash } from '@rsuite/icons';
import { Console } from 'console';
import { notify } from '@/utils/uiReducerActions';

const Laboratory = ({diagnosticsTest}) => {
   
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [diagnosticTestLaboratory, setDiagnosticTestLaboratory] = useState<ApDiagnosticTestLaboratory>({ ...newApDiagnosticTestLaboratory });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });



  const { data: serviceListResponse } = useGetServicesQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
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
        value: diagnosticsTest.key  || undefined

      }
    ]
  });

  const { data: CatalogListResponseData } = useGetDiagnosticsTestCatalogHeaderListQuery(catalogListRequest);
  const { data: LabReagentsLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  const { data: InterCodeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
  const { data: CategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const { data: TimeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: SampleContainerLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  const { data: TubeColorLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  const [saveDiagnosticsTestLaboratory, saveDiagnosticsTestLaboratoryMutation] = useSaveDiagnosticsTestLaboratoryMutation();
  const { data: labrotoryDetailsQueryResponse } = useGetDiagnosticsTestLaboratoryListQuery(labListRequest);

  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);


  useEffect(() => {
    if (diagnosticTestLaboratory.isProfile === true && diagnosticTestLaboratory.key === null ) {
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
    setLabListRequest((prevRequest) => ({
      ...prevRequest,
      filters: updatedFilters,
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
     if(labrotoryDetailsQueryResponse?.object?.length > 0){
      setDiagnosticTestLaboratory(labrotoryDetailsQueryResponse?.object[0]);
     }else{
      setDiagnosticTestLaboratory({...newApDiagnosticTestLaboratory})
     }
  }, [labrotoryDetailsQueryResponse]);

  const handleSaveLab = () => {
      
    setDiagnosticTestLaboratory({
      ...diagnosticTestLaboratory,
      createdBy: 'Administrator',
      testKey: diagnosticsTest.key

    });
    saveDiagnosticsTestLaboratory(diagnosticTestLaboratory).unwrap();
     dispatch(notify('Laboratory Details Saved Successfully'));
                };   
  
    return (
      
      <Panel
        header={
          <h3 className="title">
            <Translate>Laboratory</Translate>
          </h3>
        }
      >
        <hr />
          <Form layout="inline" fluid>
          <MyInput
           width={250}
           column
            fieldName="labCatalogKey"
            fieldType="select"
            selectData={CatalogListResponseData?.object ?? []}
            selectDataLabel="description"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
          <MyInput
            width={250}
            column
            fieldName="internationalCodingTypeLkey"
            fieldType="select"
            selectData={InterCodeLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
          <MyInput  width={250} column fieldName="childCodeLkey" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="loincCode"  record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="propertyLkey"record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="timing" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="systemLkey" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="scaleLkey" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="methodLkey" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput
            width={250}
            column
            fieldName="reagentsLkey"
            fieldType="select"
            selectData={LabReagentsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}
          />
          <MyInput  width={250} column fieldType='number' fieldName="testDurationTime" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory} />
           <MyInput
            width={250}
            column
            fieldName="timeUnitLkey"
            fieldType="select"
            selectData={TimeUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}
          />
           <MyInput  width={250} column fieldName="resultType" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory} />
            <MyInput
            width={250}
            column
            fieldName="resultUnitLkey"
            fieldType="select"
            selectData={ValueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
          <MyInput
            width={250}
            column
            fieldName="sampleContainerLkey"
            fieldType="select"
            selectData={SampleContainerLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
           <MyInput  width={250} column fieldType="number" fieldName="sampleVolume" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput
            width={250}
            column
            fieldName="sampleVolumeUnitLkey"
            fieldType="select"
            selectData={ValueUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
           <MyInput
            width={250}
            column
            fieldName="tubeColorLkey"
            fieldType="select"
            selectData={TubeColorLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
            <MyInput
            width={250}
            column
            fieldName="tubeColorLkey"
            fieldType="select"
            selectData={TubeColorLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
          <MyInput  width={250} column fieldName="testDescription" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldName="sampleHandling" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={250} column fieldType="number" fieldName="	turnaroundTime" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput
            width={250}
            column
            fieldName="turnaroundTimeUnitLkey"
            fieldType="select"
            selectData={TimeUnitLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory} 
            setRecord={setDiagnosticTestLaboratory}
          />
           <MyInput width={250} column fieldType="checkbox" fieldName="isProfile" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
         

          <br/> <br/> 
          <MyInput  width={400} column fieldType="textarea" fieldName="preparationRequirements" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={400} column fieldType="textarea" fieldName="medicalIndications" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={400} column fieldType="textarea" fieldName="associatedRisks" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={400} column fieldType="textarea" fieldName="testInstructions" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
         
        

         
         
          </Form>

          <IconButton
                onClick={handleSaveLab}
                appearance="primary"
                color="green"
                icon={<Check />}
              >
                <Translate> {"Save"} </Translate>
              </IconButton>


          <Modal open={popupOpen} overflow>
        <Modal.Title>
          <Translate>New/Edit Profile</Translate>
        </Modal.Title>
        <Modal.Body>
          <Form layout="inline" fluid>
          <MyInput
            width={300}
            column
            fieldName="category"
            fieldType="select"
            selectData={LabReagentsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory}
            setRecord={setDiagnosticTestLaboratory}
          />
            <MyInput  width={300} column fieldName="name" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>

          <MyInput
           width={300}
           column
            fieldName="status"
            fieldType="select"
            selectData={LabReagentsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={diagnosticTestLaboratory}
            setRecord={setDiagnosticTestLaboratory}
          />
         
          <MyInput  width={300} column fieldName="label" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
          <MyInput  width={300} column fieldName="note" record={diagnosticTestLaboratory} setRecord={setDiagnosticTestLaboratory}/>
         
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Stack spacing={2} divider={<Divider vertical />}>
            <Button appearance="primary" onClick={() => setPopupOpen(false)}>
              Save
            </Button>
            <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
              Cancel
            </Button>
          </Stack>
        </Modal.Footer>
      </Modal>
      </Panel>
      
    );
  };
  
  export default Laboratory;