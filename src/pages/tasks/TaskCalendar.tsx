import React, { useMemo } from 'react';
import { Calendar, Loader } from 'rsuite';
import dayjs from 'dayjs';
import { useGetPatientTasksQuery, type PatientTaskQuery } from '@/services/patients/patientActivityService';
import { useActivityCatalog, DEFAULT_CATEGORY_COLOR } from '@/pages/patient/patient-profile/tabs/Activities/activityCatalog';
import type { PatientTaskRow } from '@/services/patients/patientActivityService';

type Props = {
  /** The list filters; the calendar adds the month range itself. */
  query: Omit<PatientTaskQuery, 'dueFrom' | 'dueTo' | 'page' | 'size'>;
  month: Date;
  setMonth: (month: Date) => void;
  onPickDay: (day: Date) => void;
};

const SHOWN_PER_DAY = 3;
const MONTH_LIMIT = 500;

/** A month of tasks by due date; picking a day opens that day in the list. */
const TaskCalendar: React.FC<Props> = ({ query, month, setMonth, onPickDay }) => {
  const { templateName, categoryByCode } = useActivityCatalog();
  // The grid shows parts of the weeks around the month, so fetch those days too
  const from = dayjs(month).startOf('month').startOf('week');
  const to = dayjs(month).endOf('month').endOf('week').add(1, 'day').startOf('day');

  const { data, isFetching } = useGetPatientTasksQuery({
    ...query,
    page: 0,
    size: MONTH_LIMIT,
    dueFrom: from.toISOString(),
    dueTo: to.toISOString()
  });

  const byDay = useMemo(() => {
    const days = new Map<string, PatientTaskRow[]>();
    (data?.data ?? []).forEach(row => {
      const key = dayjs(row.task.dueAt).format('YYYY-MM-DD');
      days.set(key, [...(days.get(key) ?? []), row]);
    });
    return days;
  }, [data]);

  const renderCell = (date: Date) => {
    const rows = byDay.get(dayjs(date).format('YYYY-MM-DD')) ?? [];
    if (!rows.length) return null;
    return (
      <ul className="task-calendar-items">
        {rows.slice(0, SHOWN_PER_DAY).map(({ task, patientName }) => {
          const color = categoryByCode.get(task.category)?.color || DEFAULT_CATEGORY_COLOR;
          const overdue = task.status === 'OPEN' && dayjs(task.dueAt).isBefore(dayjs());
          return (
            <li
              key={task.id}
              className={`${task.status.toLowerCase()}${overdue ? ' overdue' : ''}`}
              style={{ borderLeftColor: color }}
              title={`${templateName(task.activityType)} · ${patientName ?? ''}`}
            >
              {templateName(task.activityType)}
            </li>
          );
        })}
        {rows.length > SHOWN_PER_DAY && <li className="more">+{rows.length - SHOWN_PER_DAY} more</li>}
      </ul>
    );
  };

  return (
    <div className="task-calendar">
      {isFetching && <Loader className="task-calendar-loader" />}
      <Calendar
        bordered
        value={month}
        onMonthChange={setMonth}
        onSelect={day => onPickDay(day)}
        renderCell={renderCell}
      />
    </div>
  );
};

export default TaskCalendar;
