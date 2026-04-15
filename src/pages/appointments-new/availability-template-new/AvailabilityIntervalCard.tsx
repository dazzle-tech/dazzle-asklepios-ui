import React, { useState } from 'react';
import './availability-interval-card.less';
import { CiSquareMinus } from "react-icons/ci";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import { useDeleteAvailabilityTemplateIntervalMutation } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { MdOutlineTimerOff } from "react-icons/md";
import AddBreakModal from './AddBreakModal';



interface Props {
  interval: AvailabilityTemplateIntervalResponseVM;
  slotLabel?: string;
  type?: 'NORMAL' | 'BREAK';
  onEdit?: () => void;
  onDelete?: () => void;
  backgroundColor?: string;
  readOnly?: boolean;
}

const AvailabilityIntervalCard: React.FC<Props> = ({
  interval,
  slotLabel,
  type = 'NORMAL',
  onEdit,
  onDelete,
  backgroundColor = "#6982F0",
  ...props
}) => {
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [openِAddBreakModal, setOpenAddBreakModal] = useState(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [deleteAvailabilityTemplateInterval] = useDeleteAvailabilityTemplateIntervalMutation();

  function hexToRGBA(hex, opacity = 0.2) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  const startLabel = interval?.startTime ?? '';
  const endLabel = interval?.endTime ?? '';
  const computedSlotLabel = slotLabel ?? (
    interval?.slotDurationMinutes != null ? `${interval.slotDurationMinutes} min` : ('-')
  );

  const handleDeleteConfirm = async () => {
    if (!interval?.id) {
      setOpenConfirmDeleteModal(false);
      return;
    }
    try {
      await deleteAvailabilityTemplateInterval({ id: interval.id }).unwrap();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete availability interval', error);
    } finally {
      setOpenConfirmDeleteModal(false);
    }
  };

  return (
       <div className='availability-template-summary-card' style={{backgroundColor: hexToRGBA(backgroundColor, 0.2)}}>
          {/* Header */}
          <div className='header-of-availability-template-summary-card' style={{backgroundColor: backgroundColor}}>
            <span>{startLabel} - {endLabel}</span>
             <div style={{ display: 'flex', gap: '5px' }}>
                      {/* <IoSettingsSharp onClick={onSettingsClick} className='icons-style'/> */}
                      <CiSquareMinus className='icons-style' onClick={() => setShowDetails(!showDetails)} />
                      <FaRegEdit className='icons-style' onClick={onEdit} />
                        {!props?.readOnly &&(
                        <MdDelete
                          className='icons-style'
                          onClick={() => setOpenConfirmDeleteModal(true)}
                        />
                        )}
                        {!props?.readOnly &&(
                        <MdOutlineTimerOff 
                          className='icons-style'
                          onClick={() => setOpenAddBreakModal(true)}
                        />
                        )}
                    </div>
            
          </div>
    
          {/* Body */}
          {showDetails && (
          <div className='body-of-availability-template-summary-card'>
            <div>
              <span>Duration:</span> {computedSlotLabel}
            </div>
          </div>
          )}

          <DeletionConfirmationModal
            open={openConfirmDeleteModal}
            setOpen={setOpenConfirmDeleteModal}
            itemToDelete="Availability Interval"
            actionButtonFunction={handleDeleteConfirm}
            actionType="delete"
            confirmationQuestion="Are you sure you want to delete this interval?"
            actionButtonLabel="Delete"
          />
          <AddBreakModal 
           open={openِAddBreakModal}
           setOpen={setOpenAddBreakModal}
           interval={interval}
          />
        </div>
  );
};

export default AvailabilityIntervalCard;
