import React, { useState } from 'react';
import { formatDateWithoutSeconds } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import '../MyAppointmentScreen.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '@mui/material';

const sampleAppointmentsData = [
  {
    appointmentId: 'APT-1001112',
    date: '2025-09-15T10:30:00Z',
    time: '10:30 AM',
    patientName: 'Alice Cooper',
    patientImage: '',
    status: 'Active',
    phone: '+962799000001',
    age: 32,
    visitType: 'In-Person'
  },
  {
    appointmentId: 'APT-1002',
    date: '2025-09-12T09:00:00Z',
    time: '09:00 AM',
    patientName: 'Bob Marley',
    patientImage: 'https://randomuser.me/api/portraits/men/3.jpg',
    status: 'Completed',
    phone: '+962799000002',
    age: 45,
    visitType: 'Virtual'
  },
  {
    appointmentId: 'APT-1003',
    date: '2025-09-18T13:00:00Z',
    time: '01:00 PM',
    patientName: 'Charlie Brown',
    patientImage: '',
    status: 'Scheduled',
    phone: '+962799000003',
    age: 28,
    visitType: 'Home Visit'
  },
  {
    appointmentId: 'APT-1004',
    date: '2025-09-18T13:00:00Z',
    time: '01:00 PM',
    patientName: 'Charlie Brown',
    patientImage: '',
    status: 'Scheduled',
    phone: '+962799000003',
    age: 28,
    visitType: 'Home Visit'
  }
];

const getAvatarFromName = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=ffffff&length=2&size=128`;
};

const ImageWithFallback = ({ name, imageSrc }: { name: string; imageSrc?: string }) => {
  const [src, setSrc] = useState(imageSrc || getAvatarFromName(name));

  const handleError = () => {
    if (src !== getAvatarFromName(name)) {
      setSrc(getAvatarFromName(name));
    }
  };

  return <img src={src} alt={name} onError={handleError} className="appointment-avatar" />;
};

const getStatusColor = (status: string) => {
  if (status === 'Scheduled') return '#ff8902ff';
  if (status === 'Completed') return '#FBC02D';
  if (status === 'Active') return '#388E3C';
  return '#808080';
};

const MyAppointmentScreenCard = () => {
  return (
    <div className="appointments-grid">
      {sampleAppointmentsData.map((appt, index) => (
        <div className="appointment-card" key={appt.appointmentId + index}>
          {/* Header */}
          <div className="appointment-header">
            <ImageWithFallback name={appt.patientName} imageSrc={appt.patientImage} />
            <div className="appointment-header-text">
              <h3>{appt.patientName}</h3>
              <p>
                {formatDateWithoutSeconds(appt.date)} at {appt.time}
              </p>
            </div>
            <div className="appointment-info-btn" />
            <IconButton onClick={() => alert(`Details for ${appt.patientName}`)}>
              <FontAwesomeIcon icon={faInfoCircle} />
            </IconButton>
          </div>

          <div className="appointment-body">
            <div className="detail-item">
              <span className="label">Phone:</span>
              <span className="value">{appt.phone}</span>
            </div>
            <div className="detail-item">
              <span className="label">Age:</span>
              <span className="value">{appt.age}</span>
            </div>
            <div className="detail-item">
              <span className="label">Visit Type:</span>
              <span className="value">{appt.visitType}</span>
            </div>

            <div className="detail-item">
              <span className="label">Status:</span>
              <MyBadgeStatus color={getStatusColor(appt.status)} contant={appt.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyAppointmentScreenCard;
