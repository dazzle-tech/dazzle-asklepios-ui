import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AppointmentModal from '@/pages/Scheduling/scheduling-screen/AppoitmentModal';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useGetResourcesByResourceIdQuery } from '@/services/appointmentService';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { faSuitcaseMedical } from '@fortawesome/free-solid-svg-icons';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import { faSquarePollHorizontal } from '@fortawesome/free-solid-svg-icons';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { GiKidneys } from 'react-icons/gi';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';
import { FaArrowLeft } from 'react-icons/fa6';
import {
  faBedPulse,
  faCheckDouble,
  faClockRotateLeft,
  faFilePrescription,
  faFileWaveform,
  faHandDots,
  faNotesMedical,
  faPersonDotsFromLine,
  faPills,
  faStethoscope,
  faSyringe,
  faTooth,
  faTriangleExclamation,
  faUserDoctor,
  faPersonFallingBurst,
  faG,
  faVials,
  faPersonWalking
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BarChartHorizontalIcon from '@rsuite/icons/BarChartHorizontal';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { Col, Divider, Drawer, Form, List, Panel, Row, Text, Tooltip, Whisper } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import './styles.less';
import BackButton from '@/components/BackButton/BackButton';
import { useGetAppointmentsQuery } from '@/services/appointmentService';
import { useGetMedicalSheetsByDepartmentIdQuery } from '@/services/setupService';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import {
  faBrain,
  faEarListen,
  faEye,
  faHeartPulse,
  faBed,
  faUserPlus,
  faBraille
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import AllergiesModal from './AllergiesModal';
import WarningiesModal from './WarningiesModal';
import { notify } from '@/utils/uiReducerActions';
import AdmitToInpatientModal from './AdmitToInpatientModal';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';
import MyInput from '@/components/MyInput';
import { FaSearch } from 'react-icons/fa';
import { faCapsules } from '@fortawesome/free-solid-svg-icons';
import { ActionContext } from '../encounter-component/patient-summary/ActionContext';
import SideSummaryScreen from './SideSummaryScreen';
import { useSelector } from 'react-redux';
import ConsultationPopup from '../encounter-component/patient-summary/ConsultationPopup';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';

const Encounter = () => {
  const mode = useSelector((state: any) => state.ui.mode);
  // create the action for the Customize Dashboard that we defined it in Patient summary page
  const [action, setAction] = useState(() => () => {});

  const authSlice = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state;
  const savedState = sessionStorage.getItem('encounterPageSource');
  const [localEncounter, setLocalEncounter] = useState<any>({ ...propsData?.encounter });
  const [searchTerm, setSearchTerm] = useState({ term: '' });
  const [openAdmitModal, setOpenAdmitModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [medicalSheetSourceKey, setMedicalSheetSourceKey] = useState<string | undefined>();
  const [medicalSheetRowSourceKey, setMedicalSheetRowSourceKey] = useState<string | undefined>();
  const [selectedResources, setSelectedResources] = useState([]);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);
  const [edit, setEdit] = useState(false);
  const [fromPage, setFromPage] = useState(savedState);

  // States for floating consultation button
  const [openConsultationPopup, setOpenConsultationPopup] = useState<boolean>(false);
  const [buttonPosition, setButtonPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 100 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 100
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on the floating button
  const handleMouseDown = e => {
    setIsDragging(true);
    setHasMoved(false);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
    e.preventDefault();
  };

  // Handle mouse move to drag the button
  const handleMouseMove = e => {
    if (!isDragging) return;

    if (!hasMoved) {
      const movedDistance = Math.sqrt(
        Math.pow(e.clientX - (buttonPosition.x + dragOffset.x), 2) +
          Math.pow(e.clientY - (buttonPosition.y + dragOffset.y), 2)
      );

      if (movedDistance > 5) {
        setHasMoved(true);
      }
    }

    setButtonPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    if (!hasMoved && !isDragging) {
      setOpenConsultationPopup(true);
    }

    setIsDragging(false);
  };

  // Handle click (for click only without drag)
  const handleClick = () => {
    if (!hasMoved && !isDragging) {
      setOpenConsultationPopup(true);
    }
  };

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, hasMoved]);

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
      setEdit(
        fromPage === 'PatientEMR' || localEncounter.encounterStatusLvalue.valueCode === 'CLOSED'
      );
      //TODO convert key to code
      if (
        propsData?.encounter?.resourceTypeLkey === '2039516279378421' ||
        propsData?.encounter?.resourceTypeLkey === '4217389643435490' ||
        propsData?.encounter?.resourceTypeLkey === '6743167799449277'
      ) {
        // Clinic logic
        setMedicalSheetRowSourceKey(propsData?.encounter?.resourceKey);
        setMedicalSheetSourceKey(undefined);
      } else {
        // Not Clinic
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
    if (
      localEncounter?.resourceTypeLvalue?.valueCode == 'BRT_INPATIENT' &&
      completeEncounterMutation.status === 'fulfilled'
    ) {
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
    } else if (localEncounter?.resourceTypeLvalue?.valueCode == 'BRT_INPATIENT') {
      navigate('/inpatient-encounters-list');
    } else if (propsData?.fromPage === 'DayCaseList') {
      navigate('/day-case-list');
    } else if (propsData?.fromPage === 'ER_Department') {
      navigate('/ER-department');
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

  const handleCompleteEncounter = async () => {
    try {
      if (propsData.encounter) {
        await completeEncounter(propsData.encounter).unwrap();
        dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      }
    } catch (error) {
      console.error('Encounter completion error:', error);
      dispatch(notify({ msg: 'An error occurred while completing the encounter', sev: 'error' }));
    }
  };

  const headersMap = {
    '/encounter/doctor-round': 'Doctor Round',
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
    '/encounter/medication-order': 'Medication Order',
    '/encounter/procedures': 'Procedures',
    '/encounter/patient-history': 'Patient History',
    '/encounter/medications-record': 'Medications Record',
    '/encounter/vaccine-record': 'Vaccine Record',
    '/encounter/diagnostics-result': 'Diagnostics Result ',
    '/encounter/dialysis-request': 'Dialysis Request ',
    '/encounter/operation-request': 'Operation Requests',
    '/encounter/multidisciplinary-team-notes': 'Multidisciplinary Team Notes',
    '/encounter/care-plan-and-goals': 'Care Plan & Goals',
    '/encounter/discharge-planning': 'Discharge Planning',
    '/encounter/bedside-procedures-requests': 'Bedside Procedures',
    '/encounter/day-case': 'DayCase',
    '/encounter/blood-order': 'Blood Order',
    '/encounter/intake-output-balance': 'Intake Output Balance',
    '/encounter/referral-request': 'Referral Request',
    '/encounter/iv-fluid-order': 'IV Fluid Order',
    '/encounter/morse-fall-scale': 'Morse Fall Scale (MFS)',
    '/encounter/stratify-scale': 'STRATIFY Scale',
    '/encounter/hendrich-fall-risk': 'Hendrich II Fall Risk Model',
    '/encounter/progress-notes': 'Progress Notes',
    '/encounter/glasgow-coma-scale': 'Glasgow Coma Scale (GCS)',
    '/encounter/pressure-ulce-risk-assessment': 'Pressure Ulcer Risk Assessment',
    '/encounter/vte-risk-assessment': 'VTE Risk Assessment',
    '/encounter/johns-hopkins-tool': 'Johns Hopkins Tool',
    '/encounter/pregnancy-follow-up': 'Pregnancy Follow Up',
    '/encounter/nutrition-state-asssessment': 'Nutrition State',
    '/encounter/dietary-request': 'Dietary Request',
    '/encounter/medication-administration-record': 'MAR',
    '/encounter/physiotherapy-plan': 'Physiotherapy Plan',
    '/encounter/occupational-therapy': 'Occupational Therapy',
    '/encounter/speech-therapy': 'Speech Therapy',
    '/encounter/iv-fluid-administration': 'IV Fluid Administration',
    '/encounter/continuous-observation': 'Continuous Observation',
    '/encounter/FLACC-neonates-pain-assessment': 'Neonates Pain Assessment',
    '/encounter/sliding-scale ': 'Sliding Scale',
    '/encounter/icu': 'ICU'
  };

  const menuItems = [
    {
      key: 'icu',
      label: 'ICU',
      icon: <FontAwesomeIcon icon={faBed} className="icon" />,
      path: 'icu'
    },
    {
      key: 'pregnancyFollowUp',
      label: 'Pregnancy Follow-up',
      icon: <FontAwesomeIcon icon={faBed} className="icon" />,
      path: 'pregnancy-follow-up'
    },
    {
      key: 'vteRiskAssessment',
      label: 'VTE Risk Assessment',
      icon: <FontAwesomeIcon icon={faBraille} className="icon" />,
      path: 'vte-risk-assessment'
    },
    {
      key: 'bradenScaleForPressureUlcer',
      label: 'Pressure Ulcer Risk Assessment',
      icon: <FontAwesomeIcon icon={faBed} className="icon" />,
      path: 'pressure-ulce-risk-assessment'
    },
    {
      key: 'glasgowComaScale',
      label: 'Glasgow Coma Scale',
      icon: <FontAwesomeIcon icon={faG} className="icon" />,
      path: 'glasgow-coma-scale'
    },
    {
      key: 'clinicalVisit',
      label: 'Clinical Visit',
      icon: <FontAwesomeIcon icon={faUserDoctor} className="icon" />,
      path: 'clinical-visit'
    },
    {
      key: 'observation',
      label: 'Observation',
      icon: <FontAwesomeIcon icon={faBedPulse} className="icon" />,
      path: 'observations'
    },
    {
      key: 'allergies',
      label: 'Allergies',
      icon: <FontAwesomeIcon icon={faPersonDotsFromLine} className="icon" />,
      path: 'allergies'
    },
    {
      key: 'medicalWarnings',
      label: 'Medical Warnings',
      icon: <FontAwesomeIcon icon={faTriangleExclamation} className="icon" />,
      path: 'medical-warnings'
    },
    {
      key: 'diagnosticsResult',
      label: 'Diagnostics Test Result',
      icon: <FontAwesomeIcon icon={faFileWaveform} className="icon" />,
      path: 'diagnostics-result'
    },
    {
      key: 'dialysisRequest',
      label: 'Dialysis Request',
      icon: <GiKidneys />,
      path: 'dialysis-request'
    },
    {
      key: 'vaccination',
      label: 'Vaccination',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'vaccination'
    },
    {
      key: 'prescription',
      label: 'Prescription',
      icon: <FontAwesomeIcon icon={faFilePrescription} className="icon" />,
      path: 'prescription'
    },
    {
      key: 'drugOrder',
      label: 'Medication Order',
      icon: <FontAwesomeIcon icon={faPills} className="icon" />,
      path: 'medication-order'
    },
    {
      key: 'diagnosticsOrder',
      label: 'Diagnostics Order',
      icon: <FontAwesomeIcon icon={faVials} className="icon" />,
      path: 'diagnostics-order'
    },
    {
      key: 'consultation',
      label: 'Consultation',
      icon: <FontAwesomeIcon icon={faStethoscope} className="icon" />,
      path: 'consultation'
    },
    {
      key: 'operationRequests',
      label: 'Operation Requests',
      icon: <FontAwesomeIcon icon={faBedPulse} className="icon" />,
      path: 'operation-request'
    },
    {
      key: 'procedures',
      label: 'Procedures',
      icon: <FontAwesomeIcon icon={faNotesMedical} className="icon" />,
      path: 'procedures'
    },
    {
      key: 'patientHistory',
      label: 'Patient History',
      icon: <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />,
      path: 'patient-history'
    },
    {
      key: 'referralRequest',
      label: 'Referral Request',
      icon: <FontAwesomeIcon icon={faUserDoctor} className="icon" />,
      path: 'referral-request'
    },
    {
      key: 'multidisciplinaryTeamNotes',
      label: 'Multidisciplinary Team Notes',
      icon: <FontAwesomeIcon icon={faComment} className="icon" />,
      path: 'multidisciplinary-team-notes'
    },
    {
      key: 'dischargePlanning',
      label: 'Discharge Planning',
      icon: <FontAwesomeIcon icon={faRightFromBracket} className="icon" />,
      path: 'discharge-planning'
    },
    {
      key: 'bedsideProceduresRequest',
      label: 'Bedside Procedures',
      icon: <FontAwesomeIcon icon={faSuitcaseMedical} className="icon" />,
      path: 'bedside-procedures-requests'
    },
    {
      key: 'bloodOrder',
      label: 'Blood Order',
      icon: <FontAwesomeIcon icon={faDroplet} className="icon" />,
      path: 'blood-order'
    },
    {
      key: 'intakeOutputBalance',
      label: 'Intake Output Balance',
      icon: <FontAwesomeIcon icon={faSquarePollHorizontal} className="icon" />,
      path: 'intake-output-balance'
    },
    {
      key: 'carePlanAndGoals',
      label: 'Care Plan & Goals',
      icon: <FontAwesomeIcon icon={faNotesMedical} className="icon" />,
      path: 'care-plan-and-goals'
    },
    {
      key: 'johnsHopkinsFallRiskAssessmentTool',
      label: 'Johns Hopkins Tool',
      icon: <FontAwesomeIcon icon={faPersonFallingBurst} className="icon" />,
      path: 'johns-hopkins-tool'
    },
    {
      key: 'medicationsRecord',
      label: 'Medications Record',
      icon: <FontAwesomeIcon icon={faPills} className="icon" />,
      path: 'medications-record'
    },
    {
      key: 'vaccineReccord',
      label: 'Vaccine Record',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'vaccine-record'
    },
    {
      key: 'cardiology',
      label: 'Cardiology',
      icon: <FontAwesomeIcon icon={faHeartPulse} className="icon" />,
      path: 'cardiology'
    },
    {
      key: 'dentalCare',
      label: 'Dental Care',
      icon: <FontAwesomeIcon icon={faTooth} className="icon" />,
      path: 'dental-care'
    },
    {
      key: 'optometricExam',
      label: 'Optometric Exam',
      icon: <FontAwesomeIcon icon={faEye} className="icon" />,
      path: 'optometric-exam'
    },
    {
      key: 'audiometryPuretone',
      label: 'Audiometry Puretone',
      icon: <FontAwesomeIcon icon={faEarListen} className="icon" />,
      path: 'audiometry'
    },
    {
      key: 'progressNotes',
      label: 'Progress Notes',
      icon: <FontAwesomeIcon icon={faFileLines} className="icon" />,
      path: 'progress-notes'
    },
    {
      key: 'psychologicalExam',
      label: 'Psychological Exam',
      icon: <FontAwesomeIcon icon={faBrain} className="icon" />,
      path: 'psychological-exam'
    },
    {
      key: 'dayCase',
      label: 'DayCase',
      icon: <FontAwesomeIcon icon={faBed} className="icon" />,
      path: 'day-case'
    },
    {
      key: 'ivFluidOrder',
      label: 'IV Fluid Order',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'iv-fluid-order'
    },
    {
      key: 'morseFallScale',
      label: 'Morse Fall Scale (MFS)',
      icon: <FontAwesomeIcon icon={faPersonFallingBurst} className="icon" />,
      path: 'morse-fall-scale'
    },
    {
      key: 'stratifyScale',
      label: 'STRATIFY Scale',
      icon: <FontAwesomeIcon icon={faPersonFallingBurst} className="icon" />,
      path: 'stratify-scale'
    },
    {
      key: 'hendrichFallRisk',
      label: 'Hendrich II Fall Risk Model',
      icon: <FontAwesomeIcon icon={faPersonFallingBurst} className="icon" />,
      path: 'hendrich-fall-risk'
    },
    {
      key: 'doctorRound',
      label: 'Doctor Round',
      icon: <FontAwesomeIcon icon={faUserDoctor} className="icon" />,
      path: 'doctor-round'
    },
    {
      key: 'nutritionStateAssessment',
      label: 'Nutrition State',
      icon: <FontAwesomeIcon icon={faLeaf} className="icon" />,
      path: 'nutrition-state-asssessment'
    },
    {
      key: 'dietaryRequest',
      label: 'Dietary Request',
      icon: <FontAwesomeIcon icon={faLeaf} className="icon" />,
      path: 'dietary-request'
    },
    {
      key: 'medicationAdministrationRecord',
      label: 'MAR',
      icon: <FontAwesomeIcon icon={faCapsules} className="icon" />,
      path: 'medication-administration-record'
    },
    {
      key: 'physiotherapyPlan',
      label: 'Physiotherapy Plan',
      icon: <FontAwesomeIcon icon={faPersonWalking} className="icon" />,
      path: 'physiotherapy-plan'
    },
    {
      key: 'occupationalTherapy',
      label: 'Occupational Therapy',
      icon: <FontAwesomeIcon icon={faPersonWalking} className="icon" />,
      path: 'occupational-therapy'
    },
    {
      key: 'speechTherapy',
      label: 'Speech Therapy',
      icon: <FontAwesomeIcon icon={faPersonWalking} className="icon" />,
      path: 'speech-therapy'
    },
    {
      key: 'ivFluidAdministration',
      label: 'IV Fluid Administration',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'iv-fluid-administration'
    },
    {
      key: 'continuousObservations',
      label: 'Continuous Observation',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'continuous-observation'
    },
    {
      key: 'flaccNeonatesPainAssessment',
      label: 'FLACC Neonates Pain Assessment',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'FLACC-neonates-pain-assessment'
    },
    {
      key: 'slidingScale',
      label: 'Sliding Scale',
      icon: <FontAwesomeIcon icon={faSyringe} className="icon" />,
      path: 'sliding-scale'
    }
  ];

  const [currentHeader, setCurrentHeader] = useState();
  const divContent = (
    <div style={{ display: 'flex' }}>
      <Text className="title-font-style">Patient Visit &gt; {currentHeader}</Text>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  useEffect(() => {
    dispatch(setPageCode('Patient_Visit'));
    dispatch(setDivContent(divContentHTML));
  }, [currentHeader, dispatch]);
  useEffect(() => {
    setCurrentHeader(headersMap[location.pathname] || 'Patient Dashboard');
  }, [location.pathname, dispatch]);

  const [expand, setExpand] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ActionContext.Provider value={{ action, setAction }}>
      <div className="container">
        {/* Floating Consultation Button */}
        <div
          ref={buttonRef}
          className={`draggable-container ${isDragging ? 'grabbing' : 'grab'}`}
          style={{ left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
        >
          <button
            className={`my-button draggable-button ${isDragging ? 'dragging' : ''}`}
            title="Drag to move or click to open consultation"
          >
            <FontAwesomeIcon icon={faDesktop} />
          </button>

          {!isDragging && <div className="draggable-pulse" />}
        </div>

        <div className="left-box">
          <Panel>
            <div className="container-bt">
              <div className="left">
                <BackButton onClick={handleGoBack} />

                <MyButton
                              backgroundColor={'var(--primary-gray)'}
                              onClick={handleGoBack}
                              prefixIcon={() => <FaArrowLeft />}
                            >
                </MyButton>

                <Form fluid>
                  <MyInput
                    width="100%"
                    placeholder="Medical Sheets"
                    fieldName={'term'}
                    record={searchTerm}
                    setRecord={setSearchTerm}
                    showLabel={false}
                    enterClick={() => setIsDrawerOpen(true)}
                    rightAddon={
                      <FaSearch
                        className="icons-style-2"
                        onClick={() => {
                          setIsDrawerOpen(true);
                        }}
                      />
                    }
                  />
                </Form>
              </div>
              <div className="right">
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
                {!(propsData?.encounter?.resourceTypeLkey === '4217389643435490') &&
                  !(propsData?.encounter?.resourceTypeLkey === '91084250213000') && (
                    <MyButton
                      prefixIcon={() => <FontAwesomeIcon icon={faBed} />}
                      onClick={() => {
                        setOpenAdmitModal(true);
                      }}
                      appearance="ghost"
                    >
                      <Translate>Admit to Inpatient</Translate>
                    </MyButton>
                  )}
                {propsData?.encounter?.editable && !propsData?.encounter?.discharge && (
                  <MyButton
                    prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={() =>
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_INPATIENT' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_DAYCASE' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_PROC' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_EMERGENCY'
                        ? setOpenDischargeModal(true)
                        : handleCompleteEncounter()
                    }
                    appearance="ghost"
                  >
                    <Translate>
                      {propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_INPATIENT' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_DAYCASE' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_PROC' ||
                      propsData?.encounter?.resourceTypeLvalue?.valueCode === 'BRT_EMERGENCY'
                        ? 'Discharge'
                        : 'Complete Visit'}
                    </Translate>
                  </MyButton>
                )}

                {/* show this button only on the dashboard page */}
                {location.pathname == '/encounter' && (
                  <MyButton
                    prefixIcon={() => (
                      <Whisper
                        trigger="hover"
                        placement="top"
                        speaker={<Tooltip>Customize Dashboard</Tooltip>}
                      >
                        <FontAwesomeIcon icon={faChartLine} />
                      </Whisper>
                    )}
                    onClick={action}
                    backgroundColor="#8360BF"
                  ></MyButton>
                )}

                {location.pathname !== '/encounter' && (
                  <MyButton
                    prefixIcon={() => (
                      <Whisper trigger="hover" placement="top" speaker={<Tooltip>Summary</Tooltip>}>
                        <FontAwesomeIcon icon={faChartLine} />
                      </Whisper>
                    )}
                    onClick={() => setExpand(!expand)}
                    backgroundColor="#8360BF"
                  />
                )}
              </div>
            </div>
            <Divider />

            <Drawer
              open={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              placement="left"
              style={{zIndex:999999999999}}
              className={`drawer-style ${mode === 'light' ? 'light' : 'dark'}`}
            >
              <Drawer.Header className="header-drawer">
                <Drawer.Title className="title-drawer">Medical Sheets</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body className="drawer-body">
                <Form fluid>
                  <Row>
                    <Col md={24}>
                      <MyInput
                        width="100%"
                        placeholder="Search screens..."
                        fieldName={'term'}
                        record={searchTerm}
                        setRecord={setSearchTerm}
                        showLabel={false}
                        rightAddon={<FaSearch style={{ color: 'var(--primary-gray)' }} />}
                      />
                    </Col>
                  </Row>
                </Form>

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

                  {menuItems
                    .filter(({ label }) =>
                      label.toLowerCase().includes(searchTerm.term.toLowerCase())
                    )
                    .map(({ key, label, icon, path }) =>
                      medicalSheet?.object?.[key] ? (
                        <List.Item
                          key={key}
                          className="drawer-item"
                          onClick={() => {
                            setIsDrawerOpen(false);
                            navigate(path, {
                              state: {
                                patient: propsData.patient,
                                encounter: propsData.encounter,
                                edit
                              }
                            });
                          }}
                        >
                          <Link
                            to={path}
                            state={{
                              patient: propsData.patient,
                              encounter: propsData.encounter,
                              edit
                            }}
                            className="inherit-link"
                          >
                            {icon}
                            <span className="margin-left-10">
                              <Translate>{label}</Translate>
                            </span>
                          </Link>
                        </List.Item>
                      ) : null
                    )}
                </List>
              </Drawer.Body>
            </Drawer>

            <div className="content-with-sticky">
              <div className="main-content-area">
                <Outlet
                  context={{
                    patient: propsData?.patient,
                    encounter: propsData?.encounter,
                    edit,
                    setLocalEncounter
                  }}
                />
              </div>

              {expand && (
                <div className="sticky-sidebar-area">
                  <SideSummaryScreen
                    expand={expand}
                    setExpand={setExpand}
                    windowHeight={windowHeight}
                    patient={propsData.patient}
                    encounter={propsData.encounter}
                  />
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right box with PatientSide and Medical Timeline */}
        <div className="right-box">
          <PatientSide patient={propsData?.patient} encounter={propsData?.encounter} edit={edit} />
        </div>
      </div>

      {/* Modals */}
      <AllergiesModal
        open={openAllargyModal}
        setOpen={setOpenAllargyModal}
        patient={propsData?.patien}
      />

      <WarningiesModal
        open={openWarningModal}
        setOpen={setOpenWarningModal}
        patient={propsData?.patient}
      />

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
        selectedSlot={undefined}
        
      />

      <EncounterDischarge
        open={openDischargeModal}
        setOpen={setOpenDischargeModal}

        encounter={propsData?.encounter}
      />

      {/* Consultation Popup */}
      <ConsultationPopup
        open={openConsultationPopup}
        setOpen={() => setOpenConsultationPopup(false)}
        patient={propsData?.patient}
        encounter={propsData?.encounter}
      />
    </ActionContext.Provider>
  );
};

export default Encounter;
