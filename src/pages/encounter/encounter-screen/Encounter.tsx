import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
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
import DrugOrder from '../encounter-component/drug-order';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import TableIcon from '@rsuite/icons/Table';
 import {useGetAppointmentsQuery } from '@/services/appointmentService';
import AppointmentModal from '@/pages/Scheduling/scheduling-screen/AppoitmentModal'
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


} from '@fortawesome/free-solid-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
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
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { initialListRequest } from '@/types/types';
import { useGetAllergensQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import Dental from '../dental-screen';
import {
  useCompleteEncounterMutation,
  useStartEncounterMutation,
  useSavePrescriptionMutation,
  useGetPrescriptionsQuery
} from '@/services/encounterService';
import {
  useGetAllergiesQuery,
  useSaveAllergiesMutation,
  useGetWarningsQuery
} from '@/services/observationService';
import { ApVisitAllergies } from '@/types/model-types';
import { newApVisitAllergies } from '@/types/model-types-constructor';
import { BlockUI } from 'primereact/blockui';
import { useLocation } from 'react-router-dom';
import EncounterMainInfoSection from '../encounter-main-info-section';
import Warning from '../encounter-pre-observations/warning';


const Encounter = () => {
  const encounterStatusNew = '91063195286200'; // TODO change this to be fetched from redis based on LOV CODE
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
   const location = useLocation();
   const propsData = location.state;
  
    console.log("page:", propsData.fromPage);
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
  
  const [startEncounter, startEncounterMutation] = useStartEncounterMutation();
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
  const [showCanceled, setShowCanceled] = useState(true);

  const filters = [
    {
      fieldName: 'patient_key',
      operator: 'match',
      value: patientSlice.patient?.key
    },
    {
      fieldName: "status_lkey",
      operator: showCanceled ? "notMatch" : "match",
      value: "3196709905099521",
    }
  ];


  const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
  const { data: warningsListResponse, refetch: fetchwarning } = useGetWarningsQuery({ ...initialListRequest, filters });
  const [activeContent, setActiveContent] = useState(<PatientSummary patient={patientSlice.patient} encounter={patientSlice.encounter} />);
  const handleMenuItemClick = (content) => {
    setActiveContent(content);
    setIsDrawerOpen(false); // Optionally close the drawer after selection
  };
  useEffect(() => {
    if (!patientSlice.encounter) {
      navigate('/encounter-list');
    }
  }, []);

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
  const handleStartEncounter = () => {
    if (patientSlice.encounter && patientSlice.encounter.editable) {
      startEncounter(patientSlice.encounter).unwrap();
    }
  };

  useEffect(() => {
    if (startEncounterMutation.status === 'fulfilled') {
      dispatch(setEncounter(startEncounterMutation.data));
    }
  }, [startEncounterMutation]);

  const handleCompleteEncounter = () => {
    if (patientSlice.encounter) {
      completeEncounter(patientSlice.encounter).unwrap();
    }
  };

  useEffect(() => {
    if (completeEncounterMutation.status === 'fulfilled') {
      navigate('/encounter-list');
    }
  }, [completeEncounterMutation]);
  const renderRowExpanded = rowData => {
    console.log("Iam in the expanded Row ")
    console.log("Children Data:", rowData);  // Add this line to check children data

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
      {patientSlice.patient && patientSlice.encounter && (
        <BlockUI
          blocked={patientSlice.encounter.encounterStatusLkey === encounterStatusNew}
          template={
            <IconButton
              onClick={handleStartEncounter}
              size="lg"
              appearance="primary"
              color="cyan"
              icon={<icons.ArrowRight />}
            >
              <Translate>Start Encounter</Translate>
            </IconButton>
          }
        >
          <Panel header={<EncounterMainInfoSection patient={patientSlice.patient} encounter={patientSlice.encounter} />}>
            <Panel>
              <ButtonToolbar>
                <IconButton
                  appearance="primary"
                  color="violet"
                  icon={<icons.ArrowLeft />}
                  onClick={handleGoBack}
                >
                  <Translate>Go Back</Translate>
                </IconButton>

                <IconButton
                  appearance="primary"
                  color="blue"
                  icon={<icons.Menu />}
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Translate>Encounter  Menu</Translate>
                </IconButton>
                <Button appearance="primary"
                  onClick={OpenAllargyModal}
                  color={patientSlice.patient.hasAllergy ? "red" : "cyan"} >
                  <FontAwesomeIcon icon={faHandDots} style={{ marginRight: '5px' }} />
                  <Translate>Allergy</Translate>
                </Button>
                <Button appearance="primary"
                  onClick={OpenWarningModal}
                  color={patientSlice.patient.hasWarning ? "red" : "cyan"} >
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: '5px' }} />
                  <Translate>Warning</Translate>
                </Button>
                <IconButton
                  appearance="primary"
                  color="violet"
                  icon={<TableIcon />}
                  onClick={() => { setModalOpen(true) }}
                >
                  <Translate>Create Follow-up</Translate>
                </IconButton>
                {patientSlice.encounter.editable && (
                  <IconButton
                    appearance="primary"
                    icon={<icons.CloseOutline />}
                    onClick={handleCompleteEncounter}
                  >
                    <Translate>Complete Visit</Translate>
                  </IconButton>
                )}
              </ButtonToolbar>
              <Divider />
              <Drawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                placement='left'

                style={{ width: '240px' }}
              >
                <Drawer.Header>
                  <Drawer.Title> Encounter Menu</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body style={{ padding: '10px' }}>
                  <List hover style={{ width: '100%', margin: 0 }}>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<PatientSummary patient={patientSlice.patient} encounter={patientSlice.encounter}  />)}>
                      <FontAwesomeIcon icon={faBars} style={{ margin: '3px' }} />
                      <Translate>Patient Dashboard</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<SOAP edit={ propsData.fromPage=="PatientEMR"} />)}>
                      <FontAwesomeIcon icon={faUserDoctor} style={{ margin: '3px' }} />
                      <Translate>Clinical Visit</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() =>
                        handleMenuItemClick(<DiagnosticsOrder edit={ propsData.fromPage=="PatientEMR"} />)
                      }>
                      <FontAwesomeIcon icon={faVials} style={{ margin: '3px' }} />
                      <Translate>Diagnostics Order</Translate>
                    </List.Item>

                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<Prescription edit={ propsData.fromPage=="PatientEMR"}  />)}>

                      <FontAwesomeIcon icon={faFilePrescription} style={{ margin: '3px' }} />
                      <Translate>Prescription</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<DrugOrder edit={ propsData.fromPage=="PatientEMR"}  />)}>

                      <FontAwesomeIcon icon={faPills} style={{ margin: '3px' }} />
                      <Translate>Drug Order</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<Consultation edit={ propsData.fromPage=="PatientEMR"}  />)}>
                      <FontAwesomeIcon icon={faStethoscope} style={{ margin: '3px' }} />
                      <Translate>Consultation</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<Referrals edit={ propsData.fromPage=="PatientEMR"}  />)}>
                      <FontAwesomeIcon icon={faNotesMedical} style={{ margin: '3px' }} />
                      <Translate>Procedures</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<PatientHistory />)}>
                      <FontAwesomeIcon icon={faClockRotateLeft} style={{ margin: '3px' }} />
                      <Translate>Patient History</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<Allergies edit={ propsData.fromPage=="PatientEMR"}  />)}>
                      <FontAwesomeIcon icon={faPersonDotsFromLine} style={{ margin: '3px' }} />
                      <Translate>Allergies</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<Warning edit={ propsData.fromPage=="PatientEMR"}  />)}>
                      <FontAwesomeIcon icon={faTriangleExclamation} style={{ margin: '3px' }} />
                      <Translate>Medical Warnings</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<MedicationsRecord />)}>
                      <FontAwesomeIcon icon={faPills} style={{ margin: '3px' }} />
                      <Translate>Medications Record</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<VaccineReccord />)}>
                      <FontAwesomeIcon icon={faSyringe} style={{ margin: '3px' }} />
                      <Translate>Vaccine Reccord</Translate>
                    </List.Item>
                    <List.Item
                      style={{ display: 'flex', alignItems: 'center' }}
                      onClick={() => handleMenuItemClick(<DiagnosticsResult edit={ propsData.fromPage=="PatientEMR"} />)}>
                      <FontAwesomeIcon icon={faFileWaveform} style={{ margin: '3px' }} />
                      <Translate>Diagnostics Result</Translate>
                    </List.Item>
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
          </Panel>
        </BlockUI>
      )}
    </>
  );
};

export default Encounter;
