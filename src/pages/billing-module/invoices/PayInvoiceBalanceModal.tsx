import React, { useEffect, useMemo, useState } from 'react';
import { Form, Modal, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import type {
  CollectInvoiceBalanceResult,
  InvoiceAdjustmentSummary,
  InvoiceLineItem,
  InvoicePricingSummary
} from '@/services/billing/financialDocumentAdjustmentService';
import { useCollectInvoiceBalanceMutation } from '@/services/billing/financialDocumentAdjustmentService';
import { useGetInvoiceByIdQuery } from '@/services/billing/BillingService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PaymentMethodSelector from '@/pages/billing-module/accounting/components/PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  computeWalletCollectAmounts,
  formatMoney,
  isWalletPaymentMethod,
  makeRequestId,
  mergeBillingPaymentMethodOptions
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { resolveInvoiceDisplayNumber } from './invoiceDisplayUtils';
import { useCreditCardMachinePayment } from '@/utils/cardMachinePayment';

export type InvoicePaymentCompletedContext = {
  paymentMethodLabel: string;
  paymentMethodCode: string;
};

type PayInvoiceBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  patientId?: number | null;
  encounterId?: number | null;
  documentNumber?: string | null;
  summary?: InvoiceAdjustmentSummary | null;
  lineItems?: InvoiceLineItem[];
  pricingSummary?: InvoicePricingSummary | null;
  outstandingAmount: number;
  currency?: string;
  walletBalance?: number;
  walletReserved?: number;
  onPaid?: (
    result: CollectInvoiceBalanceResult,
    context: InvoicePaymentCompletedContext
  ) => void;
};

const PayInvoiceBalanceModal: React.FC<PayInvoiceBalanceModalProps> = ({
  open,
  onClose,
  invoiceId,
  patientId = null,
  encounterId = null,
  documentNumber,
  summary,
  lineItems = [],
  pricingSummary,
  outstandingAmount,
  currency = 'SAR',
  walletBalance = 0,
  walletReserved = 0,
  onPaid
}) => {
  const dispatch = useAppDispatch();
   console.log("Summary:", summary);
   
  const resolvedPatientId =
    patientId ??
    (typeof (summary as any)?.patientId === 'number'
      ? Number((summary as any).patientId)
      : null) ??
    (typeof (summary as any)?.patient?.id === 'number'
      ? Number((summary as any).patient.id)
      : null);

  const resolvedEncounterId =
    encounterId ??
    (typeof (summary as any)?.encounterId === 'number'
      ? Number((summary as any).encounterId)
      : null) ??
    (typeof (summary as any)?.encounter?.id === 'number'
      ? Number((summary as any).encounter.id)
      : null);
console.log("Resolved Patient ID:", resolvedPatientId);
   console.log("Resolved Encounter ID:", resolvedEncounterId);
  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];

  const paymentMethods =
    mergeBillingPaymentMethodOptions(enumPaymentMethods);

  const resolvedDocumentNumber = resolveInvoiceDisplayNumber(
    { id: invoiceId, documentNumber },
    summary,
    pricingSummary
  );

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
  const {
    collectCreditCardAmountOrSkip,
    isProcessingCard
  } = useCreditCardMachinePayment();
  const isWalletMethod = isWalletPaymentMethod(form.paymentMethodCode);
  const walletAvailable = Math.max(0, Number(walletBalance) + Number(walletReserved));
  const walletCollectPreview = computeWalletCollectAmounts(
    suggestedAmount,
    walletAvailable,
    form.amount
  );

  const pricingDetailRows = useMemo(
    () =>
      lineItems.flatMap(item => {
        const discounts = item.appliedDiscounts ?? [];
        const taxes = item.appliedTaxes ?? [];

        return [
          ...discounts.map((discount, index) => ({
            key: `${item.id}-discount-${index}`,
            service: item.itemDescription ?? item.itemCode ?? '-',
            kind: 'Discount',
            rule: discount.code ?? discount.name ?? discount.source ?? '-',
            amount: discount.appliedAmount ?? 0
          })),
          ...taxes.map((tax, index) => ({
            key: `${item.id}-tax-${index}`,
            service: item.itemDescription ?? item.itemCode ?? '-',
            kind: 'Tax',
            rule: tax.code ?? tax.name ?? tax.source ?? '-',
            amount: tax.appliedAmount ?? 0
          }))
        ];
      }),
    [lineItems]
  );

  const adjustmentRows = useMemo(
    () =>
      (summary?.adjustments ?? []).map(adjustment => ({
        key: String(adjustment.id),
        documentNumber: adjustment.documentNumber,
        documentType: adjustment.documentType,
        amount: adjustment.totalAmount,
        reason: adjustment.adjustmentReason ?? '-'
      })),
    [summary?.adjustments]
  );

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: suggestedAmount,
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

    const selectedMethod = paymentMethods.find(
      option => String(option?.value) === String(form.paymentMethodCode)
    );
    const paymentMethodLabel =
      selectedMethod?.label ?? form.paymentMethodCode ?? 'Payment';

    let paymentAmount = Number(form.amount);

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
            msg: 'Enter a wallet payment amount greater than zero.',
            sev: 'warning'
          })
        );
        return;
      }

      paymentAmount = walletCollectPreview.applyAmount;
    } else if (!paymentAmount || paymentAmount <= 0) {
      dispatch(notify({ msg: 'Enter a payment amount greater than zero.', sev: 'warning' }));
      return;
    }

    if (Number(paymentAmount.toFixed(4)) > Number(outstandingAmount.toFixed(4))) {
      dispatch(
        notify({
          msg: `Amount exceeds outstanding balance (${formatMoney(outstandingAmount, currency)}).`,
          sev: 'warning'
        })
      );
      return;
    }
    const chargeCreditCardIfNeeded = async () => {
      if (resolvedPatientId == null || resolvedEncounterId == null) {
        return true;
      }

      const creditCardCollect = await collectCreditCardAmountOrSkip(
        selectedMethod?.value ?? form.paymentMethodCode,
        paymentAmount,
        {
          patientId: resolvedPatientId,
          sourceType: 'ENCOUNTER',
          sourceReferenceId: resolvedEncounterId,
          facilityId: null
        }
      );

      if (!creditCardCollect.proceed) {
        dispatch(
          notify({
            msg: creditCardCollect.result?.message ?? 'Credit card payment was not completed.',
            sev: 'warning'
          })
        );
        return false;
      }

      return true;
    };

    const creditCardCharged = await chargeCreditCardIfNeeded();

    if (!creditCardCharged) {
      return;
    }

    try {
      const result = await collectInvoiceBalance({
        invoiceId,
        body: {
          amount: paymentAmount,
          paymentMethodCode: form.paymentMethodCode,
          paymentMethodId: Number(
            selectedMethod?.id ?? selectedMethod?.key ?? selectedMethod?.valueId ?? 0
          ),
          requestId: makeRequestId('INVOICE-PAY'),
          notes: form.notes.trim() || `Invoice balance payment ${resolvedDocumentNumber}`
        }
      }).unwrap();

      dispatch(
        notify({
          msg: isWalletMethod
            ? `Wallet applied ${formatMoney(result.collectedAmount, currency)} on ${result.documentNumber}. Remaining ${formatMoney(result.outstandingAmount, currency)}.`
            : `Collected ${formatMoney(result.collectedAmount, currency)} on ${result.documentNumber}. Remaining ${formatMoney(result.outstandingAmount, currency)}.`,
          sev: 'success'
        })
      );
      onPaid?.(result, {
        paymentMethodLabel,
        paymentMethodCode: form.paymentMethodCode
      });
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
    <Modal open={open} onClose={onClose} size="md" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Pay invoice balance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-collect-payment-modal pay-invoice-modal">
          <div className="pay-invoice-modal__summary">
            <Text weight="semibold">
              Invoice {resolvedDocumentNumber}
            </Text>
            <Text muted size="sm">
              Review invoice totals, tax/discount adjustments, and credit or debit notes before
              collecting the remaining balance.
            </Text>
          </div>

          {summary ? (
            <div className="pay-invoice-modal__metrics">
              <div className="pay-invoice-modal__metric">
                <span>Invoice total</span>
                <strong>{formatMoney(summary.invoiceTotal, currency)}</strong>
              </div>
              <div className="pay-invoice-modal__metric">
                <span>Paid</span>
                <strong>{formatMoney(summary.totalPaid, currency)}</strong>
              </div>
              <div className="pay-invoice-modal__metric">
                <span>Credit notes</span>
                <strong>{formatMoney(summary.totalCreditNotes, currency)}</strong>
              </div>
              <div className="pay-invoice-modal__metric">
                <span>Debit notes</span>
                <strong>{formatMoney(summary.totalDebitNotes, currency)}</strong>
              </div>
              <div className="pay-invoice-modal__metric pay-invoice-modal__metric--highlight">
                <span>Outstanding</span>
                <strong>{formatMoney(summary.outstandingBalance, currency)}</strong>
              </div>
            </div>
          ) : (
            <Text muted size="sm">
              Outstanding {formatMoney(outstandingAmount, currency)}
            </Text>
          )}

          {adjustmentRows.length > 0 ? (
            <div className="pay-invoice-modal__section">
              <Text weight="semibold" size="sm">
                Credit / debit notes
              </Text>
              <div className="pay-invoice-modal__detail-list">
                {adjustmentRows.map(row => (
                  <div key={row.key} className="pay-invoice-modal__detail-row">
                    <span>
                      {row.documentNumber} ·{' '}
                      {row.documentType === 'CREDIT_NOTE' ? 'Credit note' : 'Debit note'}
                    </span>
                    <strong>{formatMoney(row.amount, currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {pricingDetailRows.length > 0 ? (
            <div className="pay-invoice-modal__section">
              <Text weight="semibold" size="sm">
                Tax & discount applied
              </Text>
              <div className="pay-invoice-modal__detail-list">
                {pricingDetailRows.map(row => (
                  <div key={row.key} className="pay-invoice-modal__detail-row">
                    <span>
                      {row.service} · {row.kind}: {row.rule}
                    </span>
                    <strong>
                      {row.kind === 'Discount'
                        ? `-${formatMoney(row.amount, currency)}`
                        : formatMoney(row.amount, currency)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : pricingSummary ? (
            <div className="pay-invoice-modal__section">
              <Text weight="semibold" size="sm">
                Pricing summary
              </Text>
              <div className="pay-invoice-modal__detail-list">
                <div className="pay-invoice-modal__detail-row">
                  <span>Gross</span>
                  <strong>{formatMoney(pricingSummary.grossAmount, currency)}</strong>
                </div>
                <div className="pay-invoice-modal__detail-row">
                  <span>Discount</span>
                  <strong>-{formatMoney(pricingSummary.discountAmount, currency)}</strong>
                </div>
                <div className="pay-invoice-modal__detail-row">
                  <span>Tax</span>
                  <strong>{formatMoney(pricingSummary.taxAmount, currency)}</strong>
                </div>
                <div className="pay-invoice-modal__detail-row">
                  <span>Net</span>
                  <strong>{formatMoney(pricingSummary.netAmount, currency)}</strong>
                </div>
              </div>
            </div>
          ) : null}

          {walletAvailable > 0 && (
            <Text muted size="sm">
              Wallet available {formatMoney(walletAvailable, currency)}
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
            <MyInput
              column
              fieldType="number"
              allowDecimal
              fieldLabel="Amount"
              fieldName="amount"
              record={form}
              setRecord={setForm}
              width="100%"
              disabled={isWalletMethod && walletAvailable <= 0}
            />
            {isWalletMethod && walletAvailable > 0 ? (
              <Text muted size="sm" style={{ marginTop: 8 }}>
                Will apply {formatMoney(walletCollectPreview.applyAmount, currency)} from wallet
                {walletCollectPreview.remainingAfter > 0
                  ? ` · invoice remaining after ${formatMoney(walletCollectPreview.remainingAfter, currency)}`
                  : ''}
              </Text>
            ) : null}
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
        <MyButton appearance="primary" loading={isLoading || isProcessingCard} onClick={handleSubmit}>
          Collect payment
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default PayInvoiceBalanceModal;
