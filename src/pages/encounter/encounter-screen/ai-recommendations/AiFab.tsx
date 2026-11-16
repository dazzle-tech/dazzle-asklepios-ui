import React, { forwardRef } from 'react';
import { FaRegLightbulb } from 'react-icons/fa';
import Translate from '@/components/Translate';
import AiTooltip from '@/components/AiTooltip/AiTooltip';

type Props = {
  open: boolean;
  loading: boolean;
  ready: boolean;
  disabled: boolean;
  onClick: () => void;
};

// Floating button: shows a ring while loading and a dot once results are ready
// The tooltip wraps the container, so it still shows while the button is disabled
const AiFab = forwardRef<HTMLButtonElement, Props>(
  ({ open, loading, ready, disabled, onClick }, ref) => (
    <AiTooltip
      placement="topEnd"
      title="AI recommendations"
      body="AI suggests tests, treatments and follow-up from this visit. It does not diagnose."
      chips={['Tests', 'Treatments', 'Follow-up']}
      foot="Nothing is saved to the chart."
    >
      <div className="ai-fab-wrap">
        <button
          ref={ref}
          type="button"
          className={`ai-fab${loading ? ' working' : ''}${ready ? ' ready' : ''}`}
          aria-label="Open AI recommendations for this visit"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={onClick}
        >
          <span className="ai-fab__ring" aria-hidden="true" />
          <span className="ai-fab__inner">
            <span className="ai-fab__ico">
              <FaRegLightbulb size={24} color="#fff" />
            </span>
            <span className="ai-fab__txt">
              <b>
                <Translate>AI Insights</Translate>
              </b>
              <small>
                <Translate>Recommendations for this visit</Translate>
              </small>
            </span>
          </span>
          <span className="ai-fab__badge" aria-hidden="true">
            AI
          </span>
          <span className="ai-fab__dot" aria-hidden="true" />
        </button>
      </div>
    </AiTooltip>
  )
);

AiFab.displayName = 'AiFab';

export default AiFab;
