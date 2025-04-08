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
import MyButton from '@/components/MyButton/MyButton';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import BarChartHorizontalIcon from '@rsuite/icons/BarChartHorizontal';
import {
  faBolt,
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

} from '@fortawesome/free-solid-svg-icons';
import { faBars, faBedPulse } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import MyCard from '@/components/MyCard/';
import {

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
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { faRunning, faHeartbeat } from '@fortawesome/free-solid-svg-icons';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { useLocation } from 'react-router-dom';
import EncounterMainInfoSection from '../encounter-main-info-section';
import Warning from '../encounter-pre-observations/warning';
import PsychologicalExam from '../encounter-component/psychological-exam';
import AudiometryPuretone from '../encounter-component/audiometry-puretone';
import { faEarListen } from "@fortawesome/free-solid-svg-icons";
import { faBrain } from "@fortawesome/free-solid-svg-icons";
import { faEye, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import OptometricExam from '../encounter-component/optometric-exam/OptometricExam';
import TreadmillStress from '../encounter-component/treadm-stress/TreadmillStress';
import Cardiology from '../encounter-component/cardiology/Cardiology';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';

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
    propsData?.encounter?.departmentKey,
    { skip: !propsData?.encounter?.departmentKey }
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
        className='table-style'
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



    <div className='container'>
      <div className='left-box'>

        <Panel>
          <div className='container-bt'>
            <div className='left'>
              <MyButton
                prefixIcon={() => <ArowBackIcon />}

                backgroundColor={'var(--primary-gray)'}
                onClick={handleGoBack}
                >Go Back</MyButton>           
            </div>
            <div className='right'>
              <MyButton
                prefixIcon={() => <BarChartHorizontalIcon />}
                backgroundColor={"var(--deep-blue)"}

                onClick={() => setIsDrawerOpen(true)}
              >Medical Sheets</MyButton>
              <MyButton

                prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
                onClick={() => { setModalOpen(true) }}
              >Create Follow-up</MyButton>
              <MyButton

                backgroundColor={propsData.patient.hasAllergy ? "var(--primary-orange)" : "var(--deep-blue)"}
                onClick={OpenAllargyModal}
                prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
              >Allergy</MyButton>
              <MyButton

                backgroundColor={propsData.patient.hasWarning ? "var(--primary-orange)" : "var(--deep-blue)"}
                onClick={OpenWarningModal}
                prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
              >Warning</MyButton>
              {propsData.encounter.editable && (
                <MyButton

                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleCompleteEncounter}
                  appearance='ghost'
                >
                  <Translate>Complete Visit</Translate>
                </MyButton>
              )}
            </div>
          </div>

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
            <Drawer.Body className='drawer-body'>
              <List hover className='drawer-list-style'>
                {medicalSheet?.object?.patientDashboard && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<PatientSummary patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faBars} className='icon' />
                  <Translate>Patient Dashboard</Translate>
                </List.Item>}
                {medicalSheet?.object?.clinicalVisit &&
                  <List.Item
                    className='drawer-item'
                    onClick={() => handleMenuItemClick(<SOAP edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={localEncounter} setEncounter={setLocalEncounter} />)}>
                    <FontAwesomeIcon icon={faUserDoctor} className='icon' />
                    <Translate>Clinical Visit</Translate>
                  </List.Item>
                }
                {medicalSheet?.object?.observation && <List.Item
                  className='drawer-item'
                  //!patientSlice.encounter.editable
                  onClick={() => handleMenuItemClick(<Observations patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faBedPulse} className='icon' />
                  <Translate>Observations</Translate>
                </List.Item>}
                {medicalSheet?.object?.allergies && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Allergies edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faPersonDotsFromLine} className='icon' />
                  <Translate>Allergies</Translate>
                </List.Item>}
                {medicalSheet?.object?.medicalWarnings && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Warning edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faTriangleExclamation} className='icon' />
                  <Translate>Medical Warnings</Translate>
                </List.Item>}
                {medicalSheet?.object?.cardiology && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Cardiology patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faHeartPulse} className='icon' />
                  <Translate>Cardiology</Translate>
                </List.Item>}

                {medicalSheet?.object?.dentalCare && <List.Item
                  className='drawer-item'
                  //!patientSlice.encounter.editable
                  onClick={() => handleMenuItemClick(<Dental patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faTooth} className='icon' />
                  <Translate>Dental Care</Translate>
                </List.Item>}
                {medicalSheet?.object?.optometricExam && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<OptometricExam patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faEye} className='icon' />
                  <Translate>Optometric Exam</Translate>
                </List.Item>}
                {medicalSheet?.object?.audiometryPuretone && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<AudiometryPuretone patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faEarListen} className='icon' />
                  <Translate>Audiometry Puretone</Translate>
                </List.Item>}
                {medicalSheet?.object?.psychologicalExam && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<PsychologicalExam patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faBrain} className='icon' />
                  <Translate>Psychological Exam</Translate>
                </List.Item>}
                {medicalSheet?.object?.vaccination && <List.Item
                  className='drawer-item'
                  //!patientSlice.encounter.editable
                  onClick={() => handleMenuItemClick(<VaccinationTab disabled={false} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faSyringe} className='icon' />
                  <Translate>VaccinationTab </Translate>
                </List.Item>}
                {medicalSheet?.object?.prescription && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Prescription edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>

                  <FontAwesomeIcon icon={faFilePrescription} className='icon' />
                  <Translate>Prescription</Translate>
                </List.Item>}
                {medicalSheet?.object?.diagnosticsOrder && <List.Item
                  className='drawer-item'
                  onClick={() =>
                    handleMenuItemClick(<DiagnosticsOrder edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)
                  }>
                  <FontAwesomeIcon icon={faVials} className='icon' />
                  <Translate>Diagnostics Order</Translate>
                </List.Item>}
                {medicalSheet?.object?.consultation && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Consultation edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faStethoscope} className='icon' />
                  <Translate>Consultation</Translate>
                </List.Item>}
                {medicalSheet?.object?.drugOrder && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<DrugOrder edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>

                  <FontAwesomeIcon icon={faPills} className='icon' />
                  <Translate>Drug Order</Translate>
                </List.Item>}


                {medicalSheet?.object?.procedures && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<Referrals edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faNotesMedical} className='icon' />
                  <Translate>Procedures</Translate>
                </List.Item>}
                {medicalSheet?.object?.patientHistory && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<PatientHistory patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faClockRotateLeft} className='icon' />
                  <Translate>Patient History</Translate>
                </List.Item>}


                {medicalSheet?.object?.medicationsRecord && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<MedicationsRecord patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faPills} className='icon' />
                  <Translate>Medications Record</Translate>
                </List.Item>}
                {medicalSheet?.object?.vaccineReccord && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<VaccineReccord patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faSyringe} className='icon' />
                  <Translate>Vaccine Reccord</Translate>
                </List.Item>}

                {medicalSheet?.object?.diagnosticsResult && <List.Item
                  className='drawer-item'
                  onClick={() => handleMenuItemClick(<DiagnosticsResult edit={propsData.fromPage == "PatientEMR"} patient={propsData.patient} encounter={propsData.encounter} />)}>
                  <FontAwesomeIcon icon={faFileWaveform} className='icon' />
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
      </div>

      <div className='right-box'>
        <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
      </div>
    </div>





  );
};

export default Encounter;
