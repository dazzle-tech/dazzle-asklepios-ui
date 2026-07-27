import React from 'react';
import { Tag, Text } from 'rsuite';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import {
  computeEncounterPatientShare,
  computeEncounterRemainingToPay,
  formatBillingChargeStatus,
  formatMoney
} from '../utils/billingAccountingUtils';

type EncounterSettlementBannerProps = {
  summary: EncounterBillingSummary;
  currency?: string;
};

const EncounterSettlementBanner: React.FC<EncounterSettlementBannerProps> = ({
  summary,
  currency = 'SAR'
}) => {
  const resolvedCurrency = currency ?? summary.currency ?? 'SAR';
  const patientShare = computeEncounterPatientShare(summary);
  const remainingToPay = computeEncounterRemainingToPay(summary);
  const walletSettled = Number(summary.patientWalletSettledAmount ?? 0);
  const debitSettled = Number(summary.patientDebitSettledAmount ?? 0);
  const chargeClosed = summary.chargeStatus === 'CLOSED';
  const invoiceOutstanding = Number(summary.invoiceOutstandingAmount ?? 0);
  const invoiceNumber = summary.invoiceNumber;
  const isSettled = remainingToPay <= 0 && patientShare > 0;
  const invoiceBalanceDue = invoiceOutstanding > 0 && chargeClosed;

  if (!summary.chargeId || patientShare <= 0) {
    return null;
  }

  return (
    <div
      className={`billing-accounting__settlement-banner${
        isSettled
          ? ' billing-accounting__settlement-banner--settled'
          : ' billing-accounting__settlement-banner--pending'
      }`}
    >
      <div className="billing-accounting__settlement-header">
        <Text weight="semibold">Encounter settlement</Text>
        <Tag color={chargeClosed ? 'green' : isSettled ? 'blue' : 'orange'} size="sm">
          {chargeClosed ? 'Checkout complete' : isSettled ? 'Ready to checkout' : 'Payment pending'}
        </Tag>
      </div>

      <div className="billing-accounting__settlement-grid">
        <div>
          <span className="billing-accounting__settlement-label">Patient share</span>
          <strong>{formatMoney(patientShare, resolvedCurrency)}</strong>
        </div>
        <div>
          <span className="billing-accounting__settlement-label">Wallet / cash applied</span>
          <strong>{formatMoney(walletSettled, resolvedCurrency)}</strong>
        </div>
        <div>
          <span className="billing-accounting__settlement-label">Posted to debit</span>
          <strong>{formatMoney(debitSettled, resolvedCurrency)}</strong>
        </div>
        <div>
          <span className="billing-accounting__settlement-label">Remaining to pay</span>
          <strong
            className={
              remainingToPay > 0
                ? 'billing-accounting__encounter-pay-value--danger'
                : 'billing-accounting__encounter-pay-value--success'
            }
          >
            {formatMoney(remainingToPay, resolvedCurrency)}
          </strong>
        </div>
      </div>

      <Text muted size="sm" className="billing-accounting__settlement-note">
        {debitSettled > 0 ? (
          <>
            <strong>{formatMoney(debitSettled, resolvedCurrency)}</strong> was posted to the patient
            debit account during checkout. This encounter is financially closed here; collect the
            debit balance from the patient in the <strong>Invoices</strong> tab.
          </>
        ) : invoiceBalanceDue ? (
          <>
            Charge checkout is complete. Invoice{' '}
            {invoiceNumber ? <strong>{invoiceNumber}</strong> : null} still has{' '}
            <strong>{formatMoney(invoiceOutstanding, resolvedCurrency)}</strong> outstanding
            (invoice-level tax/discount). Open the <strong>Invoices</strong> tab →{' '}
            <strong>Invoice Accounts</strong> → select the invoice →{' '}
            <strong>Pay outstanding</strong>.
          </>
        ) : isSettled ? (
          <>
            This encounter has no remaining patient balance. Charge status:{' '}
            <strong>{formatBillingChargeStatus(summary.chargeStatus ?? 'OPEN')}</strong>.
          </>
        ) : (
          <>
            Collect or reserve the remaining amount in Step 2, then finalize checkout in Step 3.
            Amounts here are per encounter only.
          </>
        )}
      </Text>
    </div>
  );
};

export default EncounterSettlementBanner;
