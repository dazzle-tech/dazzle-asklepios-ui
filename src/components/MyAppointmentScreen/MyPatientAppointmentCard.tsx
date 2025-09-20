import React from 'react';
import './MyAppointmentScreen.less';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const samplePatients = [
  {
    name: 'John Smith',
    status: 'stable',
    plan: 'Diabetes Management',
    lastVisit: '2 days ago'
  },
  {
    name: 'Alice Brown',
    status: 'improving',
    plan: 'Hypertension',
    lastVisit: '1 week ago'
  },
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
  monitoring: '#ad1e1eff'
};

const MyPatientAppointmentCard = () => {
  return (
    <div className="patients-list">
      {samplePatients.map((patient, index) => (
        <div className="patient-card" key={index}>
          <div className="patient-info">
            <h4 className="patient-name">{patient.name}</h4>
            <p className="patient-plan">{patient.plan}</p>
            <div className="patient-last-visit">
              Last visit: <strong>{patient.lastVisit}</strong>
            </div>
          </div>
          <div className='status-card-position-handle'>
          <MyBadgeStatus
            contant={patient.status}
            color={statusColors[patient.status.toLowerCase()] || '#555'}
          />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyPatientAppointmentCard;
