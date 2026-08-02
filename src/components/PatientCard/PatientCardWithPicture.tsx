import React, { useEffect, useState } from 'react';
import { Avatar, Button, Panel, Text } from 'rsuite';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { useGetPatientProfilePictureQuery } from '@/services/patients/attachmentService';
import './styles.less';
import { Patient } from '@/types/model-types-new';

interface PatientCardWithPictureProps {
  patient: Patient;
  onClick?: (patientWithUrl: any) => void;
  actions?: React.ReactNode;
  arrowDirection?: 'left' | 'right';
}

const PatientCardWithPicture: React.FC<PatientCardWithPictureProps> = ({
  patient,
  onClick,
  actions,
  arrowDirection = 'left'
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  const patientId = patient?.id ? Number(patient.id) : undefined;

  const { data: profilePictureTicket } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId }
  );

  useEffect(() => {
    setProfilePictureUrl(profilePictureTicket?.url || '');
  }, [profilePictureTicket]);

  const handleClick = () => {
    if (!onClick) return;

    onClick({
      ...patient,
      profilePictureUrl
    });
  };

  return (
    <Panel className={`patient-card-container ${mode === 'light' ? 'light' : 'dark'}`}>
      <div className="patient-info">
        <Avatar
          circle
          src={
            profilePictureUrl ||
            'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
          }
          size="md"
        />

        <Text className="patient-name">
          {patient.firstName} {patient.secondName} {patient.thirdName} {patient.lastName}
        </Text>

        <Text className="created-at">
          {patient.createdDate
            ? new Date(patient.createdDate).toLocaleDateString('en-GB')
            : ''}
        </Text>

        <Text className="patient-mrn">
          # {patient.medicalRecordNumber}
        </Text>
      </div>

      <div className="actions">
        {actions}

        <Button onClick={handleClick} className="arrow-button">
          {arrowDirection === 'left' ? <FaArrowLeft /> : <FaArrowRight />}
        </Button>
      </div>
    </Panel>
  );
};

export default PatientCardWithPicture;