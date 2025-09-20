import React from 'react';
import './MyAppointmentScreen.less';
import MyCard from '@/components/MyCard/MyCard';

const sampleUpcomingAppointments = [
  { date: 'Tomorrow', time: '09:00 AM', patientName: 'Lisa Anderson', visitType: 'Surgery Consultation' },
  { date: 'Dec 20', time: '11:00 AM', patientName: 'David Kim', visitType: 'Follow-up' },
  { date: 'Dec 21', time: '02:30 PM', patientName: 'Maria Garcia', visitType: 'Check-up' }
];

const UpcomingAppointmentCard = () => {
  return (
    <div className="upcoming-appointments-list">
      {sampleUpcomingAppointments.map((appt, index) => (
        <MyCard
          key={index}
          cardType="upcomingAppointment"
          date={appt.date}
          time={appt.time}
          patientName={appt.patientName}
          visitType={appt.visitType}
          width="100%"
          margin="0 0 15px 0"
        />
      ))}
    </div>
  );
};

export default UpcomingAppointmentCard;
