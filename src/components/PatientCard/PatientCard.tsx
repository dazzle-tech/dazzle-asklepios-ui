import React from 'react';
import { Avatar, Button, Panel, Text } from 'rsuite';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import './styles.less';

interface PatientCard {
  patient: any;
  onClick?: () => void;
  actions?: React.ReactNode;
  arrowDirection?: 'left' | 'right';
}

const PatientCard = ({ patient, onClick, actions, arrowDirection = 'left' }: PatientCard) => (
  <Panel className="patient-card-container">
    <div className="patient-info">
      <Avatar
        circle
        src={
          patient?.attachmentProfilePicture?.fileContent
            ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
            : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
        }
        size="md"
      />
      <Text className="patient-name">{patient.fullName}</Text>
      <Text className="created-at">
        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-GB') : ''}
      </Text>
      <Text className="patient-mrn"># {patient.patientMrn}</Text>
    </div>
    <div className="actions">
      {actions}
      <Button onClick={onClick} className="arrow-button">
        {arrowDirection === 'left' ? <FaArrowLeft /> : <FaArrowRight />}
      </Button>
    </div>
  </Panel>
);

export default PatientCard;
