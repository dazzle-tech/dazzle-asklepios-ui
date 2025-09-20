import React from 'react';
import './MyAppointmentScreen.less';

const sampleUpcomingAppointments = [
  {
    date: 'Tomorrow',
    time: '09:00 AM',
    patientName: 'Lisa Anderson',
    visitType: 'Surgery Consultation'
  },
  {
    date: 'Dec 20',
    time: '11:00 AM',
    patientName: 'David Kim',
    visitType: 'Follow-up'
  },
  {
    date: 'Dec 21',
    time: '02:30 PM',
    patientName: 'Maria Garcia',
    visitType: 'Check-up'
  }
];

const UpcomingAppointmentCard = () => {
  return (
    <div className="upcoming-appointments-list">
      {sampleUpcomingAppointments.map((appt, index) => (
        <div className="upcoming-appointment-card" key={index}>
          <div className="upcoming-appointment-left">
            <strong className="date">{appt.date}</strong>
            <h4 className="name">{appt.patientName}</h4>
            <p className="visit">{appt.visitType}</p>
          </div>
          <div className="upcoming-appointment-right">
            <span className="time">{appt.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingAppointmentCard;
