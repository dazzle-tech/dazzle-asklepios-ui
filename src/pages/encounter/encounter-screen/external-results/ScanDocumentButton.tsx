import React from 'react';
import { Tooltip, Whisper } from 'rsuite';
import { MdDocumentScanner } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import './styles.less';

type Props = {
  disabled?: boolean;
  onClick: () => void;
};

const ScanDocumentButton: React.FC<Props> = ({ disabled, onClick }) => (
  <Whisper
    placement="bottom"
    trigger="hover"
    speaker={
      <Tooltip>
        <Translate>
          AI reads a lab result or radiology report, checks it belongs to this patient, and prepares a draft for you
          to review. Nothing is saved until you confirm.
        </Translate>
      </Tooltip>
    }
  >
    <span className="scan-ai-btn">
      <MyButton disabled={disabled} prefixIcon={MdDocumentScanner} onClick={onClick}>
        Scan Document
      </MyButton>
      <span className="scan-ai-btn__badge" aria-hidden="true">
        AI
      </span>
    </span>
  </Whisper>
);

export default ScanDocumentButton;
