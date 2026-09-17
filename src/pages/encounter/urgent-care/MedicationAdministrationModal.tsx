import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useAdministerUccMedicationOrderMutation } from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';

type MedicationAdministrationModalProps = {
  orderId: number | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

const MedicationAdministrationModal: React.FC<
  MedicationAdministrationModalProps
> = ({
  orderId,
  open,
  setOpen,
  onSuccess
}) => {
  const dispatch = useAppDispatch();

  const [administerOrder, { isLoading }] =
    useAdministerUccMedicationOrderMutation();

  const [record, setRecord] = useState({
    actualAdministerTime: new Date()
  });

  useEffect(() => {
    if (open) {
      setRecord({
        actualAdministerTime: new Date()
      });
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!orderId) {
      return;
    }

    try {
      await administerOrder({
        id: orderId,
        actualAdministerTime: record.actualAdministerTime
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication administered successfully',
          sev: 'success'
        })
      );

      await onSuccess?.();

      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.detail ||
            'Administration failed',
          sev: 'error'
        })
      );
    }
  };

  return (
    <MyModal
      title="Administer Medication"
      open={open}
      setOpen={setOpen}
      actionButtonFunction={handleConfirm}
      size="sm"
      bodyheight="30vh"
      content={
        <div>
          <MyInput
            required
            fieldName="actualAdministerTime"
            fieldLabel="Actual Administer Time"
            fieldType="datetime"
            record={record}
            setRecord={setRecord}
            width='100%'
          />
        </div>
      }
    />
  );
};

export default MedicationAdministrationModal;