import React, { ReactNode } from 'react';
import { Modal } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import { useSelector } from 'react-redux';

interface AdvancedModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  leftTitle?: string;
  rightTitle?: string;
  subRightTitle?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  footerButtons?: ReactNode;
  hideCancel?: boolean;
  position?: 'left' | 'right' | 'center';
  actionButtonLabel?: string | ReactNode;
  actionButtonFunction?: (() => void) | null;
  height?: string;
  size?: string;
  leftWidth?: string;
  rightWidth?: string;
  isDisabledActionBtn?: boolean;
  defaultClose?: boolean;
  isLeftClosed?: boolean;
}

const AdvancedModal: React.FC<AdvancedModalProps> = ({
  open,
  setOpen,
  leftTitle = '',
  rightTitle = '',
  subRightTitle = '',
  leftContent,
  rightContent,
  footerButtons = null,
  hideCancel = false,
  position = 'center',
  actionButtonLabel = 'Save',
  actionButtonFunction = () => {},
  height = '90vh',
  size = '80vw',
  leftWidth = '30%',
  rightWidth = '70%',
  isDisabledActionBtn = false,
  defaultClose = false,
  isLeftClosed = true
}) => {
  const modalClass = position === 'left' ? 'left-modal' : position === 'right' ? 'rigth-modal' : '';
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size={size}
      className={`custom-advanced-modal ${modalClass} ${mode === 'light' ? 'light' : 'dark'}`}
    >
      <Modal.Body className="modal-body-flex" style={{ height: height, maxHeight: 'none' }}>
        <div
          className={`modal-left-content ${defaultClose && isLeftClosed ? 'closed' : ''}`}
          style={{
            width: defaultClose && isLeftClosed ? 0 : leftWidth
          }}
        >
          <div className="modal-left-header">
            <div className="modal-left-title">
              <span>{leftTitle}</span>
            </div>
          </div>
          <div className="modal-left-body" style={{ height: `calc(${height} - 108px)` }}>
            {(!defaultClose || !isLeftClosed) && leftContent}
          </div>
        </div>

        <div
          className="modal-right-content"
          style={{
            width: defaultClose && isLeftClosed ? '100%' : rightWidth
          }}
        >
          <div className="modal-right-header">
            <div className="modal-right-title">
              <span className="modal-right-main-title">{rightTitle}</span>
              <span className="modal-right-sub-title">{subRightTitle}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MyButton
                appearance={mode === 'light' ? 'subtle' : 'primary'}
                color="#5B5B5B"
                backgroundColor="var(--dark-black)"
                width="20px"
                height="20px"
                onClick={() => setOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </MyButton>
            </div>
          </div>
          <div className="modal-right-body" style={{ height: `calc(${height} - 108px)` }}>
            {rightContent}
          </div>
          <div className="modal-right-footer">
            <div className="modal-right-footer-buttons">
              {!hideCancel && (
                <MyButton appearance="subtle" onClick={() => setOpen(false)}>
                  Cancel
                </MyButton>
              )}
              {footerButtons}
              <MyButton disabled={isDisabledActionBtn} onClick={actionButtonFunction}>
                {actionButtonLabel}
              </MyButton>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AdvancedModal;
