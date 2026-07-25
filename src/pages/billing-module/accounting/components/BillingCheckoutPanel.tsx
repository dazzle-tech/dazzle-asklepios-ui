import React, { useState } from 'react';
import { Form, Tag, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useCheckoutBillingChargeMutation } from '@/services/billing/billingTransactionService';
import { useCloseEncounterForBillingMutation } from '@/services/encounters/patientEncounterService';
import { newBillingCheckoutRequest } from '@/types/model-types-constructor-new';
import type { BillingCheckoutResult, EncounterBillingSummary } from '@/types/model-types-new';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  computeAmountToCollect,
  computeEncounterRemainingToPay,
  formatMoney,
  makeRequestId
} from '../utils/billingAccountingUtils';

type BillingCheckoutPanelProps = {
  summary: EncounterBillingSummary;
  encounterId: number | null;
  currency?: string;
  onCompleted?: () => void;
  onCollectRemaining?: () => void;
};

const BillingCheckoutPanel: React.FC<BillingCheckoutPanelProps> = ({
  summary,
  encounterId,
  currency = 'SAR',
  onCompleted,
  onCollectRemaining
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const checkoutBy =
    authSlice?.user?.username ??
    authSlice?.user?.login ??
    authSlice?.user?.key ??
    'billing-user';

  const [allowDebit, setAllowDebit] = useState(true);
  const [lastCheckoutResult, setLastCheckoutResult] =
    useState<BillingCheckoutResult | null>(null);

  const [checkoutBillingCharge, { isLoading: checkingOut }] =
    useCheckoutBillingChargeMutation();
  const [closeEncounterForBilling, { isLoading: closingEncounter }] =
    useCloseEncounterForBillingMutation();

  const chargeId = summary.chargeId;
  const amountToCollect = computeAmountToCollect(summary);
  const remainingToPay = computeEncounterRemainingToPay(summary);
  const canCheckout =
    chargeId != null &&
    summary.chargeStatus !== 'CLOSED';

  const handleCheckout = async () => {
    if (chargeId == null) {
      dispatch(notify({ msg: 'No billing charge exists for this encounter yet.', sev: 'warning' }));
      return;
    }

    if (amountToCollect > 0 && !allowDebit) {
      dispatch(
        notify({
          msg: `Collect ${formatMoney(amountToCollect, currency)} or enable patient debit to post the remainder to the patient account.`,
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const result = await checkoutBillingCharge({
        ...newBillingCheckoutRequest,
        chargeId,
        allowDebit,
        creditLimit: Math.max(0, Number(amountToCollect.toFixed(2))),
        debitApprovalRequired: false,
        checkoutBy: String(checkoutBy),
        requestId: makeRequestId('CHECKOUT'),
        sourceChannel: 'CASHIER'
      }).unwrap();

      setLastCheckoutResult(result);
      dispatch(
        notify({
          msg: result.financiallyClosed
            ? 'Checkout complete. Patient portion is financially closed.'
            : `Checkout processed. Remaining outstanding ${formatMoney(result.totalOutstandingAmount, currency)}`,
          sev: 'success'
        })
      );
      onCompleted?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message ?? error?.message ?? 'Checkout failed.',
          sev: 'error'
        })
      );
    }
  };

  const handleCloseEncounter = async () => {
    if (encounterId == null) return;

    try {
      await closeEncounterForBilling({ id: encounterId }).unwrap();
      dispatch(
        notify({
          msg: 'Encounter closed for billing.',
          sev: 'success'
        })
      );
      onCompleted?.();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.message ??
            'Unable to close encounter for billing.',
          sev: 'error'
        })
      );
    }
  };

  if (chargeId == null) {
    return (
      <div className="billing-accounting__empty" style={{ padding: '12px 0' }}>
        Prepare services and collect payments before checkout. No charge header exists yet for this
        encounter.
      </div>
    );
  }

  const chargeClosed = summary.chargeStatus === 'CLOSED';
  const walletSettled = Number(summary.patientWalletSettledAmount ?? 0);
  const debitSettled = Number(summary.patientDebitSettledAmount ?? 0);

  return (
    <div>
      {chargeClosed && (
        <div className="billing-accounting__checkout-complete">
          <strong>Checkout complete for this encounter.</strong> Patient share is fully allocated.
          {debitSettled > 0 && (
            <>
              {' '}
              {formatMoney(debitSettled, currency)} was posted to patient debit — collect it from
              the Invoices tab.
            </>
          )}
          {walletSettled > 0 && debitSettled <= 0 && (
            <> Wallet/cash applied: {formatMoney(walletSettled, currency)}.</>
          )}
        </div>
      )}

      <div className="billing-accounting__waseel-metrics">
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Charge status</div>
          <div className="billing-accounting__metric-value">
            <Tag size="sm">{summary.chargeStatus ?? 'OPEN'}</Tag>
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Remaining to pay</div>
          <div className="billing-accounting__metric-value">
            {formatMoney(remainingToPay, currency)}
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Patient outstanding</div>
          <div className="billing-accounting__metric-value">
            {formatMoney(summary.patientOutstandingAmount, currency)}
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Wallet reserved</div>
          <div className="billing-accounting__metric-value">
            {formatMoney(summary.wallet?.reservedBalance ?? 0, currency)}
          </div>
        </div>
        <div className="billing-accounting__metric">
          <div className="billing-accounting__metric-label">Insurance outstanding</div>
          <div className="billing-accounting__metric-value">
            {formatMoney(summary.insuranceOutstandingAmount, currency)}
          </div>
        </div>
      </div>

      {amountToCollect > 0 && allowDebit && (
        <Text muted size="sm" style={{ marginBottom: 12 }}>
          {formatMoney(amountToCollect, currency)} is not reserved in the wallet. At checkout this
          amount will be posted to the patient debit account.
        </Text>
      )}

      {amountToCollect > 0 && !allowDebit && (
        <Text muted size="sm" style={{ marginBottom: 12 }}>
          {formatMoney(amountToCollect, currency)} is not yet reserved. Collect it first, or enable
          patient debit below to post the remainder to the patient account at checkout.
        </Text>
      )}

      <Form fluid style={{ marginBottom: 12 }}>
        <MyInput
          column
          fieldType="checkbox"
          fieldLabel="Post remaining balance to patient debit at checkout"
          fieldName="allowDebit"
          record={{ allowDebit }}
          setRecord={(record: { allowDebit: boolean }) => setAllowDebit(record.allowDebit)}
        />
      </Form>

      <div className="billing-accounting__actions">
        {amountToCollect > 0 && !allowDebit && onCollectRemaining && (
          <MyButton appearance="primary" onClick={onCollectRemaining}>
            Collect remaining {formatMoney(amountToCollect, currency)}
          </MyButton>
        )}
        <MyButton
          appearance="primary"
          loading={checkingOut}
          disabled={!canCheckout || chargeClosed}
          onClick={handleCheckout}
        >
          {chargeClosed ? 'Checkout complete' : 'Finalize checkout'}
        </MyButton>
        <MyButton
          loading={closingEncounter}
          disabled={encounterId == null}
          onClick={handleCloseEncounter}
        >
          Close encounter for billing
        </MyButton>
      </div>

      {lastCheckoutResult && (
        <div style={{ marginTop: 12 }}>
          <Text muted size="sm">
            Last checkout: wallet applied{' '}
            {formatMoney(lastCheckoutResult.availableWalletAllocatedAmount, currency)} · reserved
            applied {formatMoney(lastCheckoutResult.reservedAllocatedAmount, currency)} · debit
            created {formatMoney(lastCheckoutResult.debitCreatedAmount, currency)}
          </Text>
        </div>
      )}
    </div>
  );
};

export default BillingCheckoutPanel;
