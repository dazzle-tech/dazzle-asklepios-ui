// Import required dependencies and components
import React, { useState } from 'react';
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
  faProcedures
} from '@fortawesome/free-solid-svg-icons';
import { Divider, Panel } from 'rsuite';
import { useNavigate } from 'react-router-dom';

// Import patient summary and other modules
import RecentTestResults from '../../encounter-component/patient-summary/RecentTestResults';
import PatientChronicMedication from '../../encounter-component/patient-summary/PatientChronicMedication';
import PatientMajorProblem from '../../encounter-component/patient-summary/PatientMajorProblem';
import MyButton from '@/components/MyButton/MyButton';
import BackButton from '@/components/BackButton/BackButton';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import MyModal from '@/components/MyModal/MyModal';
import Prescription from '../../encounter-component/prescription';
import DrugOrder from '../../encounter-component/drug-order';
import DiagnosticsOrder from '../../encounter-component/diagnostics-order';
import Procedures from '../../encounter-component/patient-summary/Procedures/Procedures';
import TeleScreenProcedures from './TeleScreenProcedures';
import TeleScreenOperationRequests from './TeleScreenOperationRequests';
import TeleScreenConsultation from './TeleScreenConsultation';
import TeleScreenSelectTests from './TeleScreenDiagnosticsOrder';
import TeleScreenMedicationOrder from './TeleScreenMedicationOrder';
// Import custom styles
import './styles.less';

const StartTeleconsultation = () => {
  const navigate = useNavigate();

//
const [showProcedureDetails, setShowProcedureDetails] = useState(false);
const [showOperationRequest, setShowOperationRequest] = useState(false);
const [showConsultationModal, setShowConsultationModal] = useState(false);
const [showSelectTestsModal, setShowSelectTestsModal] = useState(false);
const [showMedicationOrderModal, setShowMedicationOrderModal] = useState(false);


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
//\u00A0
  // Function to handle opening modal based on button label
const handleOpenModal = (label: string) => {
  switch (label) {
    case 'Prescription':
      setSelectedModalContent(<Prescription patient={dummyPatient} encounter={dummyEncounter} />);
      break;
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
  return; // حتى ما يفتح MyModal
    case 'Procedures':
      setShowProcedureDetails(true);
      return; // NOTE: exit early so modal doesn't open
    default:
      setSelectedModalContent(<div>{label} form goes here</div>);
  }

  setIsModalOpen(true); // ✅ always open modal unless returned early
};


  return (
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
          <div className="page-content-main-container">
            {/* Patient summary section */}
            <div className="patient-summary-section">
              <PatientMajorProblem patient={dummyPatient} />
              <PatientChronicMedication patient={dummyPatient} />
              <RecentTestResults patient={dummyPatient} />
              <Procedures patient={dummyPatient} />
            </div>

            {/* Placeholder for camera section */}
            <div className="camera-tele-consultaition" />

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
    refetch={() => {}}
  />
)}

{showConsultationModal && (
  <TeleScreenConsultation
    open={showConsultationModal}
    onClose={() => setShowConsultationModal(false)}
    patient={dummyPatient}
    encounter={dummyEncounter}
    refetch={() => {}}
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
    medicRefetch={() => {}}
  />
)}


    </div>
  );
};

export default StartTeleconsultation;
