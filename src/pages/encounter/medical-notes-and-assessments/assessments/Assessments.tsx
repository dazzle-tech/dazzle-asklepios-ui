import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { FlexboxGrid, IconButton, Input, Panel, Table, Grid, Row, Col, Text } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import { BlockUI } from 'primereact/blockui';
const Assessments = () => {
  const patientSlice = useAppSelector(state => state.patient);

  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Assessment">
          <Grid fluid>
            <Row gutter={15}>
              <Col xs={4}>
                <Table bordered>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Area</Table.HeaderCell>
                    <Table.Cell />
                  </Table.Column>
                </Table>
              </Col>
              <Col xs={20}>
                <Table bordered >
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Checked</Table.HeaderCell>
                    <Table.Cell />
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Assessment</Table.HeaderCell>
                    <Table.Cell />
                  </Table.Column>
                  <Table.Column flexGrow={1}>
                    <Table.HeaderCell>Details</Table.HeaderCell>
                    <Table.Cell />
                  </Table.Column>
                </Table>
              </Col>
            </Row>
            <Row gutter={15}>
              <Col xs={2}>
                <IconButton icon={<icons.List />}>Summary</IconButton>
              </Col>
            </Row>
          </Grid>
      </Panel>
    </>
  );
};

export default Assessments;
