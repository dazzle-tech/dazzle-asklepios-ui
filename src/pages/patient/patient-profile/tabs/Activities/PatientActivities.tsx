import React, { useMemo, useState } from 'react';
import { Input, InputGroup, Loader } from 'rsuite';
import { PlusRound } from '@rsuite/icons';
import { MdAdd, MdOutlineAccountTree, MdSearch } from 'react-icons/md';
import dayjs from 'dayjs';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import {
  useClaimPatientActivityMutation,
  useGetPatientActivitiesQuery,
  useGetPatientActivitySummaryQuery,
  useMarkPatientActivityChecklistMutation
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import AddEditPatientActivity, { emptyTaskForm, taskFormOf } from './AddEditPatientActivity';
import ActivityActionModal from './ActivityActionModal';
import QuickLogModal from './QuickLogModal';
import ApplyPlanModal from './ApplyPlanModal';
import TaskItem, { dueState } from './TaskItem';
import TimelineItem, { closedAt } from './TimelineItem';
import { ActivityIcon, DEFAULT_CATEGORY_COLOR, useActivityCatalog } from './activityCatalog';
import './styles.less';

type Props = {
  patient: { id?: number; patientStatus?: string };
};

type Focus = 'open' | 'today' | 'overdue' | 'done';
type Source = '' | 'STAFF' | 'SYSTEM';

const QUICK_LOG_CATEGORY = 'PATIENT_COMMUNICATION';
const QUICK_LOG_LIMIT = 4;
const TIMELINE_PAGE = 20;

const dayLabel = (value: string) => {
  const day = dayjs(value);
  if (day.isSame(dayjs(), 'day')) return 'Today';
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  if (day.isSame(dayjs(), 'year')) return day.format('dddd, DD MMM');
  return day.format('DD MMM YYYY');
};

const PatientActivities: React.FC<Props> = ({ patient }) => {
  const dispatch = useAppDispatch();
  const patientId = patient?.id;
  const isMerged = patient?.patientStatus === 'MERGED';
  const currentUser = useAppSelector(state => state.auth?.user?.login) as string | undefined;
  const { templates, categoryByCode } = useActivityCatalog();

  const [focus, setFocus] = useState<Focus | null>(null);
  const [source, setSource] = useState<Source>('');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [timelineSize, setTimelineSize] = useState(TIMELINE_PAGE);

  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<PatientActivity | null>(null);
  const [form, setForm] = useState(emptyTaskForm());
  const [actionMode, setActionMode] = useState<'complete' | 'cancel'>('complete');
  const [openAction, setOpenAction] = useState(false);
  const [quickLogType, setQuickLogType] = useState('');
  const [openQuickLog, setOpenQuickLog] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);

  const [claimActivity] = useClaimPatientActivityMutation();
  const [markChecklist] = useMarkPatientActivityChecklistMutation();

  const { data: summary } = useGetPatientActivitySummaryQuery(patientId as number, { skip: !patientId });

  const { data: openData, isFetching: loadingOpen } = useGetPatientActivitiesQuery(
    {
      patientId: patientId as number,
      page: 0,
      size: 100,
      sort: 'dueAt,asc',
      status: 'OPEN',
      source: source || undefined,
      search: search || undefined
    },
    { skip: !patientId }
  );

  const { data: timelineData, isFetching: loadingTimeline, isError } = useGetPatientActivitiesQuery(
    {
      patientId: patientId as number,
      page: 0,
      size: timelineSize,
      sort: 'lastModifiedDate,desc',
      status: focus === 'done' ? 'DONE' : ['DONE', 'CANCELLED'],
      source: source || undefined,
      search: search || undefined
    },
    { skip: !patientId }
  );

  const quickLogTemplates = useMemo(() => {
    const activities = templates.filter(t => t.kind === 'ACTIVITY' && t.isActive);
    const communication = activities.filter(t => t.categoryCode === QUICK_LOG_CATEGORY);
    return (communication.length ? communication : activities).slice(0, QUICK_LOG_LIMIT);
  }, [templates]);

  const openTasks = useMemo(() => {
    const rows = openData?.data ?? [];
    if (focus === 'today') return rows.filter(row => dueState(row.dueAt).tone === 'today');
    if (focus === 'overdue') return rows.filter(row => dueState(row.dueAt).tone === 'overdue');
    return rows;
  }, [openData, focus]);

  const timelineGroups = useMemo(() => {
    const groups: { label: string; rows: PatientActivity[] }[] = [];
    [...(timelineData?.data ?? [])]
      .sort((a, b) => dayjs(closedAt(b)).valueOf() - dayjs(closedAt(a)).valueOf())
      .forEach(row => {
        const label = dayLabel(closedAt(row));
        const last = groups[groups.length - 1];
        if (last?.label === label) last.rows.push(row);
        else groups.push({ label, rows: [row] });
      });
    return groups;
  }, [timelineData]);

  const timelineTotal = timelineData?.totalCount ?? 0;

  const toggleFocus = (next: Focus) => setFocus(current => (current === next ? null : next));

  const applySearch = () => setSearch(searchDraft.trim());

  const openCreate = () => {
    setSelected(null);
    setForm(emptyTaskForm());
    setOpenForm(true);
  };

  const openEdit = (row: PatientActivity) => {
    setSelected(row);
    setForm(taskFormOf(row));
    setOpenForm(true);
  };

  const openCompleteOrCancel = (row: PatientActivity, mode: 'complete' | 'cancel') => {
    setSelected(row);
    setActionMode(mode);
    setOpenAction(true);
  };

  const openQuickLogFor = (code: string) => {
    setQuickLogType(code);
    setOpenQuickLog(true);
  };

  const runAction = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) dispatch(notify({ msg: success, sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to update task', sev: 'warning' }));
    }
  };

  if (!patientId) {
    return (
      <div className="patient-activity-empty">
        <Translate>Save the patient before adding activities.</Translate>
      </div>
    );
  }

  const widgets: { key: Focus; label: string; value: number; tone: string }[] = [
    { key: 'open', label: 'Open tasks', value: summary?.openTasks ?? 0, tone: 'neutral' },
    { key: 'today', label: 'Due today', value: summary?.dueToday ?? 0, tone: 'warning' },
    { key: 'overdue', label: 'Overdue', value: summary?.overdue ?? 0, tone: 'danger' },
    { key: 'done', label: 'Completed', value: summary?.completed ?? 0, tone: 'success' }
  ];

  return (
    <div className="patient-activity-tab">
      <div className="patient-activity-header">
        <div>
          <h3>
            <Translate>Activities & Follow-up</Translate>
          </h3>
          <span className="patient-activity-subtitle">
            <Translate>Tasks to follow up and everything that happened with this patient</Translate>
          </span>
        </div>
        <div className="patient-activity-header-actions">
          <MyButton
            appearance="ghost"
            prefixIcon={() => <MdOutlineAccountTree />}
            onClick={() => setOpenPlan(true)}
            disabled={isMerged}
          >
            Apply Plan
          </MyButton>
          <MyButton prefixIcon={() => <PlusRound />} onClick={openCreate} disabled={isMerged}>
            New Task
          </MyButton>
        </div>
      </div>

      <div className="patient-activity-widgets">
        {widgets.map(widget => (
          <button
            key={widget.key}
            type="button"
            className={`patient-activity-widget tone-${widget.tone}${focus === widget.key ? ' active' : ''}`}
            aria-pressed={focus === widget.key}
            onClick={() => toggleFocus(widget.key)}
          >
            <span className="patient-activity-widget-label">
              <Translate>{widget.label}</Translate>
            </span>
            <span className="patient-activity-widget-value">{widget.value}</span>
          </button>
        ))}
      </div>

      <div className="patient-activity-toolbar">
        {!isMerged && (
          <div className="patient-activity-quicklog">
            <span className="patient-activity-toolbar-label">
              <Translate>Quick log</Translate>
            </span>
            {quickLogTemplates.map(t => {
              const color = categoryByCode.get(t.categoryCode)?.color || DEFAULT_CATEGORY_COLOR;
              return (
                <button key={t.code} type="button" className="patient-activity-chip" onClick={() => openQuickLogFor(t.code)}>
                  <span style={{ color }}>
                    <ActivityIcon icon={categoryByCode.get(t.categoryCode)?.icon} />
                  </span>
                  {t.name}
                </button>
              );
            })}
            <button type="button" className="patient-activity-chip" onClick={() => openQuickLogFor('')}>
              <MdAdd /> <Translate>Other</Translate>
            </button>
          </div>
        )}
        <div className="patient-activity-search">
          <div className="patient-activity-segment" role="group" aria-label="Source">
            {([
              ['', 'All'],
              ['STAFF', 'Staff'],
              ['SYSTEM', 'System']
            ] as [Source, string][]).map(([value, label]) => (
              <button
                key={label}
                type="button"
                className={source === value ? 'active' : ''}
                aria-pressed={source === value}
                onClick={() => setSource(value)}
              >
                <Translate>{label}</Translate>
              </button>
            ))}
          </div>
          <InputGroup inside size="sm" style={{ width: 220 }}>
            <Input
              placeholder="Search notes and outcomes"
              value={searchDraft}
              onChange={value => setSearchDraft(value)}
              onPressEnter={applySearch}
              onBlur={applySearch}
            />
            <InputGroup.Button onClick={applySearch} aria-label="Search">
              <MdSearch />
            </InputGroup.Button>
          </InputGroup>
        </div>
      </div>

      {isError && (
        <div className="patient-activity-empty">
          <Translate>Failed to load activities.</Translate>
        </div>
      )}

      <div className="patient-activity-columns">
        <section className="patient-activity-panel" hidden={focus === 'done'}>
          <div className="patient-activity-panel-head">
            <h4>
              <Translate>Next steps</Translate>
              <span className="patient-activity-count">{openTasks.length}</span>
            </h4>
            <span className="patient-activity-panel-hint">
              <Translate>By due date</Translate>
            </span>
          </div>
          {loadingOpen && openTasks.length === 0 && <Loader center={false} />}
          {!loadingOpen && openTasks.length === 0 && (
            <div className="patient-activity-placeholder">
              <Translate>{focus ? 'No tasks match this filter.' : 'No open tasks. Add one when something needs following up.'}</Translate>
            </div>
          )}
          {openTasks.map(row => (
            <TaskItem
              key={row.id}
              row={row}
              readOnly={isMerged}
              currentUser={currentUser}
              onComplete={r => openCompleteOrCancel(r, 'complete')}
              onCancel={r => openCompleteOrCancel(r, 'cancel')}
              onEdit={openEdit}
              onClaim={r => runAction(() => claimActivity({ id: r.id, patientId }).unwrap(), 'Task assigned to you')}
              onChecklist={(r, index, done) =>
                runAction(() => markChecklist({ id: r.id, patientId, index, done }).unwrap())
              }
            />
          ))}
        </section>

        <section className="patient-activity-panel">
          <div className="patient-activity-panel-head">
            <h4>
              <Translate>Activity timeline</Translate>
            </h4>
            <span className="patient-activity-panel-hint">
              <Translate>{focus === 'done' ? 'Completed only' : 'Completed and cancelled'}</Translate>
            </span>
          </div>
          {loadingTimeline && timelineGroups.length === 0 && <Loader center={false} />}
          {!loadingTimeline && timelineGroups.length === 0 && (
            <div className="patient-activity-placeholder">
              <Translate>Nothing logged yet. Calls, messages and finished tasks show up here.</Translate>
            </div>
          )}
          {timelineGroups.map(group => (
            <div key={group.label} className="patient-timeline-group">
              <div className="patient-timeline-day">{group.label}</div>
              {group.rows.map(row => (
                <TimelineItem key={row.id} row={row} />
              ))}
            </div>
          ))}
          {timelineTotal > timelineSize && (
            <button
              type="button"
              className="patient-activity-more"
              onClick={() => setTimelineSize(size => size + TIMELINE_PAGE)}
              disabled={loadingTimeline}
            >
              <Translate>{`Show more (${timelineTotal - timelineSize} left)`}</Translate>
            </button>
          )}
        </section>
      </div>

      <AddEditPatientActivity
        open={openForm}
        setOpen={setOpenForm}
        patientId={patientId}
        activity={selected}
        form={form}
        setForm={setForm}
      />
      <ActivityActionModal
        open={openAction}
        setOpen={setOpenAction}
        mode={actionMode}
        activity={selected}
        patientId={patientId}
      />
      <QuickLogModal
        open={openQuickLog}
        setOpen={setOpenQuickLog}
        patientId={patientId}
        activityType={quickLogType}
      />
      <ApplyPlanModal open={openPlan} setOpen={setOpenPlan} patientId={patientId} />
    </div>
  );
};

export default PatientActivities;
