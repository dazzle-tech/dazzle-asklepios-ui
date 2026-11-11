import React from 'react';
import { Popover, Whisper } from 'rsuite';
import { LuScan, LuSparkle } from 'react-icons/lu';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';

type Props = {
  disabled?: boolean;
  onClick: () => void;
};

// Scan frame with an AI spark inside, as in the Scan Document template.
// MyButton passes the spacing between the icon and the label through style.
const ScanSparkIcon = ({ style }: { style?: React.CSSProperties }) => (
  <span className="scan-ai-icon" style={style} aria-hidden="true">
    <LuScan size={18} />
    <LuSparkle size={8} className="scan-ai-icon__spark" />
  </span>
);

// Whisper passes its own show/animation classes, so ours must be merged, not replace them
const ScanDocumentTip = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
  <Popover
    ref={ref}
    {...props}
    full
    arrow={false}
    className={['scan-ai-tip', className].filter(Boolean).join(' ')}
  >
    <div className="scan-ai-tip__header">
      <LuSparkle size={14} />
      <Translate>AI document scan</Translate>
    </div>
    <div className="scan-ai-tip__body">
      <div>
        <Translate>
          AI reads a lab result or report, checks it belongs to this patient, and prepares a structured draft for
          you to review.
        </Translate>
      </div>
      <div className="scan-ai-tip__chips">
        <span>
          <Translate>Lab results</Translate>
        </span>
        <span>
          <Translate>Reports</Translate>
        </span>
      </div>
      <div className="scan-ai-tip__note">
        <Translate>Nothing is saved until you confirm.</Translate>
      </div>
    </div>
  </Popover>
));

const ScanDocumentButton: React.FC<Props> = ({ disabled, onClick }) => (
  <Whisper placement="bottom" trigger="hover" speaker={<ScanDocumentTip />}>
    <span className="scan-ai-btn">
      <MyButton disabled={disabled} prefixIcon={ScanSparkIcon} onClick={onClick}>
        Scan Document
      </MyButton>
      <span className="scan-ai-btn__badge" aria-hidden="true">
        AI
      </span>
    </span>
  </Whisper>
);

export default ScanDocumentButton;
