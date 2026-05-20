import React, { useEffect, useState } from 'react';
import { CiSquareMinus } from 'react-icons/ci';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { Tooltip, Whisper } from 'rsuite';
import { useDeleteAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { useLazyGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useLazyGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetCatalogByIdQuery } from '@/services/setup/catalog/catalogService';
import { useLazyGetServiceByIdQuery } from '@/services/setup/serviceService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { hexToRGBA } from './utils';

type Props = {
  template: any;
  onEdit?: (template: any) => void;
  readOnly?: boolean;
};

const AvailabilityTemplateSummaryCard: React.FC<Props> = ({ template, onEdit, readOnly }) => {
  const dispatch = useAppDispatch();
  const [showDetails, setShowDetails] = useState(true);
  const [resourceName, setResourceName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const [deleteTemplate] = useDeleteAvailabilityTemplateMutation();
  const [getPractitioner] = useLazyGetPractitionerByIdQuery();
  const [getDiagnosticTest] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalog] = useLazyGetCatalogByIdQuery();
  const [getService] = useLazyGetServiceByIdQuery();
  const [getDepartment] = useLazyGetDepartmentByIdQuery();

  const allowedServicesText = (template?.allowedServices ?? [])
    .map((s: any) => s?.service)
    .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
    .map((s: string) => formatEnumString(s))
    .join(', ') || '—';

  useEffect(() => {
    if (!template?.id) return;

    if (template?.templateType === 'DEPARTMENT') {
      getDepartment(template.departmentId).unwrap().then(res => setDepartmentName(res?.name ?? ''));
      return;
    }

    if (!template?.resourceId) { setResourceName(''); return; }

    const fetchers: Record<string, () => void> = {
      PRACTITIONER: () => getPractitioner(template.resourceId).unwrap().then(res => setResourceName(`${res?.firstName} ${res?.lastName}`)),
      DIAGNOSTIC_TEST: () => getDiagnosticTest(String(template.resourceId)).unwrap().then(res => setResourceName(res?.data?.name ?? '')),
      CATALOG: () => getCatalog(template.resourceId).unwrap().then(res => setResourceName(res?.name ?? '')),
      SERVICE: () => getService(template.resourceId).unwrap().then(res => setResourceName(res?.name ?? '')),
    };

    fetchers[template.templateType]?.();
  }, [template]);

  const handleDeleteConfirm = async () => {
    if (!template?.id) {
      dispatch(notify({ msg: 'Choose a template to delete it', sev: 'warning' }));
      return;
    }
    try {
      await deleteTemplate({ id: template.id }).unwrap();
      setOpenConfirmDelete(false);
      dispatch(notify({ msg: 'Template deleted Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Failed to delete this template', sev: 'warning' }));
    }
  };

  const color = template?.templateColor ?? '#6982F0';

  return (
    <div className="availability-template-summary-card" style={{ backgroundColor: hexToRGBA(color, 0.15) }}>
      <div className="header-of-availability-template-summary-card" style={{ backgroundColor: color }}>
        <span style={{ fontWeight: 600 }}>{template.templateName}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <CiSquareMinus className="icons-style" onClick={() => setShowDetails(!showDetails)} />
          {template.parentTemplateId && (
            <FaRegEdit className="icons-style" onClick={() => onEdit?.(template)} />
          )}
          {template.parentTemplateId && !readOnly && (
            <MdDelete className="icons-style" onClick={() => setOpenConfirmDelete(true)} />
          )}
        </div>
      </div>

      {showDetails && (
        <div className="body-of-availability-template-summary-card">
          <div><strong>Type:</strong> {formatEnumString(template.templateType)}</div>
          <div><strong>Parallel Capacity:</strong> {template.parallelCapacityValue}</div>
          <div>
            <strong>{departmentName ? 'Department Name:' : 'Resource Name:'}</strong>{' '}
            {departmentName || resourceName}
          </div>
          <Whisper placement="top" trigger="click" speaker={<Tooltip>{allowedServicesText}</Tooltip>}>
            <div className="services-text">
              <strong>Services allowed:&nbsp;</strong>
              <span title="Click to view all services">{allowedServicesText}</span>
            </div>
          </Whisper>
        </div>
      )}

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Availability Template"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
      />
    </div>
  );
};

export default AvailabilityTemplateSummaryCard;
