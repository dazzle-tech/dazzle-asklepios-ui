
import React, { useEffect, useState } from 'react';
import { CiSquareMinus } from "react-icons/ci";
import { FaRegEdit } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { Tooltip, Whisper } from 'rsuite';
import { MdDelete } from "react-icons/md";
import { useDeleteAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { formatEnumString } from '@/utils';
import { useLazyGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useLazyGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetCatalogByIdQuery } from '@/services/setup/catalog/catalogService';
import { useLazyGetServiceByIdQuery } from '@/services/setup/serviceService';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';

type DepartmentPoolCardProps = {
  template: any;
  onEdit?: (template: any) => void;
  readOnly?: boolean;
};

const AvailabilityTemplateSummaryCard: React.FC<DepartmentPoolCardProps> = ({
  template,
  onEdit,
  ...props
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(true);

  const [resourceName, setRresourceName] = useState<string>("");
  const [departmentName, setDepartmentName] = useState<string>("");
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [deleteAvailabilityTemplate] = useDeleteAvailabilityTemplateMutation();

  function hexToRGBA(hex: string, opacity = 0.2) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;

  }
  const [getPractitioner] = useLazyGetPractitionerByIdQuery();
  const [getDiagnosticTest] = useLazyGetDiagnosticTestByIdQuery();
  const [getCatalog] = useLazyGetCatalogByIdQuery();
  const [getService] = useLazyGetServiceByIdQuery();
   const [getDepartment, { data, isLoading }] = useLazyGetDepartmentByIdQuery();

  const handleDeleteConfirm = async () => {
    if (!template?.id) {
      setOpenConfirmDeleteModal(false);
      return;
    }
    try {
      await deleteAvailabilityTemplate({ id: template.id }).unwrap();
      setOpenConfirmDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete availability template', error);
      setOpenConfirmDeleteModal(false);
    }
  };

  const allowedServiceNames = (template?.allowedServices ?? [])
    .map((s: any) => s?.service)
    .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
    .map((s: string) => formatEnumString(s)) as string[];

  const allowedServicesText = allowedServiceNames.length > 0 ? allowedServiceNames.join(', ') : '—';



  useEffect(() => {
    if (!template?.id) {
      return;
    }
    if(template?.templateType === "DEPARTMENT"){
    getDepartment(template.departmentId)
    .unwrap()
    .then(res => {
       setDepartmentName(res?.name);
    });
    return;
  }

    if (!template?.resourceId) {
      setRresourceName("");
      return;
    }

    if (template?.templateType === "PRACTITIONER") {
      getPractitioner(template.resourceId)
        .unwrap()
        .then(res => {
          setRresourceName(res?.firstName + " " + res?.lastName);
        });
    } else if (template?.templateType === 'DIAGNOSTIC_TEST') {
      getDiagnosticTest(String(template.resourceId))
        .unwrap()
        .then(res => {
          setRresourceName(res?.data?.name);
        });
    }
    else if (template?.templateType === 'CATALOG') {
      getCatalog(template.resourceId)
        .unwrap()
        .then(res => {
          setRresourceName(res?.name);
        });
    }
    else if (template?.templateType === 'SERVICE') {
      getService(template.resourceId)
        .unwrap()
        .then(res => {
          setRresourceName(res?.name);
        });
    }

  }, [template]);

  return (
    <div
      className="availability-template-summary-card"
      style={{ backgroundColor: hexToRGBA(template?.templateColor ?? "#6982F0", 0.2) }}
    >
      {/* Header */}
      <div
        className="header-of-availability-template-summary-card"
        style={{ backgroundColor: template?.templateColor ?? "#6982F0" }}
      >
        <span style={styles.title}>{template.templateName}</span>

        <div style={{ display: 'flex', gap: '5px' }}>
          {/* <IoSettingsSharp onClick={onSettingsClick} className='icons-style'/> */}
          <CiSquareMinus className='icons-style' onClick={() => setShowDetails(!showDetails)} />
          {template.parentTemplateId && (
            <FaRegEdit
              className='icons-style'
              onClick={() => onEdit?.(template)}
            />
          )}
          {(template.parentTemplateId && !props.readOnly) && (
            <MdDelete className='icons-style'
              onClick={() => {
                if (template.parentTemplateId)
                  setOpenConfirmDeleteModal(true)
              }}
            />
          )}
        </div>
      </div>

      {/* Body */}
      {showDetails && (
        <div className="body-of-availability-template-summary-card">
          <div>
            <strong>Type:</strong> {formatEnumString(template.templateType)}
          </div>

          <div>
            <strong>Parallel Capacity:</strong> {template.parallelCapacityValue}
          </div>

          <div>
            <strong>{departmentName ? 'Department Name:' : 'Resource Name:'}</strong> {departmentName ? departmentName : resourceName}
          </div>

          <Whisper
            placement="top"
            trigger="click"
            speaker={<Tooltip>{allowedServicesText}</Tooltip>}
          >
            <div className="services-text">
              <strong>Services allowed:&nbsp;</strong>


              <span
                // className="services-text"
                title="Click to view all services"
              >
                {allowedServicesText}
              </span>
            </div>
          </Whisper>

        </div>
      )}

      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Availability Template"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
      />
    </div>
  );
};

export default AvailabilityTemplateSummaryCard;

/* ---------- styles ---------- */

const styles: { [key: string]: React.CSSProperties } = {
  title: {
    fontWeight: 600,
  },
};
