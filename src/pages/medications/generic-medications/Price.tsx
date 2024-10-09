import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import {
  FlexboxGrid,
  IconButton,
  Input,
  Panel,
  Table,
  Grid,
  Row,
  Col,
  ButtonToolbar,
  Text,
  InputGroup,
  SelectPicker,
  DatePicker
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';

import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetPatientDiagnosisQuery,
  useRemovePatientDiagnoseMutation,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientDiagnose } from '@/types/model-types';



const Price = () => {
   
    
    
    return (
      <>
        <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Price">
          <Grid fluid>
            <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
              <Col xs={3}>
                <ButtonToolbar style={{ margin: '6px' }}>
                  <IconButton
                    size="xs"
                    appearance="primary"
                    color="blue"
                    icon={<Plus />}
                  />
                </ButtonToolbar>
              </Col>
              <Col xs={18}></Col>
              <Col xs={3}>
                <ButtonToolbar style={{ margin: '6px' }}>
                  <IconButton
                    size="xs"
                    appearance="primary"
                    color="green"
                    icon={<MdSave />}
                  />
                  <IconButton
                    size="xs"
                    appearance="primary"
                    color="red"
                    icon={<Trash />}
                  />
                </ButtonToolbar>
              </Col>
            </Row>
            <Row gutter={15}>
              <Col xs={6}>
                <Text>Cost</Text>
                <Input
                type="number"
                placeholder="Unit Orders"
               
              />
              </Col>
  
              <Col xs={6}>
              <Text>Price</Text>
                <Input
                type="number"
                placeholder="Price"
               
              />
              </Col>
            </Row>

          </Grid>
        </Panel>
      </>
    );

};
export default Price;