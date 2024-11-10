import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Drawer, Input, List, Modal, Pagination, Panel, SelectPicker, Table, Carousel } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Accordion,  Checkbox, TagGroup, Tag, CheckboxGroup, InputGroup  } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetLovValuesByCodeQuery,
  useGetServicesQuery,
} from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApCdt } from '@/types/model-types';
import { newApCdt, newApServiceCdt } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';

import { ApActiveIngredient} from '@/types/model-types';
import { newApActiveIngredient } from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { Check, Trash } from '@rsuite/icons';
import { Console } from 'console';


const Laboratory = ({diagnosticsTest}) => {
   
    const [popupOpen, setPopupOpen] = useState(false);
    const [activeIngredient, setActiveIngredient] = useState<ApActiveIngredient>({ ...newApActiveIngredient });
    const [listRequest, setListRequest] = useState<ListRequest>({
      ...initialListRequest,
      pageSize: 15
    });
  
  
  
    const { data: serviceListResponse } = useGetServicesQuery({
      ...initialListRequest,
      pageSize: 1000,
      skipDetails: true
    });
    
    const { data: LabReagentsLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_REAGENTS');
  
    const [carouselActiveIndex, setCarouselActiveIndex] = useState(0); 
  
    const handlePopup = () => {
        setPopupOpen(!false);
      };
      
    console.log("Hellllllllo I am in LAB")
  
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
            fieldName="labCatalog"
            fieldType="select"
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient} setRecord={setActiveIngredient}
          />
          <MyInput  width={250} column fieldName="internationalCodeType" record={activeIngredient} setRecord={setActiveIngredient} />
          <MyInput  width={250} column fieldName="code" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="loincCode"  record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="property"record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="timing" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="system" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="scale" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="method" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput
            width={250}
            column
            fieldName="reagents"
            fieldType="select"
            selectData={LabReagentsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient} setRecord={setActiveIngredient}
          />
          <MyInput  width={250} column fieldName="testDurationTime" record={activeIngredient} setRecord={setActiveIngredient} />
          <MyInput  width={250} column fieldName="unit" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={250} column fieldName="resultUnit" record={activeIngredient} setRecord={setActiveIngredient} />
          <MyInput  width={250} column fieldName="method" record={activeIngredient} setRecord={setActiveIngredient}/>
          <Checkbox value="K" onCheckboxClick={handlePopup}>Gender Specific</Checkbox>
          </Form>

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
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
            <MyInput  width={300} column fieldName="name" record={activeIngredient} setRecord={setActiveIngredient}/>

          <MyInput
           width={300}
           column
            fieldName="status"
            fieldType="select"
            selectData={LabReagentsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={activeIngredient}
            setRecord={setActiveIngredient}
          />
         
          <MyInput  width={300} column fieldName="label" record={activeIngredient} setRecord={setActiveIngredient}/>
          <MyInput  width={300} column fieldName="note" record={activeIngredient} setRecord={setActiveIngredient}/>
         
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