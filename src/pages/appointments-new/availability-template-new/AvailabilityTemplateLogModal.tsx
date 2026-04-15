import React, { useEffect, useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetAvailabilityTemplateLogsQuery } from '@/services/appointment/availabilityTemplateService';

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

  const columns = useMemo(
    () => [
      { key: 'id', title: 'ID', width: 90, render: (row: any) => formatValue(row?.id) },
      { key: 'templateId', title: 'TEMPLATE ID', width: 130, render: (row: any) => formatValue(row?.templateId) },
      { key: 'operationType', title: 'ACTION', width: 110, render: (row: any) => formatEnumString(row?.operationType) },
      { key: 'logDate', title: 'LOG DATE', width: 180, render: (row: any) => formatDateWithoutSeconds(row?.logDate) },
      { key: 'logBy', title: 'LOG BY', width: 140, render: (row: any) => formatValue(row?.logBy) },
      { key: 'facilityId', title: 'FACILITY ID', width: 130, render: (row: any) => formatValue(row?.facilityId) },
      { key: 'departmentId', title: 'DEPARTMENT ID', width: 140, render: (row: any) => formatValue(row?.departmentId) },
      { key: 'templateName', title: 'TEMPLATE NAME', width: 200, render: (row: any) => formatValue(row?.templateName) },
      { key: 'templateType', title: 'TEMPLATE TYPE', width: 140, render: (row: any) => formatEnumString(row?.templateType) },
      { key: 'resourceId', title: 'RESOURCE ID', width: 120, render: (row: any) => formatValue(row?.resourceId) },
      { key: 'templateColor', title: 'TEMPLATE COLOR', width: 140, render: (row: any) => formatValue(row?.templateColor) },
      { key: 'status', title: 'STATUS', width: 120, render: (row: any) => formatEnumString(row?.status) },
      { key: 'versionNo', title: 'VERSION NO', width: 120, render: (row: any) => formatValue(row?.versionNo) },
      { key: 'copyFromTemplateId', title: 'COPY FROM TEMPLATE ID', width: 190, render: (row: any) => formatValue(row?.copyFromTemplateId) },
      { key: 'parentTemplateId', title: 'PARENT TEMPLATE ID', width: 190, render: (row: any) => formatValue(row?.parentTemplateId) },
      { key: 'durationMinutes', title: 'DURATION (MIN)', width: 150, render: (row: any) => formatValue(row?.durationMinutes) },
      { key: 'defaultBufferBeforeMinutes', title: 'BUFFER BEFORE (MIN)', width: 190, render: (row: any) => formatValue(row?.defaultBufferBeforeMinutes) },
      { key: 'defaultBufferAfterMinutes', title: 'BUFFER AFTER (MIN)', width: 180, render: (row: any) => formatValue(row?.defaultBufferAfterMinutes) },
      { key: 'parallelCapacityValue', title: 'PARALLEL CAPACITY', width: 170, render: (row: any) => formatValue(row?.parallelCapacityValue) },
      { key: 'defaultServiceId', title: 'DEFAULT SERVICE ID', width: 170, render: (row: any) => formatValue(row?.defaultServiceId) },
      { key: 'numberOfResourcesExpected', title: 'NO. RESOURCES EXPECTED', width: 210, render: (row: any) => formatValue(row?.numberOfResourcesExpected) },
      { key: 'requirePractitioner', title: 'REQUIRE PRACTITIONER', width: 190, render: (row: any) => formatValue(row?.requirePractitioner) },
      { key: 'defaultPractitionerId', title: 'DEFAULT PRACTITIONER ID', width: 200, render: (row: any) => formatValue(row?.defaultPractitionerId) },
      { key: 'requireBilling', title: 'REQUIRE BILLING', width: 160, render: (row: any) => formatValue(row?.requireBilling) },
      { key: 'requirePreAssessment', title: 'REQUIRE PRE-ASSESSMENT', width: 190, render: (row: any) => formatValue(row?.requirePreAssessment) },
      { key: 'allowPatientPortalBooking', title: 'ALLOW PORTAL BOOKING', width: 190, render: (row: any) => formatValue(row?.allowPatientPortalBooking) },
      { key: 'requireConfirmation', title: 'REQUIRE CONFIRMATION', width: 190, render: (row: any) => formatValue(row?.requireConfirmation) },
      { key: 'financialDetails', title: 'FINANCIAL DETAILS', width: 170, render: (row: any) => formatEnumString(row?.financialDetails) },
      {
        key: 'workingDays',
        title: 'WORKING DAYS',
        width: 260,
        render: (row: any) => {
          const value = row?.workingDays;
          if (!value || (Array.isArray(value) && value.length === 0)) return '-';
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }
      },
      { key: 'isActive', title: 'IS ACTIVE', width: 120, render: (row: any) => formatValue(row?.isActive) },
      { key: 'createdBy', title: 'CREATED BY', width: 140, render: (row: any) => formatValue(row?.createdBy) },
      { key: 'createdDate', title: 'CREATED DATE', width: 170, render: (row: any) => formatDateWithoutSeconds(row?.createdDate) },
      { key: 'lastModifiedBy', title: 'LAST MODIFIED BY', width: 170, render: (row: any) => formatValue(row?.lastModifiedBy) },
      { key: 'lastModifiedDate', title: 'LAST MODIFIED DATE', width: 190, render: (row: any) => formatDateWithoutSeconds(row?.lastModifiedDate) }
    ],
    []
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
