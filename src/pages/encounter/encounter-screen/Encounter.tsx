import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApEncounter, ApPatient, ApUser } from '@/types/model-types';
import { newApPatient, newApUser } from '@/types/model-types-constructor';
import Consultation from '../encounter-component/consultation';
import DiagnosticsOrder from '../encounter-component/diagnostics-order';
import DiagnosticsResult from '../encounter-component/diagnostics-result/DiagnosticsResult';
import MedicationsRecord from '../encounter-component/medications-record';
import PatientHistory from '../encounter-component/patient-history';
import PatientSummary from '../encounter-component/patient-summary';
import Prescription from '../encounter-component/prescription';
import Referrals from '../encounter-component/procedure';
import SOAP from '../encounter-component/s.o.a.p';
import VaccineReccord from '../encounter-component/vaccine-reccord';
import Allergies from '../encounter-pre-observations/AllergiesNurse';
import Observations from '../encounter-pre-observations/observations/Observations';
import VaccinationTab from '../encounter-pre-observations/vaccination-tab/';
import DrugOrder from '../encounter-component/drug-order';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import TableIcon from '@rsuite/icons/Table';
import { useGetAppointmentsQuery } from '@/services/appointmentService';
import AppointmentModal from '@/pages/Scheduling/scheduling-screen/AppoitmentModal';
import PatientSide from '../encounter-main-info-section/PatienSide';
import {
  faArrowLeft,
  faVials
  , faFilePrescription
  , faStethoscope
  , faNotesMedical,
  faClockRotateLeft,
  faPersonDotsFromLine,
  faTriangleExclamation,
  faPills,
  faSyringe,
  faFileWaveform,
  faHandDots,
  faTooth
  ,faBarsStaggered,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import { faBars, faBedPulse } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import {
  InputGroup,
  ButtonToolbar,
  FlexboxGrid,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  List,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button,
  Grid,
  Row,
  Col,
  Checkbox,
  SelectPicker, Text,
  Sidenav, Nav, Toggle, Modal
} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import { useGetAllergensQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import Dental from '../dental-screen';
import {
  useCompleteEncounterMutation,

} from '@/services/encounterService';
import {
  useGetAllergiesQuery,
  useGetWarningsQuery
} from '@/services/observationService';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';;
import { useLocation } from 'react-router-dom';
import Warning from '../encounter-pre-observations/warning';
import PsychologicalExam from '../encounter-component/psychological-exam';
import AudiometryPuretone from '../encounter-component/audiometry-puretone';
import { faEarListen } from "@fortawesome/free-solid-svg-icons";
import { faBrain } from "@fortawesome/free-solid-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import OptometricExam from '../encounter-component/optometric-exam/OptometricExam';
import TreadmillStress from '../encounter-component/treadm-stress/TreadmillStress';
import Cardiology from '../encounter-component/cardiology/Cardiology';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import './styles.less';
const Encounter = () => {
  const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE

  const authSlice = useAppSelector(state => state.auth);
  const [localUser, setLocalUser] = useState<ApUser>({ ...newApUser });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...propsData.patient })
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...propsData.encounter })
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>Clinical Visit</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Clinical_Visit'));
  dispatch(setDivContent(divContentHTML));
  const [modalOpen, setModalOpen] = useState(false);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedResources, setSelectedResources] = useState([])
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const {
    data: appointments,
    refetch: refitchAppointments,
    error,
    isLoading
  } = useGetAppointmentsQuery({
    resource_type: selectedResourceType?.resourcesType || null,
    facility_id: selectedFacility?.facilityKey || null,
    resources: selectedResources ? selectedResources.resourceKey : [],

  });


  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(
    localUser?.departmentKey,
    { skip: !localUser?.departmentKey }
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [showCanceled, setShowCanceled] = useState(true);

  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: propsData.patient?.key
    },
    {
      fieldName: "status_lkey",
      operator: showCanceled ? "notMatch" : "match",
      value: "3196709905099521",
    }
  ];


  const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
  const { data: warningsListResponse, refetch: fetchwarning } = useGetWarningsQuery({ ...initialListRequest, filters });
  const [activeContent, setActiveContent] = useState(<PatientSummary patient={propsData.patient} encounter={propsData.encounter} />);
  const handleMenuItemClick = (content) => {
    setActiveContent(content);
    setIsDrawerOpen(false); // Optionally close the drawer after selection
  };
  useEffect(() => {
    if (!propsData.encounter) {
      navigate('/encounter-list');
    }
  }, []);
  useEffect(() => {
    setLocalUser(authSlice.user)
    console.log(authSlice.user)

  }, [authSlice.user]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  const handleGoBack = () => {
    dispatch(setEncounter(null));
    dispatch(setPatient(null));
    navigate('/encounter-list');
  };
  const CloseAllargyModal = () => {
    setOpenAllargyModal(false);
  }
  const OpenAllargyModal = () => {
    setOpenAllargyModal(true);
  }
  const CloseWarningModal = () => {
    setOpenWarningModal(false);
  }
  const OpenWarningModal = () => {
    setOpenWarningModal(true);
  }


  const handleCompleteEncounter = () => {
    if (propsData.encounter) {
      completeEncounter(propsData.encounter).unwrap();
    }
  };

  useEffect(() => {
    if (completeEncounterMutation.status === 'fulfilled') {
      navigate('/encounter-list');
    }
  }, [completeEncounterMutation]);
  const renderRowExpanded = rowData => {


    return (


      <Table
        data={[rowData]} // Pass the data as an array to populate the table
        bordered
        cellBordered
        headerHeight={30}
        rowHeight={40}
        style={{ width: '100%', marginTop: '5px', marginBottom: '5px' }}
        height={100} // Adjust height as needed
      >
        <Column flexGrow={2} align="center" fullText>
          <HeaderCell>Created At</HeaderCell>
          <Cell dataKey="onsetDate" >
            {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>Created By</HeaderCell>
          <Cell dataKey="createdBy" />
        </Column>
        <Column flexGrow={2} align="center" fullText>
          <HeaderCell>Resolved At</HeaderCell>
          <Cell dataKey="resolvedAt" >
            {rowData => {
              if (rowData.statusLkey != '9766169155908512') {

                return rowData.resolvedAt ? new Date(rowData.resolvedAt).toLocaleString() : "";
              }
            }}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>Resolved By</HeaderCell>
          <Cell dataKey="resolvedBy" />
        </Column>
        <Column flexGrow={2} align="center" fullText>
          <HeaderCell>Cancelled At</HeaderCell>
          <Cell dataKey="deletedAt" >
            {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
          </Cell>
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>Cancelled By</HeaderCell>
          <Cell dataKey="deletedBy" />
        </Column>
        <Column flexGrow={1} align="center" fullText>
          <HeaderCell>Cancelliton Reason</HeaderCell>
          <Cell dataKey="cancellationReason" />
        </Column>
      </Table>


    );
  };

  const handleExpanded = (rowData) => {
    let open = false;
    const nextExpandedRowKeys = [];

    expandedRowKeys.forEach(key => {
      if (key === rowData.key) {
        open = true;
      } else {
        nextExpandedRowKeys.push(key);
      }
    });

    if (!open) {
      nextExpandedRowKeys.push(rowData.key);
    }



    console.log(nextExpandedRowKeys)
    setExpandedRowKeys(nextExpandedRowKeys);
  };

  const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
    <Cell {...props} style={{ padding: 5 }}>
      <IconButton
        appearance="subtle"
        onClick={() => {
          onChange(rowData);
        }}
        icon={
          expandedRowKeys.some(key => key === rowData["key"]) ? (
            <CollaspedOutlineIcon />
          ) : (
            <ExpandOutlineIcon />
          )
        }
      />
    </Cell>
  );


  return (
    <>
      <div className='enc-body'>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flexGrow: '4', borderRadius: '5px', border: '1px solid var(--background-gray)' }}>
            <Panel >
              <div className='bt-div'>
                <div >
                  <Button
                    className='bt-back'
                    appearance="primary"

                    onClick={handleGoBack}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <Translate>Go Back</Translate>
                  </Button>
                </div>
                <div className='other-bts-div'
                >
                 <Button
                    appearance="primary"
                    className='bts'
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    <FontAwesomeIcon icon={faBarsStaggered} />
                    <Translate>Medical Sheets</Translate>
                  </Button>
                  <Button
                    appearance="primary"
                    className='bts'
                    
                    onClick={() => { setModalOpen(true) }}
                  >
                    <TableIcon />
                    <Translate>Create Follow-up</Translate>
                  </Button>
                  <Button 
                  className='bts'
                  
                  appearance="primary"
                    onClick={OpenAllargyModal}
                    style={{
                      width:'97px',
                      height:'40px',
                      fontFamily: 'Manrope Medium',
                      backgroundColor:propsData.patient.hasAllergy ? 'var(--primary-orange)':'var(--primary-blue)'
                    }}
                   >
                    
                    <FontAwesomeIcon icon={faHandDots} />
                    <Translate>Allergy</Translate>
                  </Button>
                  <Button appearance="primary"
                    onClick={OpenWarningModal}
                    style={{
                      width:'97px',
                      height:'40px',
                      fontFamily: 'Manrope Medium',
                      backgroundColor:propsData.patient.hasAllergy ?  'var(--primary-orange)':'var(--primary-blue)'
                    }} >
                    <FontAwesomeIcon icon={faTriangleExclamation}  />
                    <Translate>Warning</Translate>
                  </Button>
                  
                  {propsData.encounter.editable && (
                    <Button
                      appearance="ghost"
                      className='bts'
                     
                      onClick={handleCompleteEncounter}
                    >
                      <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px' }} />
                      <Translate>Complete Visit</Translate>
                    </Button>
                  )}
                </div>
              </div>
              <Panel>
             
                <Divider />
                <Drawer
                  open={isDrawerOpen}
                  onClose={() => setIsDrawerOpen(false)}
                  placement='left'

                  style={{ width: '240px' }}
                >
                  <Drawer.Header>
                    <Drawer.Title>Medical Sheets</Drawer.Title>
                  </Drawer.Header>
                  <Drawer.Body style={{ padding: '10px' }}>
                    <List hover style={{ width: '100%', margin: 0 }}>
                      {medicalSheet?.object?.patientDashboard && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<PatientSummary patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faBars} style={{ margin: '3px' }} />
                        <Translate>Patient Dashboard</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.clinicalVisit &&
                        <List.Item
                          style={{ display: 'flex', alignItems: 'center' }}
                          onClick={() => handleMenuItemClick(<SOAP edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={localEncounter} setEncounter={setLocalEncounter} />)}>
                          <FontAwesomeIcon icon={faUserDoctor} style={{ margin: '3px' }} />
                          <Translate>Clinical Visit</Translate>
                        </List.Item>
                      }
                      {medicalSheet?.object?.observation && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        //!patientSlice.encounter.editable
                        onClick={() => handleMenuItemClick(<Observations patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faBedPulse} style={{ margin: '3px' }} />
                        <Translate>Observations</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.allergies && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Allergies edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faPersonDotsFromLine} style={{ margin: '3px' }} />
                        <Translate>Allergies</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.medicalWarnings && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Warning edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ margin: '3px' }} />
                        <Translate>Medical Warnings</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.cardiology && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Cardiology patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faHeartPulse} style={{ margin: '3px' }} />
                        <Translate>Cardiology</Translate>
                      </List.Item>}

                      {medicalSheet?.object?.dentalCare && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        //!patientSlice.encounter.editable
                        onClick={() => handleMenuItemClick(<Dental patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faTooth} style={{ margin: '3px' }} />
                        <Translate>Dental Care</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.optometricExam && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<OptometricExam patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faEye} style={{ margin: '3px' }} />
                        <Translate>Optometric Exam</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.audiometryPuretone && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<AudiometryPuretone patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faEarListen} style={{ margin: '3px' }} />
                        <Translate>Audiometry Puretone</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.psychologicalExam && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<PsychologicalExam patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faBrain} style={{ margin: '3px' }} />
                        <Translate>Psychological Exam</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.vaccination && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        //!patientSlice.encounter.editable
                        onClick={() => handleMenuItemClick(<VaccinationTab disabled={false} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faSyringe} style={{ margin: '3px' }} />
                        <Translate>VaccinationTab </Translate>
                      </List.Item>}
                      {medicalSheet?.object?.prescription && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Prescription edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>

                        <FontAwesomeIcon icon={faFilePrescription} style={{ margin: '3px' }} />
                        <Translate>Prescription</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.diagnosticsOrder && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() =>
                          handleMenuItemClick(<DiagnosticsOrder edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)
                        }>
                        <FontAwesomeIcon icon={faVials} style={{ margin: '3px' }} />
                        <Translate>Diagnostics Order</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.consultation && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Consultation edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faStethoscope} style={{ margin: '3px' }} />
                        <Translate>Consultation</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.drugOrder && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<DrugOrder edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>

                        <FontAwesomeIcon icon={faPills} style={{ margin: '3px' }} />
                        <Translate>Drug Order</Translate>
                      </List.Item>}


                      {medicalSheet?.object?.procedures && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<Referrals edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faNotesMedical} style={{ margin: '3px' }} />
                        <Translate>Procedures</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.patientHistory && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<PatientHistory patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faClockRotateLeft} style={{ margin: '3px' }} />
                        <Translate>Patient History</Translate>
                      </List.Item>}


                      {medicalSheet?.object?.medicationsRecord && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<MedicationsRecord patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faPills} style={{ margin: '3px' }} />
                        <Translate>Medications Record</Translate>
                      </List.Item>}
                      {medicalSheet?.object?.vaccineReccord && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<VaccineReccord patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faSyringe} style={{ margin: '3px' }} />
                        <Translate>Vaccine Reccord</Translate>
                      </List.Item>}

                      {medicalSheet?.object?.diagnosticsResult && <List.Item
                        style={{ display: 'flex', alignItems: 'center' }}
                        onClick={() => handleMenuItemClick(<DiagnosticsResult edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                        <FontAwesomeIcon icon={faFileWaveform} style={{ margin: '3px' }} />
                        <Translate>Diagnostics Test Result</Translate>
                      </List.Item>}



                    </List>
                  </Drawer.Body>
                </Drawer>
                {activeContent} {/* Render the selected content */}
              </Panel>
              <Modal size="lg" open={openAllargyModal} onClose={CloseAllargyModal} overflow  >
                <Modal.Title>
                  <Translate><h6>Patient Allergy</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                  <div>
                    <Checkbox
                      checked={!showCanceled}
                      onChange={() => {
                        setShowCanceled(!showCanceled);
                      }}
                    >
                      Show Cancelled
                    </Checkbox>
                  </div>
                  <Table

                    data={allergiesListResponse?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered

                  >
                    <Column width={70} align="center">
                      <HeaderCell>#</HeaderCell>
                      <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Allergy Type</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.allergyTypeLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column >
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Allergen</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData => {

                          if (!allergensListToGetName?.object) {
                            return "Loading...";
                          }
                          const getname = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);
                          console.log(getname);
                          return getname?.allergenName || "No Name";
                        }}
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Severity</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.severityLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Onset</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.onsetLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Onset Date Time</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData => rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleString() : "Undefind"}
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Treatment Strategy</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.treatmentStrategyLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Source of information</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Reaction Description</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.reactionDescription
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Notes</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.notes
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                      <HeaderCell align="center">
                        <Translate>Status</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.statusLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>
                  </Table>



                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>

                    <Button appearance="ghost" color="cyan" onClick={CloseAllargyModal}>
                      Close
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>
              <Modal size="lg" open={openWarningModal} onClose={CloseWarningModal} overflow  >
                <Modal.Title>
                  <Translate><h6>Patient Warning</h6></Translate>
                </Modal.Title>
                <Modal.Body>
                  <div>
                    <Checkbox
                      checked={!showCanceled}
                      onChange={() => {


                        setShowCanceled(!showCanceled);
                      }}
                    >
                      Show Cancelled
                    </Checkbox>


                  </div>
                  <Table
                    height={600}
                    data={warningsListResponse?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered

                  >
                    <Column width={70} align="center">
                      <HeaderCell>#</HeaderCell>
                      <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Warning Type</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.warningTypeLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Severity</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.severityLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>First Time Recorded</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}
                      </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Source of information</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.sourceOfInformationLvalue?.lovDisplayVale || "BY Patient"
                        }
                      </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell align="center">
                        <Translate>Notes</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.notes
                        }
                      </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                      <HeaderCell align="center">
                        <Translate>Status</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData =>
                          rowData.statusLvalue?.lovDisplayVale
                        }
                      </Cell>
                    </Column>
                  </Table>

                </Modal.Body>
                <Modal.Footer>
                  <Stack spacing={2} divider={<Divider vertical />}>

                    <Button appearance="ghost" color="cyan" onClick={CloseWarningModal}>
                      Close
                    </Button>
                  </Stack>
                </Modal.Footer>
              </Modal>
              <AppointmentModal
                from={'Encounter'}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false), setShowAppointmentOnly(false) }}
                appointmentData={selectedEvent?.appointmentData}
                resourceType={selectedResourceType}
                facility={selectedFacility}
                onSave={refitchAppointments}
                showOnly={showAppointmentOnly}
              />
            </Panel></div>

          <div style={{ flexGrow: '1', borderRadius: '5px', border: '1px solid var(--background-gray)' }}>
            <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
          </div>
        </div>

      </div>


    </>
  );
};

export default Encounter;
