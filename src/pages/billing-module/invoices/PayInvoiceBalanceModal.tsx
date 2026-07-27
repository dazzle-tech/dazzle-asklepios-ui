import React, { useEffect, useMemo, useState } from 'react';
import { Form, Modal, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import type { CollectInvoiceBalanceResult } from '@/services/billing/financialDocumentAdjustmentService';
import { useCollectInvoiceBalanceMutation } from '@/services/billing/financialDocumentAdjustmentService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PaymentMethodSelector from '@/pages/billing-module/accounting/components/PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  formatMoney,
  makeRequestId
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

const FALLBACK_PAYMENT_METHODS = [
  { value: 'CASH', label: BILLING_PAYMENT_METHOD_LABELS.CASH },
  { value: 'CREDIT_DEBIT_CARD', label: BILLING_PAYMENT_METHOD_LABELS.CREDIT_DEBIT_CARD },
  { value: 'CHEQUE', label: BILLING_PAYMENT_METHOD_LABELS.CHEQUE },
  { value: 'BANK_TRANSFER', label: BILLING_PAYMENT_METHOD_LABELS.BANK_TRANSFER }
];

type PayInvoiceBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  documentNumber?: string | null;
  outstandingAmount: number;
  currency?: string;
  onPaid?: (result: CollectInvoiceBalanceResult) => void;
};

const PayInvoiceBalanceModal: React.FC<PayInvoiceBalanceModalProps> = ({
  open,
  onClose,
  invoiceId,
  documentNumber,
  outstandingAmount,
  currency = 'SAR',
  onPaid
}) => {
  const dispatch = useAppDispatch();
  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];

  const paymentMethods =
    enumPaymentMethods.length > 0 ? enumPaymentMethods : FALLBACK_PAYMENT_METHODS;

  const suggestedAmount = useMemo(
    () => Number(outstandingAmount.toFixed(2)),
    [outstandingAmount]
  );

  const [form, setForm] = useState({
    amount: 0,
    paymentMethodCode: '',
    notes: ''
  });

  const [collectInvoiceBalance, { isLoading }] = useCollectInvoiceBalanceMutation();

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: suggestedAmount,
      paymentMethodCode: '',
      notes: ''
    });
  }, [open, suggestedAmount]);

  const handleSubmit = async () => {
    if (!form.paymentMethodCode) {
      dispatch(notify({ msg: 'Select a payment method.', sev: 'warning' }));
      return;
    }

    if (!form.amount || form.amount <= 0) {
      dispatch(notify({ msg: 'Enter a payment amount greater than zero.', sev: 'warning' }));
      return;
    }

    if (form.amount > outstandingAmount) {
      dispatch(
        notify({
          msg: `Amount exceeds outstanding balance (${formatMoney(outstandingAmount, currency)}).`,
          sev: 'warning'
        })
      );
      return;
    }

    const selectedMethod = paymentMethods.find(
      option => String(option?.value) === String(form.paymentMethodCode)
    );

    try {
      const result = await collectInvoiceBalance({
        invoiceId,
        body: {
          amount: Number(form.amount),
          paymentMethodCode: form.paymentMethodCode,
          paymentMethodId: Number(
            selectedMethod?.id ?? selectedMethod?.key ?? selectedMethod?.valueId ?? 0
          ),
          requestId: makeRequestId('INVOICE-PAY'),
          notes: form.notes.trim() || `Invoice balance payment ${documentNumber ?? invoiceId}`
        }
      }).unwrap();

      dispatch(
        notify({
          msg: `Collected ${formatMoney(result.collectedAmount, currency)} on ${result.documentNumber}. Remaining ${formatMoney(result.outstandingAmount, currency)}.`,
          sev: 'success'
        })
      );
      onPaid?.(result);
      onClose();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message ?? error?.data?.detail ?? 'Invoice payment failed.',
          sev: 'error'
        })
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Pay invoice balance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-collect-payment-modal">
          <Text muted size="sm" style={{ marginBottom: 12 }}>
            {documentNumber ? `Invoice ${documentNumber}` : `Invoice #${invoiceId}`} · outstanding{' '}
            {formatMoney(outstandingAmount, currency)}
          </Text>
          <Text muted size="sm" style={{ marginBottom: 12 }}>
            Collect the invoice-level balance (tax/discount delta) after billing checkout.
          </Text>
          <Form fluid>
            <PaymentMethodSelector
              value={form.paymentMethodCode}
              options={paymentMethods}
              onChange={paymentMethodCode =>
                setForm(previous => ({
                  ...previous,
                  paymentMethodCode
                }))
              }
            />
            <MyInput
              column
              fieldType="number"
              fieldLabel="Amount"
              fieldName="amount"
              record={form}
              setRecord={setForm}
              width="100%"
            />
            <MyInput
              column
              fieldType="textarea"
              fieldLabel="Notes"
              fieldName="notes"
              record={form}
              setRecord={setForm}
              width="100%"
            />
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={onClose} disabled={isLoading}>
          Cancel
        </MyButton>
        <MyButton appearance="primary" loading={isLoading} onClick={handleSubmit}>
          Collect payment
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default PayInvoiceBalanceModal;
