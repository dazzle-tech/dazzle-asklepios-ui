import React from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';

type PreAuthorizationCommunicationModalProps = {
  open: boolean;
  communicationMessage: string;
  isSubmitting: boolean;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
};

const PreAuthorizationCommunicationModal: React.FC<
  PreAuthorizationCommunicationModalProps
> = ({
  open,
  communicationMessage,
  isSubmitting,
  onClose,
  onMessageChange,
  onSubmit
}) => {
  const record = { communicationMessage };

  return (
    <MyModal
      open={open}
      setOpen={onClose}
      size="30vw"
      bodyheight="55vh"
      title="Pre-Authorization Communication"
      actionButtonLabel="Send"
      actionButtonFunction={onSubmit}
      isDisabledActionBtn={!communicationMessage || isSubmitting}
      cancelButtonLabel="Close"
      steps={[
        {
          title: 'Communication',
          icon: <FontAwesomeIcon icon={faCommentDots} />
        }
      ]}
      content={() => (
        <Form fluid style={{ width: '100%' }}>
          <MyInput
            width="100%"
            fieldType="textarea"
            fieldLabel="Message"
            fieldName="communicationMessage"
            height={120}
            record={record}
            setRecord={(value: { communicationMessage: string }) =>
              onMessageChange(value.communicationMessage)
            }
            required
          />
        </Form>
      )}
    />
  );
};

export default PreAuthorizationCommunicationModal;