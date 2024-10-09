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
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import { initialListRequest } from '@/types/types';
import {
  useGetObservationSummariesQuery,
  useRemoveObservationSummaryMutation,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import {
  newApPatientAllergies,
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetPatientAllergiesQuery,
  useRemovePatientAllergyMutation,
  useSavePatientAllergyMutation
} from '@/services/patientService';
import { useGetAllergensQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientAllergies } from '@/types/model-types';
const PatientAllergies = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedAllergy, setSelectedAllergy] = useState<ApPatientAllergies>({
    ...newApPatientAllergies
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

  const patientAllergyListResponse = useGetPatientAllergiesQuery(listRequest);
  const { data: allergiesListResponseData } = useGetAllergensQuery({
    ...initialListRequest,
    pageSize: 100
  });

  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('SOURCE_OF_INFO');
  const { data: resolutionStatusLovResponseData } =
    useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');

  const [savePatientAllergy, savePatientAllergyMutation] = useSavePatientAllergyMutation();
  const [removePatientAllergy, removePatientAllergyMutation] = useRemovePatientAllergyMutation();

  const save = () => {
    savePatientAllergy({
      ...selectedAllergy,
      addedByVisitKey: patientSlice.encounter.key,
      patientKey: patientSlice.patient.key,
      createdBy: 'Administrator'
    }).unwrap();
  };

  const remove = () => {
    if (selectedAllergy.key) {
      removePatientAllergy({
        ...selectedAllergy,
        deletedBy: 'Administrator'
      }).unwrap();
    }
  };

  useEffect(() => {
    if (savePatientAllergyMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedAllergy({ ...newApPatientAllergies });
    }
  }, [savePatientAllergyMutation]);

  useEffect(() => {
    if (removePatientAllergyMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedAllergy({ ...newApPatientAllergies });
    }
  }, [removePatientAllergyMutation]);

  function formatDate(_date) {
    if (!_date) return '';

    const date = new Date(_date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedAllergy.key) {
      return 'selected-row';
    } else return '';
  };
  return (
    <>
      <Panel bordered style={{ padding: '10px', margin: '5px' }} header="Patient Allergies">
        <Grid fluid>
          <Row gutter={15} style={{ border: '1px solid #e1e1e1' }}>
            <Col xs={3}>
              <ButtonToolbar style={{ margin: '6px' }}>
                <IconButton
                  size="xs"
                  appearance="primary"
                  color="blue"
                  onClick={() => setSelectedAllergy({ ...newApPatientAllergies })}
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
                  disabled={!selectedAllergy.key}
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
              <Text>Allergy</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={allergiesListResponseData?.object ?? []}
                labelKey="allergenName"
                valueKey="key"
                placeholder="Allergen"
                value={selectedAllergy.allergyKey}
                onChange={e =>
                  setSelectedAllergy({
                    ...selectedAllergy,
                    allergyKey: e
                  })
                }
              />
            </Col>
            <Col xs={6}>
              <Text>Info Provider</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={sourceOfInfoLovResponseData?.object ?? []}
                labelKey="lovDisplayVale"
                valueKey="key"
                placeholder="Source of Info"
                value={selectedAllergy.sourceOfInfoLkey}
                onChange={e =>
                  setSelectedAllergy({
                    ...selectedAllergy,
                    sourceOfInfoLkey: e
                  })
                }
              />
            </Col>
            <Col xs={6}>
              <Text>Start Date</Text>
              <DatePicker
                placeholder="Allergy Diagnosed Date"
                value={selectedAllergy.dateDiagnosed}
                onChange={e =>
                  setSelectedAllergy({
                    ...selectedAllergy,
                    dateDiagnosed: e
                  })
                }
              />
            </Col>
            <Col xs={6}>
              <Text>Resolution Status</Text>
              <SelectPicker
                style={{ width: '100%' }}
                data={resolutionStatusLovResponseData?.object ?? []}
                labelKey="lovDisplayVale"
                valueKey="key"
                placeholder="Resolution Status"
                value={selectedAllergy.resolutionStatusLkey}
                onChange={e =>
                  setSelectedAllergy({
                    ...selectedAllergy,
                    resolutionStatusLkey: e
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
                  setSelectedAllergy(rowData);
                }}
                bordered
                data={patientAllergyListResponse.data?.object ?? []}
              >
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Diagnosed Date</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => <Text>{formatDate(rowData.dateDiagnosed)}</Text>}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Allergy Type</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.allergenTypeLvalue
                          ? rowData.allergenTypeLvalue.lovDisplayVale
                          : rowData.allergenTypeLkey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Allergen</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.allergyObject
                          ? rowData.allergyObject.allergenName
                          : rowData.allergyKey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Info Provider</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.sourceOfInfoLvalue
                          ? rowData.sourceOfInfoLvalue.lovDisplayVale
                          : rowData.sourceOfInfoLkey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Text>
                        {rowData.resolutionStatusLvalue
                          ? rowData.resolutionStatusLvalue.lovDisplayVale
                          : rowData.resolutionStatusLkey}
                      </Text>
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Date Resolved</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => <Text>{formatDate(rowData.dateResolved)}</Text>}
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

export default PatientAllergies;
