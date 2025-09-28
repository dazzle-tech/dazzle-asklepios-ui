// Import required dependencies and components
import React, { useState } from 'react';
import PlusIcon from '@rsuite/icons/Plus';
import ModalContent from './ModalContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faHandDots,
  faTriangleExclamation,
  faCheckDouble,
  faClipboardList,
  faPrescriptionBottle,
  faPills,
  faVials,
  faStethoscope,
  faNotesMedical,
  faProcedures,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { Divider, Panel } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import SectionContainer from '@/components/SectionsoContainer';
import AddProgressNotes from '@/components/ProgressNotes/ProgressNotes';
import RecentTestResults from '../../encounter-component/patient-summary/RecentTestResults';
import PatientChronicMedication from '../../encounter-component/patient-summary/PatientChronicMedication';
import PatientMajorProblem from '../../encounter-component/patient-summary/PatientMajorProblem';
import MyButton from '@/components/MyButton/MyButton';
import BackButton from '@/components/BackButton/BackButton';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import MyModal from '@/components/MyModal/MyModal';
import DetailsModal from '../../encounter-component/prescription/DetailsModal';
import Procedures from '../../encounter-component/patient-summary/Procedures/Procedures';
import TeleScreenProcedures from './TeleScreenProcedures';
import TeleScreenOperationRequests from './TeleScreenOperationRequests';
import TeleScreenConsultation from './TeleScreenConsultation';
import TeleScreenSelectTests from './TeleScreenDiagnosticsOrder';
import TeleScreenMedicationOrder from './TeleScreenMedicationOrder';
import ContinuousObservations from '../../continuous-observations/ContinuousObservations';
import PatientHistorySummary from '../../encounter-component/patient-history/MedicalHistory/PatientHistorySummary';
import './styles.less';
import { useSelector } from 'react-redux';
import ICU from '../../encounter-component/i.c.u';

const StartTeleConsultation = () => {
  const navigate = useNavigate();
  const mode = useSelector((state: any) => state.ui.mode);
  //
  const [showProcedureDetails, setShowProcedureDetails] = useState(false);
  const [showOperationRequest, setShowOperationRequest] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showSelectTestsModal, setShowSelectTestsModal] = useState(false);
  const [showMedicationOrderModal, setShowMedicationOrderModal] = useState(false);
  const [openVitalModal, setOpenVitalModal] = useState(false);


  const [vital, setVital] = useState({
    temperature: '',
    pulse: '',
    bloodPressure: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  });

  const [progressNotes, setProgressNotes] = useState<any[]>([]);

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const noop = () => { };



  // State to control edit mode (currently unused)
  const [edit] = useState(false);

  // State to manage modal content and open status
  const [selectedModalContent, setSelectedModalContent] = useState<React.ReactNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dummy data for patient and encounter
  const dummyPatient = { name: 'John Doe', hasAllergy: true, hasWarning: true };
  const dummyEncounter = { editable: true };

  // Define buttons for opening different medical service sheets
  const sheetButtons = [
    { label: 'Observation', icon: faClipboardList },
    { label: 'Prescription', icon: faPrescriptionBottle },
    { label: 'Medication Order', icon: faPills },
    { label: 'Diagnostics Order', icon: faVials },
    { label: 'Consultation', icon: faStethoscope },
    { label: 'Operation Requests', icon: faNotesMedical },
    { label: 'Procedures', icon: faProcedures }
  ];
  // Function to handle opening modal based on button label
  const handleOpenModal = (label: string) => {
    switch (label) {
      case 'Observation':
        setSelectedModalContent(<ContinuousObservations />);
        break;
      case 'Prescription':
        setShowPrescriptionModal(true);
        return;
      case 'Prescription':
        setShowPrescriptionModal(true);
        return;
      case 'Medication Order':
        setShowMedicationOrderModal(true);
        return;
      case 'Diagnostics Order':
        setShowSelectTestsModal(true);
        return;
      case 'Consultation':
        setShowConsultationModal(true);
        return;
      case 'Operation Requests':
        setShowOperationRequest(true);
        return;
      case 'Procedures':
        setShowProcedureDetails(true);
        return;
      default:
        setSelectedModalContent(<div>{label} form goes here</div>);
    }

    setIsModalOpen(true);
  };


  return (<div className='main-start-tele-consultation-container-handle'>


    <div className="container">
      {/* Left section of the screen */}
      <div className="left-box">
        <Panel>
          {/* Back button */}
          <div className="container-bt-start-tele">
            <BackButton onClick={() => navigate(-1)} />
          </div>

          {/* Top action buttons */}
          <div className="container-btns-start-tele">
            <MyButton disabled={edit} prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}>
              Create Follow-up
            </MyButton>
            <MyButton
              disabled={!dummyPatient.hasAllergy}
              backgroundColor={
                dummyPatient.hasAllergy ? 'var(--primary-orange)' : 'var(--deep-blue)'
              }
              prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
            >
              Allergy
            </MyButton>
            <MyButton
              disabled={!dummyPatient.hasWarning}
              backgroundColor={
                dummyPatient.hasWarning ? 'var(--primary-orange)' : 'var(--deep-blue)'
              }
              prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
            >
              Warning
            </MyButton>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              appearance="ghost"
              onClick={() => alert('Complete Visit')}
            >
              Complete Visit
            </MyButton>
          </div>

          <Divider />

          {/* Main content area */}
          <div className={`page-content-main-container ${mode === 'light' ? 'light' : 'dark'}`}>
            {/* Patient summary section */}
            <div className="patient-summary-section">
              <PatientMajorProblem patient={dummyPatient} />
              <PatientChronicMedication patient={dummyPatient} />
              <RecentTestResults patient={dummyPatient} />
              <Procedures patient={dummyPatient} />
            </div>



            {/* Placeholder for camera section */}
            <div className="camera-tele-consultaition">
              <SectionContainer
                title={<div className="patient-history-title">
                  <FontAwesomeIcon icon={faUser} className="patient-history-icon" />
                  <span>Patient Details</span></div>}
                content={<AddProgressNotes
                  progressNotes={progressNotes}
                  setProgressNotes={setProgressNotes}
                  currentChart={{ key: 'dummy-chart-key' }}
                  dispatch={(action) => console.log(action)}
                />} />
              <div>
                <PatientHistorySummary patient={dummyPatient} encounter={dummyEncounter} edit={edit} /></div>
            </div>



            {/* Buttons to open various service forms */}
            <div className="sheets-open-popup">
              {sheetButtons.map(({ label, icon }) => (
                <button key={label} onClick={() => handleOpenModal(label)} className="sheet-button">
                  <FontAwesomeIcon icon={icon} className="icon-left" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Right section showing patient information */}
      <div className="right-box">
        <PatientSide patient={dummyPatient} encounter={dummyEncounter} />
      </div>

      {/* Reusable modal to display selected form */}
      <MyModal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        title="Service Form"
        content={selectedModalContent}
        hideCancel={false}
        hideActionBtn={true}
        size="60vw"
        handleCancelFunction={() => setSelectedModalContent(null)}
      />

      {showPrescriptionModal && (
        <DetailsModal
          edit={true}
          open={showPrescriptionModal}
          setOpen={setShowPrescriptionModal}
          prescriptionMedication={{
            medicationItems: [],
            instructions: '',
            dosage: '',
          }}
          setPrescriptionMedications={noop}
          preKey={null}
          patient={dummyPatient}
          encounter={dummyEncounter}
          medicRefetch={noop}
          openToAdd={false}
          setOrderMedication={noop}
          drugKey={null}
          editing={false}
        />

      )}





      {showProcedureDetails && (
        <TeleScreenProcedures
          open={showProcedureDetails}
          onClose={() => setShowProcedureDetails(false)}
        />
      )}

      {showOperationRequest && (
        <TeleScreenOperationRequests
          open={showOperationRequest}
          onClose={() => setShowOperationRequest(false)}
          patient={dummyPatient}
          encounter={dummyEncounter}
          refetch={() => { }}
        />
      )}

      {showConsultationModal && (
        <TeleScreenConsultation
          open={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
          patient={dummyPatient}
          encounter={dummyEncounter}
          refetch={() => { }}
        />
      )}
      {showSelectTestsModal && (
        <TeleScreenSelectTests
          open={showSelectTestsModal}
          onClose={() => setShowSelectTestsModal(false)}
        />
      )}
      {showMedicationOrderModal && (
        <TeleScreenMedicationOrder
          open={showMedicationOrderModal}
          onClose={() => setShowMedicationOrderModal(false)}
          patient={dummyPatient}
          encounter={dummyEncounter}
          medicRefetch={() => { }}
        />
      )}
    </div>


    <div className='coulmns-part-tele-consultation-screen'>

      <div><ICU></ICU></div>
    </div>

    <MyModal
      open={openVitalModal}
      setOpen={setOpenVitalModal}
      title="Vital Signs"
      position="right"
      content={<ModalContent />}
      actionButtonLabel="Save"
      actionButtonFunction={() => alert("Saved vitals")}
      size="50vw"
    />
  </div>);
};

export default StartTeleConsultation;
