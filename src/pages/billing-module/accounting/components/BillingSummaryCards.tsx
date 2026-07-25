import React from 'react';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import {
  computeEncounterCoveredAmount,
  computeEncounterPatientShare,
  computeEncounterRemainingToPay,
  formatMoney,
  sumEncounterReservedAmount
} from '../utils/billingAccountingUtils';

type BillingSummaryCardsProps = {
  summary: EncounterBillingSummary;
  walletBalance: number;
  reservedBalance: number;
  totalDebt?: number;
  currency?: string;
};

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  summary,
  walletBalance,
  reservedBalance,
  totalDebt = 0,
  currency
}) => {
  const resolvedCurrency = currency ?? summary.currency ?? 'SAR';
  const reservedOnEncounter = sumEncounterReservedAmount(summary);
  const patientShare = computeEncounterPatientShare(summary);
  const coveredAmount = computeEncounterCoveredAmount(summary);
  const remainingToPay = computeEncounterRemainingToPay(summary);

  const remainingHint = (() => {
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

    return `Patient share ${formatMoney(patientShare, resolvedCurrency)} settled for this encounter · account balance at invoice`;
  })();

  const cards = [
    {
      label: 'Net charges',
      value: formatMoney(summary.netAmount, resolvedCurrency),
      hint: 'This encounter'
    },
    {
      label: 'Remaining to pay',
      value: formatMoney(remainingToPay, resolvedCurrency),
      tone: remainingToPay > 0 ? 'danger' : patientShare > 0 ? 'success' : undefined,
      hint: remainingHint
    },
    {
      label: 'Insurance due',
      value: formatMoney(summary.insuranceOutstandingAmount, resolvedCurrency)
    },
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
  ];

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
