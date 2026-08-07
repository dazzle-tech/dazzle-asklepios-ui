import React, { useRef } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientPaymentInfo, {
  PatientPaymentInfoHandle
} from '@/pages/patient/patient-profile/PatientQuickAppoinment/PatientPaymentInfo';

type AddPaymentModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  paymentRow: any;
  payment: any;
  setPayment: (value: any) => void;
  patientInsurance: any;
  setPatientInsurance: (value: any) => void;
  onSave: (options?: { payZeroNow?: boolean }) => Promise<void>;
};

const AddPaymentModal = ({
  open,
  setOpen,
  paymentRow,
  payment,
  setPayment,
  patientInsurance,
  setPatientInsurance,
  onSave
}: AddPaymentModalProps) => {
  const paymentInfoRef = useRef<PatientPaymentInfoHandle>(null);

  const handleSave = async () => {
    const ok = await paymentInfoRef.current?.confirm?.();
    if (!ok) return;
    const payZeroNow = paymentInfoRef.current?.wasPayZeroNowConfirmed?.() ?? false;
    await onSave({ payZeroNow });
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add Payment"
      size="80vw"
      bodyheight="75vh"
      content={
        open ? (
          <PatientPaymentInfo
            ref={paymentInfoRef}
            localPatient={paymentRow?.patientObject ?? null}
            localEncounter={paymentRow ?? null}
            isReadOnly={false}
            showInternalButtons={false}
            payment={payment}
            setPayment={setPayment}
            patientInsurance={patientInsurance}
            setPatientInsurance={setPatientInsurance}
          />
        ) : null
      }
      cancelButtonLabel="Close"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
    />
  );
};

export default AddPaymentModal;
