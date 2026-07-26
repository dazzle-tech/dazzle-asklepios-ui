import React, { useEffect, useMemo, useState } from 'react';
import { Form, Modal, Text } from 'rsuite';

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
  computeRowRemainingAmount,
  formatMoney,
  isWalletPaymentMethod,
  makeRequestId,
  normalizeBillingError,
  resolveBillingPaymentCategory,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';

const FALLBACK_PAYMENT_METHODS = [
  { value: 'CASH', label: BILLING_PAYMENT_METHOD_LABELS.CASH },
  { value: 'CREDIT_DEBIT_CARD', label: BILLING_PAYMENT_METHOD_LABELS.CREDIT_DEBIT_CARD },
  { value: 'CHEQUE', label: BILLING_PAYMENT_METHOD_LABELS.CHEQUE },
  { value: 'BANK_TRANSFER', label: BILLING_PAYMENT_METHOD_LABELS.BANK_TRANSFER },
  {
    value: 'DEDUCT_FROM_FREE_BALANCE',
    label: BILLING_PAYMENT_METHOD_LABELS.DEDUCT_FROM_FREE_BALANCE
  }
];

type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  encounterId: number | null;
  currency?: string;
  walletBalance?: number;
  reservedBalance?: number;
  selectedRows: UnifiedBillingChargeRow[];
  onCollected?: () => void;
};

const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  open,
  onClose,
  patientId,
  encounterId,
  currency = 'SAR',
  walletBalance = 0,
  reservedBalance = 0,
  selectedRows,
  onCollected
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
    () =>
      selectedRows.reduce(
        (sum, row) => sum + computeRowRemainingAmount(row),
        0
      ),
    [selectedRows]
  );

  const totalReservedOnSelection = useMemo(
    () =>
      selectedRows.reduce(
        (sum, row) => sum + Number(row.reservedAmount ?? 0),
        0
      ),
    [selectedRows]
  );

  const pspIds = useMemo(
    () =>
      selectedRows
        .map(row => row.patientServiceProductId)
        .filter((id): id is number => id != null),
    [selectedRows]
  );

  const [form, setForm] = useState({
    amount: 0,
    paymentMethodCode: '',
    notes: ''
  });

  const [createAdvancePayment, { isLoading }] = useCreateAdvancePaymentMutation();

  const isWalletMethod = isWalletPaymentMethod(form.paymentMethodCode);
  const walletSpendable = Math.max(0, Number(walletBalance) + Number(reservedBalance));

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: Number(suggestedAmount.toFixed(2)),
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

    if (isWalletMethod && form.amount > walletSpendable) {
      dispatch(
        notify({
          msg: `Wallet balance is ${formatMoney(walletSpendable, currency)}. Reduce the amount or deposit more funds first.`,
          sev: 'warning'
        })
      );
      return;
    }

    if (!pspIds.length) {
      dispatch(
        notify({
          msg: 'Select at least one line with an outstanding patient balance.',
          sev: 'warning'
        })
      );
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
      notes: form.notes.trim() || 'Encounter payment collection',
      patientServiceProductIds: pspIds,
      requestId: makeRequestId('COLLECT-PAYMENT')
    };

    try {
      const result = await createAdvancePayment(request).unwrap();
      dispatch(
        notify({
          msg: isWalletMethod
            ? `Wallet payment applied. Payment #${result.paymentNumber ?? result.paymentId ?? ''}.`
            : `Payment #${result.paymentNumber ?? result.paymentId ?? ''} collected and reserved.`,
          sev: 'success'
        })
      );
      onCollected?.();
      onClose();
    } catch (error: any) {
      dispatch(
        notify({
          msg: normalizeBillingError(error),
          sev: 'error'
        })
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Collect payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-collect-payment-modal">
          <Text muted size="sm" style={{ marginBottom: 12 }}>
            {selectedRows.length} line(s) selected · suggested{' '}
            {formatMoney(suggestedAmount, currency)}
            {totalReservedOnSelection > 0
              ? ` (${formatMoney(totalReservedOnSelection, currency)} already reserved from advance)`
              : ''}
          </Text>
          {walletSpendable > 0 && (
            <Text muted size="sm" style={{ marginBottom: 12 }}>
              Wallet available {formatMoney(walletBalance, currency)}
              {reservedBalance > 0
                ? ` · reserved on encounter ${formatMoney(reservedBalance, currency)}`
                : ''}
            </Text>
          )}
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
            {isWalletMethod && (
              <Text muted size="sm" style={{ marginBottom: 12 }}>
                Pays from the patient wallet advance balance. Use deposited funds instead of
                cash or card.
              </Text>
            )}
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

export default CollectPaymentModal;
