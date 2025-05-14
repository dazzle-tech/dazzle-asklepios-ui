import React, { useEffect, useState } from 'react';
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
    position = "center",
    actionButtonLabel = "Save",
    actionButtonFunction = null,
    height = 650,
    size = "1450px",
    leftWidth = "30%",
    rightWidth = "70%",
    isDisabledActionBtn = false,
    defaultClose = false,
    isLeftClosed = true,

}) => {



    const modalClass =
        position === "left"
            ? "left-modal"
            : position === "right"
                ? "rigth-modal"
                : "";

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            size={size}
            className={`custom-advanced-modal ${modalClass}`}
        >
            <Modal.Body className="modal-body-flex" style={{ height: `${height}px`, maxHeight: "none" }}>

                <div
                    className={`modal-left-content ${defaultClose && isLeftClosed ? 'closed' : ''}`}
                    style={{
                        width: defaultClose && isLeftClosed ? 0 : leftWidth,
                    }}
                >
                    <div className="modal-left-header">
                        <div className="modal-left-title">
                            <span>{leftTitle}</span>
                        </div>
                    </div>
                    <div className="modal-left-body" style={{ height: `${height - 108}px` }}>
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
                        <div style={{ display: "flex", gap: "8px" }}>

                            <MyButton appearance="subtle" color="#5B5B5B" width="20px" height="20px" onClick={() => setOpen(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </MyButton>

                        </div>
                    </div>
                    <div className="modal-right-body" style={{ height: `${height - 108}px` }}>
                        {rightContent}
                    </div>
                    <div className="modal-right-footer">
                        <div className="modal-right-footer-buttons">
                            {!hideCanel && <MyButton appearance="subtle" onClick={() =>
                                setOpen(false)
                            }>Cancel</MyButton>}
                            {footerButtons}
                            <MyButton disabled={isDisabledActionBtn} onClick={actionButtonFunction}>{actionButtonLabel}</MyButton>
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AdvancedModal;