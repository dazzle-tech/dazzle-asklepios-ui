import Translate from '@/components/Translate';
import React from 'react';
import 'react-tabs/style/react-tabs.css';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faSquareXmark } from '@fortawesome/free-solid-svg-icons';

const PatientAppointments = ({patient}) => {
  const data = [];

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
      data={patient?.key ? data : []}
      columns={tableColumns}
      height={400}
    />
  );
};

export default PatientAppointments;
