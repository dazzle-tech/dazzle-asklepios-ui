import React from 'react';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import {
  computeEncounterCoveredAmount,
  computeEncounterPatientShare,
  computeEncounterRemainingToPay,
  computeUnbilledEncounterNetAmount,
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
  currency?: string;
  coverageType?: BillingCoverageType;
  chargeRows?: UnifiedBillingChargeRow[];
};

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  summary,
  walletBalance,
  reservedBalance,
  totalDebt = 0,
  currency,
  coverageType = 'SELF_PAY',
  chargeRows = []
}) => {
  const resolvedCurrency = currency ?? summary.currency ?? 'SAR';
  const reservedOnEncounter = sumEncounterReservedAmount(summary);
  const patientShare = computeEncounterPatientShare(summary, chargeRows);
  const coveredAmount = computeEncounterCoveredAmount(summary);
  const remainingToPay = computeEncounterRemainingToPay(summary, chargeRows);
  const showInsurance = shouldShowInsuranceSummary(summary, coverageType);

  const remainingHint = (() => {
    if (patientShare <= 0) return undefined;

    if (remainingToPay > 0) {
      const parts = [
        Number(summary.invoiceOutstandingAmount ?? 0) > 0 && summary.invoiceNumber
          ? `Invoice ${summary.invoiceNumber}`
          : null,
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

    if (Number(summary.invoiceOutstandingAmount ?? 0) <= 0 && summary.invoiceNumber) {
      return `Invoice ${summary.invoiceNumber} settled · patient share ${formatMoney(patientShare, resolvedCurrency)} collected at billing`;
    }

    return `Patient share ${formatMoney(patientShare, resolvedCurrency)} settled for this encounter · account balance at invoice`;
  })();

  const invoiceTotal = Number(summary.invoiceTotalAmount ?? 0);
  const chargeNet = Number(summary.netAmount ?? 0) + computeUnbilledEncounterNetAmount(chargeRows);
  const hasInvoice = invoiceTotal > 0 && Boolean(summary.invoiceNumber);

  const cards = [
    {
      label: hasInvoice ? 'Invoice total' : 'Net charges',
      value: formatMoney(hasInvoice ? invoiceTotal : chargeNet, resolvedCurrency),
      hint: hasInvoice
        ? `Invoice ${summary.invoiceNumber} · incl. tax & discount (charge net ${formatMoney(chargeNet, resolvedCurrency)})`
        : 'This encounter'
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
  ] as const;

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
