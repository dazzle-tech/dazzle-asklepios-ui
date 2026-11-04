import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetAvailabilityTemplateLogsQuery } from '@/services/appointment/availabilityTemplateService';
import { useGetUserQuery } from '@/services/userService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  template?: any | null;
};

const resolveTemplateId = (template: any): number | null => {
  const raw = template?.id ?? template?.key ?? null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const AvailabilityTemplateLogModal: React.FC<Props> = ({ open, setOpen, template }) => {
  const templateId = useMemo(() => resolveTemplateId(template), [template]);
  const { data: users = [] } = useGetUserQuery();

  
  const {
    data: logs = [],
    isLoading,
    refetch
  } = useGetAvailabilityTemplateLogsQuery(
    { templateId: templateId as number },
    { skip: !templateId }
  );

  useEffect(() => {
    if (open && templateId) {
      refetch();
    }
  }, [open, templateId, refetch]);

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
      { key: 'id', title: 'ID', render: (row: any) => formatValue(row?.id) },
      { key: 'templateId', title: 'TEMPLATE ID', render: (row: any) => formatValue(row?.templateId) },
      { key: 'operationType', title: 'ACTION', render: (row: any) => formatEnumString(row?.operationType) },
      { key: 'logDate', title: 'LOG DATE', render: (row: any) => formatDateWithoutSeconds(row?.logDate) },
      { key: 'logBy', title: 'LOG BY', render: (row: any) => getUserName(row?.logBy) },
      { key: 'facilityId', title: 'FACILITY ID', render: (row: any) => formatValue(row?.facilityId) },
      { key: 'departmentId', title: 'DEPARTMENT ID', render: (row: any) => formatValue(row?.departmentId) },
      { key: 'templateName', title: 'TEMPLATE NAME',  render: (row: any) => formatValue(row?.templateName) },
      { key: 'templateType', title: 'TEMPLATE TYPE',  render: (row: any) => formatEnumString(row?.templateType) },
      { key: 'resourceId', title: 'RESOURCE ID', render: (row: any) => formatValue(row?.resourceId) },
      { key: 'templateColor', title: 'TEMPLATE COLOR', render: (row: any) => formatValue(row?.templateColor) },
      { key: 'status', title: 'STATUS', render: (row: any) => formatEnumString(row?.status) },
      { key: 'versionNo', title: 'VERSION NO', render: (row: any) => formatValue(row?.versionNo) },
      { key: 'copyFromTemplateId', title: 'COPY FROM TEMPLATE ID', render: (row: any) => formatValue(row?.copyFromTemplateId) },
      { key: 'parentTemplateId', title: 'PARENT TEMPLATE ID', render: (row: any) => formatValue(row?.parentTemplateId) },
      { key: 'durationMinutes', title: 'DURATION (MIN)', render: (row: any) => formatValue(row?.durationMinutes) },
      { key: 'defaultBufferBeforeMinutes', title: 'BUFFER BEFORE (MIN)', render: (row: any) => formatValue(row?.defaultBufferBeforeMinutes) },
      { key: 'defaultBufferAfterMinutes', title: 'BUFFER AFTER (MIN)', render: (row: any) => formatValue(row?.defaultBufferAfterMinutes) },
      { key: 'parallelCapacityValue', title: 'PARALLEL CAPACITY', render: (row: any) => formatValue(row?.parallelCapacityValue) },
      { key: 'defaultServiceId', title: 'DEFAULT SERVICE ID', render: (row: any) => formatValue(row?.defaultServiceId) },
      { key: 'numberOfResourcesExpected', title: 'NO. RESOURCES EXPECTED', render: (row: any) => formatValue(row?.numberOfResourcesExpected) },
      { key: 'requirePractitioner', title: 'REQUIRE PRACTITIONER', render: (row: any) => formatValue(row?.requirePractitioner) },
      { key: 'defaultPractitionerId', title: 'DEFAULT PRACTITIONER ID', render: (row: any) => formatValue(row?.defaultPractitionerId) },
      { key: 'requireBilling', title: 'REQUIRE BILLING', render: (row: any) => formatValue(row?.requireBilling) },
      { key: 'requirePreAssessment', title: 'REQUIRE PRE-ASSESSMENT',  render: (row: any) => formatValue(row?.requirePreAssessment) },
      { key: 'allowPatientPortalBooking', title: 'ALLOW PORTAL BOOKING', render: (row: any) => formatValue(row?.allowPatientPortalBooking) },
      { key: 'allowWalkInBooking', title: 'ALLOW WALK-IN BOOKING', render: (row: any) => formatValue(row?.allowWalkInBooking) },
      { key: 'requireConfirmation', title: 'REQUIRE CONFIRMATION', render: (row: any) => formatValue(row?.requireConfirmation) },
      { key: 'financialDetails', title: 'FINANCIAL DETAILS', render: (row: any) => formatEnumString(row?.financialDetails) },
      {
        key: 'workingDays',
        title: 'WORKING DAYS',
        render: (row: any) => {
          const value = row?.workingDays;

          if (!value || !Array.isArray(value)) return '-';

          const workingDays = value
            .filter((d: any) => d?.isWorking)
            .map((d: any) => formatEnumString(d?.dayOfWeek));

          return workingDays.length ? workingDays.join(', ') : '-';
        }
      },
      { key: 'isActive', title: 'IS ACTIVE', render: (row: any) => formatValue(row?.isActive) },
      { key: 'createdBy', title: 'CREATED BY', render: (row: any) => getUserName(row?.createdBy) },
      { key: 'createdDate', title: 'CREATED DATE', render: (row: any) => formatDateWithoutSeconds(row?.createdDate) },
      { key: 'lastModifiedBy', title: 'LAST MODIFIED BY', render: (row: any) => getUserName(row?.lastModifiedBy) },
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
      title="Availability Template Logs"
      size="70vw"
      bodyheight="60vh"
      position="center"
      content={<div dir={dir}><MyTable data={logs ?? []} columns={columns} height={420} loading={isLoading} /></div>}
      hideActionBtn
    />
  );
};

export default AvailabilityTemplateLogModal;
