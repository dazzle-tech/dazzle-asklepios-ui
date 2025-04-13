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
    bodyhieght = 400,
    content,
    size="sm",
    steps = [],
    footerButtons = null,
    position = "center",
    hideCanel = false,
    hideBack = false,
    isDisabledActionBtn=false,
    actionButtonLabel = "Save",
    actionButtonFunction = null,
}) => {

    const [internalStep, setInternalStep] = useState(0);
    const activeStep = internalStep;
    const updateStep = setInternalStep;

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
            <Modal.Body style={{ height: bodyhieght }}>
                <Steps current={activeStep} className={`steps-modal ${steps.length === 1 ? 'centered-step' : ''}`}>
                    {steps.map((step, index) => (
                        <Steps.Item
                            key={index}
                            title={<div className='title-modal'>
                                <FontAwesomeIcon
                                    icon={activeStep > index ? faCheck : step.icon}
                                    className={
                                        activeStep > index
                                            ? 'step-past'
                                            : activeStep === index
                                                ? 'step-active'
                                                : 'step-future'
                                    }
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
            <Modal.Footer className='footer-modal'>
                <Form className='footer-modal-content'>
                    {!hideCanel && <MyButton appearance={'subtle'} onClick={() => setOpen(false)}>Cancel</MyButton>}
                    {!hideBack && activeStep > 0 && <MyButton appearance={'subtle'} onClick={handlePrev}>Back</MyButton>}
                    {!(activeStep === computedPagesCount - 1) && <MyButton onClick={handleNext}>Next</MyButton>} {steps[activeStep]?.footer}
                    {(activeStep === computedPagesCount - 1) && <MyButton onClick={actionButtonFunction} disabled={isDisabledActionBtn}>{actionButtonLabel}</MyButton>}
                    {footerButtons}
                   
                </Form>
            </Modal.Footer>
        </Modal>

        
    );
};
export default MyModal;
