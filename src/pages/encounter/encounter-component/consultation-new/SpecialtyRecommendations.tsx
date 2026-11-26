import React from 'react';
import { LuSparkles } from 'react-icons/lu';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import AiTooltip from '@/components/AiTooltip/AiTooltip';
import type { SpecialtyConsultationResponse } from '@/services/ai-services/clinicalRecommendationsService';
import './specialtyRecommendations.less';

export type SpecialtyAiPhase = 'idle' | 'loading' | 'error' | 'empty' | 'result';

// Card priorities from the AI specialty prototype; anything else is shown as routine
const PRIORITIES = ['critical', 'high', 'moderate', 'low', 'routine'];

type ButtonProps = {
  disabled: boolean;
  phase: SpecialtyAiPhase;
  onClick: () => void;
};

// Icon only: MyButton passes a label spacing style that this button does not need
const SparkIcon = () => <LuSparkles className="sr-ai-btn__spark" size={18} />;

export const SpecialtyAiButton: React.FC<ButtonProps> = ({ disabled, phase, onClick }) => (
  <AiTooltip
    title="AI specialty recommendations"
    body="When a consultant specialty is selected, AI reviews the patient context and returns specialty-specific actions for this consultation."
    chips={['Summary', 'Prioritized actions', 'Clinical caution']}
    foot={disabled ? 'Select a consultant specialty first.' : 'AI suggestions support, not replace, clinical judgment.'}
  >
    {/* The tooltip sits on the wrapper, so it still shows while the button is disabled */}
    <span
      className={`sr-ai-btn${phase === 'loading' ? ' sr-ai-btn--working' : ''}${phase === 'result' ? ' sr-ai-btn--ready' : ''}`}
      aria-label="AI specialty recommendations"
    >
      <MyButton appearance="ghost" prefixIcon={SparkIcon} disabled={disabled || phase === 'loading'} onClick={onClick} />
      <span className="sr-ai-btn__badge" aria-hidden="true">
        AI
      </span>
      <span className="sr-ai-btn__ready" aria-hidden="true" />
    </span>
  </AiTooltip>
);

type CardProps = {
  phase: SpecialtyAiPhase;
  specialty?: string | null;
  result?: SpecialtyConsultationResponse | null;
  onRetry: () => void;
};

const SpecialtyRecommendations: React.FC<CardProps> = ({ phase, specialty, result, onRetry }) => {
  const actions = result?.actions ?? [];

  const renderBody = () => {
    if (phase === 'loading') {
      return (
        <div className="sr-card__loading" role="status" aria-label="Loading recommendations">
          <span className="sr-card__orb" aria-hidden="true">
            <LuSparkles size={20} />
          </span>
          <span className="sr-card__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      );
    }

    if (phase === 'error') {
      return (
        <div className="sr-card__error">
          <div className="sr-card__error-title">
            <Translate>AI recommendations unavailable</Translate>
          </div>
          <div className="sr-card__muted">
            <Translate>Something went wrong while generating the recommendations.</Translate>
          </div>
          <div>
            <MyButton onClick={onRetry}>
              Retry
            </MyButton>
          </div>
        </div>
      );
    }

    if (phase === 'empty') {
      return (
        <div className="sr-card__empty">
          <LuSparkles className="sr-card__empty-spark" size={16} />
          <div>
            <Translate>No specialty recommendations were returned</Translate>
            {specialty ? ` (${specialty})` : ''}.
          </div>
          <MyButton appearance="ghost" onClick={onRetry}>
            Retry
          </MyButton>
        </div>
      );
    }

    if (phase === 'result') {
      return (
        <>
          {result?.summary && (
            <div className="sr-card__summary">
              <span className="sr-card__summary-label">
                <Translate>Summary</Translate>
              </span>
              {result.summary}
            </div>
          )}
          {actions.length > 0 && (
            <div className="sr-card__actions">
              {actions.map((action, index) => {
                const priority = String(action.priority || 'routine').toLowerCase();
                const level = PRIORITIES.includes(priority) ? priority : 'routine';
                return (
                  <div key={`${action.title}-${index}`} className={`sr-action sr-action--${level}`}>
                    <div className="sr-action__top">
                      <span className="sr-action__num">{index + 1}</span>
                      <span className="sr-action__title">{action.title || 'Action'}</span>
                    </div>
                    {action.description && <div className="sr-action__desc">{action.description}</div>}
                    <div className="sr-action__meta">
                      {action.category && (
                        <span className="sr-chip">{String(action.category).replace(/_/g, ' ')}</span>
                      )}
                      {action.priority && <span className="sr-chip sr-chip--priority">{priority}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    return (
      <div className="sr-card__empty">
        <LuSparkles className="sr-card__empty-spark" size={16} />
        <div>
          <Translate>Select a consultant specialty to generate AI recommendations</Translate>
        </div>
      </div>
    );
  };

  return (
    <div className="sr-card" aria-live="polite">
      {phase === 'loading' && <span className="sr-card__progress" aria-hidden="true" />}
      <div className="sr-card__head">
        <LuSparkles className="sr-card__head-icon" size={16} />
        <span className="sr-card__title">
          <Translate>Specialty Recommendations</Translate>
        </span>
        <span className="sr-card__ai-chip">AI</span>
        {specialty && <span className="sr-card__spec">{specialty}</span>}
      </div>
      <div className="sr-card__body">{renderBody()}</div>
      {(phase === 'result' || phase === 'empty') && (
        <div className="sr-card__foot">
          <Translate>AI suggestions support, not replace, clinical judgment.</Translate>
        </div>
      )}
    </div>
  );
};

export default SpecialtyRecommendations;
