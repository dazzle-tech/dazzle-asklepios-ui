import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApEncounter } from '@/types/model-types';
import Consultation from '../encounter-component/consultation';
import DiagnosticsOrder from '../encounter-component/diagnostics-order';
import DiagnosticsResult from '../encounter-component/diagnostics-result/DiagnosticsResult';
import MedicationsRecord from '../encounter-component/medications-record';
import PatientHistory from '../encounter-component/patient-history/PatientHistory';
import PatientSummary from '../encounter-component/patient-summary';
import Prescription from '../encounter-component/prescription';
import Referrals from '../encounter-component/procedure';
import SOAP from '../encounter-component/s.o.a.p';
import VaccineReccord from '../encounter-component/vaccine-reccord';
import Allergies from '../encounter-pre-observations/AllergiesNurse';
import Observations from '../encounter-pre-observations/observations/Observations';
import VaccinationTab from '../encounter-pre-observations/vaccination-tab/';
import DrugOrder from '../encounter-component/drug-order';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { useGetResourcesByResourceIdQuery } from '@/services/appointmentService';
import AppointmentModal from '@/pages/Scheduling/scheduling-screen/AppoitmentModal';
import PatientSide from '../encounter-main-info-section/PatienSide';
import MyButton from '@/components/MyButton/MyButton';
import BarChartHorizontalIcon from '@rsuite/icons/BarChartHorizontal';
import {
  faVials,
  faFilePrescription,
  faStethoscope,
  faNotesMedical,
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
import { Panel, List, Divider, Drawer } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import 'react-tabs/style/react-tabs.css';
import { useNavigate } from 'react-router-dom';
import Dental from '../dental-screen';
import { useCompleteEncounterMutation } from '@/services/encounterService';

import { faHeartPulse } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import Warning from '../encounter-pre-observations/warning';
import PsychologicalExam from '../encounter-component/psychological-exam';
import AudiometryPuretone from '../encounter-component/audiometry-puretone';
import { faEarListen } from '@fortawesome/free-solid-svg-icons';
import { faBrain } from '@fortawesome/free-solid-svg-icons';
import { faEye, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import OptometricExam from '../encounter-component/optometric-exam/OptometricExam';
import Cardiology from '../encounter-component/cardiology/Cardiology';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import AllergiesModal from './AllergiesModal';
import WarningiesModal from './WarningiesModal';
import { useGetAppointmentsQuery } from '@/services/appointmentService';
import BackButton from '@/components/BackButton/BackButton';
const Encounter = () => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;
  const [localEncounter, setLocalEncounter] = useState<ApEncounter>({ ...propsData.encounter });
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
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [medicalSheetSourceKey, setMedicalSheetSourceKey] = useState<string | undefined>();
  const [medicalSheetRowSourceKey, setMedicalSheetRowSourceKey] = useState<string | undefined>();
  const [selectedResources, setSelectedResources] = useState([]);
  const {
    data: appointments,
    refetch: refitchAppointments,
    error,
    isLoading
  } = useGetAppointmentsQuery({
    resource_type: selectedResourceType?.resourcesType || null,
    facility_id: selectedFacility?.facilityKey || null,
    resources: selectedResources ? selectedResources.resourceKey : []
  });
  // get Midical Sheets Data Steps
  useEffect(() => {
    if (propsData?.encounter?.resourceTypeLkey === '2039516279378421') {
      // Clinic, then we need to get its resource details
      setMedicalSheetRowSourceKey(propsData?.encounter?.resourceKey);
      setMedicalSheetSourceKey(undefined);
    } else {
      // Not Clinic, use department directly
      setMedicalSheetSourceKey(propsData?.encounter?.departmentKey);
      setMedicalSheetRowSourceKey(undefined);
    }
  }, [propsData?.encounter]);

  // Step 2: Fetch the resource if needed "IF Clinic"
  const { data: resourcesResponse } = useGetResourcesByResourceIdQuery(medicalSheetRowSourceKey!, {
    skip: !medicalSheetRowSourceKey
  });

  // Step 3: Set departmentKey from resource "IF Clinic"
  useEffect(() => {
    if (resourcesResponse?.object?.resourceKey) {
      setMedicalSheetSourceKey(resourcesResponse.object.resourceKey);
    }
  }, [resourcesResponse]);

  // Step 4:get medical sheet with final departmentKey.
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(medicalSheetSourceKey!, {
    skip: !medicalSheetSourceKey
  });
  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const [activeContent, setActiveContent] = useState(
    <PatientSummary patient={propsData.patient} encounter={propsData.encounter} />
  );
  const handleMenuItemClick = content => {
    setActiveContent(content);
    setIsDrawerOpen(false); // Optionally close the drawer after selection
  };
  useEffect(() => {
    if (!propsData.encounter) {
      navigate('/encounter-list');
    }
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  const handleGoBack = () => {
    dispatch(setEncounter(null));
    dispatch(setPatient(null));

    if (propsData.fromPage === 'PatientEMR') {
      navigate('/patient-EMR', {
        state: {
          localPatient: propsData.patient,
          fromPage: 'clinicalVisit'
        }
      });
    } else {
      navigate('/encounter-list');
    }
  };

  const OpenAllargyModal = () => {
    setOpenAllargyModal(true);
  };
  const OpenWarningModal = () => {
    setOpenWarningModal(true);
  };

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

  return (
    <div className="container">
      <div className="left-box">
        <Panel>
          <div className="container-bt">
            <div className="left">
              <BackButton onClick={handleGoBack} />
            </div>
            <div className="right">
              <MyButton
                prefixIcon={() => <BarChartHorizontalIcon />}
                backgroundColor={'var(--deep-blue)'}
                onClick={() => {
                  setIsDrawerOpen(true), console.log(medicalSheetSourceKey);
                }}
              >
                Medical Sheets
              </MyButton>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                Create Follow-up
              </MyButton>
              <MyButton
                backgroundColor={
                  propsData?.patient?.hasAllergy ? 'var(--primary-orange)' : 'var(--deep-blue)'
                }
                onClick={OpenAllargyModal}
                prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
              >
                Allergy
              </MyButton>
              <MyButton
                backgroundColor={
                  propsData?.patient?.hasWarning ? 'var(--primary-orange)' : 'var(--deep-blue)'
                }
                onClick={OpenWarningModal}
                prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
              >
                Warning
              </MyButton>
              {propsData?.encounter?.editable && (
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleCompleteEncounter}
                  appearance="ghost"
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
            placement="left"
            className="drawer-style"
          >
            <Drawer.Header>
              <Drawer.Title className="title-drawer">Medical Sheets</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body className="drawer-body">
              <List hover className="drawer-list-style">
                {medicalSheet?.object?.patientDashboard && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <PatientSummary
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faBars} className="icon" />
                    <Translate>Patient Dashboard</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.clinicalVisit && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <SOAP
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={localEncounter}
                          setEncounter={setLocalEncounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faUserDoctor} className="icon" />
                    <Translate>Clinical Visit</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.observation && (
                  <List.Item
                    className="drawer-item"
                    //!patientSlice.encounter.editable
                    onClick={() =>
                      handleMenuItemClick(
                        <Observations patient={propsData.patient} encounter={propsData.encounter} />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faBedPulse} className="icon" />
                    <Translate>Observations</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.allergies && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Allergies
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faPersonDotsFromLine} className="icon" />
                    <Translate>Allergies</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.medicalWarnings && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Warning
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} className="icon" />
                    <Translate>Medical Warnings</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.cardiology && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Cardiology patient={propsData.patient} encounter={propsData.encounter} />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faHeartPulse} className="icon" />
                    <Translate>Cardiology</Translate>
                  </List.Item>
                )}

                {medicalSheet?.object?.dentalCare && (
                  <List.Item
                    className="drawer-item"
                    //!patientSlice.encounter.editable
                    onClick={() =>
                      handleMenuItemClick(
                        <Dental patient={propsData.patient} encounter={propsData.encounter} />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTooth} className="icon" />
                    <Translate>Dental Care</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.optometricExam && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <OptometricExam
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faEye} className="icon" />
                    <Translate>Optometric Exam</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.audiometryPuretone && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <AudiometryPuretone
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faEarListen} className="icon" />
                    <Translate>Audiometry Puretone</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.psychologicalExam && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <PsychologicalExam
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faBrain} className="icon" />
                    <Translate>Psychological Exam</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.vaccination && (
                  <List.Item
                    className="drawer-item"
                    //!patientSlice.encounter.editable
                    onClick={() =>
                      handleMenuItemClick(
                        <VaccinationTab
                          disabled={false}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faSyringe} className="icon" />
                    <Translate>Vaccination </Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.prescription && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Prescription
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faFilePrescription} className="icon" />
                    <Translate>Prescription</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.diagnosticsOrder && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <DiagnosticsOrder
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faVials} className="icon" />
                    <Translate>Diagnostics Order</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.consultation && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Consultation
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faStethoscope} className="icon" />
                    <Translate>Consultation</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.drugOrder && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <DrugOrder
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faPills} className="icon" />
                    <Translate>Drug Order</Translate>
                  </List.Item>
                )}

                {medicalSheet?.object?.procedures && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <Referrals
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faNotesMedical} className="icon" />
                    <Translate>Procedures</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.patientHistory && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <PatientHistory
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
                    <Translate>Patient History</Translate>
                  </List.Item>
                )}

                {medicalSheet?.object?.medicationsRecord && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <MedicationsRecord
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faPills} className="icon" />
                    <Translate>Medications Record</Translate>
                  </List.Item>
                )}
                {medicalSheet?.object?.vaccineReccord && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <VaccineReccord
                          patient={propsData.patient}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faSyringe} className="icon" />
                    <Translate>Vaccine Reccord</Translate>
                  </List.Item>
                )}

                {medicalSheet?.object?.diagnosticsResult && (
                  <List.Item
                    className="drawer-item"
                    onClick={() =>
                      handleMenuItemClick(
                        <DiagnosticsResult
                          edit={propsData.fromPage == 'PatientEMR'}
                          patient={propsData.patient}
                          encounter={propsData.encounter}
                        />
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faFileWaveform} className="icon" />
                    <Translate>Diagnostics Test Result</Translate>
                  </List.Item>
                )}
              </List>
            </Drawer.Body>
          </Drawer>
          {activeContent} {/* Render the selected content */}
        </Panel>

        <AppointmentModal
          from={'Encounter'}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false), setShowAppointmentOnly(false);
          }}
          appointmentData={selectedEvent?.appointmentData}
          resourceType={selectedResourceType}
          facility={selectedFacility}
          onSave={refitchAppointments}
          showOnly={showAppointmentOnly}
        />
      </div>

      <div className="right-box">
        <PatientSide patient={propsData.patient} encounter={propsData.encounter} />
      </div>
      <WarningiesModal
        open={openWarningModal}
        setOpen={setOpenWarningModal}
        patient={propsData.patient}
      />
      <AllergiesModal
        open={openAllargyModal}
        setOpen={setOpenAllargyModal}
        patient={propsData.patient}
      />
    </div>
  );
};

export default Encounter;
