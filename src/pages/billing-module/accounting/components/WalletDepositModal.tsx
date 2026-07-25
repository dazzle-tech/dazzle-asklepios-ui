import React, { useEffect, useState } from 'react';
import { Form, Modal } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateAdvancePaymentMutation } from '@/services/billing/billingTransactionService';
import { newCreateAdvancePaymentRequest } from '@/types/model-types-constructor-new';
import type { CreateAdvancePaymentRequest } from '@/types/model-types-new';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PaymentMethodSelector from './PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  makeRequestId,
  resolveBillingPaymentCategory
} from '../utils/billingAccountingUtils';

const FALLBACK_DEPOSIT_METHODS = [
  { value: 'CASH', label: BILLING_PAYMENT_METHOD_LABELS.CASH },
  { value: 'CREDIT_DEBIT_CARD', label: BILLING_PAYMENT_METHOD_LABELS.CREDIT_DEBIT_CARD },
  { value: 'CHEQUE', label: BILLING_PAYMENT_METHOD_LABELS.CHEQUE },
  { value: 'BANK_TRANSFER', label: BILLING_PAYMENT_METHOD_LABELS.BANK_TRANSFER }
];

type WalletDepositModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  encounterId?: number | null;
  currency?: string;
  onDeposited?: () => void;
};

const WalletDepositModal: React.FC<WalletDepositModalProps> = ({
  open,
  onClose,
  patientId,
  encounterId = null,
  currency = 'SAR',
  onDeposited
}) => {
  const dispatch = useAppDispatch();
  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE', 'DEDUCT_FROM_FREE_BALANCE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];

  const paymentMethods =
    enumPaymentMethods.length > 0 ? enumPaymentMethods : FALLBACK_DEPOSIT_METHODS;

  const [form, setForm] = useState({
    amount: 0,
    paymentMethodCode: '',
    notes: ''
  });

  const [createAdvancePayment, { isLoading }] = useCreateAdvancePaymentMutation();

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: 0,
      paymentMethodCode: String(paymentMethods[0]?.value ?? ''),
      notes: ''
    });
  }, [open]);

  useEffect(() => {
    if (!open || form.paymentMethodCode || !paymentMethods.length) return;

    setForm(previous => ({
      ...previous,
      paymentMethodCode: String(paymentMethods[0]?.value ?? '')
    }));
  }, [open, form.paymentMethodCode, paymentMethods]);

  const handleSubmit = async () => {
    if (!form.paymentMethodCode) {
      dispatch(notify({ msg: 'Select a payment method.', sev: 'warning' }));
      return;
    }

    if (!form.amount || form.amount <= 0) {
      dispatch(notify({ msg: 'Enter a deposit amount greater than zero.', sev: 'warning' }));
      return;
    }

    const selectedMethod = paymentMethods.find(
      option => String(option?.value) === String(form.paymentMethodCode)
    );

    const request: CreateAdvancePaymentRequest = {
      ...newCreateAdvancePaymentRequest,
      patientId,
      encounterId,
      paymentCategory: resolveBillingPaymentCategory(form.paymentMethodCode),
      payerType: 'PATIENT',
      amount: Number(form.amount),
      currency,
      paymentStatus: 'COMPLETED',
      transactionType: 'PAYMENT',
      paymentMethodId: Number(
        selectedMethod?.id ?? selectedMethod?.key ?? selectedMethod?.valueId ?? 0
      ),
      paymentMethodCode: form.paymentMethodCode,
      transactionStatus: 'SUCCESS',
      notes: form.notes.trim() || 'Patient wallet deposit',
      patientServiceProductIds: [],
      requestId: makeRequestId('WALLET-DEPOSIT')
    };

    try {
      const result = await createAdvancePayment(request).unwrap();
      dispatch(
        notify({
          msg: `Deposit recorded. Payment #${result.paymentNumber ?? result.paymentId ?? ''}`,
          sev: 'success'
        })
      );
      onDeposited?.();
      onClose();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message ?? error?.message ?? 'Failed to record deposit.',
          sev: 'error'
        })
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Deposit to patient wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-wallet-deposit-modal">
          <Form fluid>
            <MyInput
              column
              fieldType="number"
              fieldLabel="Amount"
              fieldName="amount"
              record={form}
              setRecord={setForm}
              width="100%"
            />
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
          Record deposit
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default WalletDepositModal;
