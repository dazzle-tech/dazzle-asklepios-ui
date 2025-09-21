import React from 'react';
import './MyAppointmentScreen.less';
import DynamicCard from '../DynamicCard';

const samplePatients = [
  { name: 'John Smith', status: 'stable', plan: 'Diabetes Management', lastVisit: '2 days ago' },
  { name: 'Alice Brown', status: 'improving', plan: 'Hypertension', lastVisit: '1 week ago' },
  {
    name: 'Robert Taylor',
    status: 'monitoring',
    plan: 'Post Surgery Care',
    lastVisit: '3 days ago'
  }
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
        <DynamicCard
          key={index}
          avatar={null}
          showMore={false}
          data={[
            {
              label: 'Name',
              value: patient.name,
              type: 'strong',
              section: 'left',
              showLabel: false,
              vertical: 'center'
            },
            {
              label: 'Plan',
              value: patient.plan,
              section: 'left',
              showLabel: false,
              vertical: 'center',
              type: 'strong'
            },
            {
              label: 'Last Visit',
              value: patient.lastVisit,
              section: 'left',
              showLabel: false,
              vertical: 'center'
            },
            {
              value: patient.status,
              type: 'badge',
              section: 'right',
              showLabel: false,
              color: statusColors[patient.status.toLowerCase()] || '#555'
            }
          ]}
          width="100%"
          margin="0 0 15px 0"
        />
      ))}
    </div>
  );
};

export default MyPatientAppointmentCard;
