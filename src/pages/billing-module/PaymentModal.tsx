// import React from 'react';
// import { Modal } from 'rsuite';
// import { useAppSelector } from '@/hooks';

// import AddPayment from './AddPayment';

// import {
//   useCreatePaymentMutation,
//   useCreatePaymentAllocationMutation,
//   useGetInvoiceItemsQuery,
//   useGetPatientAccountSummaryQuery,
// } from '@/services/billing/BillingService';

// import type {
//   BillingItem,
//   PatientPaymentCreateVM,
//   PaymentAllocationCreateVM,
// } from '@/types/model-types-new';

// type PaymentModalProps = {
//   open: boolean;
//   setOpen: (open: boolean) => void;
//   localPatient: any;
//   invoice: { id: number; amount: number } | null;
// };

// const PaymentModal: React.FC<PaymentModalProps> = ({
//   open,
//   setOpen,
//   localPatient,
//   invoice,
// }) => {
//   const authSlice = useAppSelector(state => state.auth);
//   const facilityId = authSlice?.tenant?.selectedFacility?.id;

//   const { data: invoiceItemsResponse } = useGetInvoiceItemsQuery(
//     { invoiceId: invoice?.id },
//     { skip: !invoice?.id }
//   );
//   const invoiceItems: BillingItem[] = invoiceItemsResponse?.data ?? [];

//   const [createPayment, { isLoading: savingPayment }] =
//     useCreatePaymentMutation();
//   const [createAllocation] = useCreatePaymentAllocationMutation();

//   const { refetch: refetchAccountSummary } = useGetPatientAccountSummaryQuery(
//     { patientKey: localPatient?.key },
//     { skip: !localPatient?.key }
//   );

//   const handleSavePayment = async (partialPayment: PatientPaymentCreateVM) => {
//     if (!invoice || !localPatient || !facilityId) return;

//     try {
//       const paymentPayload: PatientPaymentCreateVM = {
//         ...partialPayment,
//         facilityId,
//         patientKey: localPatient.key,
//         paymentDate:
//           partialPayment.paymentDate ||
//           new Date().toISOString().slice(0, 10),
//       };

//       const payment = await createPayment(paymentPayload).unwrap();

//       const allocationPayload: PaymentAllocationCreateVM = {
//         paymentId: payment.id,
//         invoiceId: invoice.id,
//         allocatedAmount: paymentPayload.amount,
//         invoiceItemId: null,
//       };

//       await createAllocation(allocationPayload).unwrap();

//       await refetchAccountSummary();

//       setOpen(false);
//     } catch (e) {
//       console.error('Error saving payment:', e);
//     }
//   };

//   return (
//     <Modal open={open} onClose={() => setOpen(false)} size="lg">
//       <Modal.Header>
//         <Modal.Title>Invoice Payment</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <AddPayment
//           isReadOnly={false}
//           invoiceItems={invoiceItems}
//           dueAmount={invoice?.amount ?? 0}
//           freeBalance={0} // ممكن تمرري freeBalance الحقيقي من برا
//           onSave={handleSavePayment}
//           loading={savingPayment}
//         />
//       </Modal.Body>
//     </Modal>
//   );
// };

// export default PaymentModal;
// src/pages/accounting/PaymentModal.tsx
import React from 'react';
import { Modal } from 'rsuite';
import { useAppSelector } from '@/hooks';

import AddPayment from './AddPayment';

import {
  useCreatePaymentMutation,
  useCreatePaymentAllocationMutation,
  useGetInvoiceItemsQuery,
  useGetPatientAccountSummaryQuery,
} from '@/services/billing/BillingService';

import type {
  BillingItem,
  PatientPaymentCreateVM,
  PaymentAllocationCreateVM,
} from '@/types/model-types-new';

type PaymentModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  localPatient: any;
  invoice: { id: number; amount: number } | null;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  setOpen,
  localPatient,
  invoice,
}) => {
  const authSlice = useAppSelector(state => state.auth);
  const facilityId = authSlice?.tenant?.selectedFacility?.id;

  // 🟢 نجيب الآيتمز تبعت الفاتورة
  const { data: invoiceItemsResponse } = useGetInvoiceItemsQuery(
    { invoiceId: invoice?.id },
    { skip: !invoice?.id }
  );
  const invoiceItems: BillingItem[] = invoiceItemsResponse?.data ?? [];

  // 🟢 Patient balance
  const {
    data: accountSummary,
    refetch: refetchAccountSummary,
  } = useGetPatientAccountSummaryQuery(
    { patientKey: localPatient?.key },
    { skip: !localPatient?.key }
  );

  const freeBalance = Number(accountSummary?.freeBalance ?? 0);

  // 🟢 Mutations
  const [createPayment, { isLoading: savingPayment }] =
    useCreatePaymentMutation();
  const [createAllocation] = useCreatePaymentAllocationMutation();

  const handleSavePayment = async (partialPayment: PatientPaymentCreateVM) => {
    if (!invoice || !localPatient || !facilityId) return;

    try {
      // نكمّل الـ payload
      const paymentPayload: PatientPaymentCreateVM = {
        ...partialPayment,
        facilityId,
        patientKey: localPatient.key,
        paymentDate:
          partialPayment.paymentDate ||
          new Date().toISOString().slice(0, 10),
      };

      const payment = await createPayment(paymentPayload).unwrap();

      const allocationPayload: PaymentAllocationCreateVM = {
        paymentId: payment.id,
        invoiceId: invoice.id,
        allocatedAmount: paymentPayload.amount,
        invoiceItemId: null, // لو حابة تربطي على level الآيتم ممكن تعدّليه
      };

      await createAllocation(allocationPayload).unwrap();

      await refetchAccountSummary();

      setOpen(false);
    } catch (e) {
      console.error('Error saving payment:', e);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <Modal.Header>
        <Modal.Title>Invoice Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AddPayment
          isReadOnly={false}
          dueAmount={invoice?.amount ?? 0}
          freeBalance={freeBalance}
          invoiceItems={invoiceItems}
          onSave={handleSavePayment}
          loading={savingPayment}
        />
      </Modal.Body>
    </Modal>
  );
};

export default PaymentModal;
