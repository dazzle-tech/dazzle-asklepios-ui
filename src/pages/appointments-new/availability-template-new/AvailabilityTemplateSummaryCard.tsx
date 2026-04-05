
import React, { useState } from 'react';
import { CiSquareMinus } from "react-icons/ci";
import { FaRegEdit } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { Tooltip, Whisper } from 'rsuite';
import { MdDelete } from "react-icons/md";
import { useDeleteAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { formatEnumString } from '@/utils';

type DepartmentPoolCardProps = {
  template: any
};

const AvailabilityTemplateSummaryCard: React.FC<DepartmentPoolCardProps> = ({
  template
}) => {
  const [showServicesPopup, setShowServicesPopup] = useState(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [deleteAvailabilityTemplate] = useDeleteAvailabilityTemplateMutation();

  function hexToRGBA(hex: string, opacity = 0.2) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

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
          <FaRegEdit className='icons-style' />
          {template.parentTemplateId && (
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
            <strong>Parallel Capacity:</strong> {"1"}
          </div>

          <Whisper placement="top" trigger="click" speaker={<Tooltip>{["Test, Test"].join(', ')}</Tooltip>}>
            <div className="services-text">
              <strong>Services allowed:&nbsp;</strong>


              <span
                // className="services-text"
                onClick={() => setShowServicesPopup(true)}
                title="Click to view all services"
              >
                {["Test, Test"].join(', ')}
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
