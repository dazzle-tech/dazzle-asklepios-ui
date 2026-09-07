import React, { useState, useEffect } from 'react';
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
  bodyheight = '73vh',
  content,
  size = '50vw',
  steps = [],
  footerButtons = null,
  position = 'center',
  hideCancel = false,
  hideBack = false,
  hideActionBtn = false,
  isDisabledActionBtn = false,
  actionButtonLoading = false,
  actionButtonLabel = 'Save',
  actionButtonFunction = () => {},
  customClassName = '',
  cancelButtonLabel = 'Cancel',
  handleCancelFunction = () => {},
  modalColor = 'var(--primary-blue)',
  initialStep = 0,
  enforceFocus = false,
  /** If it returns false (or a Promise that resolves false), the step does not advance. */
  onBeforeNext
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>> | ((open: boolean) => void);
  title: React.ReactNode;
  icon?: any;
  pagesCount?: number;
  bodyheight?: string;
  content?: any;
  size?: string;
  steps?: any[];
  footerButtons?: React.ReactNode;
  position?: string;
  hideCancel?: boolean;
  hideBack?: boolean;
  hideActionBtn?: boolean;
  isDisabledActionBtn?: boolean;
  actionButtonLoading?: boolean;
  actionButtonLabel?: string;
  actionButtonFunction?: () => void | Promise<void>;
  customClassName?: string;
  cancelButtonLabel?: string;
  handleCancelFunction?: () => void;
  modalColor?: string;
  initialStep?: number;
  enforceFocus?: boolean;
  onBeforeNext?: (activeStep: number) => boolean | Promise<boolean>;
}) => {
  const [internalStep, setInternalStep] = useState(initialStep);
  const activeStep = internalStep;
  const updateStep = setInternalStep;
  const mode = useSelector((state: any) => state.ui.mode);
  const computedPagesCount = steps.length > pagesCount ? steps.length : pagesCount;
  const modalClass = position === 'left' ? 'left-modal' : position === 'right' ? 'rigth-modal' : '';
  const handleNext = async () => {
    if (typeof onBeforeNext === 'function') {
      const ok = await Promise.resolve(onBeforeNext(activeStep));
      if (ok === false) return;
    }
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

  useEffect(() => {
    if (open) {
      setInternalStep(initialStep);
    }
  }, [initialStep, open]);

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size={size}
      enforceFocus={enforceFocus}
      className={`${modalClass} ${customClassName} ${
        mode === 'light' ? 'modal-light' : 'modal-dark'
      }`}
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
            value: <Translate>{step.title}</Translate>,
            description: step.description || '',
            customIcon: step.icon ? step.icon : null,
            isError: step.isError || false
          }))}
          modalColor={modalColor}
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
            <MyButton
              appearance={'subtle'}
              onClick={() => {
                handleCancel();
                handleCancelFunction();
              }}
            >
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
              onClick={async () => {
                try {
                  await Promise.resolve(actionButtonFunction());
                  setInternalStep(0);
                } catch {
                  /* caller / RTK handles errors; stay on current step */
                }
              }}
              disabled={isDisabledActionBtn}
              loading={actionButtonLoading}
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
