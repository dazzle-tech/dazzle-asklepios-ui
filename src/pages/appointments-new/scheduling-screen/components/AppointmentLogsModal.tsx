import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { useGetAppointmentLogsQuery } from '@/services/appointment/appointmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetUserQuery } from '@/services/userService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  appointment?: any | null;
};

const resolveAppointmentId = (appointment: any): number | null => {
  const raw =
    appointment?.appointmentData?.id ??
    appointment?.appointmentData?.key ??
    appointment?.id ??
    appointment?.key ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const AppointmentLogsModal: React.FC<Props> = ({ open, setOpen, appointment }) => {
  const appointmentId = useMemo(() => resolveAppointmentId(appointment), [appointment]);

  const {
    data: logs = [],
    isLoading,
    refetch
  } = useGetAppointmentLogsQuery(
    { appointmentId: appointmentId as number },
    { skip: !appointmentId }
  );

   const { data: users = [] } = useGetUserQuery();

  useEffect(() => {
    if (open && appointmentId) {
      refetch();
    }
  }, [open, appointmentId, refetch]);

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

   const usersMap = useMemo(() => {
    const map: Record<string, string> = {};
  
    users.forEach((u: any) => {
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      map[u.login] = fullName || u.login;
    });
  
    return map;
  }, [users]);
  
  const getUserName = (login?: string | null) => {
    if (!login) return '-';
  
    return usersMap[login] || login;
  };

  const columns = useMemo(
    () => [
      
      { key: 'appointmentId', title: 'APPOINTMENT ID', render: (row: any) => formatValue(row?.appointmentId) },
      { key: 'operationType', title: 'ACTION', render: (row: any) => formatEnumString(row?.operationType) },
      { key: 'logDate', title: 'LOG DATE', render: (row: any) => formatDateWithoutSeconds(row?.logDate) },
      { key: 'logBy', title: 'LOG BY', render: (row: any) => getUserName(row?.logBy) },
      { key: 'facilityName', title: 'NAME', render: (row: any) => formatValue(row?.facilityName) },
      { key: 'departmentName', title: 'DEPARTMENT NAME', render: (row: any) => formatValue(row?.departmentName) },
      {
        key: 'availabilityGenerationBatchId',
        title: 'BATCH ID',
        render: (row: any) => formatValue(row?.availabilityGenerationBatchId)
      },
      { key: 'resourceType', title: 'RESOURCE TYPE',render: (row: any) => formatEnumString(row?.resourceType) },
      { key: 'resourceName', title: 'RESOURCE NAME',render: (row: any) => formatValue(row?.resourceName) },
      { key: 'capacityIndex', title: 'CAPACITY', render: (row: any) => formatValue(row?.capacityIndex) },
      { key: 'startDatetime', title: 'START', render: (row: any) => formatDateWithoutSeconds(row?.startDatetime) },
      { key: 'endDatetime', title: 'END', render: (row: any) => formatDateWithoutSeconds(row?.endDatetime) },
      { key: 'patientId', title: 'PATIENT ID',render: (row: any) => formatValue(row?.patientId) },
      { key: 'patientName', title: 'PATIENT NAME',render: (row: any) => formatValue(row?.patientName) },
      { key: 'defaultServiceName', title: 'DEFAULT SERVICE Name', render: (row: any) => formatValue(row?.defaultServiceName) },
      { key: 'defaultPractitionerName', title: 'DEFAULT PRACTITIONER NAME', render: (row: any) => formatValue(row?.defaultPractitionerName) },
      { key: 'reason', title: 'REASON', render: (row: any) => formatValue(row?.reason) },
      { key: 'bookingMode', title: 'BOOKING MODE', render: (row: any) => formatEnumString(row?.bookingMode) },
      { key: 'status', title: 'STATUS',render: (row: any) => formatEnumString(row?.status) },
      { key: 'service', title: 'SERVICE',render: (row: any) => formatEnumString(row?.service) },
      // { key: 'serviceGroupId', title: 'SERVICE GROUP ID', render: (row: any) => formatValue(row?.serviceGroupId) },
      { key: 'deferred', title: 'DEFERRED', render: (row: any) => formatValue(row?.deferred) },
      { key: 'deferredAt', title: 'DEFERRED AT', render: (row: any) => formatDateWithoutSeconds(row?.deferredAt) },
      { key: 'noShowReason', title: 'NO-SHOW REASON', render: (row: any) => formatValue(row?.noShowReason) },
      { key: 'cancelReason', title: 'CANCEL REASON', render: (row: any) => formatValue(row?.cancelReason) },
      { key: 'cancelledBy', title: 'CANCELLED BY', render: (row: any) => getUserName(row?.createdBy)},
      { key: 'priority', title: 'PRIORITY',render: (row: any) => formatEnumString(row?.priority) },
      { key: 'originType', title: 'ORIGIN TYPE', render: (row: any) => formatValue(row?.originType) },
      { key: 'originName', title: 'ORIGIN NAME', render: (row: any) => formatValue(row?.originName) },
      { key: 'note', title: 'NOTE', render: (row: any) => formatValue(row?.note) },
      { key: 'followUpEncounterId', title: 'FOLLOW UP ENCOUNTER ID', render: (row: any) => formatValue(row?.followUpEncounterId) },
      { key: 'createdBy', title: 'CREATED BY', render: (row: any) => getUserName(row?.createdBy) },
      { key: 'createdDate', title: 'CREATED DATE', render: (row: any) => formatDateWithoutSeconds(row?.createdDate) },
      { key: 'lastModifiedBy', title: 'LAST MODIFIED BY', render: (row: any) => getUserName(row?.createdBy) },
      { key: 'lastModifiedDate', title: 'LAST MODIFIED DATE', render: (row: any) => formatDateWithoutSeconds(row?.lastModifiedDate) }
    ],
    [usersMap]
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Appointment Logs"
      size="70vw"
      bodyheight="60vh"
      position="center"
      content={<div dir={dir}><MyTable data={logs ?? []} columns={columns} height={420} loading={isLoading} /></div>}
      hideActionBtn
    />
  );
};

export default AppointmentLogsModal;
