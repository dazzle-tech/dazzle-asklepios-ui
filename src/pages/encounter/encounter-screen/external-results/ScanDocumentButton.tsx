import React from 'react';
import { LuScan, LuSparkle } from 'react-icons/lu';
import MyButton from '@/components/MyButton/MyButton';
import AiTooltip from '@/components/AiTooltip/AiTooltip';
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

const ScanDocumentButton: React.FC<Props> = ({ disabled, onClick }) => (
  <AiTooltip
    title="AI document scan"
    body="AI reads a lab result or report, checks it belongs to this patient, and prepares a structured draft for you to review."
    chips={['Lab results', 'Reports']}
    foot="Nothing is saved until you confirm."
  >
    <span className="scan-ai-btn">
      <MyButton disabled={disabled} prefixIcon={ScanSparkIcon} onClick={onClick}>
        Scan Document
      </MyButton>
      <span className="scan-ai-btn__badge" aria-hidden="true">
        AI
      </span>
    </span>
  </AiTooltip>
);

export default ScanDocumentButton;
