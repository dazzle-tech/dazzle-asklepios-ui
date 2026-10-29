import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Panel } from 'rsuite';
import {
  MdCheckCircleOutline,
  MdChecklist,
  MdOpenInNew,
  MdOutlineCalendarMonth,
  MdOutlineCancel,
  MdOutlineFlag,
  MdOutlineGroups,
  MdOutlinePerson,
  MdOutlinePersonAddAlt,
  MdOutlineSmartToy,
  MdViewList
} from 'react-icons/md';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetPatientByIdQuery } from '@/services/patient/patientService';
import {
  useBulkUpdatePatientActivitiesMutation,
  useClaimPatientActivityMutation,
  useGetActivityPlansQuery,
  useGetPatientTaskSummaryQuery,
  useGetPatientTasksQuery,
  type PatientTaskQuery,
  type PatientTaskRow,
  type TaskScope
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import ActivityActionModal from '@/pages/patient/patient-profile/tabs/Activities/ActivityActionModal';
import TaskDrawer from '@/pages/patient/patient-profile/tabs/Activities/TaskDrawer';
import { useStaffOptions } from '@/pages/patient/patient-profile/tabs/Activities/useStaffOptions';
import { dueState } from '@/pages/patient/patient-profile/tabs/Activities/TaskItem';
import RowActionsMenu from '@/pages/patient/patient-profile/tabs/Activities/RowActionsMenu';
import {
  ActivityIcon,
  DEFAULT_CATEGORY_COLOR,
  useActivityCatalog
} from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import TaskCalendar from './TaskCalendar';
import '@/pages/patient/patient-profile/tabs/Activities/styles.less';
import './styles.less';

type Props = {
  scope: TaskScope;
  title: string;
  pageCode: string;
};

type Quick = 'dueToday' | 'overdue' | 'unassigned' | 'completedToday' | null;
type StatusView = 'OPEN' | 'DONE' | 'ALL';

const ALL = 'all';
const FILTER_WIDTH = 200;
const SEARCH_DELAY_MS = 400;

const emptyFilters = { category: ALL, planCode: ALL, priority: [] as string[] };

/** One task list for the three Tasks screens; the scope decides whose tasks it shows. */
const TaskBoard: React.FC<Props> = ({ scope, title, pageCode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth?.user?.login) as string | undefined;
  const catalog = useActivityCatalog();
  const { categories, categoryByCode, templateName, planName } = catalog;
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const { data: plans = [] } = useGetActivityPlansQuery();

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusView, setStatusView] = useState<StatusView>('OPEN');
  const [quick, setQuick] = useState<Quick>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  // Search as the user types, without a request per key stroke
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchDraft]);
  const [day, setDay] = useState<Date | null>(null);
  const [month, setMonth] = useState(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [selected, setSelected] = useState<PatientActivity | null>(null);
  const [actionMode, setActionMode] = useState<'complete' | 'cancel'>('complete');
  const [openAction, setOpenAction] = useState(false);
  const [drawerRow, setDrawerRow] = useState<PatientTaskRow | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkUpdate, { isLoading: bulkSaving }] = useBulkUpdatePatientActivitiesMutation();
  const staffOptions = useStaffOptions();

  const [claim] = useClaimPatientActivityMutation();
  const [loadPatient] = useLazyGetPatientByIdQuery();

  useEffect(() => {
    dispatch(setPageCode(pageCode));
    dispatch(setDivContent(title));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pageCode, title]);

  useEffect(() => setPage(0), [statusView, quick, filters, search, day]);
  // A selection only makes sense for the rows on screen
  useEffect(() => setChecked([]), [statusView, quick, filters, search, day, page, rowsPerPage, scope]);

  const { data: summary } = useGetPatientTaskSummaryQuery(scope);

  const baseQuery = useMemo<Omit<PatientTaskQuery, 'page' | 'size'>>(() => {
    const status = quick === 'completedToday' ? ['DONE'] : statusView === 'ALL' ? undefined : [statusView];
    const startOfToday = dayjs().startOf('day');
    return {
      scope,
      status: quick && quick !== 'completedToday' ? ['OPEN'] : status,
      category: filters.category === ALL ? undefined : filters.category,
      planCode: filters.planCode === ALL ? undefined : filters.planCode,
      priority: filters.priority,
      search: search || undefined,
      overdue: quick === 'overdue' || undefined,
      unassigned: quick === 'unassigned' || undefined,
      sort: statusView === 'DONE' || quick === 'completedToday' ? 'completedAt,desc' : 'dueAt,asc',
      ...(quick === 'dueToday'
        ? { dueFrom: startOfToday.toISOString(), dueTo: startOfToday.add(1, 'day').toISOString() }
        : {}),
      ...(day
        ? { dueFrom: dayjs(day).startOf('day').toISOString(), dueTo: dayjs(day).add(1, 'day').startOf('day').toISOString() }
        : {})
    };
  }, [scope, statusView, quick, filters, search, day]);

  const { data, isFetching } = useGetPatientTasksQuery(
    { ...baseQuery, page, size: rowsPerPage },
    { skip: view !== 'list' }
  );

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      dispatch(notify({ msg: success, sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to update task', sev: 'warning' }));
    }
  };

  const openPatient = async (patientId: number) => {
    try {
      const patient = await loadPatient({ id: patientId }).unwrap();
      navigate('/patient-profile', { state: { patient } });
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to open the patient', sev: 'warning' }));
    }
  };

  const openAct = (task: PatientActivity, mode: 'complete' | 'cancel') => {
    setSelected(task);
    setActionMode(mode);
    setOpenAction(true);
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(day) ||
    filters.category !== ALL ||
    filters.planCode !== ALL ||
    filters.priority.length > 0;

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchDraft('');
    setSearch('');
    setDay(null);
  };

  const toggleQuick = (next: Quick) => {
    setDay(null);
    setQuick(current => (current === next ? null : next));
  };

  const widgets: { key: Quick; label: string; value: number; tone: string; hidden?: boolean }[] = [
    { key: null, label: 'Open', value: summary?.open ?? 0, tone: 'neutral' },
    { key: 'dueToday', label: 'Due today', value: summary?.dueToday ?? 0, tone: 'warning' },
    { key: 'overdue', label: 'Overdue', value: summary?.overdue ?? 0, tone: 'danger' },
    { key: 'unassigned', label: 'Not taken yet', value: summary?.unassigned ?? 0, tone: 'accent', hidden: scope === 'MINE' },
    { key: 'completedToday', label: 'Done today', value: summary?.completedToday ?? 0, tone: 'success' }
  ];

  const pageRows = data?.data ?? [];
  const selectable = pageRows.filter(row => row.task.status === 'OPEN').map(row => row.task.id);
  const allChecked = selectable.length > 0 && selectable.every(id => checked.includes(id));

  const toggleRow = (id: number) =>
    setChecked(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  const runBulk = async (change: { assignedTo?: string | null; unassign?: boolean; priority?: string | null }) => {
    try {
      const count = await bulkUpdate({ ids: checked, ...change }).unwrap();
      dispatch(notify({ msg: `${count} task${count === 1 ? '' : 's'} updated`, sev: 'success' }));
      setChecked([]);
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to update tasks', sev: 'warning' }));
    }
  };

  // Clicks on controls inside a row must not also open the row
  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  const columns = [
    {
      key: 'select',
      title: (
        <Checkbox
          checked={allChecked}
          indeterminate={!allChecked && checked.length > 0}
          disabled={!selectable.length}
          onChange={(_, value) => setChecked(value ? selectable : [])}
          aria-label="Select all open tasks on this page"
        />
      ),
      width: 44,
      render: ({ task }: PatientTaskRow) => (
        <span onClick={stop}>
          <Checkbox
            checked={checked.includes(task.id)}
            disabled={task.status !== 'OPEN'}
            onChange={() => toggleRow(task.id)}
            aria-label="Select task"
          />
        </span>
      )
    },
    {
      key: 'dueAt',
      title: <Translate>Due</Translate>,
      width: 130,
      render: ({ task }: PatientTaskRow) => {
        if (task.status !== 'OPEN') {
          return <span className="task-board-closed">{dayjs(task.completedAt || task.cancelledAt).format('DD MMM HH:mm')}</span>;
        }
        const due = dueState(task.dueAt);
        return <span className={`patient-task-due tone-${due.tone}`}>{due.label}</span>;
      }
    },
    {
      key: 'activityType',
      title: <Translate>Task</Translate>,
      render: ({ task }: PatientTaskRow) => {
        const category = categoryByCode.get(task.category);
        const checklist = task.checklist ?? [];
        return (
          <div className="task-board-task">
            <div className="task-board-task-title">
              <span style={{ color: category?.color || DEFAULT_CATEGORY_COLOR }}>
                <ActivityIcon icon={category?.icon} />
              </span>
              {templateName(task.activityType)}
              {task.source === 'SYSTEM' && (
                <span className="patient-activity-tag auto">
                  <MdOutlineSmartToy /> Auto
                </span>
              )}
              {task.planCode && <span className="patient-activity-tag plan">{planName(task.planCode)}</span>}
              {task.status === 'DONE' && task.outcome && (
                <span className="patient-activity-tag outcome">{task.outcome}</span>
              )}
              {task.status === 'CANCELLED' && <span className="patient-activity-tag cancelled">Cancelled</span>}
            </div>
            <div className="task-board-task-note">
              {task.note}
              {checklist.length > 0 && (
                <span className="task-board-checklist">
                  <MdChecklist /> {checklist.filter(item => item.done).length}/{checklist.length}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'patient',
      title: <Translate>Patient</Translate>,
      width: 200,
      render: ({ task, patientName, medicalRecordNumber }: PatientTaskRow) => (
        <button
          type="button"
          className="task-board-patient"
          onClick={event => {
            stop(event);
            openPatient(task.patientId);
          }}
        >
          <span>{patientName || `Patient ${task.patientId}`}</span>
          {medicalRecordNumber && <small>{medicalRecordNumber}</small>}
        </button>
      )
    },
    {
      key: 'priority',
      title: <Translate>Priority</Translate>,
      width: 100,
      render: ({ task }: PatientTaskRow) => (
        <span className={`activity-priority priority-${(task.priority ?? 'NORMAL').toLowerCase()}`}>
          {task.priority !== 'NORMAL' && <MdOutlineFlag />} {formatEnumString(task.priority)}
        </span>
      )
    },
    {
      key: 'assignedTo',
      title: <Translate>Assigned To</Translate>,
      width: 180,
      render: ({ task }: PatientTaskRow) =>
        task.assignedTo ? (
          <span className={task.assignedTo === currentUser ? 'patient-task-mine' : ''}>
            <MdOutlinePerson /> {task.assignedTo === currentUser ? 'You' : task.assignedTo}
          </span>
        ) : (
          <span className="task-board-team" title={(task.assignedRoles ?? []).map(formatEnumString).join(', ')}>
            <MdOutlineGroups /> {(task.assignedRoles ?? []).map(formatEnumString).join(', ') || 'No team'}
          </span>
        )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      width: 60,
      render: ({ task }: PatientTaskRow) => (
        <span onClick={stop}>
        <RowActionsMenu
          actions={[
            {
              label: 'Complete',
              icon: <MdCheckCircleOutline />,
              onClick: () => openAct(task, 'complete'),
              hidden: task.status !== 'OPEN'
            },
            {
              label: 'Assign to me',
              icon: <MdOutlinePersonAddAlt />,
              onClick: () =>
                runAction(() => claim({ id: task.id, patientId: task.patientId }).unwrap(), 'Task assigned to you'),
              hidden: task.status !== 'OPEN' || task.assignedTo === currentUser
            },
            { label: 'Open patient', icon: <MdOpenInNew />, onClick: () => openPatient(task.patientId) },
            {
              label: 'Cancel task',
              icon: <MdOutlineCancel />,
              onClick: () => openAct(task, 'cancel'),
              danger: true,
              hidden: task.status !== 'OPEN'
            }
          ]}
        />
        </span>
      )
    }
  ];

  return (
    <Panel className="task-board">
      <div className="patient-activity-widgets task-board-widgets">
        {widgets
          .filter(widget => !widget.hidden)
          .map(widget => (
            <button
              key={widget.label}
              type="button"
              className={`patient-activity-widget tone-${widget.tone}${quick === widget.key && (widget.key || statusView === 'OPEN') ? ' active' : ''}`}
              onClick={() => {
                if (widget.key) toggleQuick(widget.key);
                else {
                  setQuick(null);
                  setDay(null);
                  setStatusView('OPEN');
                }
              }}
            >
              <span className="patient-activity-widget-label">
                <Translate>{widget.label}</Translate>
              </span>
              <span className="patient-activity-widget-value">{widget.value}</span>
            </button>
          ))}
      </div>

      <div className="task-board-toolbar">
        <div className="patient-activity-segment" role="group" aria-label="View">
          <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <MdViewList /> <Translate>List</Translate>
          </button>
          <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
            <MdOutlineCalendarMonth /> <Translate>Calendar</Translate>
          </button>
        </div>
        <div className="patient-activity-segment" role="group" aria-label="Status">
          {(['OPEN', 'DONE', 'ALL'] as StatusView[]).map(value => (
            <button
              key={value}
              type="button"
              className={statusView === value && !quick ? 'active' : ''}
              onClick={() => {
                setQuick(null);
                setStatusView(value);
              }}
            >
              <Translate>{value === 'OPEN' ? 'Open' : value === 'DONE' ? 'Completed' : 'All'}</Translate>
            </button>
          ))}
        </div>
      </div>

      <Form fluid className="form-of-filters-set-up task-board-filters">
        <MyInput
          width={FILTER_WIDTH + 60}
          fieldName="search"
          showLabel={false}
          placeholder="Search patient, MRN or note"
          record={{ search: searchDraft }}
          setRecord={(next: { search?: string }) => setSearchDraft(next?.search ?? '')}
        />
        <MyInput
          width={FILTER_WIDTH}
          fieldType="select"
          fieldName="category"
          showLabel={false}
          selectData={[{ value: ALL, label: 'All categories' }, ...categories.map(c => ({ value: c.code, label: c.name }))]}
          selectDataLabel="label"
          selectDataValue="value"
          record={filters}
          setRecord={setFilters}
        />
        <MyInput
          width={FILTER_WIDTH}
          fieldType="checkPicker"
          fieldName="priority"
          showLabel={false}
          placeholder="Any priority"
          selectData={priorityOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={filters}
          setRecord={setFilters}
          searchable={false}
        />
        {plans.length > 0 && (
          <MyInput
            width={FILTER_WIDTH}
            fieldType="select"
            fieldName="planCode"
            showLabel={false}
            selectData={[{ value: ALL, label: 'Any plan' }, ...plans.map(p => ({ value: p.code, label: p.name }))]}
            selectDataLabel="label"
            selectDataValue="value"
            record={filters}
            setRecord={setFilters}
          />
        )}
        {hasFilters && (
          <MyButton appearance="ghost" onClick={clearFilters}>
            Clear
          </MyButton>
        )}
      </Form>

      {day && view === 'list' && (
        <div className="task-board-day">
          <Translate>{`Due on ${dayjs(day).format('dddd, DD MMM YYYY')}`}</Translate>
          <Checkbox checked onChange={() => setDay(null)}>
            <Translate>Clear day</Translate>
          </Checkbox>
        </div>
      )}

      {view === 'list' && checked.length > 0 && (
        <div className="task-board-bulk">
          <strong>
            <Translate>{`${checked.length} selected`}</Translate>
          </strong>
          <Form fluid layout="inline" className="task-board-bulk-form">
            <MyInput
              width={240}
              fieldType="select"
              fieldName="assignedTo"
              showLabel={false}
              placeholder="Assign to…"
              selectData={staffOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ assignedTo: '' }}
              setRecord={(next: { assignedTo?: string }) => next.assignedTo && runBulk({ assignedTo: next.assignedTo })}
              disabled={bulkSaving}
            />
            <MyInput
              width={170}
              fieldType="select"
              fieldName="priority"
              showLabel={false}
              placeholder="Set priority…"
              selectData={priorityOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={{ priority: '' }}
              setRecord={(next: { priority?: string }) => next.priority && runBulk({ priority: next.priority })}
              searchable={false}
              disabled={bulkSaving}
            />
          </Form>
          <MyButton appearance="ghost" onClick={() => runBulk({ assignedTo: currentUser })} disabled={bulkSaving}>
            Assign to me
          </MyButton>
          <MyButton appearance="ghost" onClick={() => runBulk({ unassign: true })} disabled={bulkSaving}>
            Back to Team
          </MyButton>
          <button type="button" className="task-board-bulk-clear" onClick={() => setChecked([])}>
            <Translate>Clear selection</Translate>
          </button>
        </div>
      )}

      {view === 'list' ? (
        <MyTable
          height={560}
          data={data?.data ?? []}
          loading={isFetching}
          columns={columns}
          rowClassName={(row: PatientTaskRow) =>
            [
              'task-board-row',
              row.task.status === 'OPEN' ? '' : 'task-board-row-closed',
              checked.includes(row.task.id) ? 'task-board-row-checked' : ''
            ].join(' ')
          }
          onRowClick={(row: PatientTaskRow) => setDrawerRow(row)}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={data?.totalCount ?? 0}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          dontTranslateData
        />
      ) : (
        <TaskCalendar
          query={baseQuery}
          month={month}
          setMonth={setMonth}
          onPickDay={picked => {
            setQuick(null);
            setDay(picked);
            setView('list');
          }}
        />
      )}

      <TaskDrawer
        taskId={drawerRow?.task.id ?? null}
        onClose={() => setDrawerRow(null)}
        patientName={drawerRow?.patientName}
        medicalRecordNumber={drawerRow?.medicalRecordNumber}
        onOpenPatient={openPatient}
      />
      <ActivityActionModal
        open={openAction}
        setOpen={setOpenAction}
        mode={actionMode}
        activity={selected}
        patientId={selected?.patientId as number}
      />
    </Panel>
  );
};

export default TaskBoard;
