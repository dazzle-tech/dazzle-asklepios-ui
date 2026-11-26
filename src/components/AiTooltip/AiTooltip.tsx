import React from 'react';
import { Popover, Whisper } from 'rsuite';
import { LuSparkle } from 'react-icons/lu';
import Translate from '@/components/Translate';
import './styles.less';

type Placement = React.ComponentProps<typeof Whisper>['placement'];

type AiTooltipProps = {
  title: string;
  body: string;
  chips?: string[];
  foot?: string;
  placement?: Placement;
  children: React.ReactElement;
};

type AiTooltipCardProps = Omit<AiTooltipProps, 'placement' | 'children'> & {
  className?: string;
};

// Whisper passes its own show/animation classes, so ours must be merged, not replace them
const AiTooltipCard = React.forwardRef<HTMLDivElement, AiTooltipCardProps>(
  ({ title, body, chips = [], foot, className, ...props }, ref) => (
    <Popover
      ref={ref}
      {...props}
      full
      arrow={false}
      className={['ai-tooltip', className].filter(Boolean).join(' ')}
    >
      <div className="ai-tooltip__header">
        <LuSparkle size={14} aria-hidden="true" />
        <Translate>{title}</Translate>
      </div>
      <div className="ai-tooltip__body">
        <div>
          <Translate>{body}</Translate>
        </div>
        {chips.length > 0 && (
          <div className="ai-tooltip__chips">
            {chips.map(chip => (
              <span key={chip} className="ai-tooltip__chip">
                <Translate>{chip}</Translate>
              </span>
            ))}
          </div>
        )}
        {foot && (
          <div className="ai-tooltip__foot">
            <Translate>{foot}</Translate>
          </div>
        )}
      </div>
    </Popover>
  )
);

AiTooltipCard.displayName = 'AiTooltipCard';

// Hover card for AI features: tinted title, short explanation, scope chips and a reassurance line
const AiTooltip: React.FC<AiTooltipProps> = ({ placement = 'bottom', children, ...card }) => (
  <Whisper placement={placement} trigger="hover" speaker={<AiTooltipCard {...card} />}>
    {children}
  </Whisper>
);

export default AiTooltip;
