import React, { useState } from 'react';
import { Checkbox, Drawer, Form, Input, Loader } from 'rsuite';
import {
  MdOpenInNew,
  MdOutlineAssignmentTurnedIn,
  MdOutlineCancel,
  MdOutlineChat,
  MdOutlineEditCalendar,
  MdOutlineFlag,
  MdOutlineHistory,
  MdOutlinePersonOutline,
  MdOutlineSmartToy,
  MdChecklist,
  MdAddTask
} from 'react-icons/md';
import dayjs from 'dayjs';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useAddActivityCommentMutation,
  useAssignPatientActivityMutation,
  useGetActivityCommentsQuery,
  useGetActivityHistoryQuery,
  useGetPatientActivityQuery,
  useMarkPatientActivityChecklistMutation,
  useReschedulePatientActivityMutation
} from '@/services/patients/patientActivityService';
import type { PatientActivityLog } from '@/types/model-types-new';
import ActivityActionModal from './ActivityActionModal';
import { dueState } from './TaskItem';
import { ActivityIcon, DEFAULT_CATEGORY_COLOR, useActivityCatalog } from './activityCatalog';
import { useStaffOptions } from './useStaffOptions';

type Props = {
  taskId: number | null;
  onClose: () => void;
  patientName?: string | null;
  medicalRecordNumber?: string | null;
  /** Shown as "Open patient" when the drawer is opened away from the patient file. */
  onOpenPatient?: (patientId: number) => void;
};

const ROLE_LIST = /^[A-Z_]+(,[A-Z_]+)*$/;

const when = (value?: string | null) => (value ? dayjs(value).format('DD MMM YYYY HH:mm') : '—');

/** One history row in plain words. */
const describe = (entry: PatientActivityLog, templateName: (code?: string | null) => string) => {
  const { action, oldValue, newValue } = entry;
  const roles = (value?: string | null) =>
    (value ?? '').split(',').filter(Boolean).map(formatEnumString).join(', ') || 'no team';
  switch (action) {
    case 'CREATED':
      return 'Created the task';
    case 'ASSIGNED':
      if (ROLE_LIST.test(newValue ?? '') || ROLE_LIST.test(oldValue ?? '')) {
        return `Changed the team from ${roles(oldValue)} to ${roles(newValue)}`;
      }
      if (!newValue) return `Unassigned ${oldValue ?? ''}`.trim();
      return oldValue ? `Reassigned from ${oldValue} to ${newValue}` : `Assigned to ${newValue}`;
    case 'DUE_CHANGED':
      return `Moved the due date from ${when(oldValue)} to ${when(newValue)}`;
    case 'PRIORITY_CHANGED':
      return `Changed the priority from ${formatEnumString(oldValue ?? '')} to ${formatEnumString(newValue ?? '')}`;
    case 'CHECKLIST_CHECKED':
      return `Checked “${newValue}”`;
    case 'CHECKLIST_UNCHECKED':
      return `Unchecked “${newValue}”`;
    case 'COMMENTED':
      return 'Added a comment';
    case 'COMPLETED':
      return newValue ? `Completed: ${newValue}` : 'Completed the task';
    case 'CANCELLED':
      return newValue ? `Cancelled: ${newValue}` : 'Cancelled the task';
    case 'UPDATED':
      return oldValue && newValue && oldValue !== newValue
        ? `Changed the task from ${templateName(oldValue)} to ${templateName(newValue)}`
        : 'Edited the task';
    default:
      return formatEnumString(action);
  }
};

/** Everything about one task in a side panel: schedule, assignment, checklist, comments and history. */
const TaskDrawer: React.FC<Props> = ({ taskId, onClose, patientName, medicalRecordNumber, onOpenPatient }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth?.user?.login) as string | undefined;
  const { templateName, categoryByCode, planName } = useActivityCatalog();
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const skip = taskId == null;

  const { data: task, isFetching } = useGetPatientActivityQuery(taskId as number, { skip });
  const { data: history = [] } = useGetActivityHistoryQuery(taskId as number, { skip });
  const { data: comments = [] } = useGetActivityCommentsQuery(taskId as number, { skip });
  const staffOptions = useStaffOptions(task?.assignedRoles ?? [], task?.assignedTo, skip);

  const [reschedule] = useReschedulePatientActivityMutation();
  const [assign] = useAssignPatientActivityMutation();
  const [markChecklist] = useMarkPatientActivityChecklistMutation();
  const [addComment, { isLoading: commenting }] = useAddActivityCommentMutation();

  const [comment, setComment] = useState('');
  const [actionMode, setActionMode] = useState<'complete' | 'cancel'>('complete');
  const [openAction, setOpenAction] = useState(false);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) dispatch(notify({ msg: success, sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to update task', sev: 'warning' }));
    }
  };

  const isOpen = task?.status === 'OPEN';
  const category = task ? categoryByCode.get(task.category) : undefined;
  const color = category?.color || DEFAULT_CATEGORY_COLOR;
  const due = dueState(task?.dueAt);

  const reassignTo = (assignedTo: string | null) =>
    task &&
    run(
      () => assign({ id: task.id, patientId: task.patientId, body: { assignedTo } }).unwrap(),
      assignedTo ? 'Task assigned' : 'Task back with the team'
    );

  const submitComment = () => {
    const body = comment.trim();
    if (!task || !body) return;
    run(async () => {
      await addComment({ id: task.id, patientId: task.patientId, body }).unwrap();
      setComment('');
    });
  };

  return (
    <Drawer open={!skip} onClose={onClose} size="sm" placement="right" className="task-drawer">
      <Drawer.Header>
        <Drawer.Title>
          {task ? (
            <span className="task-drawer-title">
              <span className="task-drawer-icon" style={{ color, background: `${color}1f` }}>
                <ActivityIcon icon={category?.icon} />
              </span>
              {templateName(task.activityType)}
            </span>
          ) : (
            <Translate>Task</Translate>
          )}
        </Drawer.Title>
        {task && isOpen && (
          <Drawer.Actions>
            <MyButton
              appearance="ghost"
              prefixIcon={() => <MdOutlineCancel />}
              onClick={() => {
                setActionMode('cancel');
                setOpenAction(true);
              }}
            >
              Cancel Task
            </MyButton>
            <MyButton
              prefixIcon={() => <MdOutlineAssignmentTurnedIn />}
              onClick={() => {
                setActionMode('complete');
                setOpenAction(true);
              }}
            >
              Complete
            </MyButton>
          </Drawer.Actions>
        )}
      </Drawer.Header>

      <Drawer.Body className="task-drawer-body">
        {!task && isFetching && <Loader center />}
        {task && (
          <>
            <div className="task-drawer-tags">
              <span className={`patient-activity-status status-${task.status.toLowerCase()}`}>
                {formatEnumString(task.status === 'DONE' ? 'COMPLETED' : task.status)}
              </span>
              {isOpen && <span className={`patient-task-due tone-${due.tone}`}>{due.label}</span>}
              {task.source === 'SYSTEM' && (
                <span className="patient-activity-tag auto">
                  <MdOutlineSmartToy /> Auto
                </span>
              )}
              {task.planCode && <span className="patient-activity-tag plan">{planName(task.planCode)}</span>}
              {category && <span className="task-drawer-category">{category.name}</span>}
            </div>

            {(patientName || onOpenPatient) && (
              <div className="task-drawer-patient">
                <MdOutlinePersonOutline />
                <span>
                  {patientName || `Patient ${task.patientId}`}
                  {medicalRecordNumber && <small> · {medicalRecordNumber}</small>}
                </span>
                {onOpenPatient && (
                  <button type="button" onClick={() => onOpenPatient(task.patientId)}>
                    <MdOpenInNew /> <Translate>Open patient</Translate>
                  </button>
                )}
              </div>
            )}

            {task.note && <p className="task-drawer-note">{task.note}</p>}
            {task.status === 'DONE' && (task.outcome || task.outcomeNote) && (
              <p className="task-drawer-outcome">
                <strong>{task.outcome}</strong> {task.outcomeNote}
              </p>
            )}
            {task.status === 'CANCELLED' && task.cancellationReason && (
              <p className="task-drawer-outcome">{task.cancellationReason}</p>
            )}

            <section className="task-drawer-section">
              <h5>
                <MdOutlineEditCalendar /> <Translate>Schedule and assignment</Translate>
              </h5>
              <Form fluid className="task-drawer-grid">
                <MyInput
                  width="100%"
                  fieldType="datetime"
                  fieldName="dueAt"
                  fieldLabel="Due"
                  record={task}
                  setRecord={(next: { dueAt?: string }) =>
                    next.dueAt &&
                    next.dueAt !== task.dueAt &&
                    run(() => reschedule({ id: task.id, patientId: task.patientId, dueAt: next.dueAt }).unwrap(), 'Due date moved')
                  }
                  disabled={!isOpen}
                />
                <MyInput
                  width="100%"
                  fieldType="select"
                  fieldName="priority"
                  fieldLabel="Priority"
                  selectData={priorityOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={task}
                  setRecord={(next: { priority?: string }) =>
                    next.priority &&
                    next.priority !== task.priority &&
                    run(
                      () => reschedule({ id: task.id, patientId: task.patientId, priority: next.priority }).unwrap(),
                      'Priority changed'
                    )
                  }
                  searchable={false}
                  disabled={!isOpen}
                />
                <MyInput
                  width="100%"
                  fieldType="select"
                  fieldName="assignedTo"
                  fieldLabel="Assigned To"
                  placeholder="Anyone in the team"
                  selectData={staffOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={{ assignedTo: task.assignedTo ?? '' }}
                  setRecord={(next: { assignedTo?: string }) =>
                    (next.assignedTo || null) !== (task.assignedTo ?? null) && reassignTo(next.assignedTo || null)
                  }
                  disabled={!isOpen}
                />
                <div className="task-drawer-team">
                  <span className="task-drawer-label">
                    <Translate>Team</Translate>
                  </span>
                  <span>{(task.assignedRoles ?? []).map(formatEnumString).join(', ') || '—'}</span>
                </div>
              </Form>
              {isOpen && (
                <div className="task-drawer-quick">
                  {task.assignedTo !== currentUser && (
                    <button type="button" onClick={() => reassignTo(currentUser ?? null)}>
                      <MdAddTask /> <Translate>Assign to me</Translate>
                    </button>
                  )}
                  {task.assignedTo && (
                    <button type="button" onClick={() => reassignTo(null)}>
                      <Translate>Back to the team</Translate>
                    </button>
                  )}
                  {task.priority !== 'NORMAL' && (
                    <span className={`activity-priority priority-${task.priority.toLowerCase()}`}>
                      <MdOutlineFlag /> {formatEnumString(task.priority)}
                    </span>
                  )}
                </div>
              )}
            </section>

            {(task.checklist ?? []).length > 0 && (
              <section className="task-drawer-section">
                <h5>
                  <MdChecklist /> <Translate>Checklist</Translate>{' '}
                  <span className="patient-activity-count">
                    {(task.checklist ?? []).filter(item => item.done).length}/{task.checklist?.length}
                  </span>
                </h5>
                <ul className="patient-task-checklist">
                  {(task.checklist ?? []).map((item, index) => (
                    <li key={`${item.label}-${index}`}>
                      <Checkbox
                        checked={item.done}
                        disabled={!isOpen}
                        onChange={(_, checked) =>
                          run(() => markChecklist({ id: task.id, patientId: task.patientId, index, done: checked }).unwrap())
                        }
                      >
                        {item.label}
                      </Checkbox>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="task-drawer-section">
              <h5>
                <MdOutlineChat /> <Translate>Comments</Translate>{' '}
                <span className="patient-activity-count">{comments.length}</span>
              </h5>
              {comments.length === 0 && (
                <p className="task-drawer-empty">
                  <Translate>No comments yet. Leave a note for whoever picks this up next.</Translate>
                </p>
              )}
              <ul className="task-drawer-comments">
                {comments.map(item => (
                  <li key={item.id}>
                    <div className="task-drawer-comment-meta">
                      <strong>{item.createdBy === currentUser ? 'You' : item.createdBy}</strong> · {when(item.createdDate)}
                    </div>
                    <div className="task-drawer-comment-body">{item.body}</div>
                  </li>
                ))}
              </ul>
              <div className="task-drawer-comment-form">
                <Input
                  as="textarea"
                  rows={2}
                  placeholder="Write a comment"
                  value={comment}
                  onChange={value => setComment(value)}
                />
                <MyButton onClick={submitComment} loading={commenting} disabled={!comment.trim()}>
                  Add Comment
                </MyButton>
              </div>
            </section>

            <section className="task-drawer-section">
              <h5>
                <MdOutlineHistory /> <Translate>History</Translate>
              </h5>
              <ul className="task-drawer-history">
                {history.map(entry => (
                  <li key={entry.id} className={`action-${entry.action.toLowerCase()}`}>
                    <span className="task-drawer-history-dot" />
                    <div>
                      <div>{describe(entry, templateName)}</div>
                      <div className="task-drawer-comment-meta">
                        {entry.createdBy === currentUser ? 'You' : entry.createdBy} · {when(entry.createdDate)}
                      </div>
                    </div>
                  </li>
                ))}
                {history.length === 0 && (
                  <li className="task-drawer-empty">
                    <Translate>{`Created ${when(task.createdDate)} by ${task.createdBy ?? 'the system'}`}</Translate>
                  </li>
                )}
              </ul>
            </section>
          </>
        )}
      </Drawer.Body>

      <ActivityActionModal
        open={openAction}
        setOpen={setOpenAction}
        mode={actionMode}
        activity={task ?? null}
        patientId={task?.patientId as number}
      />
    </Drawer>
  );
};

export default TaskDrawer;
