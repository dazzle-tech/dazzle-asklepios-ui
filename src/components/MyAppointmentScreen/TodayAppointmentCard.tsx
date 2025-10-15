import React from 'react';
import DynamicCard from '../DynamicCard';

const sampleMiniAppointments = [
  {
    time: '09:00 AM',
    duration: '30 min',
    patientName: 'Sarah Johnson',
    visitType: 'Consultation',
    status: 'confirmed'
  },
  {
    time: '10:30 AM',
    duration: '15 min',
    patientName: 'Michael Chen',
    visitType: 'Follow-up',
    status: 'in-progress'
  },
  {
    time: '02:00 PM',
    duration: '45 min',
    patientName: 'Emma Rodriguez',
    visitType: 'Check-up',
    status: 'confirmed'
  },
  {
    time: '03:30 PM',
    duration: '30 min',
    patientName: 'James Wilson',
    visitType: 'Consultation',
    status: 'pending'
  }
];

const TodayAppointmentCard = () => {
  return (
    <div className="mini-appointments-list">
      {sampleMiniAppointments.map((appt, index) => (
        <DynamicCard
          key={index}
          data={[
            { label: 'Time', value: appt.time, type: 'strong', section: 'left' },
            {
              label: 'Patient',
              value: appt.patientName,
              type: 'strong',
              showLabel: false,
              section: 'center'
            },
            { label: 'Duration', value: appt.duration, showLabel: false, section: 'left' },
            { label: 'Visit Type', value: appt.visitType, showLabel: false, section: 'center' },
            {
              label: 'Status',
              value: appt.status,
              type: 'badge',
              section: 'right',
              vertical: 'center',
              showLabel: false,
              color:
                appt.status === 'confirmed'
                  ? '#28a745'
                  : appt.status === 'in-progress'
                  ? '#ffc107'
                  : '#dc3545'
            }
          ]}
          width="100%"
        />
      ))}
    </div>
  );
};

export default TodayAppointmentCard;
