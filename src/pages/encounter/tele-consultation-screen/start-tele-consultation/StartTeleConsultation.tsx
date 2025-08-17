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
import RecentTestResults from '../../encounter-component/patient-summary/RecentTestResults';
import PatientChronicMedication from '../../encounter-component/patient-summary/PatientChronicMedication';
import PatientMajorProblem from '../../encounter-component/patient-summary/PatientMajorProblem';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import BackButton from '@/components/BackButton/BackButton';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import MyModal from '@/components/MyModal/MyModal';
import Prescriptions from '../../encounter-component/medications-record/Prescriptions';
import DrugOrder from '../../encounter-component/drug-order';
import DiagnosticsOrder from '../../encounter-component/diagnostics-order';
import Consultation from '../../encounter-component/consultation';
import OperationRequest from '../../encounter-component/operation-request/OperationRequest';
import Procedures from '../../encounter-component/patient-summary/Procedures/Procedures';

import './styles.less';

const StartTeleconsultation = () => {
  const navigate = useNavigate();
  const [edit] = useState(false);
  const [record, setRecord] = useState(null);

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
      case 'Prescription':
        setSelectedModalContent(<Prescriptions />);
        break;
      case 'Medication Order':
        setSelectedModalContent(<DrugOrder />);
        break;
      case 'Diagnostics Order':
        setSelectedModalContent(<DiagnosticsOrder />);
        break;
      case 'Consultation':
        setSelectedModalContent(<Consultation
      patient={dummyPatient}
      encounter={dummyEncounter}
    />);
        break;
      case 'Operation Requests':
        setSelectedModalContent(<OperationRequest
      patient={dummyPatient}
      encounter={dummyEncounter}
    />);
        break;
              case 'Procedures':
        setSelectedModalContent(<Procedures 
          patient={dummyPatient}
          encounter={dummyEncounter}/>);
        break;
      default:
        setSelectedModalContent(<div>{label} form goes here</div>);
    }
    setIsModalOpen(true);
  };

  return (
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

          <div className="page-content-main-container">
            <div className="patient-summary-section">
              <PatientMajorProblem patient={dummyPatient} />
              <PatientChronicMedication patient={dummyPatient} />
              <RecentTestResults patient={dummyPatient} />
              <Procedures patient={dummyPatient} />
            </div>

            <div className="camera-tele-consultaition" />

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
        <PatientSide patient={dummyPatient} encounter={dummyEncounter} />
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
    </div>
  );
};

export default StartTeleconsultation;
