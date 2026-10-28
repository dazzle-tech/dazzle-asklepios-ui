import React from 'react';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import {
  computeEncounterCollectAmount,
  computeEncounterDiscountAmount,
  computeEncounterGrossAmount,
  computeEncounterNetAmount,
  computeEncounterPatientShare,
  computeEncounterWalletAmount,
  formatMoney,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';

type BillingSummaryCardsProps = {
  summary: EncounterBillingSummary;
  loading?: boolean;
  currency?: string;
  chargeRows?: UnifiedBillingChargeRow[];
};

const PLACEHOLDER = '—';
const ENCOUNTER_HINT = 'This encounter';

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  summary,
  loading = false,
  currency,
  chargeRows = []
}) => {
  if (loading) {
    const skeletonCards = [
      'Gross Amount',
      'Net Amount',
      'Discount',
      'CoPayment',
      'Wallet',
      'Collect'
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

  const resolvedCurrency = currency ?? summary.currency ?? 'SAR';
  const grossAmount = computeEncounterGrossAmount(summary, chargeRows);
  const netAmount = computeEncounterNetAmount(summary, chargeRows);
  const discountAmount = computeEncounterDiscountAmount(summary);
  const copaymentAmount = computeEncounterPatientShare(summary, chargeRows);
  const walletAmount = computeEncounterWalletAmount(summary);
  const collectAmount = computeEncounterCollectAmount(summary, chargeRows);

  const cards = [
    {
      label: 'Gross Amount',
      value: formatMoney(grossAmount, resolvedCurrency),
      hint: ENCOUNTER_HINT
    },
    {
      label: 'Net Amount',
      value: formatMoney(netAmount, resolvedCurrency),
      hint: ENCOUNTER_HINT
    },
    {
      label: 'Discount',
      value: formatMoney(discountAmount, resolvedCurrency),
      hint: ENCOUNTER_HINT
    },
    {
      label: 'CoPayment',
      value: formatMoney(copaymentAmount, resolvedCurrency),
      hint: ENCOUNTER_HINT
    },
    {
      label: 'Wallet',
      value: formatMoney(walletAmount, resolvedCurrency),
      tone: walletAmount > 0 ? 'success' : undefined,
      hint: ENCOUNTER_HINT
    },
    {
      label: 'Collect',
      value: formatMoney(collectAmount, resolvedCurrency),
      tone: collectAmount > 0 ? 'danger' : copaymentAmount > 0 ? 'success' : undefined,
      hint: ENCOUNTER_HINT
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
