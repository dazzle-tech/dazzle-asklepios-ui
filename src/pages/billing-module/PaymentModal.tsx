
import React from 'react';
import { Message, Modal, useToaster } from 'rsuite';

import AddPayment from './AddPayment';

import {
  useGetPatientAccountSummaryQuery,
} from '@/services/billing/BillingService';
import { useGetPatientInvoiceItemsByInvoiceIdQuery } from '@/services/patient/patientBillingInvoiceItemService';

import type {
  BillingItem,
  BillingInvoiceItemResponseVM,
  PatientPaymentCreateVM,
} from '@/types/model-types-new';

type PaymentModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  localPatient: any;
  invoice: { id: number; amount: number; encounterId?: number } | null;
  onSimulatedPaid?: (
    invoiceId: number,
    status: 'Paid' | 'Partially',
    paidAmount: number
  ) => void;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  setOpen,
  localPatient,
  invoice,
  onSimulatedPaid,
}) => {
  const toaster = useToaster();

  const { data: invoiceItemsResponse } = useGetPatientInvoiceItemsByInvoiceIdQuery(
    { invoiceId: Number(invoice?.id), page: 0, size: 100, sort: 'id,asc' },
    { skip: !invoice?.id }
  );
  const rawInvoiceItems: BillingInvoiceItemResponseVM[] = invoiceItemsResponse?.data ?? [];
  const invoiceItems: BillingItem[] = rawInvoiceItems.map((item, index) => {
    const code = String(item.code ?? '');
    const [mappedType, mappedName] = code.includes('::')
      ? code.split('::')
      : ['', code];
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unitPrice ?? 0);
    const totalPrice = Number(item.totalPrice ?? unitPrice * quantity);

    return {
      id: String(item.id ?? index),
      nurseServiceProductKey: String((item as any).nurseServiceProductId ?? ''),
      clinic: '',
      chargeDate: '',
      type: mappedType || 'N/A',
      name: mappedName || `Item #${item.id}`,
      price: unitPrice,
      totalPrice,
      currency: item.currency ?? 'USD',
      discount: 0,
      priceList: 'Standard',
      patientKey: String(localPatient?.key ?? ''),
      quantity,
    };
  });

  const {
    data: accountSummary,
    refetch: refetchAccountSummary,
  } = useGetPatientAccountSummaryQuery(
    { patientKey: localPatient?.key },
    { skip: !localPatient?.key }
  );

  const freeBalance = Number(accountSummary?.freeBalance ?? 0);

  const [savingPayment] = React.useState(false);

  const handleSavePayment = async (
    partialPayment: PatientPaymentCreateVM,
    selectedItemIds: string[]
  ) => {
    if (!invoice || !localPatient) return;
    if (!selectedItemIds?.length) {
      toaster.push(
        <Message showIcon type="warning" closable>
          Select at least one invoice item.
        </Message>,
        { placement: 'topEnd', duration: 3500 }
      );
      return;
    }

    try {
      const selectedItems = invoiceItems.filter(item =>
        selectedItemIds.includes(String(item.id))
      );
      if (!selectedItems.length) {
        toaster.push(
          <Message showIcon type="warning" closable>
            Select at least one invoice item.
          </Message>,
          { placement: 'topEnd', duration: 3500 }
        );
        return;
      }

      // Fake payment for invoice flow: UI-only confirmation without backend mutation.
      const selectedTotal = selectedItems.reduce(
        (sum, item) => sum + Number(item.totalPrice ?? item.price * (item.quantity || 1)),
        0
      );
      const enteredAmount = Number(partialPayment.amount ?? 0);
      if (enteredAmount <= 0 || enteredAmount > selectedTotal) {
        toaster.push(
          <Message showIcon type="warning" closable>
            Entered amount is invalid for selected invoice items.
          </Message>,
          { placement: 'topEnd', duration: 3500 }
        );
        return;
      }

      setOpen(false);
      if (invoice?.id) {
        const nextStatus: 'Paid' | 'Partially' =
          enteredAmount >= Number(invoice.amount ?? 0) ? 'Paid' : 'Partially';
        onSimulatedPaid?.(invoice.id, nextStatus, enteredAmount);
      }
      toaster.push(
        <Message showIcon type="success" closable>
          Invoice payment saved (simulation mode).
        </Message>,
        { placement: 'topEnd', duration: 2500 }
      );
    } catch (e) {
      console.error('Error saving payment:', e);
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to save payment. Please review entered data and try again.
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );
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
