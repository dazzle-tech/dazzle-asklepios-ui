import React, { useEffect, useState } from 'react';
import { Avatar, Button, Panel, Text } from 'rsuite';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { useGetPatientProfilePictureQuery } from '@/services/patients/attachmentService';
import './styles.less';

interface PatientCardWithPictureProps {
  patient: any;
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
  
  // Fetch profile picture for this patient
  const patientId = patient?.key ? Number(patient.key) : undefined;
  const { data: profilePictureTicket } = useGetPatientProfilePictureQuery(
    { patientId: patientId! },
    { skip: !patientId }
  );

  // Update the profile picture URL when data is available
  useEffect(() => {
    if (profilePictureTicket?.url) {
      setProfilePictureUrl(profilePictureTicket.url);
    } else {
      setProfilePictureUrl('');
    }
  }, [profilePictureTicket]);

  // Handle click with profile picture URL
  const handleClick = () => {
    if (onClick) {
      // Create a new object with the patient data and profile picture URL
      const patientWithUrl = { ...patient, profilePictureUrl };
      onClick(patientWithUrl);
    }
  };

  return (
    <Panel className={`patient-card-container ${mode === 'light' ? 'light' : 'dark'}`}>
      <div className="patient-info">
        <Avatar
          circle
          src={
            profilePictureUrl
              ? profilePictureUrl
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
        {/* {actions} */}
        <Button onClick={handleClick} className="arrow-button">
          {arrowDirection === 'left' ? <FaArrowLeft /> : <FaArrowRight />}
        </Button>
      </div>
    </Panel>
  );
};

export default PatientCardWithPicture;

