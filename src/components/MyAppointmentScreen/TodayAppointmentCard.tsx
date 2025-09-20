import React from 'react';
import './MyAppointmentScreen.less';

const sampleMiniAppointments = [
  {
    time: '09:00 AM',
    duration: '30 min',
    patientName: 'Sarah Johnson',
    visitType: 'Consultation'
  },
  {
    time: '10:30 AM',
    duration: '45 min',
    patientName: 'Michael Smith',
    visitType: 'Follow-up'
  }
];

const TodayAppointmentCard = () => {
  return (
    <div className="mini-appointments-list">
      {sampleMiniAppointments.map((appt, index) => (
        <div className="mini-appointment-card" key={index}>
          <div className="mini-appointment-time">
            <strong>{appt.time}</strong>
            <span>{appt.duration}</span>
          </div>
          <div className="mini-appointment-info">
            <h4>{appt.patientName}</h4>
            <p>{appt.visitType}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodayAppointmentCard;
