import React, { useEffect, useMemo, useState } from 'react';
import { Form, Modal, Slider, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faMoneyBillTransfer,
  faWallet
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useRefundBillingPaymentMutation } from '@/services/billing/billingTransactionService';
import { newBillingRefundRequest } from '@/types/model-types-constructor-new';
import type {
  BillingRefundRequest,
  PatientEncounter
} from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage, WALLET_REFUND_ERROR_MAP } from '@/utils/apiErrorMessage';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import PaymentMethodSelector from './PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  buildWalletRefundReceipt,
  formatMoney,
  makeRequestId,
  mergeBillingPaymentMethodOptions
} from '../utils/billingAccountingUtils';

const REFUND_REASONS = [
  'Patient requested refund',
  'Duplicate payment',
  'Overpayment',
  'Visit cancelled'
] as const;

const QUICK_PERCENTS = [25, 50, 75, 100] as const;

const toMoney = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Number(parsed.toFixed(2));
};

const clampAmount = (value: unknown, max: number): number => {
  const amount = toMoney(value);
  if (max <= 0) {
    return 0;
  }

  return Math.min(amount, max);
};

type WalletRefundModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patient?: any;
  encounter?: PatientEncounter | null;
  encounterId?: number | null;
  facilityId?: number | null;
  currency?: string;
  walletAvailable?: number;
  walletReserved?: number;
  onRefunded?: () => void;
  onReceiptReady?: (receipt: PaymentReceiptData) => void;
};

const WalletRefundModal: React.FC<WalletRefundModalProps> = ({
  open,
  onClose,
  patientId,
  patient,
  encounter = null,
  encounterId = null,
  facilityId = null,
  currency = 'SAR',
  walletAvailable = 0,
  walletReserved = 0,
  onRefunded,
  onReceiptReady
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const requestedBy = String(
    authSlice?.user?.username ??
      authSlice?.user?.login ??
      authSlice?.user?.key ??
      'billing-user'
  ).slice(0, 50);
  const facilityName =
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    'Healthcare Facility';

  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE', 'DEDUCT_FROM_FREE_BALANCE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];

  const paymentMethods = useMemo(
    () =>
      mergeBillingPaymentMethodOptions(enumPaymentMethods, {
        exclude: ['DEDUCT_FROM_FREE_BALANCE']
      }),
    [enumPaymentMethods]
  );

  const available = toMoney(walletAvailable);
  const reserved = toMoney(walletReserved);
  const canRefund = available > 0;

  const [form, setForm] = useState({
    amount: 0,
    refundMethodCode: '',
    reason: '',
    notes: ''
  });

  const [refundBillingPayment, { isLoading }] = useRefundBillingPaymentMutation();

  const remainingAfterRefund = Math.max(0, Number((available - toMoney(form.amount)).toFixed(2)));
  const refundPercent = available > 0 ? Math.min(100, (toMoney(form.amount) / available) * 100) : 0;

  const selectedReasonChip = useMemo(
    () => REFUND_REASONS.find(reason => reason === form.reason) ?? '',
    [form.reason]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      amount: 0,
      refundMethodCode: '',
      reason: '',
      notes: ''
    });
  }, [open]);

  useEffect(() => {
    setForm(previous => ({
      ...previous,
      amount: clampAmount(previous.amount, available)
    }));
  }, [available]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultMethod =
      paymentMethods.find(option => option.value === 'CASH')?.value ??
      paymentMethods[0]?.value ??
      '';

    if (!defaultMethod) {
      return;
    }

    setForm(previous =>
      previous.refundMethodCode
        ? previous
        : {
            ...previous,
            refundMethodCode: defaultMethod
          }
    );
  }, [open, paymentMethods]);

  const applyAmount = (nextAmount: number) => {
    setForm(previous => ({
      ...previous,
      amount: clampAmount(nextAmount, available)
    }));
  };

  const handleFormChange = (next: typeof form) => {
    setForm({
      ...next,
      amount: clampAmount(next.amount, available)
    });
  };

  const handleSubmit = async () => {
    const amount = clampAmount(form.amount, available);

    if (!canRefund) {
      dispatch(
        notify({
          msg: 'No available wallet balance to refund. Reserved funds cannot be refunded.',
          sev: 'warning'
        })
      );
      return;
    }

    if (!form.refundMethodCode) {
      dispatch(notify({ msg: 'Select how the refund should be returned.', sev: 'warning' }));
      return;
    }

    if (amount <= 0) {
      dispatch(notify({ msg: 'Enter a refund amount greater than zero.', sev: 'warning' }));
      return;
    }

    if (amount > available) {
      dispatch(
        notify({
          msg: `Refund cannot exceed the available wallet balance of ${formatMoney(available, currency)}.`,
          sev: 'warning'
        })
      );
      return;
    }

    if (!form.reason.trim()) {
      dispatch(notify({ msg: 'Select or enter a refund reason.', sev: 'warning' }));
      return;
    }

    const selectedMethod = paymentMethods.find(
      option => String(option?.value) === String(form.refundMethodCode)
    );
    const refundMethodLabel =
      selectedMethod?.label ?? form.refundMethodCode ?? 'Refund';

    const request: BillingRefundRequest = {
      ...newBillingRefundRequest,
      patientId,
      encounterId,
      facilityId,
      originalPaymentId: null,
      originalPaymentTransactionId: null,
      refundSourceType: 'WALLET_AVAILABLE',
      requestedAmount: amount,
      refundMethodId: Number(
        selectedMethod?.id ?? selectedMethod?.key ?? selectedMethod?.valueId ?? 0
      ),
      refundMethodCode: form.refundMethodCode,
      requestedBy,
      reason: form.reason.trim(),
      notes: form.notes.trim() || 'Available wallet refund to patient',
      requestId: makeRequestId('WALLET-REFUND'),
      sourceChannel: 'CASHIER'
    };

    try {
      const result = await refundBillingPayment(request).unwrap();
      const receiptData = buildWalletRefundReceipt({
        refundResult: result,
        patient,
        encounter,
        facilityName,
        currency,
        paymentMethodLabel: refundMethodLabel,
        notes: form.notes.trim() || 'Available wallet refund to patient'
      });

      dispatch(
        notify({
          msg: `Refund ${result.documentNumber ?? result.refundNumber} completed. ${formatMoney(
            result.refundedAmount,
            currency
          )} returned to the patient.`,
          sev: 'success'
        })
      );

      onRefunded?.();
      onClose();
      onReceiptReady?.(receiptData);
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error, WALLET_REFUND_ERROR_MAP),
          sev: 'error'
        })
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      overflow
      enforceFocus={false}
      className="billing-wallet-refund-dialog"
    >
      <Modal.Header>
        <Modal.Title>
          <span className="billing-wallet-refund__title">
            <FontAwesomeIcon icon={faMoneyBillTransfer} />
            Refund to patient
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-wallet-refund">
          <div className="billing-wallet-refund__hero">
            <div className="billing-wallet-refund__hero-copy">
              <span className="billing-wallet-refund__kicker">Available in wallet</span>
              <strong>{formatMoney(available, currency)}</strong>
              <p>
                Only available balance can be returned. Reserved funds stay in the wallet until
                they are released.
              </p>
            </div>
            <div className="billing-wallet-refund__hero-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faWallet} />
            </div>
          </div>

          <div className="billing-wallet-refund__metrics">
            <div>
              <span>Refunding now</span>
              <strong>{formatMoney(form.amount, currency)}</strong>
            </div>
            <div>
              <span>Remaining after refund</span>
              <strong>{formatMoney(remainingAfterRefund, currency)}</strong>
            </div>
            {reserved > 0 && (
              <div>
                <span>Reserved (not refundable)</span>
                <strong>{formatMoney(reserved, currency)}</strong>
              </div>
            )}
          </div>

          <div className="billing-wallet-refund__progress" aria-hidden="true">
            <div
              className="billing-wallet-refund__progress-fill"
              style={{ width: `${refundPercent}%` }}
            />
          </div>

          {!canRefund ? (
            <div className="billing-wallet-refund__empty">
              <FontAwesomeIcon icon={faCircleCheck} />
              <Text>This patient has no available wallet balance to refund.</Text>
            </div>
          ) : (
            <Form fluid>
              <div className="billing-wallet-refund__amount">
                <div className="billing-wallet-refund__amount-label">
                  <span>Amount to return</span>
                  <span>
                    {refundPercent.toFixed(0)}% of available
                  </span>
                </div>
                <Slider
                  progress
                  min={0}
                  max={available}
                  step={available >= 10 ? 1 : 0.01}
                  value={toMoney(form.amount)}
                  onChange={value => applyAmount(Number(value))}
                />
                <div className="billing-wallet-refund__chips">
                  {QUICK_PERCENTS.map(percent => {
                    const chipAmount = Number(((available * percent) / 100).toFixed(2));
                    const active = toMoney(form.amount) === chipAmount;

                    return (
                      <button
                        key={percent}
                        type="button"
                        className={`billing-wallet-refund__chip${
                          active ? ' billing-wallet-refund__chip--active' : ''
                        }`}
                        onClick={() => applyAmount(chipAmount)}
                      >
                        {percent === 100 ? 'Max' : `${percent}%`}
                      </button>
                    );
                  })}
                </div>
                <MyInput
                  column
                  fieldType="number"
                  fieldLabel="Refund amount"
                  fieldName="amount"
                  record={form}
                  setRecord={handleFormChange}
                  width="100%"
                />
              </div>

              <PaymentMethodSelector
                label="Return via"
                value={form.refundMethodCode}
                options={paymentMethods}
                onChange={refundMethodCode =>
                  setForm(previous => ({
                    ...previous,
                    refundMethodCode
                  }))
                }
                placeholder="Select refund method"
              />

              <Form.Group>
                <Form.ControlLabel>Reason</Form.ControlLabel>
                <div className="billing-wallet-refund__chips">
                  {REFUND_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      className={`billing-wallet-refund__chip${
                        selectedReasonChip === reason
                          ? ' billing-wallet-refund__chip--active'
                          : ''
                      }`}
                      onClick={() =>
                        setForm(previous => ({
                          ...previous,
                          reason
                        }))
                      }
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <MyInput
                  column
                  fieldType="textarea"
                  fieldLabel="Refund reason"
                  fieldName="reason"
                  record={form}
                  setRecord={handleFormChange}
                  width="100%"
                />
              </Form.Group>

              <MyInput
                column
                fieldType="textarea"
                fieldLabel="Notes"
                fieldName="notes"
                record={form}
                setRecord={handleFormChange}
                width="100%"
              />
            </Form>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={onClose} disabled={isLoading}>
          Cancel
        </MyButton>
        <MyButton
          appearance="primary"
          loading={isLoading}
          disabled={!canRefund || isLoading}
          onClick={handleSubmit}
        >
          Refund to patient
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default WalletRefundModal;
