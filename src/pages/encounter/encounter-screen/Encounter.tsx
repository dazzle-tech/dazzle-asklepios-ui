import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentModal from '@/pages/Scheduling/scheduling-screen/AppoitmentModal';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetResourcesByResourceIdQuery } from '@/services/appointmentService';
import { useCompleteEncounterMutation, useDischargeInpatientEncounterMutation } from '@/services/encounterService';
import {
  faBedPulse, faCheckDouble, faClockRotateLeft, faFilePrescription, faFileWaveform,
  faHandDots, faNotesMedical, faPersonDotsFromLine, faPills, faStethoscope, faSyringe, faTooth, faTriangleExclamation, faUserDoctor, faVials
} from '@fortawesome/free-solid-svg-icons';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BarChartHorizontalIcon from '@rsuite/icons/BarChartHorizontal';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { Divider, Drawer, List, Panel, Text } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import './styles.less';
import BackButton from '@/components/BackButton/BackButton';
import { useGetAppointmentsQuery } from '@/services/appointmentService';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import { faBrain, faEarListen, faEye, faHeartPulse, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import AllergiesModal from './AllergiesModal';
import WarningiesModal from './WarningiesModal';
import { notify } from '@/utils/uiReducerActions';
import AdmitToInpatientModal from './AdmitToInpatientModal';
const Encounter = () => {
  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;
  const savedState = sessionStorage.getItem("encounterPageSource");
console.log("Encounter ",propsData?.encounter)
  const [localEncounter, setLocalEncounter] = useState<any>({ ...propsData?.encounter });
  const [openAdmitModal, setOpenAdmitModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [medicalSheetSourceKey, setMedicalSheetSourceKey] = useState<string | undefined>();
  const [medicalSheetRowSourceKey, setMedicalSheetRowSourceKey] = useState<string | undefined>();
  const [selectedResources, setSelectedResources] = useState([]);
  const [dischargeInpatientEncounter] = useDischargeInpatientEncounterMutation();
  const [edit, setEdit] = useState(false);
  const [fromPage, setFromPage] = useState(savedState);

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


  // Step 2: Fetch the resource if needed "IF Clinic"
  const { data: resourcesResponse } = useGetResourcesByResourceIdQuery(medicalSheetRowSourceKey!, {
    skip: !medicalSheetRowSourceKey
  });

  // Step 4:get medical sheet with final departmentKey.
  const { data: medicalSheet } = useGetMedicalSheetsByDepartmentIdQuery(medicalSheetSourceKey!, {
    skip: !medicalSheetSourceKey
  });


  const [completeEncounter, completeEncounterMutation] = useCompleteEncounterMutation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openAllargyModal, setOpenAllargyModal] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);

  useEffect(() => {
    if (location.state && location.state.fromPage) {
      setFromPage(location.state.fromPage);
    }
  }, [location.state]);
  // get Midical Sheets Data Steps
  useEffect(() => {
    if (!propsData?.encounter) {
      navigate('/encounter-list');
    } else {
      setEdit(fromPage === 'PatientEMR' || localEncounter.encounterStatusLvalue.valueCode === "CLOSED");
      //TODO convert key to code
      if (propsData?.encounter?.resourceTypeLkey === '2039516279378421' || "4217389643435490") {
        // Clinic, then we need to get its resource details
        setMedicalSheetRowSourceKey(propsData?.encounter?.resourceKey);
        setMedicalSheetSourceKey(undefined);
      } else {
        // Not Clinic, use department directly
        setMedicalSheetSourceKey(propsData?.encounter?.departmentKey);
        setMedicalSheetRowSourceKey(undefined);
      }
    }
  }, [propsData]);
  // Step 3: Set departmentKey from resource "IF Clinic"
  useEffect(() => {
    if (resourcesResponse?.object?.resourceKey) {
      setMedicalSheetSourceKey(resourcesResponse.object.resourceKey);
    }
  }, [resourcesResponse]);

  useEffect(() => {
    if (localEncounter?.resourceTypeLvalue?.valueCode == "BRT_INPATIENT" && completeEncounterMutation.status === 'fulfilled') {
      navigate('/inpatient-encounters-list');
    } else if (completeEncounterMutation.status === 'fulfilled') {
      navigate('/encounter-list');
    }
  }, [completeEncounterMutation]);



  const handleGoBack = () => {
    if (savedState === 'PatientEMR') {
      navigate('/patient-EMR', {
        state: {
          localPatient: propsData.patient,
          fromPage: 'clinicalVisit'
        }
      });
    } else if (localEncounter?.resourceTypeLvalue?.valueCode == "BRT_INPATIENT") {
      navigate('/inpatient-encounters-list')
    }
    else {
      navigate('/encounter-list');
    }
  };

  const OpenAllargyModal = () => {
    setOpenAllargyModal(true);
  };
  const OpenWarningModal = () => {
    setOpenWarningModal(true);
  };

  const handleCompleteEncounter = async () => {
    try {
      if (propsData.encounter?.resourceTypeLvalue?.valueCode === "BRT_INPATIENT") {
        await dischargeInpatientEncounter(propsData.encounter).unwrap();
        dispatch(notify({ msg: 'Inpatient Encounter Discharge Successfully', sev: 'success' }));
      } else if (propsData.encounter) {
        await completeEncounter(propsData.encounter).unwrap();
        dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      }
    } catch (error) {
      console.error("Encounter completion error:", error);
      dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
    }
  };

  const headersMap = {
    '/encounter/clinical-visit': 'Clinical Visit',
    '/encounter/observations': 'Observation',
    '/encounter/allergies': 'Allergies',
    '/encounter/medical-warnings': 'Medical Warnings',
    '/encounter/cardiology': 'Cardiology',
    '/encounter/dental-care': 'Dental Care ',
    '/encounter/optometric-exam': 'Optometric Exam',
    '/encounter/audiometry': 'Audiometry Puretone',
    '/encounter/psychological-exam': 'Psychological Exam',
    '/encounter/vaccination': 'Vaccination',
    '/encounter/prescription': 'Prescription ',
    '/encounter/diagnostics-order': 'Diagnostics Order ',
    '/encounter/consultation': 'Consultation',
    '/encounter/drug-order': 'Drug Order ',
    '/encounter/procedures': 'Procedures',
    '/encounter/patient-history': 'Patient History',
    '/encounter/medications-record': 'medications Record ',
    '/encounter/vaccine-record': 'Vaccine Record',
    '/encounter/diagnostics-result': 'Diagnostics Result ',
    '/encounter/operation-request':'Operation Requests'
  };

  const menuItems = [
    { key: 'clinicalVisit', label: 'Clinical Visit', icon: faUserDoctor, path: 'clinical-visit' },
    { key: 'observation', label: 'Observation', icon: faBedPulse, path: 'observations' },
    { key: 'allergies', label: 'Allergies', icon: faPersonDotsFromLine, path: 'allergies' },
    { key: 'medicalWarnings', label: 'Medical Warnings', icon: faTriangleExclamation, path: 'medical-warnings' },
    { key: 'diagnosticsResult', label: 'Diagnostics Test Result', icon: faFileWaveform, path: 'diagnostics-result' },
    
    { key: 'vaccination', label: 'Vaccination', icon: faSyringe, path: 'vaccination' },
    { key: 'prescription', label: 'Prescription', icon: faFilePrescription, path: 'prescription' },
    { key: 'drugOrder', label: 'Drug Order', icon: faPills, path: 'drug-order' },
    { key: 'diagnosticsOrder', label: 'Diagnostics Order', icon: faVials, path: 'diagnostics-order' },
    { key: 'consultation', label: 'Consultation', icon: faStethoscope, path: 'consultation' },

    { key: 'procedures', label: 'Procedures', icon: faNotesMedical, path: 'procedures' },
    { key: 'patientHistory', label: 'Patient History', icon: faClockRotateLeft, path: 'patient-history' },
    { key: 'medicationsRecord', label: 'Medications Record', icon: faPills, path: 'medications-record' },
    { key: 'vaccineReccord', label: 'Vaccine Record', icon: faSyringe, path: 'vaccine-record' },
    {key:'operationRequests',label:'Operation Requests',icon:faBedPulse,path:'operation-request'},

    { key: 'cardiology', label: 'Cardiology', icon: faHeartPulse, path: 'cardiology' },
    { key: 'dentalCare', label: 'Dental Care', icon: faTooth, path: 'dental-care' },
    { key: 'optometricExam', label: 'Optometric Exam', icon: faEye, path: 'optometric-exam' },
    { key: 'audiometryPuretone', label: 'ENT', icon: faEarListen, path: 'audiometry' },
    { key: 'psychologicalExam', label: 'Psychological Exam', icon: faBrain, path: 'psychological-exam' },

  ];
  const [currentHeader, setCurrentHeader] = useState();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <Text className='title-font-style'>Patient Visit &gt; {currentHeader}</Text>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  useEffect(() => {
    dispatch(setPageCode('Patient_Visit'));
    dispatch(setDivContent(divContentHTML));
  }, [currentHeader, dispatch]);
  useEffect(() => {

    setCurrentHeader(headersMap[location.pathname] || 'Patient Dashboard')
  }, [location.pathname, dispatch]);

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
                  setIsDrawerOpen(true)
                }}
              >
                Medical Sheets
              </MyButton>
              <MyButton
                disabled={edit}
                prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                Create Follow-up
              </MyButton>
              <MyButton
                disabled={propsData?.patient?.hasAllergy ? false : true}
                backgroundColor={
                  propsData?.patient?.hasAllergy ? 'var(--primary-orange)' : 'var(--deep-blue)'
                }
                onClick={OpenAllargyModal}
                prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
              >
                Allergy
              </MyButton>
              <MyButton
                disabled={propsData?.patient?.hasWarning ? false : true}
                backgroundColor={
                  propsData?.patient?.hasWarning ? 'var(--primary-orange)' : 'var(--deep-blue)'
                }
                onClick={OpenWarningModal}
                prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
              >
                Warning
              </MyButton>
              {!(propsData?.encounter?.resourceTypeLkey === "4217389643435490") && !(propsData?.encounter?.resourceTypeLkey === "91084250213000") && <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faBed} />}
                onClick={() => { setOpenAdmitModal(true) }}
                appearance="ghost"
              >
                <Translate>Admit to Inpatient</Translate>
              </MyButton>}
              {propsData?.encounter?.editable && !propsData?.encounter?.discharge && (
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  onClick={handleCompleteEncounter}
                  appearance="ghost"
                >
                  <Translate>
                    {propsData?.encounter?.resourceTypeLvalue?.valueCode === "BRT_INPATIENT"
                      ? "Discharge"
                      : "Complete Visit"}
                  </Translate>
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
                <List.Item
                  className="drawer-item return-button"
                  onClick={() => {
                    const basePath = location.pathname.split('/').slice(0, -1).join('/');
                    navigate(basePath, { state: location.state });
                    setIsDrawerOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
                  <Translate>Dashboard</Translate>
                </List.Item>
               
                {menuItems.map(({ key, label, icon, path }) =>
                  medicalSheet?.object?.[key] ? (
                    <List.Item key={key} className="drawer-item"
                      onClick={() => {
                        setIsDrawerOpen(false)
                        navigate(path, { state: { patient: propsData.patient, encounter: propsData.encounter, edit } });
                      }}
                    >
                      <Link
                        to={path}
                        state={{ patient: propsData.patient, encounter: propsData.encounter, edit }}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        <FontAwesomeIcon icon={icon} className="icon" />
                        <Translate> {label} </Translate>
                      </Link>
                    </List.Item>
                  ) : null
                )}


              </List>
            </Drawer.Body>
          </Drawer>
          <Outlet />
          {/* {activeContent} Render the selected content */}
        </Panel>
        <AdmitToInpatientModal
          open={openAdmitModal}
          setOpen={setOpenAdmitModal}
          encounter={propsData?.encounter}
        />
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