import Translate from '@/components/Translate';
import React from 'react';
import 'react-tabs/style/react-tabs.css';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { AppointmentFromTemplate } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

const PatientAppointments = ({ patient }) => {
  const data = [];
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const { data: appointmentsData } = useSearchAppointmentsQuery({
    filter: {
      facility: selectedFacility?.id,
      patientId: patient?.id
    },
    page: 0,
    size: 50,
    sort: 'id,desc'
  });
  console.log("appointmentsData: ", appointmentsData);
  const formatDateTime = (date?: string) => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
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
      title: 'Appointment Date',
      render: (row: AppointmentFromTemplate) => (
        <span>
          {row.startDatetime ? row.startDatetime.split('T')[0] : ''}
        </span>
      )
    },
    {
      key: 'resourceType',
      title: 'Resource Type',
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.resourceType)}</span>
      ),
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

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyTable
        data={patient?.id ? appointmentsData?.data : []}
        columns={tableColumns}
        height={400}
      />
    </div>
  );
};

export default PatientAppointments;
