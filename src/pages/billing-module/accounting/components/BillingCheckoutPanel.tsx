import React, { useState } from 'react';

import { Form, Message, Tag, Text } from 'rsuite';



import MyButton from '@/components/MyButton/MyButton';

import MyInput from '@/components/MyInput';

import { useCheckoutBillingChargeMutation } from '@/services/billing/billingTransactionService';

import { useCloseEncounterForBillingMutation } from '@/services/encounters/patientEncounterService';

import { newBillingCheckoutRequest } from '@/types/model-types-constructor-new';

import type { BillingCheckoutResult, EncounterBillingSummary } from '@/types/model-types-new';

import { useAppDispatch, useAppSelector } from '@/hooks';

import { CHECKOUT_ERROR_MAP, extractApiErrorMessage } from '@/utils/apiErrorMessage';

import { notify } from '@/utils/uiReducerActions';

import {

  computeAmountToCollect,

  computeEncounterRemainingToPay,

  formatBillingChargeStatus,

  formatMoney,

  makeRequestId,

  shouldShowInsuranceSummary,

  type BillingCoverageType,

  type UnifiedBillingChargeRow

} from '../utils/billingAccountingUtils';



type BillingCheckoutPanelProps = {
  summary: EncounterBillingSummary;
  encounterId: number | null;
  currency?: string;
  coverageType?: BillingCoverageType;
  onCompleted?: () => void;
  onCollectRemaining?: () => void;
  chargeRows?: UnifiedBillingChargeRow[];
  encounterClosedForBilling?: boolean;
  loadingBillingMetrics?: boolean;
  preAuthBlocksCheckout?: boolean;
};



const BillingCheckoutPanel: React.FC<BillingCheckoutPanelProps> = ({

  summary,

  encounterId,

  currency = 'SAR',

  coverageType = 'SELF_PAY',

  onCompleted,

  onCollectRemaining,

  chargeRows = [],

  encounterClosedForBilling = false,

  loadingBillingMetrics = false,

  preAuthBlocksCheckout = false

}) => {

  const dispatch = useAppDispatch();

  const authSlice = useAppSelector(state => state.auth);

  const checkoutBy =

    authSlice?.user?.username ??

    authSlice?.user?.login ??

    authSlice?.user?.key ??

    'billing-user';



  const [allowDebit, setAllowDebit] = useState(true);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastCheckoutResult, setLastCheckoutResult] =

    useState<BillingCheckoutResult | null>(null);



  const [checkoutBillingCharge, checkoutMutation] =

    useCheckoutBillingChargeMutation();

  const [closeEncounterForBilling, { isLoading: closingEncounter }] =

    useCloseEncounterForBillingMutation();



  const chargeId = summary.chargeId;

  const amountToCollect = computeAmountToCollect(summary);

  const remainingToPay = loadingBillingMetrics
    ? null
    : computeEncounterRemainingToPay(summary, chargeRows);

  const checkoutAmountDue =
    remainingToPay == null ? 0 : remainingToPay > 0 ? remainingToPay : amountToCollect;

  const checkoutCreditLimit = Math.max(

    checkoutAmountDue,

    Number(summary.patientOutstandingAmount ?? 0)

  );

  const chargeClosed = summary.chargeStatus === 'CLOSED';

  const canCheckout = chargeId != null && !chargeClosed;

  const showInsurance = shouldShowInsuranceSummary(summary, coverageType);

  const isCheckoutBusy = isSubmitting || checkoutMutation.isLoading;

  const handleCheckout = async () => {

    if (isCheckoutBusy) {

      return;

    }



    if (chargeId == null) {

      dispatch(notify({ msg: 'No billing charge exists for this encounter yet.', sev: 'warning' }));

      return;

    }



    if (checkoutAmountDue > 0 && !allowDebit) {

      dispatch(

        notify({

          msg: `Collect ${formatMoney(checkoutAmountDue, currency)} or enable patient debit to post the remainder to the patient account.`,

          sev: 'warning'

        })

      );

      return;

    }



    setCheckoutError(null);

    setCheckoutStatus('Processing checkout...');

    setIsSubmitting(true);

    checkoutMutation.reset();



    try {

      const result = await checkoutBillingCharge({

        ...newBillingCheckoutRequest,

        chargeId,

        allowDebit,

        creditLimit: Math.max(0, Number(checkoutCreditLimit.toFixed(2))),

        debitApprovalRequired: false,

        checkoutBy: String(checkoutBy),

        requestId: makeRequestId('CHECKOUT'),

        sourceChannel: 'CASHIER'

      }).unwrap();



      setCheckoutStatus(null);

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

    } catch (error: unknown) {

      const message = extractApiErrorMessage(error, CHECKOUT_ERROR_MAP);

      setCheckoutStatus(null);

      setCheckoutError(message);

      dispatch(

        notify({

          msg: message,

          sev: 'error'

        })

      );

    } finally {

      setIsSubmitting(false);

      checkoutMutation.reset();

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

    } catch (error: unknown) {

      dispatch(

        notify({

          msg: extractApiErrorMessage(error),

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

            <Tag size="sm">{formatBillingChargeStatus(summary.chargeStatus ?? 'OPEN')}</Tag>

          </div>

        </div>

        <div className="billing-accounting__metric">

          <div className="billing-accounting__metric-label">Remaining to pay</div>

          <div className="billing-accounting__metric-value">

            {remainingToPay == null ? '—' : formatMoney(remainingToPay, currency)}

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

        {showInsurance && (

          <div className="billing-accounting__metric">

            <div className="billing-accounting__metric-label">Insurance outstanding</div>

            <div className="billing-accounting__metric-value">

              {formatMoney(summary.insuranceOutstandingAmount, currency)}

            </div>

          </div>

        )}

      </div>



      {checkoutAmountDue > 0 && allowDebit && (

        <Text muted size="sm" style={{ marginBottom: 12 }}>

          {formatMoney(checkoutAmountDue, currency)} is not reserved in the wallet. At checkout this

          amount will be posted to the patient debit account.

        </Text>

      )}



      {checkoutAmountDue > 0 && !allowDebit && (

        <Text muted size="sm" style={{ marginBottom: 12 }}>

          {formatMoney(checkoutAmountDue, currency)} is not yet reserved. Collect it first, or enable

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



      {checkoutStatus && (

        <Message showIcon type="info" style={{ marginBottom: 12 }}>

          {checkoutStatus}

        </Message>

      )}



      {checkoutError && (

        <Message showIcon type="error" style={{ marginBottom: 12 }}>

          {checkoutError}

        </Message>

      )}



      {!canCheckout && !chargeClosed && (

        <Message showIcon type="warning" style={{ marginBottom: 12 }}>

          Checkout is unavailable until a billing charge exists for this encounter.

        </Message>

      )}



      {preAuthBlocksCheckout && (

        <Message type="warning" showIcon style={{ marginBottom: 12 }}>

          Pre-authorization is still pending with Waseel. Refresh status from the services table

          above and wait for the final payer response before checkout or closing the encounter.

        </Message>

      )}



      <div className="billing-accounting__actions">

        {checkoutAmountDue > 0 && !allowDebit && onCollectRemaining && (

          <MyButton appearance="primary" onClick={onCollectRemaining}>

            Collect remaining {formatMoney(checkoutAmountDue, currency)}

          </MyButton>

        )}

        <MyButton

          appearance="primary"

          loading={isCheckoutBusy}

          disabled={!canCheckout || isCheckoutBusy || preAuthBlocksCheckout}

          onClick={() => {

            void handleCheckout();

          }}

        >

          {chargeClosed ? 'Checkout complete' : 'Finalize checkout'}

        </MyButton>

        <MyButton

          loading={closingEncounter}

          disabled={
            encounterId == null ||
            isCheckoutBusy ||
            encounterClosedForBilling ||
            preAuthBlocksCheckout
          }

          onClick={() => {

            void handleCloseEncounter();

          }}

        >

          {encounterClosedForBilling
            ? 'Encounter closed for billing'
            : 'Close encounter for billing'}

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


