import React from 'react';
import { Modal, Steps, Divider } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import MyButton from '../MyButton/MyButton';
import {faCheck} from '@fortawesome/free-solid-svg-icons';
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
  footerButtons,
  position = "center",
  hideCanel = false,
  hideBack = false,
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
console.log("currentStep-->",currentStep);
console.log(" --pagesCount-->", pagesCount);
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
                  icon={currentStep > index ? faCheck : step.icon}
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
        {!hideBack && currentStep > 0 && <MyButton onClick={handlePrev}>Back</MyButton>}
        {!(currentStep === pagesCount-1) && <MyButton onClick={handleNext}>Next</MyButton>}
        {footerButtons}
      </Modal.Footer>
    </Modal>
  );
};

export default MyModal;
