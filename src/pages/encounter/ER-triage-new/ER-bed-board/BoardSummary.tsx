import Translate from '@/components/Translate';
import React from 'react';
import BoardIcon from './BoardIcon';
import type { BoardMetric } from './useERBedBoardData';

type BoardSummaryProps = {
  metrics: BoardMetric[];
  occupancyPct: number;
};

const BoardSummary = ({ metrics, occupancyPct }: BoardSummaryProps) => (
  <section className="ebb-kpis" aria-label="Department summary">
    {metrics.map(metric => (
      <div className={`ebb-kpi ${metric.tone}`} key={metric.label}>
        <div className="ebb-kpi-top">
          <span>
            <Translate>{metric.label}</Translate>
          </span>
          <div className="ebb-metric-icon">
            <BoardIcon name={metric.icon} />
          </div>
        </div>

        <div className="ebb-metric-value ebb-num">
          {metric.value}
          <small>{metric.suffix}</small>
        </div>

        <div className="ebb-metric-detail">{metric.detail}</div>

        {metric.icon === 'bed' && (
          <div className="ebb-occupancy-track">
            <span style={{ width: `${occupancyPct}%` }} />
          </div>
        )}
      </div>
    ))}
  </section>
);

export default BoardSummary;
