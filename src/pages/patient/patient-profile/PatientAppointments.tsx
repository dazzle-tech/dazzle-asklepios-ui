import Translate from '@/components/Translate';
import React from 'react';
import 'react-tabs/style/react-tabs.css';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faSquareXmark } from '@fortawesome/free-solid-svg-icons';

const PatientAppointments = () => {
  const data = [
    {
      appointmentDate: '2025-08-28',
      resourceType: 'Doctor',
      resource: 'Dr. Ahmad Khalil',
      visitType: 'Consultation',
      priority: 'High'
    },
    {
      appointmentDate: '2025-08-30',
      resourceType: 'Nurse',
      resource: 'Nurse Sara Ali',
      visitType: 'Follow-up',
      priority: 'Medium'
    },
    {
      appointmentDate: '2025-09-01',
      resourceType: 'Lab',
      resource: 'Blood Test - Lab A',
      visitType: 'Diagnostic',
      priority: 'Low'
    },
    {
      appointmentDate: '2025-09-05',
      resourceType: 'Physiotherapist',
      resource: 'Omar Hamed',
      visitType: 'Therapy Session',
      priority: 'Medium'
    },
    {
      appointmentDate: '2025-09-10',
      resourceType: 'Doctor',
      resource: 'Dr. Lina Nasser',
      visitType: 'Surgery',
      priority: 'High'
    }
  ];

  // Icons column (Change, View, Cancel)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <FontAwesomeIcon icon={faArrowUpRightFromSquare} title="Change" className="icons-style" />
      <FontAwesomeIcon icon={faEye} title="View" className="icons-style" />
      <FontAwesomeIcon icon={faSquareXmark} title="Cancel" className="icons-style" />
    </div>
  );

  // Table columns definition
  const tableColumns = [
    {
      key: 'appointmentDate',
      title: <Translate>Appointment Date</Translate>
    },
    {
      key: 'resourceType',
      title: <Translate>Resource Type</Translate>
    },
    {
      key: 'resource',
      title: <Translate>Resource</Translate>,
      flexGrow: 4
    },
    {
      key: 'visitType',
      title: <Translate>Visit Type</Translate>
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  return (
    <MyTable
      data={data}
      columns={tableColumns}
      height={400}
    />
  );
};

export default PatientAppointments;
