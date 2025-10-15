import React, { useState } from 'react';
import { Modal, Steps, Divider, Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import MyButton from '../MyButton/MyButton';
import MyStepper from '../MyStepper';
import { useSelector } from 'react-redux';
import Translate from '../Translate';
const MyModal = ({
  open,
  setOpen,
  title,
  icon = null,
  pagesCount = 1,
  bodyheight = '80vh',
  content,
  size = '50vw',
  steps = [],
  footerButtons = null,
  position = 'center',
  hideCancel = false,
  hideBack = false,
  hideActionBtn = false,
  isDisabledActionBtn = false,
  actionButtonLabel = 'Save',
  actionButtonFunction = ()=>{},
  customClassName = '',
  cancelButtonLabel = 'Cancel',
  handleCancelFunction=()=>{}
}) => {
  const [internalStep, setInternalStep] = useState(0);
  const activeStep = internalStep;
  const updateStep = setInternalStep;
  const mode = useSelector((state: any) => state.ui.mode);
  const computedPagesCount = steps.length > pagesCount ? steps.length : pagesCount;
  const modalClass = position === 'left' ? 'left-modal' : position === 'right' ? 'rigth-modal' : '';
  const handleNext = () => {
    if (activeStep < computedPagesCount - 1) {
      updateStep(prev => prev + 1);
    }
  };
  const handlePrev = () => {
    if (activeStep > 0) {
      updateStep(prev => prev - 1);
    }
  };
  const handleCancel = () => {
    setInternalStep(0);
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size={size}
      className={`${modalClass} ${customClassName} ${mode === 'light' ? 'modal-light' : 'modal-dark'}`}
    >
      <Modal.Header>
        <Modal.Title>
          {icon && <FontAwesomeIcon icon={icon} className="icon-title-modal" />}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Divider className="divider-line" />
      <Modal.Body style={{ height: bodyheight }}>

        <MyStepper
          activeStep={activeStep}
          stepsList={steps.map((step, index) => ({
            key: index,
            value:<Translate>{step.title}</Translate>,
            description: step.description || '',
            customIcon: step.icon ? step.icon : null,
            isError: step.isError || false
          }))}
        />
        <br />

        {typeof content === 'function' ? content(activeStep) : activeStep === 0 && content}
      </Modal.Body>
      {(footerButtons ||
        !hideCancel ||
        (!hideBack && activeStep > 0) ||
        activeStep !== computedPagesCount - 1 ||
        steps[activeStep]?.footer ||
        (activeStep === computedPagesCount - 1 && !hideActionBtn && actionButtonFunction)) && (
        <Divider className="divider-line" />
      )}
      <Modal.Footer className="footer-modal">
        <Form className="footer-modal-content">
          {!hideCancel && (
            <MyButton appearance={'subtle'} onClick={()=>{handleCancel();handleCancelFunction();}}>
              {cancelButtonLabel}
            </MyButton>
          )}
          {!hideBack && activeStep > 0 && (
            <MyButton appearance={'subtle'} onClick={handlePrev}>
              Back
            </MyButton>
          )}
          {!(activeStep === computedPagesCount - 1) && (
            <MyButton onClick={handleNext} disabled={steps[activeStep]?.disabledNext}>
              Next
            </MyButton>
          )}{' '}
          {steps[activeStep]?.footer}
          {activeStep === computedPagesCount - 1 && !hideActionBtn && (
            <MyButton
              onClick={() => {
                actionButtonFunction();
                setInternalStep(0);
              }}
              disabled={isDisabledActionBtn}
            >
              {actionButtonLabel}
            </MyButton>
          )}
          {footerButtons}
        </Form>
      </Modal.Footer>
    </Modal>
  );
};
export default MyModal;
