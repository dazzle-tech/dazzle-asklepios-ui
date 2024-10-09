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
const PatientDiagnosis = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose
  });

  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patientSlice.patient.key
      },
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);

  const { data: icdListResponseData } = useGetIcdListQuery({
    ...initialListRequest,
    pageSize: 100
  });

  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('SOURCE_OF_INFO');
  const { data: resolutionStatusLovResponseData } =
    useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');

  const [savePatientDiagnose, savePatientDiagnoseMutation] = useSavePatientDiagnoseMutation();
  const [removePatientDiagnose, removePatientDiagnoseMutation] = useRemovePatientDiagnoseMutation();

  const save = () => {
    savePatientDiagnose({
      ...selectedDiagnose,
      visitKey: patientSlice.encounter.key,
      patientKey: patientSlice.patient.key,
      createdBy: 'Administrator'
    }).unwrap();
  };

  const remove = () => {
    if (selectedDiagnose.key) {
      removePatientDiagnose({
        ...selectedDiagnose,
        deletedBy: 'Administrator'
      }).unwrap();
    }
  };

  useEffect(() => {
    if (savePatientDiagnoseMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedDiagnose({ ...newApPatientDiagnose });
    }
  }, [savePatientDiagnoseMutation]);

  useEffect(() => {
    if (removePatientDiagnoseMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedDiagnose({ ...newApPatientDiagnose });
    }
  }, [removePatientDiagnoseMutation]);

  function formatDate(_date) {
    if (!_date) return '';

    const date = new Date(_date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedDiagnose.key) {
      return 'selected-row';
    } else return '';
  };
  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Patient Diagnosis">
        <Grid fluid>
          <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={() => setSelectedDiagnose({ ...newApPatientDiagnose })}
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
                  disabled={!selectedDiagnose.key}
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
            <Col xs={6}>
              <Text>Diagnose Date</Text>
              <DatePicker
                placeholder="Date of Diagnosis"
                value={selectedDiagnose.dateDiagnosed}
                onChange={e =>
                  setSelectedDiagnose({
                    ...selectedDiagnose,
                    dateDiagnosed: e
                  })
                }
              />
            </Col>
            <Col xs={6}>
              <Text>Diagnose</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={icdListResponseData?.object ?? []}
                labelKey="description"
                valueKey="key"
                placeholder="ICD"
                value={selectedDiagnose.diagnoseCode}
                onChange={e =>
                  setSelectedDiagnose({
                    ...selectedDiagnose,
                    diagnoseCode: e
                  })
                }
              />
            </Col>
            <Col xs={6}>
              <Text>Type</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={sourceOfInfoLovResponseData?.object ?? []}
                labelKey="lovDisplayVale"
                valueKey="key"
                placeholder="Source of Info"
                value={selectedDiagnose.diagnoseTypeLkey}
                onChange={e =>
                  setSelectedDiagnose({
                    ...selectedDiagnose,
                    diagnoseTypeLkey: e
                  })
                }
              />
            </Col>

            <Col xs={6}>
              <Text>Status</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={resolutionStatusLovResponseData?.object ?? []}
                labelKey="lovDisplayVale"
                valueKey="key"
                placeholder="Resolution Status"
                value={selectedDiagnose.diagnoseStatusLkey}
                onChange={e =>
                  setSelectedDiagnose({
                    ...selectedDiagnose,
                    diagnoseStatusLkey: e
                  })
                }
              />
            </Col>
          </Row>

          <Row gutter={15}>
            <Col xs={24}>
              <Table
                rowClassName={isSelected}
                onRowClick={rowData => {
                  setSelectedDiagnose(rowData);
                }}
                bordered
                data={patientDiagnoseListResponse.data?.object ?? []}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Diagnosed Date</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => <Text>{formatDate(rowData.dateDiagnosed)}</Text>}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Diagnose Type</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.diagnoseTypeLvalue
                          ? rowData.diagnoseTypeLvalue.lovDisplayVale
                          : rowData.diagnoseTypeLkey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>ICD-10 Diagnosis</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.diagnosisObject
                          ? rowData.diagnosisObject.description
                          : rowData.diagnoseCode}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.diagnoseStatusLvalue
                          ? rowData.diagnoseStatusLvalue.lovDisplayVale
                          : rowData.diagnoseStatusLkey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
            </Col>
          </Row>
        </Grid>
      </Panel>
    </>
  );
};

export default PatientDiagnosis;
