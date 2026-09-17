import React, { useEffect, useState } from 'react';
import { Form, Modal, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateAdvancePaymentMutation } from '@/services/billing/billingTransactionService';
import { newCreateAdvancePaymentRequest } from '@/types/model-types-constructor-new';
import type {
  CreateAdvancePaymentRequest,
  PatientEncounter
} from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import PaymentMethodSelector from './PaymentMethodSelector';
import {
  BILLING_PAYMENT_METHOD_LABELS,
  buildWalletDepositReceipt,
  makeRequestId,
  mergeBillingPaymentMethodOptions,
  normalizeBillingError,
  resolveBillingPaymentCategory,
  resolvePaymentReceiptNumber
} from '../utils/billingAccountingUtils';
import {
  useCreditCardMachinePayment
} from '@/utils/cardMachinePayment';
const toOptionalFacilityId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

type WalletDepositModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patient?: any;
  encounter?: PatientEncounter | null;
  encounterId?: number | null;
  facilityId?: number | null;
  currency?: string;
  onDeposited?: () => void;
  onReceiptReady?: (receipt: PaymentReceiptData) => void;
};

const WalletDepositModal: React.FC<WalletDepositModalProps> = ({
  open,
  onClose,
  patientId,
  patient,
  encounter = null,
  encounterId = null,
  facilityId = null,
  currency = 'SAR',
  onDeposited,
  onReceiptReady
}) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const facilityName =
    authSlice?.tenant?.selectedFacility?.name ??
    authSlice?.tenant?.selectedFacility?.facilityName ??
    'Healthcare Facility';

  const enumPaymentMethods =
    useEnumOptions('PaymentMethods', {
      exclude: ['INSURANCE_COVERAGE', 'DEDUCT_FROM_FREE_BALANCE'],
      labelOverrides: BILLING_PAYMENT_METHOD_LABELS
    }) ?? [];
  const {
    collectCreditCardAmountOrSkip,
    isProcessingCard
  } = useCreditCardMachinePayment();
  console.log('isProcessingCard in wallet deposit', isProcessingCard);
  const paymentMethods =
    mergeBillingPaymentMethodOptions(enumPaymentMethods, {
      exclude: ['DEDUCT_FROM_FREE_BALANCE']
    });

  const [form, setForm] = useState({
    amount: 0,
    paymentMethodCode: '',
    notes: ''
  });

  const [createAdvancePayment, { isLoading }] = useCreateAdvancePaymentMutation();

  useEffect(() => {
    if (!open) return;

    setForm({
      amount: 0,
      paymentMethodCode: '',
      notes: ''
    });
  }, [open]);

  const handleSubmit = async () => {
    if (!form.paymentMethodCode) {
      dispatch(notify({ msg: 'Select a payment method.', sev: 'warning' }));
      return;
    }

    if (!form.amount || form.amount <= 0) {
      dispatch(notify({ msg: 'Enter a deposit amount greater than zero.', sev: 'warning' }));
      return;
    }

    const selectedMethod = paymentMethods.find(
      option => String(option?.value) === String(form.paymentMethodCode)
    );
    const paymentMethodLabel =
      selectedMethod?.label ?? form.paymentMethodCode ?? 'Payment';

    const creditCardCollect = await collectCreditCardAmountOrSkip(
      form.paymentMethodCode,
      form.amount,
      {
        currency,
        patientId,
        sourceType: 'WALLET_BALANCE',
        sourceReferenceId: patientId,
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
      encounterId,
      facilityId:
        facilityId ??
        toOptionalFacilityId(encounter?.facilityId) ??
        toOptionalFacilityId(encounter?.facility?.id) ??
        toOptionalFacilityId(authSlice?.tenant?.selectedFacility?.id),
      paymentCategory: resolveBillingPaymentCategory(form.paymentMethodCode),
      payerType: 'PATIENT',
      amount: Number(form.amount),
      currency,
      paymentStatus: 'COMPLETED',
      transactionType: 'PAYMENT',
      paymentMethodId: Number(
        selectedMethod?.id ?? selectedMethod?.key ?? selectedMethod?.valueId ?? 0
      ),
      paymentMethodCode: form.paymentMethodCode,
      transactionStatus: 'SUCCESS',
      notes: form.notes.trim() || 'Patient wallet deposit',
      patientServiceProductIds: [],
      requestId: makeRequestId('WALLET-DEPOSIT')
    };

    try {
      const result = await createAdvancePayment(request).unwrap();
      const receiptData = buildWalletDepositReceipt({
        paymentResult: result,
        patient,
        encounter,
        facilityName,
        currency,
        paymentMethodLabel,
        notes: form.notes.trim() || 'Patient wallet deposit'
      });

      dispatch(
        notify({
          msg: `Deposit recorded. Receipt #${resolvePaymentReceiptNumber(result)}`,
          sev: 'success'
        })
      );

      onDeposited?.();
      onClose();
      onReceiptReady?.(receiptData);
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
    <Modal open={open} onClose={onClose} size="sm" overflow={false} enforceFocus={false}>
      <Modal.Header>
        <Modal.Title>Deposit to patient wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="billing-wallet-deposit-modal">
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
              fieldLabel="Amount"
              fieldName="amount"
              record={form}
              setRecord={setForm}
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
        <MyButton appearance="primary" loading={isLoading || isProcessingCard} onClick={handleSubmit}>
          Record deposit
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default WalletDepositModal;
