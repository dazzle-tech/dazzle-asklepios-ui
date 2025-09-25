import { useAppSelector } from '@/hooks';
import {
  useGetObservationSummariesQuery,
  useRemoveObservationSummaryMutation,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { initialListRequest } from '@/types/types';
import { Plus, Trash } from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import { MdSave } from 'react-icons/md';
import 'react-tabs/style/react-tabs.css';
import {
  ButtonToolbar,
  Col,
  Grid,
  IconButton,
  Input,
  InputGroup,
  Panel,
  Row,
  Table,
  Text
} from 'rsuite';
const VitalSigns = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedObservationSummary, setSelectedObservationSummary] = useState({
    ...newApPatientObservationSummary
  });

  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: patientSlice.encounter.key
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const { data: observationListResponseData } = useGetObservationSummariesQuery(listRequest);
  const [saveObservationSummary, saveObservationSummaryMutation] =
    useSaveObservationSummaryMutation();
  const [removeObservationSummary, removeObservationSummaryMutation] =
    useRemoveObservationSummaryMutation();

  const save = () => {
    saveObservationSummary({
      ...selectedObservationSummary,
      visitKey: patientSlice.encounter.key,
      patientKey: patientSlice.patient.key,
      createdBy: 'Administrator'
    }).unwrap();
  };

  const remove = () => {
    if (selectedObservationSummary.key) {
      removeObservationSummary({
        ...selectedObservationSummary,
        deletedBy: 'Administrator'
      }).unwrap();
    }
  };

  useEffect(() => {
    if (saveObservationSummaryMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });

      setSelectedObservationSummary({ ...newApPatientObservationSummary });
    }
  }, [saveObservationSummaryMutation]);

  useEffect(() => {
    if (removeObservationSummaryMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });

      setSelectedObservationSummary({ ...newApPatientObservationSummary });
    }
  }, [removeObservationSummaryMutation]);

  const handleKeyPress = e => {
    const charCode = e.charCode;
    // Allow only numeric input
    if (charCode < 48 || charCode > 57) {
      e.preventDefault();
    }
  };

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedObservationSummary.key) {
      return 'selected-row';
    } else return '';
  };

  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Vital Signs">
        <Grid fluid>
          <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={() =>
                    setSelectedObservationSummary({ ...newApPatientObservationSummary })
                  }
                  icon={<Plus />}
                />
              </ButtonToolbar>
            </Col>
            <Col xs={18}></Col>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton
                  size="xs"
                  onClick={save}
                  appearance="primary"
                  color="green"
                  icon={<MdSave />}
                />
                <IconButton
                  disabled={!selectedObservationSummary.key}
                  size="xs"
                  appearance="primary"
                  onClick={remove}
                  color="red"
                  icon={<Trash />}
                />
              </ButtonToolbar>
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={2}>
              <h6 style={{ textAlign: 'left' }}>BP</h6>
            </Col>
            <Col xs={4}>
              <Input
                type="number"
                onKeyPress={handleKeyPress}
                placeholder="SYS"
                value={selectedObservationSummary.latestbpSystolic}
                onChange={e =>
                  setSelectedObservationSummary({
                    ...selectedObservationSummary,
                    latestbpSystolic: Number(e)
                  })
                }
              />
            </Col>
            <Col xs={1}>
              <h6 style={{ textAlign: 'center' }}>/</h6>
            </Col>
            <Col xs={4}>
              <Input
                type="number"
                onKeyPress={handleKeyPress}
                placeholder="DIA"
                value={selectedObservationSummary.latestbpDiastolic}
                onChange={e =>
                  setSelectedObservationSummary({
                    ...selectedObservationSummary,
                    latestbpDiastolic: Number(e)
                  })
                }
              />
            </Col>
            <Col xs={1}>
              <h6 style={{ textAlign: 'center' }}>mmHg</h6>
            </Col>
            <Col xs={6}></Col>
            <Col xs={1}>
              <h6 style={{ textAlign: 'left' }}>MAP</h6>
            </Col>
            <Col xs={1}></Col>
            <Col xs={4}>
              <Input
                disabled
                value={(
                  (selectedObservationSummary.latestbpSystolic +
                    2 * selectedObservationSummary.latestbpDiastolic) /
                  3
                ).toFixed(2)}
              />
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={2}>
              <h6 style={{ textAlign: 'left' }}>Pulse</h6>
            </Col>
            <Col xs={4}>
              <Input
                type="number"
                onKeyPress={handleKeyPress}
                placeholder="Pulse"
                value={selectedObservationSummary.latestheartrate}
                onChange={e =>
                  setSelectedObservationSummary({
                    ...selectedObservationSummary,
                    latestheartrate: Number(e)
                  })
                }
              />
            </Col>
            <Col xs={1}>
              <h6 style={{ textAlign: 'left' }}>bpm</h6>
            </Col>
            <Col xs={11}></Col>
            <Col xs={1}>
              <h6 style={{ textAlign: 'left' }}>Temp</h6>
            </Col>
            <Col xs={1}></Col>
            <Col xs={4}>
              <InputGroup>
                <Input
                  type="number"
                  onKeyPress={handleKeyPress}
                  placeholder="Temparature"
                  value={selectedObservationSummary.latesttemperature}
                  onChange={e =>
                    setSelectedObservationSummary({
                      ...selectedObservationSummary,
                      latesttemperature: Number(e)
                    })
                  }
                />
                <InputGroup.Addon>
                  <Text>°C</Text>
                </InputGroup.Addon>
              </InputGroup>
            </Col>
          </Row>
          <Row gutter={15}>
            <Col xs={24}>
              <Table
                bordered
                onRowClick={rowData => {
                  setSelectedObservationSummary(rowData);
                }}
                rowClassName={isSelected}
                data={observationListResponseData?.object ?? []}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => <Text>{formatTimestamp(rowData.createdAt)}</Text>}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>BP</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>{rowData.latestbpSystolic} / {rowData.latestbpDiastolic}</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Pulse</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>{rowData.latestheartrate} bpm</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Temperature</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>{rowData.latesttemperature} °C</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>User</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>{rowData.createdBy}</Text>}</Table.Cell>
                </Table.Column>
              </Table>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </>
  );
};

export default VitalSigns;
