// Import required dependencies and components
import React, { useState, useMemo, useEffect } from 'react';
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
  faUser,
  faHourglassStart,
  faVideo
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
import DetailsModal from '../../encounter-component/prescription-new/DetailsModal';
import Procedures from '../../encounter-component/patient-summary/Procedures/Procedures';
import TeleScreenProcedures from './TeleScreenProcedures';
import TeleScreenOperationRequests from './TeleScreenOperationRequests';
import TeleScreenConsultation from './TeleScreenConsultation';
import TeleScreenMedicationOrder from './TeleScreenMedicationOrder';
import ContinuousObservations from '../../continuous-observations/ContinuousObservations';
import PatientHistorySummary from '../../encounter-component/patient-history/MedicalHistory/PatientHistorySummary';
import './styles.less';
import { useSelector } from 'react-redux';
import ICU from '../../encounter-component/i.c.u';
import ProgressNote from './ProgressNotes';
import { useGetEncounterByIdQuery, useGetEncountersQuery, useGetPrescriptionsQuery, useSaveTeleConsultationMutation } from '@/services/encounterService';

import { JitsiMeeting } from '@jitsi/react-sdk';
import FloatingPiPJitsi from './JitsiPip';
import { slice } from 'lodash';
import { startCall } from '@/store/callSlice';
import { useDispatch } from 'react-redux';

import Translate from '@/components/Translate';
import { newApEncounter, newApPrescriptionMedications } from '@/types/model-types-constructor';
import { ApPrescriptionMedications } from '@/types/model-types';
import { initialListRequest } from '@/types/types';
import Observations from './Observation';

const StartTeleConsultation = () => {
  const navigate = useNavigate();
  const mode = useSelector((state: any) => state.ui.mode);
  const { state } = useLocation();
  const { patient, encounterId, fromPage, consultaition, notelist } = state || {};
  const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
  const { data: encounterData } = useGetEncounterByIdQuery(encounterId ?? '', {
      skip: !encounterId
    });
    
    useEffect(() => {
       setEncounter(encounterData);
    },[encounterData]);
     const {
        data: prescriptions,
        isLoading: isLoadingPrescriptions,
        refetch: preRefetch
      } = useGetPrescriptionsQuery({
        ...initialListRequest,
        filters: [
          { fieldName: 'patient_key', operator: 'match', value: patient?.key },
          { fieldName: 'visit_key', operator: 'match', value: encounter?.key }
        ]
      });
    const [preKeyRecord, setPreKeyRecord] = useState<{ preKey: any }>({ preKey: null });
     useEffect(() => {
        if (preKeyRecord.preKey !== null) return;
    
        const foundDraft = prescriptions?.object?.find((p: any) => p.saveDraft === true);
        if (foundDraft?.key) setPreKeyRecord({ preKey: foundDraft.key });
      }, [prescriptions]);
    
    const [prescriptionMedication, setPrescriptionMedications] = useState<ApPrescriptionMedications>({
        ...newApPrescriptionMedications,
        duration: null,
        numberOfRefills: null
      });
  const sliceauth = useSelector((state: any) => state.auth);

  const [showProcedureDetails, setShowProcedureDetails] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showSelectTestsModal, setShowSelectTestsModal] = useState(false);
  const [openVitalModal, setOpenVitalModal] = useState(false);

  const [save] = useSaveTeleConsultationMutation();
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const noop = () => {};

  const [edit] = useState(false);

  const [selectedModalContent, setSelectedModalContent] = useState<React.ReactNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sheetButtons = [
    { label: 'Observation', icon: faClipboardList },
    { label: 'Prescription', icon: faPrescriptionBottle },
    { label: 'Diagnostics Order', icon: faVials },
    { label: 'Consultation', icon: faStethoscope },
    { label: 'Procedures', icon: faProcedures }
  ];

  const handleOpenModal = (label: string) => {
    switch (label) {
      case 'Observation':
        setSelectedModalContent(
        <Observations patient={patient} encounter={encounter} setOpen={setIsModalOpen}/>
      );
        break;
      case 'Prescription':
        setShowPrescriptionModal(true);
        return;
      case 'Diagnostics Order':
        setShowSelectTestsModal(true);
        return;
      case 'Consultation':
        setShowConsultationModal(true);
        return;
      case 'Procedures':
        setShowProcedureDetails(true);
        return;
      default:
        setSelectedModalContent(<div>{label} form goes here</div>);
    }
    setIsModalOpen(true);
  };

  const roomName = useMemo(() => `asklepios tele-consultation`, []);
  // const meetingUrl = `https://meet.jit.si/${roomName}`;

  const dispatch = useDispatch();
  const displayName = sliceauth?.user?.firstName + ' ' + sliceauth?.user?.lastName;
  const email = sliceauth?.user?.email;


        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div className="main-start-tele-consultation-container-handle" dir={dir}>
      <div className="container">
        <div className="left-box">
          <Panel>
            <div className="container-bt-start-tele">
              <BackButton onClick={() => navigate(-1)} />
              <MyButton
                onClick={async () => {

                  await save({   ...state.consultaition,
                    statusLkey: '13828778108999715', // ORD_ON_CALL
                    callStartedAt: Date.now(),
                    callStartedBy: sliceauth.user?.login }).unwrap();
                  dispatch(startCall({ roomName, displayName, email }));
                }}
                prefixIcon={() => <FontAwesomeIcon icon={faVideo} />}
                loading={false}
              >
                Start Call
              </MyButton>
            </div>

            <div className="container-btns-start-tele">
              <MyButton disabled={edit} prefixIcon={() => <FontAwesomeIcon icon={faUserPlus} />}>
                Create Follow-up
              </MyButton>
              <MyButton
                disabled={!encounter?.hasAllergy}
                backgroundColor={
                  encounter?.hasAllergy ? 'var(--primary-orange)' : 'var(--deep-blue)'
                }
                prefixIcon={() => <FontAwesomeIcon icon={faHandDots} />}
              >
                Allergy
              </MyButton>
              <MyButton
                disabled={!patient.hasWarning}
                backgroundColor={patient.hasWarning ? 'var(--primary-orange)' : 'var(--deep-blue)'}
                prefixIcon={() => <FontAwesomeIcon icon={faTriangleExclamation} />}
              >
                Warning
              </MyButton>
              <MyButton
                prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                appearance="ghost"
                onClick={async () => {
                  const payload = {
                    ...consultaition,
                    statusLkey: '13828896473769449', // ORD_CALL_CLOSED
                    callClosedAt: Date.now(),
                    callClosedBy: sliceauth.user?.login
                  };
                  await save(payload).unwrap();
                }}
              >
                Close Call
              </MyButton>
            </div>

            <Divider />

            <div className={`page-content-main-container ${mode === 'light' ? 'light' : 'dark'}`}>
              <div className="patient-summary-section">
                <PatientMajorProblem patient={patient} />
                <PatientChronicMedication patient={patient} />
                <RecentTestResults patient={patient} />
                <Procedures patient={patient} />
              </div>

              <div className="camera-tele-consultaition">
                <div>
                  <PatientHistorySummary
                    patient={patient}
                    encounter={encounter}
                    edit={edit}
                  />
                </div>

                <div>
                  <SectionContainer
                    title={<Translate>Progress Note</Translate>}
                    content={<ProgressNote patient={patient} encounter={encounter} />}
                    minHeight={'17vw'}
                  />
                </div>
              </div>

              <div className="sheets-open-popup">
                {sheetButtons.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => handleOpenModal(label)}
                    className="sheet-button"
                  >
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
          // size="100vw"
          size="60vw"
          handleCancelFunction={() => setSelectedModalContent(null)}
        />

        {showPrescriptionModal && (
          <DetailsModal
            edit={false}
            open={showPrescriptionModal}
            setOpen={setShowPrescriptionModal}
            prescriptionMedication={prescriptionMedication}
            setPrescriptionMedications={setPrescriptionMedications}
            preKey={preKeyRecord['preKey']}
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
          <TeleScreenProcedures
            open={showProcedureDetails}
            onClose={() => setShowProcedureDetails(false)}
            patient={patient}
            encounter={encounter}
          />
        )}
        {showConsultationModal && (
          <TeleScreenConsultation
            open={showConsultationModal}
            onClose={() => setShowConsultationModal(false)}
            patient={patient}
            encounter={encounter}
            refetch={() => {}}
          />
        )}
       
        
      </div>
      {/* Extra Sections  // hide  */}
      <div className="coulmns-part-tele-consultation-screen"> 
        <div>
          <ICU />
        </div>
      </div>

      <MyModal
        open={openVitalModal}
        setOpen={setOpenVitalModal}
        title="Vital Signs"
        position="right"
        content={<ModalContent />}
        actionButtonLabel="Save"
        actionButtonFunction={() => alert('Saved vitals')}
        size="50vw"
      />
    </div>
  );
};

export default StartTeleConsultation;
