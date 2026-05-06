import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import MyTable from '@/components/MyTable';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchAppointmentsQuery } from '@/services/appointment/appointmentService';
import { AppointmentFromTemplate } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { useLazyGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useLazyGetServiceByIdQuery } from '@/services/setup/serviceService';
import { useLazyGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetCatalogByIdQuery } from '@/services/setup/catalog/catalogService';
import { useLazyGetRoomByIdQuery } from '@/services/setup/room/roomService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';

const PatientAppointments = ({ patient }) => {
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const [resourceNames, setResourceNames] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { data: appointmentsData, isFetching } = useSearchAppointmentsQuery({
    filter: {
      facility: selectedFacility?.id,
      patientId: patient?.id
    },
    page,
    size: rowsPerPage,
    sort: 'id,desc'
  }, {
    skip: !patient?.id
  });
  const [getPractitioner] = useLazyGetPractitionerByIdQuery();
  const [getService] = useLazyGetServiceByIdQuery();
  const [getDiagnosticTest] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalog] = useLazyGetCatalogByIdQuery();
  const [getRoom] = useLazyGetRoomByIdQuery();
  const [getDepartment] = useLazyGetDepartmentByIdQuery();

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
      key: 'startTime',
      title: <Translate>Start Time</Translate>,
      render: (row: AppointmentFromTemplate) => {
        if (!row.startDatetime) return '';

        const d = new Date(row.startDatetime);

        return (
          <span>
            {d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        );
      }
    },
    {
      key: 'endTime',
      title: <Translate>End Time</Translate>,
      render: (row: AppointmentFromTemplate) => {
        if (!row.endDatetime) return '';

        const d = new Date(row.endDatetime);

        return (
          <span>
            {d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        );
      }
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
      flexGrow: 4,
      render: (row: AppointmentFromTemplate) => (
        <span>{row?.resourceId ? (resourceNames[row.resourceId] ?? '...') : ''}</span>
      )
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.reason)}</span>
      ),
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.priority)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.status)}</span>
      ),
    },
    // {
    //   key: 'icons',
    //   title: <Translate></Translate>,
    //   flexGrow: 3,
    //   render: () => iconsForActions()
    // }
  ];

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  const totalCount = appointmentsData?.totalCount ?? 0;

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [patient?.id, selectedFacility?.id]);

  // Effects
  useEffect(() => {
    const appointments = appointmentsData?.data ?? [];
    appointments.forEach(async (appt: AppointmentFromTemplate) => {
      if (!appt?.resourceId || resourceNames[appt.resourceId] !== undefined) return;

      try {
        let name = '';
        switch (appt.resourceType) {
          case 'PRACTITIONER': {
            const res = await getPractitioner(appt.resourceId).unwrap();
            name = `${res?.firstName ?? ''} ${res?.lastName ?? ''}`.trim();
            break;
          }
          case 'SERVICE': {
            const res = await getService(appt.resourceId).unwrap();
            name = res?.name ?? '';
            break;
          }
          case 'DIAGNOSTIC_TEST': {
            const res = await getDiagnosticTest(String(appt.resourceId)).unwrap();
            name = res?.data?.name ?? res?.name ?? '';
            break;
          }
          case 'CATALOG': {
            const res = await getCatalog(appt.resourceId).unwrap();
            name = res?.name ?? '';
            break;
          }
          case 'ROOM': {
            const res = await getRoom({ id: appt.resourceId }).unwrap();
            name = res?.name ?? '';
            break;
          }
          case 'DEPARTMENT': {
            const res = await getDepartment(appt.resourceId).unwrap();
            name = res?.name ?? '';
            break;
          }
        }
        setResourceNames(prev => ({ ...prev, [appt.resourceId]: name }));
      } catch {
        setResourceNames(prev => ({ ...prev, [appt.resourceId]: '' }));
      }
    });
  }, [appointmentsData]);
  return (
    <div dir={dir}>
      <MyTable
        data={patient?.id ? appointmentsData?.data : []}
        columns={tableColumns}
        height={400}
        loading={isFetching}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
};

export default PatientAppointments;
