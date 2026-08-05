import React from 'react';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import type { InvoiceAdjustmentSummary } from '@/services/billing/financialDocumentAdjustmentService';
import {
  computeEncounterCoveredAmount,
  computeEncounterPatientShare,
  computeEncounterRemainingToPay,
  computeUnbilledEncounterNetAmount,
  encounterHasInvoice,
  formatMoney,
  shouldShowInsuranceSummary,
  sumEncounterReservedAmount,
  type BillingCoverageType,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';

type BillingSummaryCardsProps = {
  summary: EncounterBillingSummary;
  walletBalance: number;
  reservedBalance: number;
  totalDebt?: number;
  loading?: boolean;
  currency?: string;
  coverageType?: BillingCoverageType;
  chargeRows?: UnifiedBillingChargeRow[];
  invoiceAdjustments?: InvoiceAdjustmentSummary | null;
};

const PLACEHOLDER = '—';

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  summary,
  walletBalance,
  reservedBalance,
  totalDebt = 0,
  loading = false,
  currency,
  coverageType = 'SELF_PAY',
  chargeRows = [],
  invoiceAdjustments = null
}) => {
  if (loading) {
    const skeletonCards = [
      'Invoice total',
      'Remaining to pay',
      'Wallet available',
      'Wallet reserved',
      'Ledger debt'
    ];

    return (
      <div className="billing-accounting__cards billing-accounting__cards--loading">
        {skeletonCards.map(label => (
          <div key={label} className="billing-accounting__card">
            <div className="billing-accounting__card-label">{label}</div>
            <div className="billing-accounting__card-value billing-accounting__card-value--loading">
              {PLACEHOLDER}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const resolvedCurrency =
    currency ??
    invoiceAdjustments?.currency ??
    summary.currency ??
    'SAR';
  const reservedOnEncounter = sumEncounterReservedAmount(summary);
  const patientShare = computeEncounterPatientShare(summary, chargeRows);
  const coveredAmount = computeEncounterCoveredAmount(summary);
  const remainingToPay = computeEncounterRemainingToPay(summary, chargeRows);
  const showInsurance = shouldShowInsuranceSummary(summary, coverageType);

  const chargeNet = Number(summary.netAmount ?? 0) + computeUnbilledEncounterNetAmount(chargeRows);
  const hasInvoice =
    encounterHasInvoice(summary) ||
    invoiceAdjustments != null ||
    Boolean(summary.invoiceNumber);

  const invoiceTotal = Number(
    invoiceAdjustments?.invoiceTotal ?? summary.invoiceTotalAmount ?? 0
  );
  const invoicePaid = Number(
    invoiceAdjustments?.totalPaid ?? summary.invoicePaidAmount ?? 0
  );
  const invoiceOutstanding = Number(
    invoiceAdjustments?.outstandingBalance ?? summary.invoiceOutstandingAmount ?? 0
  );
  const totalCreditNotes = Number(invoiceAdjustments?.totalCreditNotes ?? 0);
  const totalDebitNotes = Number(invoiceAdjustments?.totalDebitNotes ?? 0);
  const invoiceNumber =
    invoiceAdjustments?.documentNumber ?? summary.invoiceNumber ?? null;

  const remainingHint = (() => {
    if (hasInvoice) {
      if (invoiceOutstanding <= 0 && invoiceNumber) {
        return `Invoice ${invoiceNumber} settled · paid ${formatMoney(invoicePaid, resolvedCurrency)}`;
      }

      if (invoiceNumber) {
        return `Invoice ${invoiceNumber} · outstanding ${formatMoney(invoiceOutstanding, resolvedCurrency)}`;
      }
    }

    if (patientShare <= 0) return undefined;

    if (remainingToPay > 0) {
      const parts = [
        `Patient share ${formatMoney(patientShare, resolvedCurrency)}`,
        coveredAmount > 0
          ? `${formatMoney(coveredAmount, resolvedCurrency)} covered`
          : null,
        reservedOnEncounter > 0
          ? `${formatMoney(reservedOnEncounter, resolvedCurrency)} reserved`
          : null
      ].filter(Boolean);
      return `${parts.join(' · ')} · per encounter`;
    }

    return `Patient share ${formatMoney(patientShare, resolvedCurrency)} settled for this encounter`;
  })();

  const cards = hasInvoice
    ? ([
        {
          label: 'Invoice total',
          value: formatMoney(invoiceTotal, resolvedCurrency),
          hint: invoiceNumber
            ? `Invoice ${invoiceNumber} · charge net ${formatMoney(chargeNet, resolvedCurrency)}`
            : undefined
        },
        {
          label: 'Paid',
          value: formatMoney(invoicePaid, resolvedCurrency),
          tone: invoicePaid > 0 ? 'success' : undefined
        },
        {
          label: 'Outstanding',
          value: formatMoney(invoiceOutstanding, resolvedCurrency),
          tone: invoiceOutstanding > 0 ? 'danger' : 'success',
          hint: remainingHint
        },
        {
          label: 'Credit notes',
          value: formatMoney(totalCreditNotes, resolvedCurrency)
        },
        {
          label: 'Debit notes',
          value: formatMoney(totalDebitNotes, resolvedCurrency)
        }
      ] as const)
    : ([
        {
          label: 'Net charges',
          value: formatMoney(chargeNet, resolvedCurrency),
          hint: 'This encounter'
        },
        {
          label: 'Remaining to pay',
          value: formatMoney(remainingToPay, resolvedCurrency),
          tone: remainingToPay > 0 ? 'danger' : patientShare > 0 ? 'success' : undefined,
          hint: remainingHint
        },
        ...(showInsurance
          ? [
              {
                label: 'Insurance due',
                value: formatMoney(summary.insuranceOutstandingAmount, resolvedCurrency)
              }
            ]
          : []),
        {
          label: 'Wallet available',
          value: formatMoney(walletBalance, resolvedCurrency),
          tone: 'success'
        },
        {
          label: 'Wallet reserved',
          value: formatMoney(reservedBalance, resolvedCurrency)
        },
        {
          label: 'Ledger debt',
          value: formatMoney(totalDebt, resolvedCurrency),
          tone: totalDebt > 0 ? 'danger' : undefined
        }
      ] as const);

  return (
    <div className="billing-accounting__cards">
      {cards.map(card => (
        <div key={card.label} className="billing-accounting__card">
          <div className="billing-accounting__card-label">{card.label}</div>
          <div
            className={`billing-accounting__card-value${
              card.tone === 'danger'
                ? ' billing-accounting__card-value--danger'
                : card.tone === 'success'
                  ? ' billing-accounting__card-value--success'
                  : ''
            }`}
          >
            {card.value}
          </div>
          {'hint' in card && card.hint ? (
            <div className="billing-accounting__card-hint">{card.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default BillingSummaryCards;
