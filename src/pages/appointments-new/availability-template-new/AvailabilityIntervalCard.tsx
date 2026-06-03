import React, { useState } from 'react';
import { CiSquareMinus } from 'react-icons/ci';
import { FaRegEdit } from 'react-icons/fa';
import { MdDelete, MdOutlineTimerOff } from 'react-icons/md';
import { AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import { useDeleteAvailabilityTemplateIntervalMutation } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { hexToRGBA } from './utils';
import AddBreakModal from './AddBreakModal';
import './availability-interval-card.less';

interface Props {
  interval: AvailabilityTemplateIntervalResponseVM;
  slotLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  backgroundColor?: string;
  readOnly?: boolean;
}

const AvailabilityIntervalCard: React.FC<Props> = ({
  interval,
  slotLabel,
  onEdit,
  onDelete,
  backgroundColor = '#6982F0',
  readOnly,
}) => {
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openAddBreak, setOpenAddBreak] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [deleteInterval] = useDeleteAvailabilityTemplateIntervalMutation();

  const startLabel = interval?.startTime ?? '';
  const endLabel = interval?.endTime ?? '';
  const computedSlotLabel = slotLabel ?? (interval?.slotDurationMinutes != null ? `${interval.slotDurationMinutes} min` : '-');

  const handleDeleteConfirm = async () => {
    if (!interval?.id) { setOpenConfirmDelete(false); return; }
    try {
      await deleteInterval({ id: interval.id }).unwrap();
      onDelete?.();
    } catch {
      // deletion errors are handled silently; the UI updates via RTK Query cache invalidation
    } finally {
      setOpenConfirmDelete(false);
    }
  };

  return (
    <div className="availability-template-summary-card" style={{ backgroundColor: hexToRGBA(backgroundColor, 0.2) }}>
      <div className="header-of-availability-template-summary-card" style={{ backgroundColor }}>
        <span>{startLabel} - {endLabel}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <CiSquareMinus className="icons-style" onClick={() => setShowDetails(!showDetails)} />
          <FaRegEdit className="icons-style" onClick={onEdit} />
          {!readOnly && (
            <MdDelete className="icons-style" onClick={() => setOpenConfirmDelete(true)} />
          )}
          <MdOutlineTimerOff className="icons-style" onClick={() => setOpenAddBreak(true)} />
        </div>
      </div>

      {showDetails && (
        <div className="body-of-availability-template-summary-card">
          <div><span>Duration:</span> {computedSlotLabel}</div>
        </div>
      )}

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Availability Interval"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this interval?"
        actionButtonLabel="Delete"
      />
      <AddBreakModal
        open={openAddBreak}
        setOpen={setOpenAddBreak}
        interval={interval}
        readOnly={readOnly}
      />
    </div>
  );
};

export default AvailabilityIntervalCard;
