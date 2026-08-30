import React, { useEffect, useMemo, useState } from 'react';
import { Form, Modal, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateAdvancePaymentMutation } from '@/services/billing/billingTransactionService';
import { newCreateAdvancePaymentRequest } from '@/types/model-types-constructor-new';
import type {
  CreateAdvancePaymentRequest,
  EncounterBillingSummary,
  PatientEncounter
} from '@/types/model-types-new';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PaymentReceiptModal from '@/pages/patient/patient-profile/PatientQuickAppoinment/PaymentReceiptModal';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import PaymentMethodSelector from './PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  buildBillingPaymentReceipt,
  computeRowRemainingAmount,
  computeWalletCollectAmounts,
  formatMoney,
  isWalletPaymentMethod,
  makeRequestId,
  mergeBillingPaymentMethodOptions,
  normalizeBillingError,
  resolveBillingPaymentCategory,
  resolvePaymentReceiptNumber,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';
import { collectCreditCardAmountOrSkip } from '@/utils/cardMachinePayment';

const toOptionalFacilityId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patient?: any;
  encounter?: PatientEncounter | null;
  encounterId: number | null;
  facilityId?: number | null;
  currency?: string;
  walletBalance?: number;
  reservedBalance?: number;
  billingSummary?: EncounterBillingSummary | null;
  selectedRows: UnifiedBillingChargeRow[];
  onCollected?: () => void;
};

const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  open,
  onClose,
  patientId,
  patient,
  encounter = null,
  encounterId,
  facilityId = null,
  currency = 'SAR',
  walletBalance = 0,
  reservedBalance = 0,
  billingSummary = null,
  selectedRows,
  onCollected
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const facilityName =
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    'Healthcare Facility';
  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];

  const paymentMethods =
    mergeBillingPaymentMethodOptions(enumPaymentMethods);

  const dedupedSelectedRows = useMemo(() => {
    const seenPspIds = new Set<number>();
    return selectedRows.filter(row => {
      const pspId = row.patientServiceProductId;
      if (pspId == null) {
        return true;
      }
      if (seenPspIds.has(pspId)) {
        return false;
      }
      seenPspIds.add(pspId);
      return true;
    });
  }, [selectedRows]);

  const suggestedAmount = useMemo(
    () =>
      dedupedSelectedRows.reduce(
        (sum, row) => sum + computeRowRemainingAmount(row),
        0
      ),
    [dedupedSelectedRows]
  );

  const totalReservedOnSelection = useMemo(
    () =>
      dedupedSelectedRows.reduce(
        (sum, row) => sum + Number(row.reservedAmount ?? 0),
        0
      ),
    [dedupedSelectedRows]
  );

  const pspIds = useMemo(
    () =>
      dedupedSelectedRows
        .map(row => row.patientServiceProductId)
        .filter((id): id is number => id != null),
    [dedupedSelectedRows]
  );

  const [form, setForm] = useState({
    amount: 0,
    paymentMethodCode: '',
    notes: ''
  });

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);

  const [createAdvancePayment, { isLoading }] = useCreateAdvancePaymentMutation();

  const isWalletMethod = isWalletPaymentMethod(form.paymentMethodCode);
  const walletAvailable = Math.max(0, Number(walletBalance));
  const walletCollectPreview = computeWalletCollectAmounts(
    suggestedAmount,
    walletAvailable,
    form.amount
  );

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: Number(suggestedAmount.toFixed(2)),
      paymentMethodCode: '',
      notes: ''
    });
  }, [open, suggestedAmount]);

  useEffect(() => {
    if (!open || !isWalletMethod) return;

    setForm(previous => ({
      ...previous,
      amount: Number(
        Math.min(suggestedAmount, walletAvailable, previous.amount || suggestedAmount).toFixed(2)
      )
    }));
  }, [open, isWalletMethod, suggestedAmount, walletAvailable]);

  const handleSubmit = async () => {
    if (!form.paymentMethodCode) {
      dispatch(notify({ msg: 'Select a payment method.', sev: 'warning' }));
      return;
    }

    if (isWalletMethod) {
      if (walletAvailable <= 0) {
        dispatch(
          notify({
            msg: 'No wallet balance available. Deposit funds first or choose another payment method.',
            sev: 'warning'
          })
        );
        return;
      }

      if (walletCollectPreview.applyAmount <= 0) {
        dispatch(
          notify({
            msg: 'Nothing to apply from the wallet for the selected lines.',
            sev: 'warning'
          })
        );
        return;
      }
    }

    if (!isWalletMethod && (!form.amount || form.amount <= 0)) {
      dispatch(notify({ msg: 'Enter a payment amount greater than zero.', sev: 'warning' }));
      return;
    }

    if (!isWalletMethod && form.amount > suggestedAmount + 0.0001) {
      dispatch(
        notify({
          msg: `Amount cannot exceed the selected balance of ${formatMoney(suggestedAmount, currency)}.`,
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

    const paymentAmount = isWalletMethod
      ? walletCollectPreview.applyAmount
      : Number(form.amount);

    const creditCardCollect = await collectCreditCardAmountOrSkip(
      form.paymentMethodCode,
      paymentAmount,
      {
        currency,
        patientId,
        encounterId,
        facilityId
      }
    );

    if (!creditCardCollect.proceed) {
      dispatch(
        notify({
          msg:
            creditCardCollect.result?.message ??
            'Credit card payment was not completed.',
          sev: 'warning'
        })
      );
      return;
    }

    const request: CreateAdvancePaymentRequest = {
      ...newCreateAdvancePaymentRequest,
      patientId,
      encounterId: encounterId ?? null,
      facilityId:
        facilityId ??
        toOptionalFacilityId(encounter?.facilityId) ??
        toOptionalFacilityId(encounter?.facility?.id) ??
        toOptionalFacilityId(authSlice?.tenant?.selectedFacility?.id),
      paymentCategory: resolveBillingPaymentCategory(form.paymentMethodCode),
      payerType: 'PATIENT',
      amount: paymentAmount,
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
      const receiptData = buildBillingPaymentReceipt({
        paymentResult: result,
        patient,
        encounter,
        facilityName,
        billingSummary,
        paymentMethodLabel:
          selectedMethod?.label ?? form.paymentMethodCode ?? 'Payment'
      });

      dispatch(
        notify({
          msg: isWalletMethod
            ? walletCollectPreview.remainingAfter > 0
              ? `Wallet applied ${formatMoney(paymentAmount, currency)}. Remaining to pay ${formatMoney(walletCollectPreview.remainingAfter, currency)}.`
              : `Wallet payment applied. Receipt #${resolvePaymentReceiptNumber(result)}.`
            : `Receipt #${resolvePaymentReceiptNumber(result)} collected and reserved.`,
          sev: 'success'
        })
      );
      onCollected?.();
      onClose();
      setReceipt(receiptData);
      setReceiptOpen(true);
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
    <>
    <Modal open={open} onClose={onClose} size="sm" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Collect payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-collect-payment-modal">
          <Text muted size="sm" style={{ marginBottom: 12 }}>
            {dedupedSelectedRows.length} line(s) selected · suggested{' '}
            {formatMoney(suggestedAmount, currency)}
            {dedupedSelectedRows.length !== selectedRows.length
              ? ' · duplicate visit lines ignored'
              : ''}
            {totalReservedOnSelection > 0
              ? ` (${formatMoney(totalReservedOnSelection, currency)} already reserved from advance)`
              : ''}
          </Text>
          {walletAvailable > 0 && (
            <Text muted size="sm" style={{ marginBottom: 12 }}>
              Wallet available {formatMoney(walletAvailable, currency)}
              {reservedBalance > 0
                ? ` · ${formatMoney(reservedBalance, currency)} already reserved on this encounter`
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
              <>
                <Text muted size="sm" style={{ marginBottom: 12 }}>
                  Pays from the patient wallet advance balance. If the service costs more than the
                  wallet, only the available balance is applied and the rest stays as remaining to
                  pay.
                </Text>
                <Text size="sm" style={{ marginBottom: 12 }}>
                  Service due {formatMoney(suggestedAmount, currency)} · Wallet will apply{' '}
                  {formatMoney(walletCollectPreview.applyAmount, currency)} · Remaining to pay{' '}
                  {formatMoney(walletCollectPreview.remainingAfter, currency)}
                </Text>
              </>
            )}
            <MyInput
              column
              fieldType="number"
              fieldLabel={isWalletMethod ? 'Amount to apply from wallet' : 'Amount'}
              fieldName="amount"
              record={form}
              setRecord={nextRecord => {
                if (!isWalletMethod) {
                  setForm(nextRecord);
                  return;
                }

                const rawAmount = Number(nextRecord.amount ?? 0);
                const cappedAmount = Math.min(
                  Math.max(0, rawAmount),
                  suggestedAmount,
                  walletAvailable
                );

                setForm({
                  ...nextRecord,
                  amount: Number(cappedAmount.toFixed(2))
                });
              }}
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

    <PaymentReceiptModal
      open={receiptOpen}
      onClose={() => {
        setReceiptOpen(false);
        setReceipt(null);
      }}
      receipt={receipt}
      autoPrint
    />
    </>
  );
};

export default CollectPaymentModal;
