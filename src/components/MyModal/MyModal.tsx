import React, { useState } from 'react';
import { Modal, Steps, Divider, Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles.less';
import MyButton from '../MyButton/MyButton';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

const MyModal = ({
    open,
    setOpen,
    title,
    icon = null,
    pagesCount = 1,
    currentStep = 0,
    setCurrentStep = null,
    content,
    size = "sm",
    steps = [],
    footerButtons,
    position = "center",
    hideCanel = false,
    hideBack = false,
    actionButtonLabel = "Save",
    actionButtonFunction,
}) => {
    const [internalStep, setInternalStep] = useState(currentStep);
    const activeStep = typeof setCurrentStep === 'function' ? currentStep : internalStep;
    const updateStep = typeof setCurrentStep === 'function' ? setCurrentStep : setInternalStep;
    const computedPagesCount = steps.length > pagesCount ? steps.length : pagesCount;
    const modalClass =
        position === "left"
            ? "left-modal"
            : position === "right"
                ? "rigth-modal"
                : "";
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
    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            size={size}
            className={modalClass}
        >
            <Modal.Header>
                <Modal.Title>
                    {icon && <FontAwesomeIcon icon={icon} className='icon-title-modal' />}
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Divider className='divider-line' />
            <Modal.Body>
                <Steps current={activeStep} className='steps-modal'>
                    {steps.map((step, index) => (
                        <Steps.Item
                            key={index}
                            title={<div style={{ textAlign: 'center' }}>
                                <FontAwesomeIcon
                                    icon={currentStep > index ? faCheck : step.icon}
                                    style={{
                                        color:
                                            currentStep > index ? 'green' : currentStep === index ? 'blue' : 'gray'
                                    }}
                                />
                                <div>{step.title}</div>
                            </div>}
                            icon={<></>}
                        />
                    ))}
                </Steps>
                {typeof content === 'function' ? content(activeStep) : (activeStep === 0 && content)}
            </Modal.Body>
            <Divider className='divider-line' />
            <Modal.Footer style={{ display: 'flex', alignItems: 'center' }}>
                <Form style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                    {!hideCanel && <MyButton appearance={'subtle'}  width='93px' onClick={() => setOpen(false)}>Cancel</MyButton>}
                    {!hideBack && activeStep > 0 && <MyButton ghost width='93px' onClick={handlePrev}>Back</MyButton>}
                    {!(activeStep === computedPagesCount - 1) && <MyButton  width='93px'onClick={handleNext}>Next</MyButton>}
                    {(activeStep === computedPagesCount - 1) && <MyButton width='93px' onClick={actionButtonFunction}>{actionButtonLabel}</MyButton>}
                    {footerButtons}
                    {steps[activeStep]?.footer}
                </Form>
            </Modal.Footer>
        </Modal>
    );
};



export default MyModal;
