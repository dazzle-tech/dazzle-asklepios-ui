import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';

interface EncounterCancellationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleCancel: () => void;
  object: {
    reason: string;
    otherReason: string;
  };
  setObject: React.Dispatch<
    React.SetStateAction<{
      reason: string;
      otherReason: string;
    }>
  >;
}

const EncounterCancellationModal: React.FC<
  EncounterCancellationModalProps
> = ({
  open,
  setOpen,
  handleCancel,
  object,
  setObject
}) => {

  // لازم الـ Hook يكون داخل الـ Component
  const cancellationReasonOptions =
    useEnumOptions('EncounterCancellationReason');

  const isOther = object?.reason === 'OTHER';

  const isConfirmDisabled =
    !object?.reason ||
    (isOther && !object?.otherReason?.trim());

  return (
    <MyModal
      open={open}
      size="30vw"
      setOpen={setOpen}
      bodyheight="60vh"
      title="Confirm Cancel Encounter"
      actionButtonLabel="Confirm"
      actionButtonFunction={handleCancel}
      isDisabledActionBtn={isConfirmDisabled}
      steps={[
        {
          title: 'Cancel Encounter',
          icon: <FontAwesomeIcon icon={faBan} />
        }
      ]}
      content={() => (
        <Form fluid style={{ width: '100%' }}>
          <MyInput
            width="100%"
            fieldType="select"
            fieldLabel="Cancellation Reason"
            fieldName="reason"
            selectData={cancellationReasonOptions}
            selectDataLabel="label"
            selectDataValue="value"
            record={object}
            setRecord={setObject}
            required
            searchable={false}
          />

          {isOther && (
            <MyInput
              width="100%"
              fieldType="textarea"
              fieldLabel="Other Reason"
              fieldName="otherReason"
              height={120}
              record={object}
              setRecord={setObject}
              required
            />
          )}
        </Form>
      )}
      cancelButtonLabel="Close"
    />
  );
};

export default EncounterCancellationModal;