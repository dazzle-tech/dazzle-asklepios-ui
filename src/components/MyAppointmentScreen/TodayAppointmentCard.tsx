import React from 'react';
import './MyAppointmentScreen.less';
import MyCard from '@/components/MyCard/MyCard';

const sampleMiniAppointments = [
  { time: '09:00 AM', duration: '30 min', patientName: 'Sarah Johnson', visitType: 'Consultation' },
  { time: '10:30 AM', duration: '45 min', patientName: 'Michael Smith', visitType: 'Follow-up' }
];

const TodayAppointmentCard = () => {
  return (
    <div className="mini-appointments-list">
      {sampleMiniAppointments.map((appt, index) => (
        <MyCard
          key={index}
          cardType="todayAppointment"
          time={appt.time}
          duration={appt.duration}
          patientName={appt.patientName}
          visitType={appt.visitType}
          width="100%"
          margin="0 0 15px 0"
        />
      ))}
    </div>
  );
};

export default TodayAppointmentCard;
