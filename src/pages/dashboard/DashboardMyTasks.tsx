import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from 'rsuite';
import Translate from '@/components/Translate';
import { useGetPatientTaskSummaryQuery } from '@/services/patients/patientActivityService';

const TaskCalendarDashboard = lazy(() => import('@/pages/tasks/TaskCalendarDashboard'));

/** Counts on the Tasks tab. The calendar itself loads only after that tab is opened. */
export const TasksTabTitle: React.FC = () => {
  const { data: mine } = useGetPatientTaskSummaryQuery('MINE');
  const { data: team } = useGetPatientTaskSummaryQuery('TEAM');
  const counts = [mine ? `${mine.open} yours` : '', team ? `${team.open} team` : ''].filter(Boolean);

  return (
    <span className="dashboard-my-tasks-header">
      <Translate>Tasks</Translate>
      {counts.length > 0 && <span className="dashboard-my-tasks-counts">{counts.join(' · ')}</span>}
    </span>
  );
};

/** Team tasks, with a flag that keeps only the ones assigned to you. */
const DashboardMyTasks: React.FC = () => (
  <div className="dashboard-my-tasks">
    <Suspense
      fallback={
        <div style={{ padding: 24 }}>
          <Loader content="Loading tasks…" />
        </div>
      }
    >
      <TaskCalendarDashboard embedded assignedToggle />
      <div className="dashboard-my-tasks-foot">
        <Link to="/task-calendar">
          <Translate>Open the full calendar</Translate>
        </Link>
      </div>
    </Suspense>
  </div>
);

export default DashboardMyTasks;
