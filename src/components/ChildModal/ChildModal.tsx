import React, { useEffect } from 'react';
import MyModal from '../MyModal/MyModal';
import './styles.less';
const SIZE_WIDTH_MAP = {
    xs: 400,
    sm: 600,
    md: 800,
    lg: 970,
};
const GAP = 20;
const ChildModal = ({
    open,
    setOpen,
    showChild,
    setShowChild,
    title,
    mainContent,
    actionButtonFunction = null,
    actionButtonLabel = "Save",
    actionChildButtonFunction = null,
    hideActionBtn = false,
    hideCancel = false,
    actionChildButtonLabel = "Save",
    hideActionChildBtn = false,
    hideChildCanel = false,
    mainStep = [],
    childTitle,
    childStep = [],
    childContent,
    mainSize = "xs",
    childSize = "xs"
}) => {
    const mainWidth = SIZE_WIDTH_MAP[mainSize] || 300;
    const childRight = mainWidth + GAP;

    useEffect(() => {
        if (showChild) {
            const childModal = document.querySelector('.child-right-modal');
            if (childModal instanceof HTMLElement) {
                childModal.style.position = 'fixed';
                childModal.style.top = '0px';
                childModal.style.right = `${childRight}px`;
                childModal.style.zIndex = '1051';
            }
        }
    }, [showChild, childRight]);
    return (
        <>
            {/* Main Modal */}
            <MyModal
                open={open}
                setOpen={(val) => { setOpen(val); if (!val) setShowChild(false); }}
                title={title}
                steps={mainStep}
                size={mainSize}
                position="right"
                actionButtonFunction={actionButtonFunction}
                actionButtonLabel={actionButtonLabel}
                hideActionBtn={hideActionBtn}
                content={mainContent}
                hideCancel={hideCancel} />

            {/* Child Modal */}
            <MyModal
                open={showChild}
                setOpen={setShowChild}
                steps={childStep}
                title={childTitle}
                size={childSize}
                content={childContent}
                hideActionBtn={hideActionChildBtn}
                customClassName="child-right-modal"
                actionButtonFunction={actionChildButtonFunction}
                actionButtonLabel={actionChildButtonLabel}
                hideCancel={hideChildCanel}
            />
        </>
    );
};

export default ChildModal;