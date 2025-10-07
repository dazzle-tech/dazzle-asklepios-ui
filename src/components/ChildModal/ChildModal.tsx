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
  childSize = "xs",

  // Sub-child
  showSubChild = false,
  setShowSubChild = (b:boolean=false)=>{},
  subChildTitle = "",
  subChildStep = [],
  subChildContent = null,
  subChildSize = "xs",
  actionSubChildButtonFunction = null,
  actionSubChildButtonLabel = "Save",
  hideActionSubChildBtn = false,
  hideSubChildCancel = false
}) => {
  const mainWidth = SIZE_WIDTH_MAP[mainSize] || 300;
  const childWidth = SIZE_WIDTH_MAP[childSize] || 300;
  const childRight = mainWidth + GAP;
  const subChildRight = mainWidth + childWidth + (GAP * 2);

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

  useEffect(() => {
    if (showSubChild) {
      const subChildModal = document.querySelector('.sub-child-right-modal');
      if (subChildModal instanceof HTMLElement) {
        subChildModal.style.position = 'fixed';
        subChildModal.style.top = '0px';
        subChildModal.style.right = `${subChildRight}px`;
        subChildModal.style.zIndex = '1052';
      }
    }
  }, [showSubChild, subChildRight]);

  return (
    <>
      <MyModal
        open={open}
        setOpen={(val) => {
          setOpen(val);
          if (!val) {
            setShowChild(false);
            setShowSubChild(false);
          }
        }}
        title={title}
        steps={mainStep}
        size={mainSize}
        position="right"
        actionButtonFunction={actionButtonFunction}
        actionButtonLabel={actionButtonLabel}
        hideActionBtn={hideActionBtn}
        content={mainContent}
        hideCancel={hideCancel}
      />

      <MyModal
        open={showChild}
        setOpen={(val) => {
          setShowChild(val);
          if (!val) setShowSubChild(false);
        }}
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

      <MyModal
        open={showSubChild}
        setOpen={setShowSubChild}
        steps={subChildStep}
        title={subChildTitle}
        size={subChildSize}
        content={subChildContent}
        hideActionBtn={hideActionSubChildBtn}
        customClassName="sub-child-right-modal"
        actionButtonFunction={actionSubChildButtonFunction}
        actionButtonLabel={actionSubChildButtonLabel}
        hideCancel={hideSubChildCancel}
      />
    </>
  );
};

export default ChildModal;
