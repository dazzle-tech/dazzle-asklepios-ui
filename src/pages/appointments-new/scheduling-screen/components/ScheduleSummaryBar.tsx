import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';

type Props = {
  slotSummaryBarStats: any;
  selectedDepartment: { departmentId: number | string | null };
  departmentOptions: any[];
  selectedResources: { resourceKey: string | null };
  resourceNameById: Map<string, string>;
  selectedResourceTypeValue: { value: string | null };
  onRescheduleClick?: () => void;
};

const ScheduleSummaryBar = ({
  slotSummaryBarStats,
  selectedDepartment,
  departmentOptions,
  selectedResources,
  resourceNameById,
  selectedResourceTypeValue,
  onRescheduleClick
}: Props) => {
  return (
    <div className="appointments-slot-summary-bar">
      <div className="appointments-slot-summary-bar-row">
        <div className="appointments-slot-summary-bar-main">
          <div className="appointments-slot-summary-scope">
            <span className="appointments-slot-summary-scope-date">{slotSummaryBarStats.rangeLabel}</span>
            <span className="appointments-slot-summary-scope-meta">
              {selectedDepartment?.departmentId
                ? (departmentOptions as any[])?.find(
                    (d: any) => String(d?.id) === String(selectedDepartment.departmentId)
                  )?.name ?? `Dept #${selectedDepartment.departmentId}`
                : 'All departments'}
              {selectedResources?.resourceKey != null && String(selectedResources.resourceKey).trim() !== ''
                ? ` · ${resourceNameById.get(String(selectedResources.resourceKey))?.trim() || 'Resource'}`
                : selectedResourceTypeValue?.value
                  ? ` · ${String(selectedResourceTypeValue.value)}`
                  : ''}
            </span>
          </div>
          <div className="appointments-slot-summary-metrics appointments-slot-summary-metrics--single-row">
            <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
              <span className="appointments-slot-summary-icon appointments-slot-summary-icon--total">
                <FontAwesomeIcon icon={faClock} />
              </span>
              <span className="appointments-slot-summary-text">
                <strong>{slotSummaryBarStats.total}</strong> Slots
              </span>
            </div>
            {slotSummaryBarStats.legendRow.map((row: any) => (
              <React.Fragment key={row.label}>
                <div className="appointments-slot-summary-divider" />
                <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
                  <span
                    className="appointments-slot-summary-icon"
                    style={{ backgroundColor: row.summaryIconBg }}
                  >
                    <FontAwesomeIcon icon={row.icon} />
                  </span>
                  <span className="appointments-slot-summary-text">
                    <strong>{row.count}</strong> {row.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
            {slotSummaryBarStats.otherCount > 0 ? (
              <>
                <div className="appointments-slot-summary-divider" />
                <div className="appointments-slot-summary-item appointments-slot-summary-item--shrink0">
                  <span className="appointments-slot-summary-text appointments-slot-summary-muted">
                    <strong>{slotSummaryBarStats.otherCount}</strong> Other
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSummaryBar;
