import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import EncounterMainInfoSection from '../encounter-main-info-section';
import { useAppSelector, useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import {
  FlexboxGrid,
  IconButton,
  Input,
  Table,
  Grid,
  Row,
  Col,
  ButtonToolbar,
  Text,
  InputGroup,
  SelectPicker,
  Form
} from 'rsuite';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import BlockIcon from '@rsuite/icons/Block';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetObservationSummariesQuery,
  useRemoveObservationSummaryMutation,
  useSaveObservationSummaryMutation
} from '@/services/observationService';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import {
  ApPatientObservationSummary
} from '@/types/model-types';
import {
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { useNavigate } from 'react-router-dom';
const EncounterPreObservations = () => {
  const patientSlice = useAppSelector(state => state.patient);
  console.log(patientSlice.encounter);
  const dispatch = useAppDispatch();
  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const navigate = useNavigate();
  const [patientObservationSummary, setPatientObservationSummary] = useState<ApPatientObservationSummary>({
    ...newApPatientObservationSummary,
    latesttemperature: null,
    latestbpSystolic: null,
    latestbpDiastolic: null,
    latestheartrate: null,
    latestrespiratoryrate: null,
    latestoxygensaturation: null,
    latestglucoselevel: null,
    latestweight: null,
    latestheight: null,
    latestheadcircumference: null
  })
  const [bmi, setBmi] = useState('');
  const [bsa, setBsa] = useState('');
  const [saveObservationSummary, setSaveObservationSummary]=useSaveObservationSummaryMutation();
  const [patientLastVisitObservationsListRequest, setPatientLastVisitObservationsListRequest] =
  useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patientSlice.patient.key
      }
    ]
  });
  const [patientObservationsListRequest, setPatientObservationsListRequest] =
  useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patientSlice.patient.key
      }
      ,
      {
        fieldName: 'visit_key',
        operator: 'match',
        value:patientSlice.encounter.key
      }
    ]
  });
const { data: getObservationSummaries } = useGetObservationSummariesQuery({
  ...patientLastVisitObservationsListRequest,
});
const firstObservationSummary = getObservationSummaries?.object?.length > 0 ? getObservationSummaries.object[0] : null;

  const handleSave = () => {
    saveObservationSummary({
      observation: {
        ...patientObservationSummary,
        visitKey: patientSlice.encounter.key,
        patientKey: patientSlice.patient.key,
        createdBy: 'Administrator',
        prevRecordKey: firstObservationSummary?.key || null,
        plastDate: firstObservationSummary?.createdAt || null,
        platesttemperature: firstObservationSummary?.latesttemperature || null,
        platestbpSystolic: firstObservationSummary?.latestbpSystolic || null,
        platestbpDiastolic: firstObservationSummary?.latestbpDiastolic || null,
        platestheartrate: firstObservationSummary?.latestheartrate || null,
        platestrespiratoryrate: firstObservationSummary?.latestrespiratoryrate || null,
        platestoxygensaturation: firstObservationSummary?.latestoxygensaturation || null,
        platestweight: firstObservationSummary?.latestweight || null,
        platestheight: firstObservationSummary?.latestheight || null,
        platestheadcircumference: firstObservationSummary?.latestheadcircumference || null,
      },
      listRequest: patientObservationsListRequest // Assuming this is required as part of the payload
    }).unwrap().then(() => {
      dispatch(notify('Added Successfully'));
    });;
  };
  const handleClear = () => {
    setPatientObservationSummary({...newApPatientObservationSummary});
  }
  useEffect(() => {
    const { latestweight, latestheight } = patientObservationSummary;
    if (latestweight && latestheight) {
      const calculatedBmi = (latestweight / ((latestheight / 100) ** 2)).toFixed(2);
      const calculatedBsa = Math.sqrt((latestweight * latestheight) / 3600).toFixed(2);
      setBmi(calculatedBmi);
      setBsa(calculatedBsa);
    } else {
      setBmi('');
      setBsa('');
    }
  }, [patientObservationSummary]);
  return (
    <>
      {patientSlice.patient && patientSlice.encounter && (
        <div>
          <h4>Pre-Visit Observations</h4>
          <Panel header={<EncounterMainInfoSection patient={patientSlice.patient} encounter={patientSlice.encounter} />}>
          </Panel>

          <Panel>
            <Grid fluid>
              <Row gutter={15}>
                <Col xs={12}>
                  <fieldset
                    style={{
                      padding: '5px',
                      margin: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    <legend
                      style={{
                        padding: '0 5px',
                        fontWeight: 'bold',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      Vital Signs
                    </legend>
                    <Panel style={{ padding: '5px' }} >
                      <Grid fluid>
                        <Row gutter={15}>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>BP</h6></Col>
                          <Col xs={4}><Input type="number" placeholder=" "
                            value={patientObservationSummary.latestbpSystolic}
                            onChange={e =>
                              setPatientObservationSummary({
                                ...patientObservationSummary,
                                latestbpSystolic: Number(e)
                              })} /></Col>
                          <Col xs={1}><h6 style={{ textAlign: 'center' }}>/</h6></Col>
                          <Col xs={4}><Input type="number" placeholder=" "
                            value={patientObservationSummary.latestbpDiastolic}
                            onChange={e =>
                              setPatientObservationSummary({
                                ...patientObservationSummary,
                                latestbpDiastolic: Number(e)
                              })} /></Col>
                          <Col xs={1}><h6 style={{ textAlign: 'center' }}>mmHg</h6></Col>
                          <Col xs={6}></Col>
                          <Col xs={1}><h6 style={{ textAlign: 'left' }}>MAP</h6></Col>
                          <Col xs={1}></Col>
                          <Col xs={4}>
                            <Input
                              disabled
                              placeholder=' '
                              value={
                                patientObservationSummary.latestbpDiastolic != null && patientObservationSummary.latestbpSystolic != null
                                  ? ((2 * patientObservationSummary.latestbpDiastolic + patientObservationSummary.latestbpSystolic) / 3).toFixed(2)
                                  : ''
                              }
                            />

                          </Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>Pulse</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input type="number"
                                value={patientObservationSummary.latestheartrate}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestheartrate: Number(e)
                                  })} />
                              <InputGroup.Addon><Text>bpm</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>R.R</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input type="number" placeholder=" "
                                value={patientObservationSummary.latestrespiratoryrate}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestrespiratoryrate: Number(e)
                                  })} />
                              <InputGroup.Addon><Text>bpm</Text></InputGroup.Addon>
                            </InputGroup>
                            <Col xs={3}></Col>
                          </Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>SpO2</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input type="number" placeholder=" "
                                value={patientObservationSummary.latestoxygensaturation}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestoxygensaturation: Number(e)
                                  })} />

                              <InputGroup.Addon><Text>%</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>Temp</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input type="number" placeholder=" "
                                value={patientObservationSummary.latesttemperature}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latesttemperature: Number(e)
                                  })} />

                              <InputGroup.Addon><Text>°C</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row>
                          <Col xs={2}><h6 style={{ textAlign: 'left' }}>Notes</h6></Col>
                        </Row>
                        <Row>
                          <Col xs={2}><Input
                            as="textarea"
                            rows={3}
                            placeholder="Notes"
                            style={{ width: 357 }}
                          /></Col>
                        </Row>

                      </Grid>

                    </Panel>
                  </fieldset>
                </Col>
                <Col xs={12}>
                  <fieldset
                    style={{
                      padding: '8px',
                      margin: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    <legend
                      style={{
                        padding: '0 5px',
                        fontWeight: 'bold',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      Body Measurements
                    </legend>
                    <Panel style={{ padding: '5px' }} >
                      <Grid fluid>
                        <Row gutter={15}>
                          <Col xs={6}><h6 style={{ textAlign: 'left' }}>Weight</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input
                                type="number"
                                placeholder=" "
                                value={patientObservationSummary.latestweight}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestweight: Number(e),
                                  })
                                }
                              />
                              <InputGroup.Addon><Text>kg</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                          <Col xs={1}><h6 style={{ textAlign: 'left' }}>BMI</h6></Col>
                          <Col xs={1}></Col>
                          <Col xs={4}><Input disabled value={bmi} /></Col>
                        </Row>
                        <Row gutter={15}>
                          <Col xs={6}><h6 style={{ textAlign: 'left' }}>Height</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input
                                type="number"
                                placeholder=" "
                                value={patientObservationSummary.latestheight}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestheight: Number(e),
                                  })
                                }
                              />
                              <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                          <Col xs={1}><h6 style={{ textAlign: 'left' }}>BSA</h6></Col>
                          <Col xs={1}></Col>
                          <Col xs={4}><Input disabled value={bsa} /></Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}>
                          <Col xs={6}><h6 style={{ textAlign: 'left' }}>Head circumference</h6></Col>
                          <Col xs={7}>
                            <InputGroup>
                              <Input type="number" placeholder=" "
                                value={patientObservationSummary.latestheadcircumference}
                                onChange={e =>
                                  setPatientObservationSummary({
                                    ...patientObservationSummary,
                                    latestheadcircumference: Number(e)
                                  })} />
                              <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                            </InputGroup>
                          </Col>
                          <Col xs={3}></Col>
                        </Row>
                      </Grid>
                    </Panel>
                  </fieldset>
                  <fieldset
                    style={{
                      padding: '5px',
                      margin: '5px',
                      border: '1px solid #ccc',
                      borderRadius: '5px'
                    }}
                  >
                    <legend
                      style={{
                        padding: '0 5px',
                        fontWeight: 'bold',
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      Pain Level
                    </legend>
                    <Panel style={{ padding: '10px' }} >
                      <Grid fluid>
                        <Row gutter={15}>
                          <Col xs={6}>
                            <Form fluid>
                              <MyInput
                                width={165}
                                row
                                fieldLabel="Pain Degree"
                                fieldType="select"
                                fieldName="latestpainlevelLkey"
                                selectData={painDegreesLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayValue"
                                selectDataValue="key"
                                record={patientObservationSummary}
                                setRecord={setPatientObservationSummary}
                              />
                            </Form>
                          </Col>
                        </Row>
                        <Row gutter={15}></Row>
                        <Row gutter={15}></Row>
                        <Row>
                          <Col xs={5}><h6 style={{ textAlign: 'left' }}>Pain Description</h6></Col>
                        </Row>
                        <Row>
                          <Col xs={2}><Input

                            as="textarea"
                            rows={2}
                            placeholder="Pain Description"
                            style={{ width: 357 }}
                          /></Col>
                        </Row>
                      </Grid>
                    </Panel>
                  </fieldset>
                </Col>
              </Row>
            </Grid>
            <ButtonToolbar>
              <IconButton appearance="primary" icon={<Check />} color="violet"
                onClick={handleSave}>
                <Translate>Save</Translate>
              </IconButton>
              <IconButton
                appearance="primary"
                color="cyan"
                icon={<BlockIcon />}
                onClick={handleClear}
              >
                <Translate>Clear</Translate>
              </IconButton>
              <IconButton
                appearance="primary"
                color="blue"
                icon={<CloseOutlineIcon />}
                onClick={() => { navigate('/encounter-list') }}
              >
                <Translate>Close</Translate>
              </IconButton>
            </ButtonToolbar>
          </Panel>
        </div>
      )}
    </>
  );
};

export default EncounterPreObservations;
