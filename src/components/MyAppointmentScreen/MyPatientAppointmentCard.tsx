import React from 'react';
import './MyAppointmentScreen.less';
import MyCard from '@/components/MyCard/MyCard';

const samplePatients = [
  { name: 'John Smith', status: 'stable', plan: 'Diabetes Management', lastVisit: '2 days ago' },
  { name: 'Alice Brown', status: 'improving', plan: 'Hypertension', lastVisit: '1 week ago' },
  { name: 'Robert Taylor', status: 'monitoring', plan: 'Post Surgery Care', lastVisit: '3 days ago' }
];

const statusColors: Record<string, string> = {
  stable: '#2e7d32',
  improving: '#ff9800',
  monitoring: '#ad1e1e'
};

const MyPatientAppointmentCard = () => {
  return (
    <div className="patients-list">
      {samplePatients.map((patient, index) => (
        <MyCard
          key={index}
          cardType="patient"
          name={patient.name}
          plan={patient.plan}
          lastVisit={patient.lastVisit}
          status={patient.status}
          statusColor={statusColors[patient.status.toLowerCase()] || '#555'}
          width="100%"
          margin="0 0 15px 0"
        />
      ))}
    </div>
  );
};

export default MyPatientAppointmentCard;
