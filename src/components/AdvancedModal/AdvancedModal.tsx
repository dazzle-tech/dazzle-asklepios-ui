import React from 'react';
import { Modal } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import { NONAME } from 'dns';
const AdvancedModal = ({
    open,
    setOpen,
    leftTitle = "",
    rightTitle = "",
    subRightTitle = "",
    leftContent,
    rightContent,
    footerButtons = null,
    hideCanel = false,
    actionButtonLabel = "Save",
    actionButtonFunction = null,
    height = 695,
    size="1400px"
}) => {
    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            size={size}
            className="custom-advanced-modal"
        >
            <Modal.Body className="modal-body-flex" style={{ height: `${height}px` , maxHeight:"none"}}
            >
                <div className="modal-left-content" >
                    <div className="modal-left-header">
                        <div className="modal-left-title">
                            <span>{leftTitle}</span>
                        </div>
                    </div>
                    <div className="modal-left-body" style={{ height: `${height - 108}px` }}
                    >{leftContent}</div>
                </div>
                <div className="modal-right-content">
                    <div className="modal-right-header">
                        <div className="modal-right-title">
                            <span className="modal-right-main-title">{rightTitle}</span>
                            <span className="modal-right-sub-title">{subRightTitle}</span>
                        </div>
                        <div>
                            <MyButton appearance="subtle" color="#5B5B5B" width="20px" height="20px" onClick={() => setOpen(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </MyButton>
                        </div>
                    </div>
                    <div className="modal-right-body" style={{ height: `${height - 108}px` }}>{rightContent}</div>
                    <div className="modal-right-footer">
                        <div className="modal-right-footer-buttons">
                            {!hideCanel && <MyButton appearance="subtle" onClick={() => setOpen(false)}>Cancel</MyButton>}
                            {footerButtons}
                            <MyButton onClick={actionButtonFunction}>{actionButtonLabel}</MyButton>
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AdvancedModal;
