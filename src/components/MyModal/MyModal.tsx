import React from 'react';
import { Modal, Steps, Divider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import MyButton from '../MyButton/MyButton';

const MyModal = ({
  open,
  setOpen,
  title,
  icon,
  pagesCount = 1,
  currentStep = 0,
  setCurrentStep, // Pass the function directly
  content,
  size = "sm",
  steps = [],
  footer,
  position = "center",
  hideCanel = false,
  triggerSource = ""
}) => {
  const isSinglePage = pagesCount === 1;
  const modalClass =
    position === "left"
      ? "left-modal"
      : position === "right"
      ? "rigth-modal"
      : "";

  console.log(modalClass, position, size);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size={size}
      className={modalClass}
    >
      <Modal.Header>
        <Modal.Title>
          {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: '8px' }} />}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Divider />
      <Modal.Body>
        <Steps current={currentStep} style={{ marginBottom: 20 }}>
          {steps.map((step, index) => (
            <Steps.Item
              key={index}
              title={step.title}
              icon={
                <FontAwesomeIcon
                  icon={currentStep > index ? 'check' : step.icon}
                  style={{
                    color: currentStep > index ? 'green' : currentStep === index ? 'blue' : 'gray'
                  }}
                />
              }
            />
          ))}
        </Steps>

        {content}
      </Modal.Body>

      <Modal.Footer>
        <Divider />
        {!hideCanel && <MyButton onClick={() => setOpen(false)}>Cancel</MyButton>}
        <MyButton onClick={handleNext}>Next</MyButton>
        {footer}
      </Modal.Footer>
    </Modal>
  );
};

export default MyModal;
