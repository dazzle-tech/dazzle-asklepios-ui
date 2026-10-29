import React from 'react';
import { MdOutlineSmartToy } from 'react-icons/md';
import dayjs from 'dayjs';
import type { PatientActivity } from '@/types/model-types-new';
import { ActivityIcon, DEFAULT_CATEGORY_COLOR, useActivityCatalog } from './activityCatalog';

/** When the entry closed, which is what the timeline orders and groups by. */
export const closedAt = (row: PatientActivity) => row.completedAt || row.cancelledAt || row.createdDate || '';

const TimelineItem: React.FC<{ row: PatientActivity }> = ({ row }) => {
  const { templateName, categoryByCode, planName } = useActivityCatalog();
  const category = categoryByCode.get(row.category);
  const color = category?.color || DEFAULT_CATEGORY_COLOR;
  const isCancelled = row.status === 'CANCELLED';
  const isSystem = row.source === 'SYSTEM';
  const when = closedAt(row);
  const by = isCancelled ? row.cancelledBy : row.completedBy || row.createdBy;
  const wasTask = Boolean(row.dueAt) && row.completedAt && row.createdDate &&
    dayjs(row.completedAt).diff(dayjs(row.createdDate), 'minute') > 1;
  const detail = isCancelled ? row.cancellationReason : row.outcomeNote;

  return (
    <div className={`patient-timeline-item${isCancelled ? ' cancelled' : ''}`}>
      <span className="patient-timeline-icon" style={{ color, background: `${color}1a` }}>
        {isSystem ? <MdOutlineSmartToy /> : <ActivityIcon icon={category?.icon} />}
      </span>
      <div className="patient-timeline-body">
        <div className="patient-timeline-title">
          <span>{templateName(row.activityType)}</span>
          {row.outcome && <span className="patient-activity-tag outcome">{row.outcome}</span>}
          {isCancelled && <span className="patient-activity-tag cancelled">Cancelled</span>}
          {row.planCode && <span className="patient-activity-tag plan">{planName(row.planCode)}</span>}
          {wasTask && !isCancelled && <span className="patient-activity-tag done">Task done</span>}
        </div>
        {row.note && <p className="patient-timeline-note">{row.note}</p>}
        {detail && <p className="patient-timeline-detail">{detail}</p>}
        <div className="patient-timeline-meta">
          {when ? dayjs(when).format('HH:mm') : ''}
          {by ? ` · ${by}` : ''}
          {isSystem ? ' · System' : ''}
          {category ? ` · ${category.name}` : ''}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
