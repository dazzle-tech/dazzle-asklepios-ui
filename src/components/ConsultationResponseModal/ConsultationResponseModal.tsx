import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'rsuite';
import MyInput from '../MyInput';
import MyButton from '../MyButton/MyButton';
import Translate from '../Translate';

interface ConsultationResponseModalProps {
  open: boolean;
  consultation: any | null;
  readonly?: boolean;
  onClose: () => void;
  onSave?: (response: string) => void;
}

const ConsultationResponseModal: React.FC<ConsultationResponseModalProps> = ({
  open,
  consultation,
  readonly = false,
  onClose,
  onSave
}) => {
  const [responseText, setResponseText] = useState('');

  // Update response text when consultation changes
  useEffect(() => {
    if (consultation) {
      setResponseText(consultation.viewResponse || '');
    } else {
      setResponseText('');
    }
  }, [consultation]);

  const handleSave = () => {
    if (onSave) {
      onSave(responseText);
    }
  };

  const handleClose = () => {
    setResponseText('');
    onClose();
  };

  const isSubmitted = consultation?.statusLkey === '1804482322306061';
  const isReadonly = readonly || isSubmitted;

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      size="xs"
      backdrop="static"
      dialogStyle={{ 
        width: '500px',
        maxWidth: '90vw'
      }}
    >
      <Modal.Header>
        <Modal.Title>
          {isReadonly ? (
            <Translate>View Response</Translate>
          ) : (
            <Translate>Add Response</Translate>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form fluid>
          <MyInput
            fieldLabel="Response"
            fieldName="response"
            fieldType="textarea"
            rows={6}
            width="100%"
            record={{ response: responseText }}
            setRecord={(value) => setResponseText(value.response)}
            disabled={isReadonly}
            placeholder={isReadonly ? "No response available" : "Enter your response here..."}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <MyButton
          onClick={handleClose}
          appearance="subtle"
        >
          <Translate>{isReadonly ? 'Close' : 'Cancel'}</Translate>
        </MyButton>
        {!isReadonly && (
          <MyButton
            onClick={handleSave}
            backgroundColor="var(--deep-blue)"
            disabled={!responseText.trim()}
          >
            <Translate>Save Response</Translate>
          </MyButton>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ConsultationResponseModal;

