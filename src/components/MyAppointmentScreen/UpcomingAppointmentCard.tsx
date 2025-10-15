import React from 'react';
import DynamicCard from '../DynamicCard';

const sampleUpcomingAppointments = [
  {
    date: 'Tomorrow',
    time: '09:00 AM',
    patientName: 'Lisa Anderson',
    visitType: 'Surgery Consultation'
  },
  { date: 'Dec 20', time: '11:00 AM', patientName: 'David Kim', visitType: 'Follow-up' },
  { date: 'Dec 21', time: '02:30 PM', patientName: 'Maria Garcia', visitType: 'Check-up' }
];

const UpcomingAppointmentCard = () => {
  return (
    <div className="upcoming-appointments-list">
      {sampleUpcomingAppointments.map((appt, index) => (
        <DynamicCard
          key={index}
          data={[
            { label: 'Date', value: appt.date, type: 'strong', section: 'left', showLabel: false },
            { label: 'Patient', value: appt.patientName, section: 'left', showLabel: false },
            { label: 'Visit Type', value: appt.visitType, section: 'left', showLabel: false },
            {
              label: 'Time',
              value: appt.time,
              type: 'strong',
              section: 'right',
              vertical: 'center',
              showLabel: false
            }
          ]}
          width="100%"
        />
      ))}
    </div>
  );
};

export default UpcomingAppointmentCard;
