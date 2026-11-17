import React from 'react';
import { Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faTrash,
  faCircleCheck,
  faEye,
  faPlay,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons';

import {
  isCompleted,
  isExistingDocumentation,
  isInProgress
} from './treatmentPlanShared';

type RowActionProps = {
  label: string;
  className: string;
  icon: React.ComponentProps<typeof FontAwesomeIcon>['icon'];
  onClick: () => void;
};

const RowAction = ({ label, className, icon, onClick }: RowActionProps) => (
  <IconButton
    className={`ap-action ${className}`}
    size="small"
    title={label}
    aria-label={label}
    onClick={event => {
      event.stopPropagation();
      onClick();
    }}
  >
    <FontAwesomeIcon icon={icon} />
  </IconButton>
);

export type TreatmentRowActionsProps = {
  row: any;
  actionsDisabled: boolean;
  canAddTreatment: boolean;
  canExecute: boolean;
  canReturn: boolean;
  completingId: number | null;
  onViewTreatment: (row: any) => void;
  onEditTreatment: (row: any) => void;
  onStartTreatment: (row: any) => void;
  onCompleteTreatment: (row: any) => void;
  onCancelTreatment: (row: any) => void;
  onReturnTreatment: (row: any) => void;
};

/**
 * Row actions for a plan treatment item, shared by Active and History.
 * Only actions available in the item's current state are rendered.
 */
const TreatmentRowActions = ({
  row,
  actionsDisabled,
  canAddTreatment,
  canExecute,
  canReturn,
  completingId,
  onViewTreatment,
  onEditTreatment,
  onStartTreatment,
  onCompleteTreatment,
  onCancelTreatment,
  onReturnTreatment
}: TreatmentRowActionsProps) => {
  const planItem = !isExistingDocumentation(row);
  const completed = isCompleted(row);
  const open = planItem && !actionsDisabled && !row.cancelled;
  const unfinished = open && !completed && canAddTreatment;

  const showStart = unfinished && canExecute && !isInProgress(row);
  const showComplete = unfinished && canExecute;
  // Charged items cannot be reopened (billing reversal is not supported).
  const showReturn =
    open &&
    canReturn &&
    row.status === 'COMPLETED' &&
    !row.patientServiceAndProductId;

  return (
    <Box
      className="ap-actions"
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
    >
      <RowAction
        label="View Details"
        className="ap-action--view"
        icon={faEye}
        onClick={() => onViewTreatment(row)}
      />

      {unfinished && (
        <RowAction
          label="Edit Treatment"
          className="ap-action--edit"
          icon={faPen}
          onClick={() => onEditTreatment(row)}
        />
      )}

      {showStart && (
        <RowAction
          label="Start Treatment"
          className="ap-action--start"
          icon={faPlay}
          onClick={() => onStartTreatment(row)}
        />
      )}

      {showComplete && (
        <RowAction
          label={
            completingId === row.id ? 'Completing...' : 'Complete Treatment'
          }
          className="ap-action--complete"
          icon={faCircleCheck}
          onClick={() => onCompleteTreatment(row)}
        />
      )}

      {unfinished && (
        <RowAction
          label="Cancel Treatment"
          className="ap-action--cancel"
          icon={faTrash}
          onClick={() => onCancelTreatment(row)}
        />
      )}

      {showReturn && (
        <RowAction
          label="Return to In Progress"
          className="ap-action--return"
          icon={faRotateLeft}
          onClick={() => onReturnTreatment(row)}
        />
      )}
    </Box>
  );
};

export default TreatmentRowActions;
