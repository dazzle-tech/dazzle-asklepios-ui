import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { Panel, Table } from 'rsuite';
const PatientRecentOrders = () => {
  const patientSlice = useAppSelector(state => state.patient);

  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Recent Orders">
        <Table bordered>
          <Table.Column flexGrow={1}>
            <Table.HeaderCell>Order Date</Table.HeaderCell>
            <Table.Cell />
          </Table.Column>
          <Table.Column flexGrow={1}>
            <Table.HeaderCell>Order Type</Table.HeaderCell>
            <Table.Cell />
          </Table.Column>
          <Table.Column flexGrow={2}>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.Cell />
          </Table.Column>
          <Table.Column flexGrow={1}>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.Cell />
          </Table.Column>
          <Table.Column flexGrow={1}>
            <Table.HeaderCell>Ordered By</Table.HeaderCell>
            <Table.Cell />
          </Table.Column>
        </Table>
      </Panel>
    </>
  );
};

export default PatientRecentOrders;
