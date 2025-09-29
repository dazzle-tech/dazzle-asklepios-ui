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
import { useLocation, useNavigate } from 'react-router-dom';
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
import ProgressNote from './ProgressNotes';



const StartTeleConsultation = () => {
  const navigate = useNavigate();
  const mode = useSelector((state: any) => state.ui.mode);
  const { state } = useLocation();
  const { patient, encounter, fromPage, consultaition, notelist } = state || {};
  const [showProcedureDetails, setShowProcedureDetails] = useState(false);
  const [showOperationRequest, setShowOperationRequest] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showSelectTestsModal, setShowSelectTestsModal] = useState(false);
  const [showMedicationOrderModal, setShowMedicationOrderModal] = useState(false);
  const [openVitalModal, setOpenVitalModal] = useState(false);

  const [progressNotes, setProgressNotes] = useState<any[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const noop = () => { };

  const [edit] = useState(false);

  const [selectedModalContent, setSelectedModalContent] = useState<React.ReactNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dummyPatient = { name: 'John Doe', hasAllergy: true, hasWarning: true };
  const dummyEncounter = { editable: true };

  const sheetButtons = [
    { label: 'Observation', icon: faClipboardList },
    { label: 'Prescription', icon: faPrescriptionBottle },
    { label: 'Medication Order', icon: faPills },
    { label: 'Diagnostics Order', icon: faVials },
    { label: 'Consultation', icon: faStethoscope },
    { label: 'Operation Requests', icon: faNotesMedical },
    { label: 'Procedures', icon: faProcedures }
  ];

  const handleOpenModal = (label: string) => {
    switch (label) {
      case 'Observation':
        setSelectedModalContent(<ContinuousObservations />);
        break;
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

  return (
    <div className='main-start-tele-consultation-container-handle'>
      <div className="container">
        <div className="left-box">
          <Panel>
            <div className="container-bt-start-tele">
              <BackButton onClick={() => navigate(-1)} />
            </div>

            <div className="container-btns-start-tele">
              <MyButton disabled={edit} prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}>
                Create Follow-up
              </MyButton>
              <MyButton
                disabled={!dummyPatient.hasAllergy}
                backgroundColor={dummyPatient.hasAllergy ? 'var(--primary-orange)' : 'var(--deep-blue)'}
                prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
              >
                Allergy
              </MyButton>
              <MyButton
                disabled={!dummyPatient.hasWarning}
                backgroundColor={dummyPatient.hasWarning ? 'var(--primary-orange)' : 'var(--deep-blue)'}
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

            <div className={`page-content-main-container ${mode === 'light' ? 'light' : 'dark'}`}>
              <div className="patient-summary-section">
                <PatientMajorProblem patient={dummyPatient} />
                <PatientChronicMedication patient={dummyPatient} />
                <RecentTestResults patient={dummyPatient} />
                <Procedures patient={dummyPatient} />
              </div>

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
                  <PatientHistorySummary patient={dummyPatient} encounter={dummyEncounter} edit={edit} />
                </div>
              </div>

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

        <div className="right-box">
          <PatientSide patient={patient} encounter={encounter} />
        </div>

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
            patient={patient}
            encounter={encounter}
            medicRefetch={noop}
            openToAdd={false}
            setOrderMedication={noop}
            drugKey={null}
            editing={false}
          />
        )}

        {showProcedureDetails && (
          <TeleScreenProcedures open={showProcedureDetails} onClose={() => setShowProcedureDetails(false)} />
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
          <TeleScreenSelectTests open={showSelectTestsModal} onClose={() => setShowSelectTestsModal(false)} />
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

      {/* Extra Sections */}
      <div className='coulmns-part-tele-consultation-screen'>
        <div><ICU /></div>

       
       
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
    </div>
  );
};

export default StartTeleConsultation;
