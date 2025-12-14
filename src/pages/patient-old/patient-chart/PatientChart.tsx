import { useAppSelector } from '@/hooks';
import React from 'react';
import {
  Panel,
  FlexboxGrid,
  Col,
  Button,
  IconButton,
  ButtonToolbar,
  ButtonGroup,
  List,
  Table,
  Tag,
  TagGroup
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

const PatientChart = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const vitalSignsMockData = [
    {
      measure: 'Temp',
      date: '2023-10-28',
      value: '27',
      previous: '31',
      user: 'Nafiz'
    },
    {
      measure: 'BP',
      date: '2023-10-28',
      value: '27',
      previous: '31',
      user: 'Nafiz'
    },
    {
      measure: 'HR',
      date: '2023-10-28',
      value: '27',
      previous: '31',
      user: 'Nafiz'
    },
    {
      measure: 'O2 Sat.',
      date: '2023-10-28',
      value: '27',
      previous: '31',
      user: 'Nafiz'
    }
  ];
  const problemsMockData = [
    {
      code: 'B12D',
      description: 'B12 Defecency'
    }
  ];
  return (
    <>
      {patientSlice.patient && (
        <Panel header={<h3 className="title">Patient Chart</h3>}>
          <FlexboxGrid>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Patient Information" collapsible bordered defaultExpanded>
                <div>
                  <span style={{ display: 'block', fontSize: '16px', fontWeight: 'bold' }}>
                    Patient Name
                  </span>
                  <span>{patientSlice.patient.fullName}</span>
                </div>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Allergies" collapsible bordered defaultExpanded>
                <List bordered>
                  <List.Item>
                    <h6>Food allergies</h6>
                    <TagGroup>
                      <Tag>cane sugar</Tag>
                      <Tag>penuts</Tag>
                    </TagGroup>
                  </List.Item>

                  <List.Item>
                    <h6>Drug allergies</h6>
                    <TagGroup>
                      <Tag>paracetamol</Tag>
                      <Tag>penecilin</Tag>
                    </TagGroup>
                  </List.Item>

                  <List.Item>
                    <h6>Environmental allergies</h6>
                    <TagGroup>
                      <Tag>dust</Tag>
                    </TagGroup>
                  </List.Item>
                </List>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Vital Signs & Measurements" collapsible bordered defaultExpanded>
                <Table data={vitalSignsMockData}>
                  <Column>
                    <HeaderCell>Measure</HeaderCell>
                    <Cell dataKey="measure" />
                  </Column>
                  <Column>
                    <HeaderCell>Date</HeaderCell>
                    <Cell dataKey="date" />
                  </Column>
                  <Column>
                    <HeaderCell>Value</HeaderCell>
                    <Cell dataKey="value" />
                  </Column>
                  <Column>
                    <HeaderCell>Previous</HeaderCell>
                    <Cell dataKey="previous" />
                  </Column>
                  <Column>
                    <HeaderCell>User</HeaderCell>
                    <Cell dataKey="user" />
                  </Column>
                </Table>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Visit Summary" collapsible bordered defaultExpanded>
                <div>
                  <span style={{ display: 'block', fontSize: '16px', fontWeight: 'bold' }}>
                    Chief Complaint
                  </span>
                  <span>Cough</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '16px', fontWeight: 'bold' }}>
                    Visit Provider
                  </span>
                  <span>GP Nafiz</span>
                </div>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Pre-Arrival Triage" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Diagnostics" collapsible bordered defaultExpanded>
                <Table data={vitalSignsMockData}>
                  <Column>
                    <HeaderCell>Dx</HeaderCell>
                    <Cell dataKey="measure" />
                  </Column>
                  <Column>
                    <HeaderCell>Onset</HeaderCell>
                    <Cell dataKey="date" />
                  </Column>
                  <Column>
                    <HeaderCell>Type</HeaderCell>
                    <Cell dataKey="value" />
                  </Column>
                </Table>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Problems" collapsible bordered defaultExpanded>
                <Table data={problemsMockData}>
                  <Column flexGrow={1}>
                    <HeaderCell>Code</HeaderCell>
                    <Cell dataKey="code" />
                  </Column>
                  <Column flexGrow={2}>
                    <HeaderCell>Description</HeaderCell>
                    <Cell dataKey="description" />
                  </Column>
                </Table>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="General Labs" collapsible bordered defaultExpanded>
                <Table data={problemsMockData}>
                  <Column flexGrow={1}>
                    <HeaderCell>Chemestry</HeaderCell>
                    <Cell />
                  </Column>
                  <Column flexGrow={2}>
                    <HeaderCell>Result</HeaderCell>
                    <Cell />
                  </Column>
                  <Column flexGrow={1}>
                    <HeaderCell>Date</HeaderCell>
                    <Cell />
                  </Column>
                </Table>
              </Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Medications" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Histories" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Alerts" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Rads" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Procedures" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Home Medication" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Documents/Note" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item as={Col} colspan={24} lg={6} md={12} sm={24}>
              <Panel header="Future Appointments" collapsible bordered defaultExpanded></Panel>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Panel>
      )}
    </>
  );
};

export default PatientChart;
