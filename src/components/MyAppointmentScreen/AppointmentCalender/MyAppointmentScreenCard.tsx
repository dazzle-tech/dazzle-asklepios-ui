import React from 'react';
import { formatDateWithoutSeconds } from '@/utils';
import DynamicCard from '@/components/DynamicCard/DynamicCard';
import '../MyAppointmentScreen.less';

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
    patientImage: '',
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
  }
];

const getStatusColor = (status: string) => {
  if (status === 'Scheduled') return '#ff8902ff';
  if (status === 'Completed') return '#FBC02D';
  if (status === 'Active') return '#388E3C';
  return '#808080';
};

const getAvatarFromName = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=ffffff&length=2&size=128`;
};

const getFinalAvatar = (name: string, imageSrc?: string) => {
  return imageSrc && imageSrc.trim() !== '' ? imageSrc : getAvatarFromName(name);
};

const MyAppointmentScreenCard = () => {
  return (
    <div className="appointments-grid">
      {sampleAppointmentsData.map((appt, index) => (
        <DynamicCard
          key={appt.appointmentId + index}
          avatar={getFinalAvatar(appt.patientName, appt.patientImage)}
          showMore
          width={550}
          moreClick={() => alert(`Details for ${appt.patientName}`)}
          data={[
            {
              type: 'strong',
              value: appt.patientName,
              section: 'left',
              showLabel: false
            },
            {
              type: 'text',
              label: 'Date',
              section: 'left',
            },
            {
            type: 'text',
            label: 'Date',
            value: `${formatDateWithoutSeconds(appt.date)} at ${appt.time}`,
            section: 'right',
            showLabel:false,
            textAlign: 'right'            
            },

            { type: 'text', label: 'Phone', section: 'left', },
            { type: 'text', label: 'Phone', value: appt.phone, section: 'right', showLabel:false, textAlign: 'right' },
            {
              type: 'text',
              label: 'Age',
              section: 'left',
            },
            {
              type: 'text',
              label: 'Age',
              value: appt.age.toString(),
              section: 'right',
              showLabel:false,
              textAlign: 'right'
            },
            {
              type: 'text',
              label: 'Visit Type',
              section: 'left',

            },
                        {
              type: 'text',
              label: 'Visit Type',
              value: appt.visitType,
              section: 'right',
              showLabel:false,
              textAlign: 'right'
            },
            {
              type: 'text',
              label: 'Status',
              section: 'left',
              showLabel: true,
            },
            {
              type: 'badge',
              label: 'Status',
              value: appt.status,
              color: getStatusColor(appt.status),
              section: 'right',
              showLabel: false,
              textAlign: 'right'
            }
          ]}
        />
      ))}
    </div>
  );
};

export default MyAppointmentScreenCard;
