import React, { useEffect, useState, useContext } from 'react';
import { TagInput, Panel } from 'rsuite';
import './styles.less';
import MyInput from '@/components/MyInput';
import EncounterPreObservations from '../../encounter-pre-observations/EncounterPreObservations';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VoiceCitation from '@/components/VoiceCitation';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
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

import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';
import Consultation from '../consultation';
import Assessments from '../../medical-notes-and-assessments/assessments';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, calculateAge, formatDate, fromCamelCaseToDBName } from '@/utils';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
  useGetObservationSummariesQuery,

} from '@/services/observationService';
import {
  ApPatientObservationSummary
} from '@/types/model-types';
import {
  newApEncounter,
  newApPatientObservationSummary
} from '@/types/model-types-constructor';
import { values } from 'lodash';
import { notify } from '@/utils/uiReducerActions';


const SOAP = ({ edit,patient,encounter ,setEncounter}) => {
  const dispatch = useAppDispatch();
  const [localEncounter, setLocalEncounter] = useState({ ...encounter });
  const [planInstructions, setPlanInstructions] = useState();
  const [instructionKey, setInstructionsKey] = useState()
  const [instructionValue, setInstructionsValue] = useState()
  const [instructions, setInstructions] = useState()
  const { data: painDegreesLovQueryResponse } = useGetLovValuesByCodeQuery('PAIN_DEGREE');
  const { data: planLovQueryResponse } = useGetLovValuesByCodeQuery('VISIT_CAREPLAN_OPT');
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();

  const [patientObservationsListRequest, setPatientObservationsListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      timestamp: new Date().getMilliseconds(),
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        }
        ,
        {
          fieldName: 'visit_key',
          operator: 'match',
          value:encounter.key
        }
      ]
    });
  const { data: getCurrenttObservationSummaries } = useGetObservationSummariesQuery({
    ...patientObservationsListRequest,
  });
  const currentObservationSummary = getCurrenttObservationSummaries?.object?.length > 0 ? getCurrenttObservationSummaries.object[0] : null;
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
    latestheadcircumference: null,
    latestpainlevelLkey: null
  });

 

 useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
     setEncounter(saveEncounterChangesMutation.data);
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);

  useEffect(() => {

    setPatientObservationSummary((prevSummary) => ({
      ...prevSummary,
      latesttemperature: currentObservationSummary?.latesttemperature,
      latestbpSystolic: currentObservationSummary?.latestbpSystolic,
      latestbpDiastolic: currentObservationSummary?.latestbpDiastolic,
      latestheartrate: currentObservationSummary?.latestheartrate,
      latestrespiratoryrate: currentObservationSummary?.latestrespiratoryrate,
      latestglucoselevel: currentObservationSummary?.latestglucoselevel,
      latestoxygensaturation: currentObservationSummary?.latestoxygensaturation,
      latestweight: currentObservationSummary?.latestweight,
      latestheight: currentObservationSummary?.latestheight,
      latestheadcircumference: currentObservationSummary?.latestheadcircumference,
      latestpainlevelLkey: currentObservationSummary?.latestpainlevelLkey,
      latestnotes: currentObservationSummary?.latestnotes,
      latestpaindescription: currentObservationSummary?.latestpaindescription,
      key: currentObservationSummary?.key,

    }));
  }, [currentObservationSummary]);

  const saveChanges = async () => {
    try {
      await saveEncounterChanges(localEncounter).unwrap();
      dispatch(notify('Assessment  Saved Successfully'));
    } catch (error) {


      dispatch(notify('Assessment Save Failed'));
    }
  };
  const savePlan = async () => {

    try {
      await saveEncounterChanges({ ...localEncounter}).unwrap();
      dispatch(notify('Saved Successfully'));
    } catch (error) {


      dispatch(notify('Save Failed'));
    }
  };
  const assessmentSummeryChanged = () => {
    return encounter.assessmentSummery !== localEncounter.assessmentSummery;
  };
  return (<>
    <h5>Clinical Visit</h5>
    <div className={`soap-container ${edit ? "disabled-panel" : ""}`}>
      <div className="column-container">

        <fieldset style={{ flex: "2" }} className="box-container">
          <legend>Chief Complain</legend>

          <InputGroup>
            <InputGroup.Addon>
              <IconButton
                circle

                icon={<CheckOutlineIcon />}
                size="xs"
                appearance="primary"
                color="green"
                onClick={saveChanges}
              />
            </InputGroup.Addon>
            <Input
              as={'textarea'}
              rows={8}
              style={{ overflowY: 'auto', resize: 'vertical' }}
              value={localEncounter.chiefComplaint}
              onChange={e => setLocalEncounter({ ...localEncounter, chiefComplaint: e })}

            />


          </InputGroup>
        </fieldset>
        <fieldset style={{ flex: "4" }} className="box-container">
          <legend> Physical Examination & Findings</legend>
          <ReviewOfSystems patient={patient} encounter={encounter}/>
        </fieldset>

        <fieldset className="box-container">
          <legend>Create Orders</legend>
          <br />
          <div style={{ height: '30px', display: "flex" }}>

            <Button
              appearance="ghost"
              style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)' }}

            >
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: '5px' }} />
              <span>Prescription</span>
            </Button>

            <Button
              appearance="ghost"
              style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)', marginLeft: "3px" }}

            >
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: '5px' }} />
              <span>Diagnostic Order</span>
            </Button>
            <Button
              appearance="ghost"
              style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)', marginLeft: "3px" }}

            >
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: '5px' }} />
              <span>Consultation</span>
            </Button>
            <Button
              appearance="ghost"
              style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)', marginLeft: "3px" }}

            >
              <FontAwesomeIcon icon={faBolt} style={{ marginRight: '5px' }} />
              <span>Procedures</span>
            </Button>

          </div>
        </fieldset>
      </div>

      <div className="column-container">
        <fieldset style={{ flex: "2" }} className="box-container">
          <legend> Vital signs</legend>
          <Panel>
            <Grid fluid>
              <Row gutter={15}>
                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>BP</h6></Col>
                <Col xs={4}>
                  <Input
                    disabled={true}
                    type="number"
                    value={patientObservationSummary.latestbpSystolic}
                  /></Col>
                <Col xs={1}><h6 style={{ textAlign: 'center' }}>/</h6></Col>
                <Col xs={4}>
                  <Input
                    disabled={true}
                    type="number"
                    value={patientObservationSummary.latestbpDiastolic}

                  /></Col>
                <Col xs={1}><h6 style={{ textAlign: 'center', fontSize: "13px" }}>mmHg</h6></Col>
                <Col xs={6}></Col>
                <Col xs={1}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>MAP</h6></Col>
                <Col xs={1}></Col>
                <Col xs={4}>
                  <Input
                    disabled

                    value={
                      patientObservationSummary.latestbpDiastolic != null && patientObservationSummary.latestbpSystolic != null
                        ? ((2 * patientObservationSummary.latestbpDiastolic + patientObservationSummary.latestbpSystolic) / 3).toFixed(2)
                        :
                        ''
                    }
                  />

                </Col>
              </Row>
              <Row gutter={15}></Row>

              <Row gutter={15}>
                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Pulse</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input
                      disabled={true}

                      type="number"
                      value={patientObservationSummary.latestheartrate}

                    />
                    <InputGroup.Addon><Text style={{ fontSize: "13px" }} >bpm</Text></InputGroup.Addon>
                  </InputGroup>
                </Col>
                <Col xs={6}></Col>

                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>R.R</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input
                      type="number"
                      disabled={true}
                      value={patientObservationSummary.latestrespiratoryrate}
                    />
                    <InputGroup.Addon><Text style={{ fontSize: "13px" }}>bpm</Text></InputGroup.Addon>
                  </InputGroup>
                  <Col xs={3}></Col>
                </Col>
              </Row>
              <Row gutter={15}></Row>

              <Row>
                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>SpO2</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input type="number"
                      disabled={true}
                      value={patientObservationSummary.latestoxygensaturation}
                    />

                    <InputGroup.Addon><Text style={{ fontSize: "13px" }}>%</Text></InputGroup.Addon>
                  </InputGroup>
                </Col>
                <Col xs={3}></Col>
              </Row>

              <Row>
                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Temp</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input type="number"
                      disabled={true}
                      value={patientObservationSummary.latesttemperature}

                    />

                    <InputGroup.Addon><Text style={{ fontSize: "13px" }}>°C</Text></InputGroup.Addon>
                  </InputGroup>
                </Col>
                <Col xs={3}></Col>
              </Row>


              <Row>
                <Col xs={2}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Notes</h6></Col>
              </Row>
              <Row>
                <Col xs={2}><Input
                  as="textarea"
                  rows={1}
                  disabled={true}
                  style={{ width: 400 }}
                  value={patientObservationSummary.latestnotes}

                /></Col>
              </Row>

            </Grid>

          </Panel>
        </fieldset>
        <fieldset style={{ flex: "1" }} className="box-container">
          <legend>Patient Diagnosis </legend>
          <PatientDiagnosis  patient={patient} encounter={encounter} setEncounter={setEncounter}/>
        </fieldset>
        <fieldset style={{ flex: "1" }} className="box-container">
          <legend>Plan</legend>


          <Form fluid>

            <MyInput

              width={350}
              // disabled={editing}
              fieldType="select"
              selectData={planLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName={'planInstructionsLkey'}
              record={localEncounter}
              setRecord={setLocalEncounter}
            />
            <MyInput
              width={350}
              fieldType='textarea'
              fieldName={'planNstructionsNote'}
              record={localEncounter}
              setRecord={setLocalEncounter}
              row={4}
            />

          </Form>
          <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'flex-end', marginTop: '10px' }}>

            <Button
              appearance="primary"
              onClick={() => savePlan()}
              style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: '5px' }}
            >
              <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px' }} />

              Save
            </Button>
          </div>


        </fieldset>
      </div>
      <div className="column-container">
        <fieldset style={{ flex: "2" }} className="box-container">
          <legend> Body Measurements</legend>
          <Panel style={{ padding: '5px'}} >
            <Grid fluid>
              <Row gutter={15}>
                <Col xs={6}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Weight</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input
                      type="number"
                      disabled={true}
                      value={patientObservationSummary.latestweight}

                    />
                    <InputGroup.Addon><Text>kg</Text></InputGroup.Addon>
                  </InputGroup>
                </Col>
                <Col xs={3}></Col>
                <Col xs={1}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>BMI</h6></Col>
                <Col xs={1}></Col>
                <Col xs={4}>
                  <Input disabled
                    value={(patientObservationSummary.latestweight / ((patientObservationSummary.latestheight / 100) ** 2)).toFixed(2)} /></Col>
              </Row>
              <Row gutter={15}>
                <Col xs={6}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Height</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input
                      type="number"
                      disabled={true}
                      value={patientObservationSummary.latestheight}

                    />
                    <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                  </InputGroup>
                </Col>
                <Col xs={3}></Col>
                <Col xs={1}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>BSA</h6></Col>
                <Col xs={1}></Col>
                <Col xs={4}>
                  <Input disabled
                    value={Math.sqrt((patientObservationSummary.latestweight * patientObservationSummary.latestheight) / 3600).toFixed(2)} /></Col>
              </Row>
              <Row gutter={15}></Row>
              <Row gutter={15}></Row>
              <Row gutter={15}>
                <Col xs={6}><h6 style={{ textAlign: 'left', fontSize: "13px" }}>Head circumference</h6></Col>
                <Col xs={7}>
                  <InputGroup>
                    <Input type="number"
                      disabled={true}
                      value={patientObservationSummary.latestheadcircumference}
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
          <Panel style={{ padding: '5px'}} >
            <Grid fluid>
              <Row gutter={15}>
                <Col xs={6}>
                  <Form fluid>
                    <MyInput
                      disabled={true}
                      width={190}
                      row
                      fieldLabel="Pain Degree"
                      fieldType="select"
                      fieldName="latestpainlevelLkey"
                      selectData={painDegreesLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={patientObservationSummary}
                      setRecord={setPatientObservationSummary}
                    />
                  </Form>
                </Col>
                <Col xs={2}>
                  Description
                  <Input
                    disabled={true}
                    as="textarea"
                    rows={1}
                    value={patientObservationSummary.latestpaindescription}
                    style={{ width: 255 }}
                  />
                </Col>
              </Row>
            </Grid>
          </Panel>
        </fieldset>
        <fieldset className="box-container">
          <legend> Assessment</legend>
          <Panel style={{ padding: '2px' }} >
            <Form>
              {/* <MyInput
            fieldType='textarea'
            placeholder={"Only you can see this Assessment"}
            width={450}
            rows={4}
            fieldName={'assesment'}
            record={{}}
            setRecord={{}}
            
            ></MyInput> */}

              <Input
                as={'textarea'}
                rows={4}
                style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto', resize: 'vertical' }}
                value={localEncounter.assessmentSummery}
                placeholder={'Only you can see this Assessment'}
                onChange={e => setLocalEncounter({ ...localEncounter, assessmentSummery: e })}
                onBlur={assessmentSummeryChanged() ? saveChanges : undefined}
              />

            </Form>
          </Panel>
        </fieldset>
        <fieldset style={{ flex: "2" }} className="box-container">
          <legend> Test Results </legend>

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

        </fieldset>
      </div>


    </div></>);
};
export default SOAP;