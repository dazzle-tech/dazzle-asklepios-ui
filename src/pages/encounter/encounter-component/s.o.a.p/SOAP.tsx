import React, { useEffect, useState } from 'react';
import { TagInput, Panel } from 'rsuite';
import './styles.less';
import MyInput from '@/components/MyInput';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VoiceCitation from '@/components/VoiceCitation';
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
    Modal,
    Button,
    Form,
    Toggle
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import ChiefComplaint from '../../medical-notes-and-assessments/chief-complaint';
import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
const SOAP = () => {
    const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true
      });

    
    return (<>
        <h5>S.O.A.P</h5>
        <div className="soap-container">
            <div style={{ flex: "2" }} className="column-container">

                <fieldset style={{ flex: "2" }} className="box-container">
                    <legend>Chief Complain</legend>

                    <ChiefComplaint />
                </fieldset>
                <fieldset style={{ flex: "4" }} className="box-container">
                    <legend> Physical Examination & Findings</legend>
                    <ReviewOfSystems />
                </fieldset>

                <fieldset className="box-container">
                    <legend>Tests to be done on follow-up</legend>
                    <br/>
                    <div style={{ height: '30px',display:"flex" }}>
                            <IconButton
                                appearance="ghost"
                                style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)',fontSize:"12px",margin: '4px' }}
                              icon={<FontAwesomeIcon icon={faBolt} style={{ margin: '3px' }} />}
                            >
                               Prescription
                            </IconButton>
                            <IconButton
                                appearance="ghost"
                                style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)',fontSize:"12px", margin: '4px'}}
                              icon={<FontAwesomeIcon icon={faBolt} style={{ margin: '3px' }} />}
                            >
                               Diagnostic Order
                            </IconButton>
                            <IconButton
                                appearance="ghost"
                                style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)',fontSize:"12px",margin: '4px' }}
                              icon={<FontAwesomeIcon icon={faBolt} style={{ margin: '3px' }} />}
                            >
                               Consultation
                            </IconButton>
                            <IconButton
                                appearance="ghost"
                                style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)',fontSize:"12px",margin: '4px' }}
                              icon={<FontAwesomeIcon icon={faBolt} style={{ margin: '3px' }} />}
                            >
                              Referral
                            </IconButton>
                        </div>
                </fieldset>
            </div>

            <div className="column-container">
                <fieldset style={{ flex: "2" }} className="box-container">
                    <legend> vital signs</legend>
                    <Panel >
                        <Grid fluid>
                            <Row gutter={15}>
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "12px" }}>BP</h6></Col>
                                <Col xs={4}><Input
                                    disabled={true}
                                    // isEncounterStatusClosed}
                                    type="number"
                                    value={""}
                                // patientObservationSummary.latestbpSystolic}
                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestbpSystolic: Number(e)
                                //     })}
                                /></Col>
                                <Col xs={1}><h6 style={{ textAlign: 'center' }}>/</h6></Col>
                                <Col xs={4}><Input
                                    disabled={true}
                                    // isEncounterStatusClosed}
                                    type="number"
                                    value={""}
                                // patientObservationSummary.latestbpDiastolic}

                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestbpDiastolic: Number(e)
                                //     })} 
                                /></Col>
                                <Col xs={1}><h6 style={{ textAlign: 'center', fontSize: "12px" }}>mmHg</h6></Col>
                                <Col xs={6}></Col>
                                <Col xs={1}><h6 style={{ textAlign: 'left', fontSize: "12px" }}>MAP</h6></Col>
                                <Col xs={1}></Col>
                                <Col xs={4}>
                                    <Input
                                        disabled

                                        value={
                                            //   patientObservationSummary.latestbpDiastolic != null && patientObservationSummary.latestbpSystolic != null
                                            //     ? ((2 * patientObservationSummary.latestbpDiastolic + patientObservationSummary.latestbpSystolic) / 3).toFixed(2)
                                            //     : 
                                            ''
                                        }
                                    />

                                </Col>
                            </Row>
                            <Row gutter={15}></Row>
                         
                            <Row gutter={15}>
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "12px" }}>Pulse</h6></Col>
                                <Col xs={7}>
                                    <InputGroup>
                                        <Input
                                            disabled={true}
                                            // isEncounterStatusClosed}
                                            type="number"
                                            value={""}
                                        // patientObservationSummary.latestheartrate}
                                        //   onChange={e =>
                                        //     setPatientObservationSummary({
                                        //       ...patientObservationSummary,
                                        //       latestheartrate: Number(e)
                                        //     })} 
                                        />
                                        <InputGroup.Addon><Text >bpm</Text></InputGroup.Addon>
                                    </InputGroup>
                                </Col>
                                <Col xs={6}></Col>
                            
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "12px" }}>R.R</h6></Col>
                                <Col xs={7}>
                                    <InputGroup>
                                        <Input
                                            type="number"
                                            disabled={true}
                                            // isEncounterStatusClosed}
                                            value={""}
                                        // patientObservationSummary.latestrespiratoryrate}
                                        //   onChange={e =>
                                        //     setPatientObservationSummary({
                                        //       ...patientObservationSummary,
                                        //       latestrespiratoryrate: Number(e)
                                        //     })} 
                                        />
                                        <InputGroup.Addon><Text>bpm</Text></InputGroup.Addon>
                                    </InputGroup>
                                    <Col xs={3}></Col>
                                </Col>
                            </Row>
                            <Row gutter={15}></Row>
                            
                            <Row>
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "12px" }}>SpO2</h6></Col>
                                <Col xs={7}>
                                    <InputGroup>
                                        <Input type="number"
                                            disabled={true}
                                            // isEncounterStatusClosed}
                                            value={""}
                                        //   patientObservationSummary.latestoxygensaturation}
                                        //   onChange={e =>
                                        //     setPatientObservationSummary({
                                        //       ...patientObservationSummary,
                                        //       latestoxygensaturation: Number(e)
                                        //     })} 
                                        />

                                        <InputGroup.Addon><Text>%</Text></InputGroup.Addon>
                                    </InputGroup>
                                </Col>
                                <Col xs={3}></Col>
                            </Row>
                          
                            <Row>
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "11px" }}>Temp</h6></Col>
                                <Col xs={7}>
                                    <InputGroup>
                                        <Input type="number"
                                            disabled={true}
                                            // isEncounterStatusClosed}
                                            value={""}
                                        //   patientObservationSummary.latesttemperature}
                                        //   onChange={e =>
                                        //     setPatientObservationSummary({
                                        //       ...patientObservationSummary,
                                        //       latesttemperature: Number(e)
                                        //     })} 
                                        />

                                        <InputGroup.Addon><Text>°C</Text></InputGroup.Addon>
                                    </InputGroup>
                                </Col>
                                <Col xs={3}></Col>
                            </Row>
                            
                            
                            <Row>
                                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "11px" }}>Notes</h6></Col>
                            </Row>
                            <Row>
                                <Col xs={2}><Input
                                    as="textarea"
                                    rows={1}
                                    style={{ width: 400 }}
                                    value={""}
                                // patientObservationSummary.latestnotes}
                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestnotes: String(e),
                                //     })
                                //   }
                                /></Col>
                            </Row>

                        </Grid>

                    </Panel>
                </fieldset>
                <fieldset style={{ flex: "1" }} className="box-container">
                    <legend>Patient Diagnosis </legend>
                    <PatientDiagnosis />
                </fieldset>
                <fieldset style={{ flex: "2" }} className="box-container">
                    <legend>Plan</legend>
            
                    <Grid fluid >
                        <Row gutter={15} style={{ height: '70px' }}>
                            <Col xs={12} >
                           <div style={{marginBottom:"8px",marginTop:"7px"}}> Physician Recommendations</div>
                                <VoiceCitation
                                    originalRecord={""}
                                    record={""}
                                    setRecord={{}}
                                    fieldName="progressNote"
                                    saveMethod={""}
                                    rows={4}
                                />
                            </Col>

                            <Col xs={12}>
                        <div style={{marginBottom:"8px",marginTop:"7px"}}>   Patient Education</div>
                                <VoiceCitation
                                    originalRecord={""}
                                    record={""}
                                    setRecord={{}}
                                    fieldName="progressNote"
                                    saveMethod={""}
                                    rows={4}
                                />
                            </Col>
                        </Row>

                        <Row gutter={15} style={{ height: '70px' }}>
                            <Col xs={12}>
                           <div style={{marginBottom:"10px",marginTop:"10px"}}> Lifestyle Modification</div>
                                <VoiceCitation
                                    originalRecord={""}
                                    record={""}
                                    setRecord={{}}
                                    fieldName="progressNote"
                                    saveMethod={""}
                                    rows={4}
                                />
                            </Col>

                            <Col xs={12}>
                            <div style={{marginBottom:"10px",marginTop:"10px"}}>General Instructions</div>
                                <VoiceCitation
                                    originalRecord={""}
                                    record={""}
                                    setRecord={{}}
                                    fieldName="progressNote"
                                    saveMethod={""}
                                    rows={4}
                                />
                            </Col>
                        </Row>
                      
                    </Grid>
                </fieldset>
            </div>
            <div className="column-container">
                <fieldset style={{ flex: "2" }} className="box-container">
                    <legend> Body Measurements</legend>
                    <Panel style={{ padding: '5px' }} >
                        <Grid fluid>
                          <Row gutter={15}>
                            <Col xs={6}><h6 style={{ textAlign: 'left',fontSize:"13px" }}>Weight</h6></Col>
                            <Col xs={7}>
                              <InputGroup>
                                <Input
                                  type="number"
                                  disabled={true}
                                  value={""}
                                    // patientObservationSummary.latestweight}
                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestweight: Number(e),
                                //     })
                                //   }
                                />
                                <InputGroup.Addon><Text>kg</Text></InputGroup.Addon>
                              </InputGroup>
                            </Col>
                            <Col xs={3}></Col>
                            <Col xs={1}><h6 style={{ textAlign: 'left' ,fontSize:"13px" }}>BMI</h6></Col>
                            <Col xs={1}></Col>
                            <Col xs={4}><Input disabled value={""} /></Col>
                          </Row>
                          <Row gutter={15}>
                            <Col xs={6}><h6 style={{ textAlign: 'left', fontSize:"13px" }}>Height</h6></Col>
                            <Col xs={7}>
                              <InputGroup>
                                <Input
                                  type="number"
                                  disabled={true}
                                  value={""}
                                    // patientObservationSummary.latestheight}
                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestheight: Number(e),
                                //     })
                                //   }
                                />
                                <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                              </InputGroup>
                            </Col>
                            <Col xs={3}></Col>
                            <Col xs={1}><h6 style={{ textAlign: 'left',fontSize:"13px" }}>BSA</h6></Col>
                            <Col xs={1}></Col>
                            <Col xs={4}><Input disabled value={""} /></Col>
                          </Row>
                          <Row gutter={15}></Row>
                          <Row gutter={15}></Row>
                          <Row gutter={15}>
                            <Col xs={6}><h6 style={{ textAlign: 'left' ,fontSize:"13px"}}>Head circumference</h6></Col>
                            <Col xs={7}>
                              <InputGroup>
                                <Input type="number"
                                  disabled={true}
                                  value={""}
                                    // patientObservationSummary.latestheadcircumference}
                                //   onChange={e =>
                                //     setPatientObservationSummary({
                                //       ...patientObservationSummary,
                                //       latestheadcircumference: Number(e)
                                //     })} 
                                    />
                                <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                              </InputGroup>
                            </Col>
                            <Col xs={3}></Col>
                          </Row>
                        </Grid>
                      </Panel>
                </fieldset>
                <fieldset className="box-container">
                    <legend> Pain Level</legend>
                    <Panel style={{ padding: '5px' }} >
                        <Grid fluid>
                          <Row gutter={15}>
                            <Col xs={6}>
                              <Form fluid>
                              <MyInput
                                  disabled={true}
                                  width={180}
                                  row
                                  fieldLabel="Pain Degree"
                                  fieldType="select"
                                  fieldName="latestpainlevelLkey"
                                  selectData={painDegreesLovQueryResponse?.object ?? []}
                                  selectDataLabel="lovDisplayVale"
                                  selectDataValue="key"
                                  record={{}}
                                  setRecord={{}}
                                />
                              </Form>
                        </Col>
                            <Col xs={2}>
                            Description
                            <Input
                              disabled={true}
                              as="textarea"
                              rows={1}
                              value={''}
                                // patientObservationSummary.latestpaindescription}
                              style={{ width: 270 }}
                            //   onChange={e =>
                            //     setPatientObservationSummary({
                            //       ...patientObservationSummary,
                            //       latestpaindescription: String(e),
                            //     })
                            //   }
                            />
                            </Col>
                          </Row>
                        </Grid>
                      </Panel>
                </fieldset>
                <fieldset style={{ flex: "3" }} className="box-container">
                    <legend> Test Results </legend>
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table
                                bordered
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px', width: '150px', padding: '10px' }}>  Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px', width: '150px', padding: '10px' }}>Name</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px', width: '150px', padding: '10px' }}>Result</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px', width: '150px', padding: '10px' }}>Order Time</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px', width: '150px', padding: '10px' }}>Result Time</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                            </Table>
                        </Col>
                    </Row>
                </fieldset>
            </div>
           
     
        </div></>);
};
export default SOAP;