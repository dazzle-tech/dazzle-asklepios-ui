import React, { useState } from 'react';
import { Checkbox } from 'rsuite';
import {
  MdCheckCircleOutline,
  MdChecklist,
  MdOutlineCancel,
  MdOutlineEdit,
  MdOutlineFlag,
  MdOutlineGroups,
  MdOutlinePerson,
  MdOutlinePersonAddAlt,
  MdOutlineSmartToy
} from 'react-icons/md';
import dayjs from 'dayjs';
import { formatEnumString } from '@/utils';
import type { PatientActivity } from '@/types/model-types-new';
import { ActivityIcon, DEFAULT_CATEGORY_COLOR, useActivityCatalog } from './activityCatalog';
import RowActionsMenu from './RowActionsMenu';

type Props = {
  row: PatientActivity;
  readOnly: boolean;
  currentUser?: string;
  onComplete: (row: PatientActivity) => void;
  onCancel: (row: PatientActivity) => void;
  onEdit: (row: PatientActivity) => void;
  onClaim: (row: PatientActivity) => void;
  onChecklist: (row: PatientActivity, index: number, done: boolean) => void;
  onOpen: (row: PatientActivity) => void;
};

/** Overdue, due today, or the due date — with the tone the chip should take. */
export const dueState = (dueAt?: string | null) => {
  if (!dueAt) return { tone: 'none', label: 'No due date' };
  const due = dayjs(dueAt);
  const now = dayjs();
  if (due.isBefore(now.startOf('day'))) {
    const days = now.startOf('day').diff(due.startOf('day'), 'day');
    return { tone: 'overdue', label: `${days}d overdue` };
  }
  if (due.isBefore(now)) return { tone: 'overdue', label: `Overdue ${due.format('HH:mm')}` };
  if (due.isSame(now, 'day')) return { tone: 'today', label: `Today ${due.format('HH:mm')}` };
  if (due.isSame(now.add(1, 'day'), 'day')) return { tone: 'soon', label: 'Tomorrow' };
  return { tone: 'later', label: due.format('DD MMM') };
};

const TaskItem: React.FC<Props> = ({
  row,
  readOnly,
  currentUser,
  onComplete,
  onCancel,
  onEdit,
  onClaim,
  onChecklist,
  onOpen
}) => {
  const { templateName, templateByCode, categoryByCode, planName } = useActivityCatalog();
  const [expanded, setExpanded] = useState(false);
  const category = categoryByCode.get(row.category);
  const color = category?.color || DEFAULT_CATEGORY_COLOR;
  const due = dueState(row.dueAt);
  const checklist = row.checklist ?? [];
  const doneItems = checklist.filter(item => item.done).length;
  const isMine = Boolean(currentUser) && row.assignedTo === currentUser;
  const canEdit = !readOnly && row.source === 'STAFF';
  const priority = (row.priority ?? 'NORMAL').toLowerCase();
  const team = (row.assignedRoles ?? []).map(formatEnumString).join(', ');

  return (
    <div className={`patient-task due-${due.tone}`}>
      <Checkbox
        className="patient-task-check"
        checked={false}
        disabled={readOnly}
        title="Complete"
        onChange={() => onComplete(row)}
      />
      <div className="patient-task-body">
        <div className="patient-task-top">
          <div className="patient-task-title">
            <span className="patient-task-icon" style={{ color }}>
              <ActivityIcon icon={category?.icon} />
            </span>
            <button type="button" className="patient-task-title-button" onClick={() => onOpen(row)}>
              {templateName(row.activityType)}
            </button>
            {row.source === 'SYSTEM' && (
              <span className="patient-activity-tag auto" title="Created by the system">
                <MdOutlineSmartToy /> Auto
              </span>
            )}
            {row.planCode && (
              <span className="patient-activity-tag plan" title="Added from a task plan">
                {planName(row.planCode)}
              </span>
            )}
          </div>
          <span className={`patient-task-due tone-${due.tone}`}>{due.label}</span>
        </div>
        {row.note && row.note !== templateByCode.get(row.activityType)?.name && (
          <p className="patient-task-note">{row.note}</p>
        )}
        <div className="patient-task-meta">
          {priority !== 'normal' && (
            <span className={`activity-priority priority-${priority}`}>
              <MdOutlineFlag /> {formatEnumString(row.priority)}
            </span>
          )}
          {row.assignedTo ? (
            <span className={isMine ? 'patient-task-mine' : ''}>
              <MdOutlinePerson /> {isMine ? 'You' : row.assignedTo}
            </span>
          ) : (
            team && (
              <span title={team}>
                <MdOutlineGroups /> {team}
              </span>
            )
          )}
          {checklist.length > 0 && (
            <button type="button" className="patient-task-checklist-toggle" onClick={() => setExpanded(!expanded)}>
              <MdChecklist /> {doneItems}/{checklist.length}
            </button>
          )}
        </div>
        {expanded && checklist.length > 0 && (
          <ul className="patient-task-checklist">
            {checklist.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <Checkbox
                  checked={item.done}
                  disabled={readOnly}
                  onChange={(_, checked) => onChecklist(row, index, checked)}
                >
                  {item.label}
                </Checkbox>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!readOnly && (
        <RowActionsMenu
          actions={[
            { label: 'Complete', icon: <MdCheckCircleOutline />, onClick: () => onComplete(row) },
            { label: 'Assign to me', icon: <MdOutlinePersonAddAlt />, onClick: () => onClaim(row), hidden: isMine },
            { label: 'Edit', icon: <MdOutlineEdit />, onClick: () => onEdit(row), hidden: !canEdit },
            { label: 'Cancel task', icon: <MdOutlineCancel />, onClick: () => onCancel(row), danger: true }
          ]}
        />
      )}
    </div>
  );
};

export default TaskItem;
