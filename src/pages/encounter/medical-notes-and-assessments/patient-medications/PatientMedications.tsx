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
  Text,
  SelectPicker,
  DatePicker,
  ButtonToolbar
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
const PatientMedications = () => {
  const patientSlice = useAppSelector(state => state.patient);

  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Patient Medications">
        <Grid>
          <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton disabled size="xs" appearance="primary" color="blue" icon={<Plus />} />
              </ButtonToolbar>
            </Col>
            <Col xs={18}></Col>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton
                  disabled
                  size="xs"
                  appearance="primary"
                  color="green"
                  icon={<MdSave />}
                />
                <IconButton disabled size="xs" appearance="primary" color="red" icon={<Trash />} />
              </ButtonToolbar>
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={6}>
              <Text>Start Date</Text>
              <DatePicker placeholder="Start Date" />
            </Col>
            <Col xs={6}>
              <Text>Medication</Text>
              <SelectPicker data={[]} style={{ width: '100%' }} placeholder="Medication" />
            </Col>
            <Col xs={6}>
              <Text>Indication</Text>
              <SelectPicker data={[]} style={{ width: '100%' }} placeholder="Indication" />
            </Col>
            <Col xs={6}>
              <Text>Usage Status</Text>
              <SelectPicker data={[]} style={{ width: '100%' }} placeholder="Usage Status" />
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={24}>
              <Table bordered>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Start Date</Table.HeaderCell>
                  <Table.Cell />
                </Table.Column>
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>Medication Name</Table.HeaderCell>
                  <Table.Cell />
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Indication</Table.HeaderCell>
                  <Table.Cell />
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.Cell />
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Discontinue Date</Table.HeaderCell>
                  <Table.Cell />
                </Table.Column>
              </Table>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </>
  );
};

export default PatientMedications;
