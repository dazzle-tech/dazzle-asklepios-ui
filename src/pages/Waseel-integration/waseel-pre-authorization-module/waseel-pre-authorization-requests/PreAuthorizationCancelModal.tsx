import React, { useMemo } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';

type CancelReason =
  | 'SERVICE_NOT_PERFORMED'
  | 'WRONG_INFORMATION'
  | 'TRANSACTION_ALREADY_SUBMITTED';

type PreAuthorizationCancelModalProps = {
  open: boolean;
  cancelReason?: CancelReason | '';
  isSubmitting: boolean;
  onClose: () => void;
  onCancelReasonChange: (value: CancelReason | '') => void;
  onSubmit: () => void | Promise<void>;
};

const PreAuthorizationCancelModal: React.FC<PreAuthorizationCancelModalProps> = ({
  open,
  cancelReason,
  isSubmitting,
  onClose,
  onCancelReasonChange,
  onSubmit
}) => {
  const cancelReasonList = useEnumOptions('CancelReason');

  const cancelObject = useMemo(
    () => ({
      cancelReason: cancelReason || ''
    }),
    [cancelReason]
  );

  const setCancelObject = (value: { cancelReason?: CancelReason | '' }) => {
    onCancelReasonChange(value?.cancelReason ?? '');
  };

  return (
    <MyModal
      open={open}
      setOpen={(value: boolean) => {
        if (!value) onClose();
      }}
      size="30vw"
      bodyheight="35vh"
      title="Confirm Cancel Pre-Authorization"
      actionButtonLabel="Confirm"
      actionButtonFunction={onSubmit}
      actionButtonLoading={isSubmitting}
      isDisabledActionBtn={!cancelObject.cancelReason || isSubmitting}
      cancelButtonLabel="Close"
      steps={[
        {
          title: 'Cancel Pre-Authorization',
          icon: <FontAwesomeIcon icon={faBan} />
        }
      ]}
      content={() => (
        <Form fluid style={{ width: '100%' }}>
          <MyInput
            width="100%"
            fieldLabel="Cancel Reason"
            fieldName="cancelReason"
            fieldType="select"
            selectData={cancelReasonList ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={cancelObject}
            setRecord={setCancelObject}
            searchable={false}
            menuMaxHeight={200}
            required
          />
        </Form>
      )}
    />
  );
};

export default PreAuthorizationCancelModal;