import React from 'react';
import { FaTimes } from 'react-icons/fa';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { ClinicalRecommendation } from '@/services/ai-services/clinicalRecommendationsService';
import { categoryLabel, PRIORITY_ICONS, PRIORITY_LABELS, toBucket } from './utils';

type Props = {
  recommendation: ClinicalRecommendation;
  index: number;
  isOpen: boolean;
  isDismissed: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onUndo: () => void;
};

const DetailSection = ({ title, text, items }: { title: string; text?: string | null; items?: string[] }) => {
  if (!text && !items?.length) return null;
  return (
    <>
      <h4>
        <Translate>{title}</Translate>
      </h4>
      {items?.length ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{text}</p>
      )}
    </>
  );
};

const RecommendationRow: React.FC<Props> = ({
  recommendation: r,
  index,
  isOpen,
  isDismissed,
  onToggle,
  onDismiss,
  onUndo
}) => {
  if (isDismissed) {
    return (
      <div className="ai-rec-row dismissed">
        <span>{r.title}</span>
        <MyButton appearance="link" size="xs" onClick={onUndo}>
          Undo
        </MyButton>
      </div>
    );
  }

  const bucket = toBucket(r.priority);

  return (
    <div className={`ai-rec-row${isOpen ? ' open' : ''}`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="ai-rec-row__top">
        <span className={`ai-rec-pri ${bucket}`}>
          <span aria-hidden="true">{PRIORITY_ICONS[bucket]}</span> <Translate>{PRIORITY_LABELS[bucket]}</Translate>
        </span>
        <span className="ai-rec-cat">
          <Translate>{categoryLabel(r.type)}</Translate>
        </span>
        <span className="acts">
          <button type="button" title="Dismiss" aria-label="Dismiss" onClick={onDismiss}>
            <FaTimes />
          </button>
        </span>
      </div>

      <button type="button" className="ai-rec-row__title" aria-expanded={isOpen} onClick={onToggle}>
        {r.title}
      </button>
      <p className="ai-rec-row__desc">{r.description}</p>

      <div className="detail">
        {r.description && <p>{r.description}</p>}
        <DetailSection title="Why this is suggested" text={r.rationale} />
        <DetailSection title="Suggested actions" items={r.actionable_steps} />
        <DetailSection title="Cautions" items={r.contraindications} />
        <DetailSection title="Monitoring" text={r.monitoring_requirements} />
        <DetailSection title="Follow-up" text={r.follow_up} />
      </div>
    </div>
  );
};

export default RecommendationRow;
