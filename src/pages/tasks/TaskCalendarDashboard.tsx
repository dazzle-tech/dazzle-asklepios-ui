import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Loader, Panel } from 'rsuite';
import {
  MdCheckCircleOutline,
  MdChevronLeft,
  MdChevronRight,
  MdOpenInNew,
  MdOutlineFlag,
  MdOutlinePersonAddAlt
} from 'react-icons/md';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import Translate from '@/components/Translate';
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
  useClaimPatientActivityMutation,
  useGetActivityPlansQuery,
  useGetPatientTaskCalendarQuery,
  useGetPatientTaskSummaryQuery,
  useReschedulePatientActivityMutation,
  type PatientTaskRow,
  type TaskScope
} from '@/services/patients/patientActivityService';
import type { PatientActivity } from '@/types/model-types-new';
import ActivityActionModal from '@/pages/patient/patient-profile/tabs/Activities/ActivityActionModal';
import TaskDrawer from '@/pages/patient/patient-profile/tabs/Activities/TaskDrawer';
import { dueState } from '@/pages/patient/patient-profile/tabs/Activities/TaskItem';
import {
  DEFAULT_CATEGORY_COLOR,
  useActivityCatalog
} from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import '@/pages/patient/patient-profile/tabs/Activities/styles.less';
import './styles.less';
import './calendar.less';

type View = 'month' | 'week' | 'agenda';
type StatusView = 'OPEN' | 'DONE' | 'ALL';

const ALL = 'all';
const FILTER_WIDTH = 180;
const SEARCH_DELAY_MS = 400;
const MONTH_SHOWN = 3;

const emptyFilters = { category: ALL, planCode: ALL, priority: [] as string[] };

const scopeHint: Record<TaskScope, string> = {
  MINE: 'Tasks assigned to you. Drag an open task onto another day to reschedule it — the time of day stays.',
  TEAM: 'Tasks for your job role in this facility. Drag an open task onto another day to reschedule it.',
  ALL: 'Every task in this facility. Drag an open task onto another day to reschedule it.'
};

const who = (task: PatientActivity, currentUser?: string) => {
  if (task.assignedTo) return task.assignedTo === currentUser ? 'You' : task.assignedTo;
  const team = (task.assignedRoles ?? []).map(formatEnumString).join(', ');
  return team || 'Unassigned';
};

const heatColor = (rows: PatientTaskRow[]) => {
  const open = rows.filter(row => row.task.status === 'OPEN');
  if (open.some(row => row.task.priority === 'URGENT')) return '#e11d48';
  if (open.some(row => row.task.priority === 'HIGH')) return '#ea580c';
  return '#3b82f6';
};

type ChipProps = {
  row: PatientTaskRow;
  name: string;
  color: string;
  moving: boolean;
  dragged: React.MutableRefObject<boolean>;
  onOpen: () => void;
  rich?: boolean;
};

/** A task you can grab. Closed tasks open, they do not move. */
const TaskChip: React.FC<ChipProps> = ({ row, name, color, moving, dragged, onOpen, rich }) => {
  const task = row.task;
  const open = task.status === 'OPEN';
  const overdue = open && !!task.dueAt && dayjs(task.dueAt).isBefore(dayjs());
  const due = dueState(task.dueAt);
  return (
    <button
      type="button"
      draggable={open && !moving}
      className={[
        rich ? 'task-cal-card' : 'task-cal-chip',
        task.status.toLowerCase(),
        overdue ? 'is-overdue' : '',
        moving ? 'is-moving' : ''
      ].join(' ')}
      style={{ borderLeftColor: color }}
      title={`${name} · ${row.patientName || 'Patient'} · ${due.label}`}
      onDragStart={event => {
        if (!open) {
          event.preventDefault();
          return;
        }
        dragged.current = true;
        event.dataTransfer.setData('text/plain', String(task.id));
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => window.setTimeout(() => { dragged.current = false; }, 0)}
      onClick={event => {
        event.stopPropagation();
        if (dragged.current) return;
        onOpen();
      }}
    >
      {rich && <span className="task-cal-card-time">{task.dueAt ? dayjs(task.dueAt).format('HH:mm') : ''}</span>}
      <span className="task-cal-card-body">
        <strong>{name}</strong>
        {rich && <small>{row.patientName || `Patient ${task.patientId}`}</small>}
      </span>
      {rich && task.priority && task.priority !== 'NORMAL' && <MdOutlineFlag className={`priority-${task.priority.toLowerCase()}`} />}
      {!rich && <span className="task-cal-chip-time">{task.dueAt ? dayjs(task.dueAt).format('HH:mm') : ''}</span>}
    </button>
  );
};

type Props = {
  /** Inside another page. Leaves that page's title alone. */
  embedded?: boolean;
  /**
   * Dashboard calendar: team tasks, with a flag that keeps only the ones assigned to you.
   * The Tasks screen keeps its Mine / Team / All switch instead.
   */
  assignedToggle?: boolean;
};

const TaskCalendarDashboard: React.FC<Props> = ({ embedded = false, assignedToggle = false }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth?.user?.login) as string | undefined;
  const { categories, categoryByCode, templateName } = useActivityCatalog();
  const priorityOptions = useEnumOptions('PatientActivityPriority');
  const { data: plans = [] } = useGetActivityPlansQuery();

  const [scope, setScope] = useState<TaskScope>(assignedToggle ? 'TEAM' : 'MINE');
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [statusView, setStatusView] = useState<StatusView>('OPEN');
  const [unassigned, setUnassigned] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [drawerRow, setDrawerRow] = useState<PatientTaskRow | null>(null);
  const [actionTask, setActionTask] = useState<PatientActivity | null>(null);
  const dragged = useRef(false);
  const movingRef = useRef<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const [reschedule] = useReschedulePatientActivityMutation();
  const [claim] = useClaimPatientActivityMutation();
  const [loadPatient] = useLazyGetPatientByIdQuery();

  useEffect(() => {
    if (embedded) return;
    dispatch(setPageCode('TaskCalendar'));
    dispatch(setDivContent('Task Calendar'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, embedded]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const range = useMemo(() => {
    const anchor = dayjs(cursor);
    if (view === 'week') {
      const from = anchor.startOf('week');
      return { from, to: from.add(7, 'day') };
    }
    if (view === 'agenda') {
      const from = anchor.startOf('day');
      return { from, to: from.add(14, 'day') };
    }
    const from = anchor.startOf('month').startOf('week');
    return { from, to: anchor.endOf('month').endOf('week').add(1, 'day').startOf('day') };
  }, [cursor, view]);

  const days = useMemo(() => {
    const list: dayjs.Dayjs[] = [];
    for (let day = range.from; day.isBefore(range.to); day = day.add(1, 'day')) list.push(day);
    return list;
  }, [range]);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const { data: summary } = useGetPatientTaskSummaryQuery(scope);
  const { data, isFetching, isError } = useGetPatientTaskCalendarQuery({
    scope,
    status: statusView === 'ALL' ? undefined : [statusView],
    category: filters.category === ALL ? undefined : filters.category,
    priority: filters.priority.length ? filters.priority : undefined,
    planCode: filters.planCode === ALL ? undefined : filters.planCode,
    search: search || undefined,
    unassigned: unassigned || undefined,
    dueFrom: range.from.toISOString(),
    dueTo: range.to.toISOString(),
    overdueBefore: dayjs(todayKey).startOf('day').toISOString()
  });

  const byDay = useMemo(() => {
    const map = new Map<string, PatientTaskRow[]>();
    (data?.tasks ?? []).forEach(row => {
      if (!row.task.dueAt) return;
      const key = dayjs(row.task.dueAt).format('YYYY-MM-DD');
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return map;
  }, [data]);

  const rowById = useMemo(() => {
    const map = new Map<number, PatientTaskRow>();
    (data?.tasks ?? []).forEach(row => map.set(row.task.id, row));
    (data?.overdue ?? []).forEach(row => map.set(row.task.id, row));
    return map;
  }, [data]);

  const legend = useMemo(() => {
    const codes = new Set<string>();
    (data?.tasks ?? []).forEach(row => codes.add(row.task.category));
    (data?.overdue ?? []).forEach(row => codes.add(row.task.category));
    return [...codes]
      .map(code => categoryByCode.get(code))
      .filter((category): category is NonNullable<typeof category> => Boolean(category));
  }, [data, categoryByCode]);

  const label =
    view === 'month'
      ? dayjs(cursor).format('MMMM YYYY')
      : `${range.from.format('DD MMM')} – ${range.to.subtract(1, 'day').format(view === 'week' ? 'DD MMM YYYY' : 'DD MMM')}`;

  const selectedKey = dayjs(selectedDay).format('YYYY-MM-DD');
  const selectedRows = byDay.get(selectedKey) ?? [];
  const selectedOpen = selectedRows.filter(row => row.task.status === 'OPEN').length;

  const hasFilters =
    Boolean(search) || unassigned || filters.category !== ALL || filters.planCode !== ALL || filters.priority.length > 0;

  const go = (direction: number) => {
    if (direction === 0) {
      const today = new Date();
      setCursor(today);
      setSelectedDay(today);
      return;
    }
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
    const amount = view === 'agenda' ? 14 : 1;
    const next = dayjs(cursor).add(direction * amount, unit).toDate();
    setCursor(next);
    setSelectedDay(next);
  };

  const paint = (row: PatientTaskRow) => ({
    name: templateName(row.task.activityType),
    color: categoryByCode.get(row.task.category)?.color || DEFAULT_CATEGORY_COLOR
  });

  const openPatient = async (patientId: number) => {
    try {
      const patient = await loadPatient({ id: patientId }).unwrap();
      navigate('/patient-profile', { state: { patient } });
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to open the patient', sev: 'warning' }));
    }
  };

  const moveTask = async (row: PatientTaskRow, dayKey: string) => {
    const task = row.task;
    if (task.status !== 'OPEN' || !task.dueAt || movingRef.current != null) return;
    if (dayjs(task.dueAt).format('YYYY-MM-DD') === dayKey) return;
    const due = dayjs(task.dueAt);
    const next = dayjs(dayKey).hour(due.hour()).minute(due.minute()).second(0).millisecond(0);
    movingRef.current = task.id;
    setMovingId(task.id);
    try {
      await reschedule({ id: task.id, patientId: task.patientId, dueAt: next.toISOString() }).unwrap();
      dispatch(notify({ msg: `Due ${next.format('ddd, DD MMM HH:mm')}`, sev: 'success' }));
      setSelectedDay(next.toDate());
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to move the task', sev: 'warning' }));
    } finally {
      movingRef.current = null;
      setMovingId(null);
    }
  };

  const take = async (row: PatientTaskRow) => {
    try {
      await claim({ id: row.task.id, patientId: row.task.patientId }).unwrap();
      dispatch(notify({ msg: 'Task assigned to you', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: extractApiErrorMessage(error) || 'Failed to take the task', sev: 'warning' }));
    }
  };

  const dayClass = (day: dayjs.Dayjs, extra: string) =>
    [
      extra,
      dropKey === day.format('YYYY-MM-DD') ? 'is-drop' : '',
      day.isSame(dayjs(), 'day') ? 'is-today' : '',
      day.isSame(selectedDay, 'day') ? 'is-selected' : '',
      view === 'month' && !day.isSame(cursor, 'month') ? 'is-out' : ''
    ]
      .filter(Boolean)
      .join(' ');

  const dayDrop = (day: dayjs.Dayjs) => ({
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      const key = day.format('YYYY-MM-DD');
      setDropKey(current => (current === key ? current : key));
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDropKey(null);
      const row = rowById.get(Number(event.dataTransfer.getData('text/plain')));
      if (row) moveTask(row, day.format('YYYY-MM-DD'));
    },
    onClick: () => setSelectedDay(day.toDate())
  });

  const chip = (row: PatientTaskRow, rich = false) => {
    const { name, color } = paint(row);
    return (
      <TaskChip
        key={row.task.id}
        row={row}
        name={name}
        color={color}
        rich={rich}
        moving={movingId === row.task.id}
        dragged={dragged}
        onOpen={() => {
          if (row.task.dueAt) {
            const due = dayjs(row.task.dueAt);
            if (!due.isBefore(range.from) && due.isBefore(range.to)) setSelectedDay(due.toDate());
          }
          setDrawerRow(row);
        }}
      />
    );
  };

  const widgets: { key: string; label: string; value: number; tone: string; active?: boolean; onClick?: () => void; hidden?: boolean }[] = [
    {
      key: 'open',
      label: 'Open',
      value: summary?.open ?? 0,
      tone: 'neutral',
      active: statusView === 'OPEN' && !unassigned,
      onClick: () => {
        setUnassigned(false);
        setStatusView('OPEN');
        go(0);
      }
    },
    {
      key: 'today',
      label: 'Due today',
      value: summary?.dueToday ?? 0,
      tone: 'warning',
      active: selectedKey === todayKey && statusView === 'OPEN',
      onClick: () => {
        setStatusView('OPEN');
        go(0);
      }
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: summary?.overdue ?? 0,
      tone: 'danger',
      onClick: () => {
        setStatusView('OPEN');
        setUnassigned(false);
        go(0);
        railRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    {
      key: 'unassigned',
      label: 'Not taken',
      value: summary?.unassigned ?? 0,
      tone: 'accent',
      hidden: scope === 'MINE',
      active: unassigned,
      onClick: () => {
        setStatusView('OPEN');
        setUnassigned(current => !current);
      }
    },
    { key: 'done', label: 'Done today', value: summary?.completedToday ?? 0, tone: 'success' }
  ];

  return (
    <Panel className={`task-cal${embedded ? ' task-cal-embedded' : ''}${isFetching ? ' is-fetching' : ''}`}>
      <div className="patient-activity-widgets task-cal-widgets">
        {widgets
          .filter(widget => !widget.hidden)
          .map(widget =>
            widget.onClick ? (
              <button
                key={widget.key}
                type="button"
                className={`patient-activity-widget tone-${widget.tone}${widget.active ? ' active' : ''}`}
                onClick={widget.onClick}
              >
                <span className="patient-activity-widget-label">
                  <Translate>{widget.label}</Translate>
                </span>
                <span className="patient-activity-widget-value">{widget.value}</span>
              </button>
            ) : (
              <div key={widget.key} className={`patient-activity-widget tone-${widget.tone} is-static`}>
                <span className="patient-activity-widget-label">
                  <Translate>{widget.label}</Translate>
                </span>
                <span className="patient-activity-widget-value">{widget.value}</span>
              </div>
            )
          )}
      </div>

      <div className="task-cal-toolbar">
        {assignedToggle ? (
          <Checkbox
            className="task-cal-assigned"
            checked={scope === 'MINE'}
            onChange={(_, checked) => {
              setUnassigned(false);
              setScope(checked ? 'MINE' : 'TEAM');
            }}
          >
            <Translate>Only assigned to me</Translate>
          </Checkbox>
        ) : (
          <div className="patient-activity-segment" role="group" aria-label="Whose tasks">
            {(['MINE', 'TEAM', 'ALL'] as TaskScope[]).map(value => (
              <button key={value} type="button" className={scope === value ? 'active' : ''} onClick={() => setScope(value)}>
                <Translate>{value === 'MINE' ? 'Mine' : value === 'TEAM' ? 'Team' : 'All'}</Translate>
              </button>
            ))}
          </div>
        )}
        <div className="task-cal-nav">
          <button type="button" aria-label="Previous" onClick={() => go(-1)}>
            <MdChevronLeft />
          </button>
          <button type="button" onClick={() => go(0)}>
            <Translate>Today</Translate>
          </button>
          <strong>{label}</strong>
          <button type="button" aria-label="Next" onClick={() => go(1)}>
            <MdChevronRight />
          </button>
        </div>
        <div className="patient-activity-segment" role="group" aria-label="Calendar view">
          {(['month', 'week', 'agenda'] as View[]).map(value => (
            <button key={value} type="button" className={view === value ? 'active' : ''} onClick={() => setView(value)}>
              <Translate>{value === 'month' ? 'Month' : value === 'week' ? 'Week' : 'Agenda'}</Translate>
            </button>
          ))}
        </div>
      </div>

      <p className="task-cal-hint">{scopeHint[scope]}</p>

      <div className="task-cal-filters-row">
        <div className="patient-activity-segment" role="group" aria-label="Status">
          {(['OPEN', 'DONE', 'ALL'] as StatusView[]).map(value => (
            <button
              key={value}
              type="button"
              className={statusView === value ? 'active' : ''}
              onClick={() => setStatusView(value)}
            >
              <Translate>{value === 'OPEN' ? 'Open' : value === 'DONE' ? 'Completed' : 'All'}</Translate>
            </button>
          ))}
        </div>
        <Form fluid className="form-of-filters-set-up task-board-filters task-cal-filters">
          <MyInput
            width={FILTER_WIDTH + 40}
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
            <MyButton
              appearance="ghost"
              onClick={() => {
                setFilters(emptyFilters);
                setSearchDraft('');
                setSearch('');
                setUnassigned(false);
              }}
            >
              Clear
            </MyButton>
          )}
        </Form>
      </div>

      {legend.length > 0 && (
        <div className="task-cal-legend">
          {legend.map(category => (
            <span key={category.code}>
              <i style={{ background: category.color || DEFAULT_CATEGORY_COLOR }} />
              {category.name}
            </span>
          ))}
        </div>
      )}

      {data?.truncated && (
        <div className="task-cal-banner">
          <Translate>This range has more tasks than the calendar can draw. Narrow the filters to see the rest.</Translate>
        </div>
      )}
      {isError && (
        <div className="task-cal-banner is-error">
          <Translate>The calendar could not be loaded.</Translate>
        </div>
      )}

      <div className="task-cal-body">
        <div className="task-cal-main">
          {isFetching && <Loader className="task-cal-loader" />}

          {(data?.overdueCount ?? 0) > 0 && statusView !== 'DONE' && (
            <div className="task-cal-rail" ref={railRef}>
              <div className="task-cal-rail-title">
                <Translate>Open before today</Translate>
                <strong>{data?.overdueCount}</strong>
              </div>
              <div className="task-cal-rail-list">
                {(data?.overdue ?? []).map(row => chip(row))}
              </div>
              {(data?.overdueCount ?? 0) > (data?.overdue.length ?? 0) && (
                <p className="task-cal-rail-more">
                  <Translate>{`Showing ${data?.overdue.length} of ${data?.overdueCount}. The task lists have the rest.`}</Translate>
                </p>
              )}
            </div>
          )}

          {view === 'month' && (
            <div className="task-cal-month">
              <div className="task-cal-weekdays">
                {days.slice(0, 7).map(day => (
                  <span key={day.format('dd')}>{day.format('ddd')}</span>
                ))}
              </div>
              <div className="task-cal-month-grid">
                {days.map(day => {
                  const key = day.format('YYYY-MM-DD');
                  const rows = byDay.get(key) ?? [];
                  const openCount = rows.filter(row => row.task.status === 'OPEN').length;
                  return (
                    <div key={key} className={dayClass(day, 'task-cal-cell')} {...dayDrop(day)}>
                      <div className="task-cal-cell-top">
                        <span className="task-cal-date">{day.date()}</span>
                        {openCount > 0 && <span className="task-cal-count">{openCount}</span>}
                      </div>
                      {rows.slice(0, MONTH_SHOWN).map(row => chip(row))}
                      {rows.length > MONTH_SHOWN && (
                        <button
                          type="button"
                          className="task-cal-more"
                          onClick={event => {
                            event.stopPropagation();
                            setSelectedDay(day.toDate());
                          }}
                        >
                          +{rows.length - MONTH_SHOWN}
                        </button>
                      )}
                      {openCount > 0 && (
                        <span
                          className="task-cal-heat"
                          style={{ width: `${(Math.min(openCount, 6) / 6) * 100}%`, background: heatColor(rows) }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            <div className="task-cal-week">
              {days.map(day => {
                const rows = byDay.get(day.format('YYYY-MM-DD')) ?? [];
                return (
                  <div key={day.format('YYYY-MM-DD')} className={dayClass(day, 'task-cal-week-col')} {...dayDrop(day)}>
                    <div className="task-cal-week-head">
                      <span className="task-cal-date">{day.format('ddd D')}</span>
                      <small>{rows.filter(row => row.task.status === 'OPEN').length}</small>
                    </div>
                    {rows.map(row => chip(row, true))}
                    {rows.length === 0 && <p className="task-cal-drop-hint">Drop a task</p>}
                  </div>
                );
              })}
            </div>
          )}

          {view === 'agenda' && (
            <div className="task-cal-agenda">
              {days.map(day => {
                const rows = byDay.get(day.format('YYYY-MM-DD')) ?? [];
                return (
                  <section key={day.format('YYYY-MM-DD')} className={dayClass(day, 'task-cal-agenda-day')} {...dayDrop(day)}>
                    <header>
                      <span className="task-cal-date">{day.format('dddd, DD MMM')}</span>
                      <small>{rows.filter(row => row.task.status === 'OPEN').length} open</small>
                    </header>
                    {rows.length === 0 && <p className="task-cal-drop-hint">Nothing due — drop a task here</p>}
                    {rows.map(row => chip(row, true))}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <aside className="task-cal-dock">
          <p className="task-cal-dock-kicker">
            <Translate>{dayjs(selectedDay).isSame(dayjs(), 'day') ? 'Today' : dayjs(selectedDay).format('dddd')}</Translate>
          </p>
          <h3>{dayjs(selectedDay).format('DD MMMM')}</h3>
          <p className="task-cal-dock-meta">
            {selectedRows.length === 0
              ? 'Nothing due. Drop a task on this day to move it here.'
              : `${selectedOpen} open · ${selectedRows.length - selectedOpen} closed`}
          </p>
          {selectedRows.length > 0 && (
            <div className="task-cal-progress">
              <span style={{ width: `${Math.round(((selectedRows.length - selectedOpen) / selectedRows.length) * 100)}%` }} />
            </div>
          )}
          <div className="task-cal-dock-list">
            {selectedRows.map(row => {
              const task = row.task;
              const { color } = paint(row);
              return (
                <article key={task.id} className="task-cal-dock-item" style={{ borderLeftColor: color }}>
                  {chip(row, true)}
                  <div className="task-cal-dock-who">{who(task, currentUser)}</div>
                  {task.note && <p className="task-cal-dock-note">{task.note}</p>}
                  <div className="task-cal-dock-actions">
                    {task.status === 'OPEN' && (
                      <button type="button" onClick={() => setActionTask(task)}>
                        <MdCheckCircleOutline /> <Translate>Complete</Translate>
                      </button>
                    )}
                    {task.status === 'OPEN' && task.assignedTo !== currentUser && (
                      <button type="button" onClick={() => take(row)}>
                        <MdOutlinePersonAddAlt /> <Translate>Take</Translate>
                      </button>
                    )}
                    <button type="button" onClick={() => openPatient(task.patientId)}>
                      <MdOpenInNew /> <Translate>Patient</Translate>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>

      <TaskDrawer
        taskId={drawerRow?.task.id ?? null}
        onClose={() => setDrawerRow(null)}
        patientName={drawerRow?.patientName}
        medicalRecordNumber={drawerRow?.medicalRecordNumber}
        onOpenPatient={openPatient}
      />
      <ActivityActionModal
        open={Boolean(actionTask)}
        setOpen={open => {
          if (!open) setActionTask(null);
        }}
        mode="complete"
        activity={actionTask}
        patientId={actionTask?.patientId as number}
      />
    </Panel>
  );
};

export default TaskCalendarDashboard;
