// PatientPaymentInfo.tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';

import { Form, Checkbox } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';

import * as modelTypes from '@/types/model-types-new';
import { PatientInsurance } from '@/types/model-types-new';
import { newPatientInsurance, newPatientPayments } from '@/types/model-types-constructor-new';

import { useEnumCapitalized, useEnumOptions } from '@/services/enumsApi';

import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useGetPatientBalanceQuery,
  useGetPatientLedgerSummaryQuery,
  useGetPaymentByEncounterQuery
} from '@/services/encounters/patientPaymentsService';

import { useGetFacilityByIdQuery } from '@/services/security/facilityService';

import { useGetInsurancesByPatientQuery } from '@/services/patients/patientInsurancesService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useLazyGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';

import { conjureValueBasedOnIDFromList } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';

import './style.less';

async function convertCurrencyFree(amount: number, from: string, to: string): Promise<number> {
  if (!amount || amount <= 0) return 0;
  if (!from || !to) return 0;

  const fromCurrency = String(from).toUpperCase();
  const toCurrency = String(to).toUpperCase();

  if (fromCurrency === toCurrency) return amount;

  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(fromCurrency)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Currency API failed');

  const jsonResponse = await response.json();

  if (jsonResponse?.result !== 'success') {
    throw new Error('Currency API error');
  }

  const rate = jsonResponse?.rates?.[toCurrency];
  const numericRate = Number(rate ?? 0);

  return Number.isFinite(numericRate) ? amount * numericRate : 0;
}

type UiPaymentServiceRow = modelTypes.PatientPaymentServices & {
  serviceType?: string;
  serviceName?: string;
  defaultCurrency?: string;
  isExempted?: boolean;
};

export type PatientPaymentInfoHandle = {
  confirm: () => Promise<boolean>;
  clear: () => void;
  validate: () => boolean;
};

const PAYMENT_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Payment data is required.',
  'patient.invalid': 'Invalid patient id.',
  'patient.notfound': 'Patient not found.',
  'patient.required': 'Patient is required.',
  'encounter.invalid': 'Invalid encounter id.',
  'encounter.notfound': 'Encounter not found.',
  'encounter.required': 'Encounter is required.',
  'encounter.invalid.status':
    'Encounter is not ready for payment (must be in Pending Payment status).',
  'payment.duplicate.encounter': 'Payment already exists for this encounter.',
  'id.notfound': 'Payment record not found.',
  notfound: 'Payment record not found.',
  duplicate: 'Duplicate record.',
  'db.constraint': 'Database constraint violation while saving payment.',
  'no.services': 'No services to pay for',
  'http.400': 'Please review the payment data. Some required values are missing or invalid.'
};

const PAYMENT_FIELD_LABELS: Record<string, string> = {
  patientId: 'Patient',
  encounterId: 'Encounter',
  planId: 'Plan',
  paymentTypes: 'Payment Type',
  paymentMethods: 'Payment Method',
  amount: 'Amount',
  currency: 'Currency',
  facilityDefaultCurrency: 'Default Currency',
  amountInFacilityCurrency: 'Amount in default currency',
  exchangeRate: 'Exchange Rate',
  remaining: 'Remaining',
  refunds: 'Refunds',
  addToFreeBalance: 'Add to free balance',
  useBalanceToSettleDebts: 'Use balance to settle debts',
  paidFromAmount: 'Paid from amount',
  paidFromBalance: 'Paid from balance',
  debt: 'Debt',
  cardNumber: 'Card Number',
  cardHolderName: 'Holder Name',
  cardValidUntil: 'Valid until',
  chequeNumber: 'Cheque Number',
  chequeBankName: 'Bank Name',
  chequeDueDate: 'Cheque Due Date',
  transferNumber: 'Transfer Number',
  transferBankName: 'Bank Name',
  transferDate: 'Transfer Date'
};

const handleCrudError = (error: any, dispatch: any, keyMap: Record<string, string>) => {
  const responseData = error?.data ?? error ?? {};
  const traceId = responseData?.traceId || responseData?.requestId || responseData?.correlationId;
  const traceSuffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeFieldErrorMessage = (message: string) => {
    const lowerMessage = (message || '').toLowerCase();
    if (lowerMessage.includes('must not be null')) return 'is required';
    if (lowerMessage.includes('must not be blank')) return 'must not be blank';
    if (lowerMessage.includes('size')) return 'length is out of range';
    if (lowerMessage.includes('greater')) return 'value is too small';
    if (lowerMessage.includes('less')) return 'value is too large';
    return message || 'invalid value';
  };

  const getFieldLabel = (field: string) => PAYMENT_FIELD_LABELS[field] ?? field;

  if (Array.isArray(responseData?.fieldErrors) && responseData.fieldErrors.length > 0) {
    const errorLines = responseData.fieldErrors.map(
      (fieldError: any) =>
        `• ${getFieldLabel(fieldError.field)}: ${normalizeFieldErrorMessage(fieldError.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${errorLines.join('\n')}` + traceSuffix,
        sev: 'warning'
      })
    );
    return;
  }

  const messageProp: string = responseData?.message || '';
  const detailProp: string = responseData?.detail || '';
  const titleProp: string = responseData?.title || '';

  const errorKey =
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    responseData?.errorKey;

  if (errorKey && keyMap[errorKey]) {
    dispatch(
      notify({
        msg: keyMap[errorKey] + traceSuffix,
        sev: 'warning'
      })
    );
    return;
  }

  if (
    messageProp === 'error.http.400' ||
    detailProp.toLowerCase().includes('validation failure') ||
    titleProp.toLowerCase() === 'bad request'
  ) {
    dispatch(
      notify({
        msg: 'Please review the payment form. Some values are missing or invalid.' + traceSuffix,
        sev: 'warning'
      })
    );
    return;
  }

  const stripErrorPrefix = (raw: string) =>
    raw && raw.startsWith('error.') ? raw.substring(6) : raw;

  const status = error?.status ?? error?.originalStatus;
  const statusText = error?.error || error?.statusText;

  const humanReadableMessage =
    responseData?.detail ||
    stripErrorPrefix(responseData?.message || '') ||
    responseData?.title ||
    statusText ||
    (status ? `Request failed (HTTP ${status})` : 'Unexpected error');

  dispatch(notify({ msg: humanReadableMessage + traceSuffix, sev: 'warning' }));
};
const toDateOnlyOrNull = (value: any) => {
  if (!value) return null;
  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().slice(0, 10);
};

const PatientPaymentInfo = forwardRef<PatientPaymentInfoHandle, any>(
  (
    {
      localPatient,
      localEncounter,
      isReadOnly,
      showInternalButtons = true,
      payment,
      setPayment,
      patientInsurance,
      setPatientInsurance,
      onPaymentSaved
    }: any,
    ref
  ) => {
    const dispatch = useAppDispatch();

    const PaymentTypesEnum = useEnumOptions('PaymentTypes');

    const CurrencyEnum = useEnumCapitalized('Currency', {
      labelFormatter: (value: any) => String(value).toUpperCase()
    });

    const [validationResult, setValidationResult] = useState<any>({});
    const authSlice = useAppSelector(state => state.auth);

    const selectedFacilityId =
      localEncounter?.facilityId ??
      localEncounter?.facility?.id ??
      authSlice?.tenant?.selectedFacility?.id ??
      null;

    const { data: facilityResponse } = useGetFacilityByIdQuery(selectedFacilityId, {
      skip: !selectedFacilityId
    });

    const facilityDefaultCurrency =
      facilityResponse?.defaultCurrency ?? facilityResponse?.data?.defaultCurrency ?? null;

    const [lockAfterConfirm, setLockAfterConfirm] = useState(false);

    const isLocked = Boolean(isReadOnly || lockAfterConfirm);

    // ─────────────────────────────────────────────────────────────────────
    // Auto-fill: load existing payment when opening a completed encounter
    // ─────────────────────────────────────────────────────────────────────
    const encounterId = localEncounter?.id;

    const { data: existingPaymentDetails } = useGetPaymentByEncounterQuery(
      { encounterId: encounterId! },
      { skip: !encounterId }
    );

    // Ref prevents re-applying saved data on every re-render after first load
    const existingPaymentAppliedRef = useRef(false);

    // Reset the ref whenever we switch to a different encounter
    useEffect(() => {
      existingPaymentAppliedRef.current = false;
    }, [encounterId]);

    useEffect(() => {
      if (!existingPaymentDetails) return;
      if (existingPaymentAppliedRef.current) return;
      if (lockAfterConfirm) return;

      const savedPayment: any = existingPaymentDetails?.payment;
      if (!savedPayment || !savedPayment.id) return;
      if (!savedPayment?.id) return;

      existingPaymentAppliedRef.current = true;

      setPayment((prev: any) => ({
        ...prev,
        id: savedPayment.id,
        paymentTypes: savedPayment.paymentTypes,
        paymentMethods: savedPayment.paymentMethods,
        amount: savedPayment.amount,
        currency: savedPayment.currency,
        amountInFacilityCurrency: savedPayment.amountInFacilityCurrency,
        exchangeRate: savedPayment.exchangeRate,
        dueAmount: savedPayment.dueAmount,
        remaining: savedPayment.remaining,
        refunds: savedPayment.refunds,
        paidFromAmount: savedPayment.paidFromAmount,
        paidFromBalance: savedPayment.paidFromBalance,
        addToFreeBalance: savedPayment.addToFreeBalance,
        useBalanceToSettleDebts: savedPayment.useBalanceToSettleDebts,
        planId: savedPayment.planId,
        cardNumber: savedPayment.cardNumber,
        cardHolderName: savedPayment.cardHolderName,
        cardValidUntil: savedPayment.cardValidUntil,
        chequeNumber: savedPayment.chequeNumber,
        chequeBankName: savedPayment.chequeBankName,
        chequeDueDate: savedPayment.chequeDueDate,
        transferNumber: savedPayment.transferNumber,
        transferBankName: savedPayment.transferBankName,
        transferDate: savedPayment.transferDate
      }));

      applySavedServicesToTable(existingPaymentDetails);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingPaymentDetails, lockAfterConfirm]);
    // ─────────────────────────────────────────────────────────────────────

    useEffect(() => {
      if (!facilityDefaultCurrency) return;
      setPayment((prev: any) => ({
        ...prev,
        patientId: localPatient?.id ?? localPatient?.key ?? prev.patientId ?? 0,
        encounterId: localEncounter?.id ?? prev.encounterId ?? 0,
        facilityDefaultCurrency: facilityDefaultCurrency,
        currency:
          prev.currency && String(prev.currency).trim() !== ''
            ? prev.currency
            : facilityDefaultCurrency
      }));
    }, [
      localPatient?.id,
      localPatient?.key,
      localEncounter?.id,
      facilityDefaultCurrency,
      setPayment
    ]);

    const effectivePatientId = Number(localPatient?.id ?? localPatient?.key ?? 0);

    const ledgerSummaryResponse = useGetPatientLedgerSummaryQuery(
      { patientId: effectivePatientId },
      { skip: !effectivePatientId }
    );

    useEffect(() => {
      const summary: modelTypes.PatientLedgerSummaryDTO | undefined =
        ledgerSummaryResponse?.data as any;
      if (!summary) return;

      const totalDebt = Number((summary as any)?.totalDebt ?? 0);

      if (Number(payment?.debt ?? NaN) !== totalDebt) {
        setPayment((previousPayment: any) => ({ ...previousPayment, debt: totalDebt }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ledgerSummaryResponse?.data]);

    const DefaultCurrencySelectData = useMemo(() => {
      const defaultCurrency = payment?.facilityDefaultCurrency;
      const baseOptions = CurrencyEnum ?? [];
      if (!defaultCurrency) return baseOptions;

      const alreadyExists = baseOptions.some((option: any) => option?.value === defaultCurrency);
      return alreadyExists
        ? baseOptions
        : [{ label: defaultCurrency, value: defaultCurrency }, ...baseOptions];
    }, [CurrencyEnum, payment?.facilityDefaultCurrency]);

    const [servicesRows, setServicesRows] = useState<UiPaymentServiceRow[]>([]);
    const savedExemptedByServiceIdRef = useRef<Map<number, boolean>>(new Map());

    const PaymentMethodsEnum = useEnumOptions('PaymentMethods', {
      // exclude: payment?.paymentTypes === 'CASH' ? ['INSURANCE_COVERAGE'] : []

      exclude: ['INSURANCE_COVERAGE']
    });

    const patientInsuranceResponse = useGetInsurancesByPatientQuery(
      {
        patientId: Number(localPatient?.id ?? localPatient?.key ?? 0),
        page: 0,
        size: 100,
        sort: 'id,desc'
      },
      { skip: !(localPatient?.id ?? localPatient?.key) }
    );

    const { data: payorListResponse, isFetching: payorFetching } = useGetAllPayorsQuery({
      page: 0,
      size: 1000,
      sort: 'name,asc'
    });
    const payorsList = payorListResponse?.data ?? [];

    const [plansByPayorId, setPlansByPayorId] = useState<Record<number, any[]>>({});
    const [triggerGetPlans] = useLazyGetPlansByPayorQuery();

    const patientInsurancesList: PatientInsurance[] = useMemo(() => {
      const responseData: any = patientInsuranceResponse?.data;
      if (Array.isArray(responseData?.data)) return responseData.data;
      if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
      if (Array.isArray(responseData?.object)) return responseData.object;
      return [];
    }, [patientInsuranceResponse?.data]);

    const [insurancePage, setInsurancePage] = useState(0);
    const [insuranceSearchKeyword, setInsuranceSearchKeyword] = useState('');
    const INSURANCE_PAGE_SIZE = 20;

    useEffect(() => {
      setInsurancePage(0);
    }, [insuranceSearchKeyword]);

    const filteredInsurances = useMemo(() => {
      const keyword = insuranceSearchKeyword.trim().toLowerCase();
      if (!keyword) return patientInsurancesList ?? [];

      return (patientInsurancesList ?? []).filter((insuranceItem: any) => {
        const payorName =
          conjureValueBasedOnIDFromList(payorsList, insuranceItem?.payorId, 'name') ||
          insuranceItem?.payorName ||
          insuranceItem?.insuranceProvider ||
          '';

        const plans = plansByPayorId[Number(insuranceItem?.payorId)] ?? [];
        const planName =
          conjureValueBasedOnIDFromList(plans, insuranceItem?.planId, 'name') ||
          insuranceItem?.planName ||
          insuranceItem?.plan?.name ||
          '';

        const policyNumber = String(insuranceItem?.policyNumber ?? '');
        const groupNumber = String(insuranceItem?.groupNumber ?? '');

        const searchableText =
          `${payorName} ${planName} ${policyNumber} ${groupNumber}`.toLowerCase();
        return searchableText.includes(keyword);
      });
    }, [patientInsurancesList, insuranceSearchKeyword, payorsList, plansByPayorId]);

    const insurancePageSlice = useMemo(() => {
      const startIndex = insurancePage * INSURANCE_PAGE_SIZE;
      return (filteredInsurances ?? []).slice(startIndex, startIndex + INSURANCE_PAGE_SIZE);
    }, [filteredInsurances, insurancePage]);

    const hasMoreInsurances = useMemo(() => {
      return (insurancePage + 1) * INSURANCE_PAGE_SIZE < (filteredInsurances?.length ?? 0);
    }, [filteredInsurances?.length, insurancePage]);

    const handleLoadMoreInsurances = () => {
      if (hasMoreInsurances) setInsurancePage(previousPage => previousPage + 1);
    };

    const visiblePayorIdsForInsurance = useMemo(() => {
      const payorIdSet = new Set<number>();
      (insurancePageSlice ?? []).forEach((insuranceRow: any) => {
        const payorId = Number(insuranceRow?.payorId);
        if (!Number.isNaN(payorId)) payorIdSet.add(payorId);
      });
      return Array.from(payorIdSet);
    }, [insurancePageSlice]);

    useEffect(() => {
      const loadPlans = async () => {
        for (const payorId of visiblePayorIdsForInsurance) {
          if (plansByPayorId[payorId]) continue;

          try {
            const plansResponse = await triggerGetPlans(
              { payorId, page: 0, size: 1000, sort: 'name,asc' },
              true
            ).unwrap();
            setPlansByPayorId(previousPlans => ({
              ...previousPlans,
              [payorId]: plansResponse?.data ?? []
            }));
          } catch {
            setPlansByPayorId(previousPlans => ({ ...previousPlans, [payorId]: [] }));
          }
        }
      };

      if (visiblePayorIdsForInsurance.length > 0) loadPlans();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visiblePayorIdsForInsurance]);

    const insuranceSelectData = useMemo(() => {
      return (insurancePageSlice ?? []).map((insuranceItem: any) => {
        const payorName =
          conjureValueBasedOnIDFromList(payorsList, insuranceItem?.payorId, 'name') ||
          insuranceItem?.payorName ||
          insuranceItem?.insuranceProvider ||
          '';

        const plans = plansByPayorId[Number(insuranceItem?.payorId)] ?? [];
        const planName =
          conjureValueBasedOnIDFromList(plans, insuranceItem?.planId, 'name') ||
          insuranceItem?.planName ||
          insuranceItem?.plan?.name ||
          '';

        const displayLabel = `${payorName || 'Payor'} • ${planName || 'Plan'}`;
        return {
          ...insuranceItem,
          label: displayLabel,
          payorDisplayName: payorName,
          planDisplayName: planName
        };
      });
    }, [insurancePageSlice, payorsList, plansByPayorId]);

    const isInsurancePlan = payment?.paymentTypes === 'INSURANCE_PLAN';
    const paymentMethod = payment?.paymentMethods;

    const showCardFields = paymentMethod === 'CREDIT_DEBIT_CARD';
    const showChequeFields = paymentMethod === 'CHEQUE';
    const showBankTransferFields = paymentMethod === 'BANK_TRANSFER';

    const isCurrencyChanged =
      !!payment?.currency &&
      !!payment?.facilityDefaultCurrency &&
      payment.currency !== payment.facilityDefaultCurrency;

    const patientBalanceResponse = useGetPatientBalanceQuery(
      { patientId: effectivePatientId },
      { skip: !effectivePatientId }
    );

    useEffect(() => {
      const balance = patientBalanceResponse?.data;
      if (balance == null) return;

      if (Number(payment?.patientBalance ?? NaN) !== Number(balance)) {
        setPayment((previousPayment: any) => ({
          ...previousPayment,
          patientBalance: Number(balance)
        }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientBalanceResponse?.data]);

    const departmentId =
      localEncounter?.departmentId ??
      localEncounter?.department?.id ??
      localEncounter?.clinicDepartmentId ??
      null;

    const [triggerGetServicesByDepartment, lazyServicesByDepartmentResponse] =
      useLazyGetServicesByDepartmentQuery();

    useEffect(() => {
      const departmentIdNum = Number(departmentId ?? 0);
      if (!departmentIdNum) {
        setServicesRows([]);
        return;
      }

      triggerGetServicesByDepartment(
        { sourceId: departmentIdNum, page: 0, size: 200, sort: 'id,asc' },
        true
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentId]);

    useEffect(() => {
      const responseData: any = lazyServicesByDepartmentResponse?.data;
      const rows = Array.isArray(responseData?.data) ? responseData.data : [];
      const defaultCurrency = payment?.facilityDefaultCurrency || '';

      const mappedRows: UiPaymentServiceRow[] = (rows ?? []).map((serviceItem: any) => {
        const price = Number(
          serviceItem?.price ?? serviceItem?.servicePrice ?? serviceItem?.defaultPrice ?? 0
        );
        const serviceId = Number(serviceItem?.id ?? serviceItem?.serviceId ?? 0);

        const savedExempted = serviceId
          ? savedExemptedByServiceIdRef.current.get(serviceId)
          : undefined;

        return {
          id: serviceItem?.id ?? serviceItem?.serviceId ?? `${serviceItem?.id ?? ''}`,
          serviceId: serviceItem?.id ?? serviceItem?.serviceId ?? null,
          price,
          isExempted:
            savedExempted != null ? Boolean(savedExempted) : Boolean(serviceItem?.isExempted),
          serviceType: serviceItem?.serviceType ?? serviceItem?.type ?? serviceItem?.category ?? '',
          serviceName: serviceItem?.name ?? serviceItem?.serviceName ?? '',
          defaultCurrency: String(
            serviceItem?.currency ?? serviceItem?.defaultCurrency ?? defaultCurrency
          )
        } as any;
      });

      if (!departmentId) return;

      setServicesRows(previousRows => {
        const previousByServiceId = new Map<string, UiPaymentServiceRow>();
        (previousRows ?? []).forEach(previousRow => {
          const key = String((previousRow as any).serviceId ?? previousRow.id ?? '');
          previousByServiceId.set(key, previousRow);
        });

        return mappedRows.map(mappedRow => {
          const key = String((mappedRow as any).serviceId ?? mappedRow.id ?? '');
          const existingRow = previousByServiceId.get(key);
          return existingRow
            ? { ...mappedRow, isExempted: Boolean(existingRow.isExempted) }
            : mappedRow;
        });
      });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyServicesByDepartmentResponse?.data, departmentId, payment?.facilityDefaultCurrency]);

    const uiDueAmount = useMemo(() => {
      return (servicesRows ?? [])
        .filter(serviceRow => !Boolean((serviceRow as any).isExempted))
        .reduce((accumulator, serviceRow: any) => accumulator + Number(serviceRow?.price ?? 0), 0);
    }, [servicesRows]);

    useEffect(() => {
      let isCancelled = false;

      (async () => {
        try {
          const amount = Number(payment?.amount ?? 0);
          const fromCurrency = payment?.currency;
          const toCurrency = payment?.facilityDefaultCurrency;

          if (!isCurrencyChanged) {
            if (payment?.amountInFacilityCurrency != null || payment?.exchangeRate != null) {
              setPayment((previousPayment: any) => ({
                ...previousPayment,
                amountInFacilityCurrency: null,
                exchangeRate: null
              }));
            }
            return;
          }

          const convertedAmount = await convertCurrencyFree(amount, fromCurrency, toCurrency);
          const rate = amount > 0 ? convertedAmount / amount : null;

          if (!isCancelled) {
            setPayment((previousPayment: any) => ({
              ...previousPayment,
              amountInFacilityCurrency: convertedAmount,
              exchangeRate: rate
            }));
          }
        } catch {
          if (!isCancelled) {
            setPayment((previousPayment: any) => ({
              ...previousPayment,
              amountInFacilityCurrency: null,
              exchangeRate: null
            }));
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payment?.amount, payment?.currency, payment?.facilityDefaultCurrency, isCurrencyChanged]);

    useEffect(() => {
      const validationErrors: any = { details: {} };
      const markRequired = (field: string, message = 'Required') => {
        validationErrors.details[field] = [{ validationType: 'REJECT', message }];
      };
      if (isInsurancePlan) {
        if (!payment?.insuranceKey && !payment?.planId) markRequired('planId');
      }

      if (showCardFields) {
        if (!payment?.cardNumber) markRequired('cardNumber');
        if (!payment?.cardHolderName) markRequired('cardHolderName');
        if (!payment?.cardValidUntil) markRequired('cardValidUntil');
      }

      if (showChequeFields) {
        if (!payment?.chequeNumber) markRequired('chequeNumber');
        if (!payment?.chequeBankName) markRequired('chequeBankName');
        if (!payment?.chequeDueDate) markRequired('chequeDueDate');
      }

      if (showBankTransferFields) {
        if (!payment?.transferNumber) markRequired('transferNumber');
        if (!payment?.transferBankName) markRequired('transferBankName');
        if (!payment?.transferDate) markRequired('transferDate');
      }

      setValidationResult(validationErrors);
    }, [
      payment?.paymentTypes,
      payment?.paymentMethods,
      payment?.amount,
      payment?.currency,
      payment?.insuranceKey,
      payment?.planId,
      payment?.cardNumber,
      payment?.cardHolderName,
      payment?.cardValidUntil,
      payment?.chequeNumber,
      payment?.chequeBankName,
      payment?.chequeDueDate,
      payment?.transferNumber,
      payment?.transferBankName,
      payment?.transferDate,
      isInsurancePlan,
      showCardFields,
      showChequeFields,
      showBankTransferFields
    ]);

    const allExempted =
      servicesRows.length > 0 && servicesRows.every(serviceRow => !!serviceRow.isExempted);
    const someExempted = servicesRows.some(serviceRow => !!serviceRow.isExempted);

    const toggleAllExempted = (checked: boolean) => {
      setServicesRows(previousRows =>
        previousRows.map(serviceRow => ({ ...serviceRow, isExempted: checked }))
      );
    };

    const toggleOneExempted = (rowId: any, checked: boolean) => {
      setServicesRows(previousRows =>
        previousRows.map(serviceRow =>
          String(serviceRow.id) === String(rowId)
            ? { ...serviceRow, isExempted: checked }
            : serviceRow
        )
      );
    };

    const exemptionBadge = (isExempted: boolean | null | undefined) => {
      const exemptedValue = Boolean(isExempted);
      const badgeColor = exemptedValue ? '#388E3C' : '#ff8902ff';
      const badgeLabel = exemptedValue ? 'Yes' : 'No';
      return <MyBadgeStatus color={badgeColor} contant={badgeLabel} />;
    };

    const serviceColumns: ColumnConfig[] = [
      {
        key: 'isExemptedToggle',
        title: (
          <Checkbox
            checked={allExempted}
            indeterminate={!allExempted && someExempted}
            onChange={(_, checked) => toggleAllExempted(checked)}
            disabled={isReadOnly || isLocked}
          />
        ),
        dataKey: 'isExemptedToggle',
        width: 60,
        render: (row: UiPaymentServiceRow) => (
          <Checkbox
            checked={!!row.isExempted}
            onChange={(_, checked) => toggleOneExempted(row.id, checked)}
            disabled={isReadOnly || isLocked}
          />
        )
      },
      { key: 'serviceType', title: <Translate>Service Type</Translate>, dataKey: 'serviceType' },
      { key: 'serviceName', title: <Translate>Service Name</Translate>, dataKey: 'serviceName' },
      { key: 'price', title: <Translate>Price</Translate>, dataKey: 'price', width: 120 },
      {
        key: 'defaultCurrency',
        title: <Translate>Default Currency</Translate>,
        dataKey: 'defaultCurrency',
        width: 160,
        render: (row: UiPaymentServiceRow) => (
          <span>{String(row.defaultCurrency ?? '').toUpperCase()}</span>
        )
      },
      {
        key: 'isExempted',
        title: <Translate>Exempted</Translate>,
        dataKey: 'isExempted',
        width: 140,
        render: (row: UiPaymentServiceRow) => exemptionBadge(row.isExempted)
      }
    ];

    const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
    const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation();

    const handleClear = () => {
      // Reset the ref so saved data can be re-applied if needed after a clear
      existingPaymentAppliedRef.current = false;

      setPayment((previousPayment: any) => ({
        ...newPatientPayments,
        patientId: previousPayment.patientId,
        encounterId: previousPayment.encounterId,
        facilityDefaultCurrency: previousPayment.facilityDefaultCurrency,
        currency: previousPayment.facilityDefaultCurrency,
        useBalanceToSettleDebts: false,
        debt: previousPayment.debt ?? 0
      }));

      setServicesRows(previousRows =>
        previousRows.map(serviceRow => ({ ...serviceRow, isExempted: false }))
      );
      savedExemptedByServiceIdRef.current = new Map();
      setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
      setValidationResult({});
    };

    const applySavedServicesToTable = (details: any) => {
      const savedServices = details?.services ?? details?.payment?.services ?? [];

      if (!Array.isArray(savedServices)) return;

      const exemptedMap = new Map<number, boolean>();

      savedServices.forEach((service: any) => {
        const serviceId = Number(service?.serviceId ?? 0);
        if (!serviceId) return;

        exemptedMap.set(serviceId, Boolean(service?.isExempted));
      });

      savedExemptedByServiceIdRef.current = exemptedMap;

      setServicesRows(prev =>
        (prev ?? []).map(row => {
          const serviceId = Number((row as any)?.serviceId ?? 0);

          if (!serviceId) return row;
          if (!exemptedMap.has(serviceId)) return row;

          return {
            ...row,
            isExempted: Boolean(exemptedMap.get(serviceId))
          };
        })
      );
    };

    const handleConfirm = async () => {
      const hasBillableServices = uiDueAmount > 0;

      const paymentDto: modelTypes.PatientPaymentDTO = {
        id: payment.id,
        patientId: payment.patientId,
        encounterId: payment.encounterId,
        planId: hasBillableServices ? payment.planId ?? null : null,

        paymentTypes: hasBillableServices ? payment.paymentTypes ?? null : null,
        paymentMethods: hasBillableServices ? payment.paymentMethods ?? null : null,

        amount: hasBillableServices
          ? payment.amount != null
            ? Number(payment.amount)
            : null
          : null,

        currency: hasBillableServices ? payment.currency ?? null : null,
        facilityDefaultCurrency: hasBillableServices
          ? payment.facilityDefaultCurrency ?? null
          : null,
        exchangeRate: hasBillableServices ? payment.exchangeRate ?? null : null,
        amountInFacilityCurrency: hasBillableServices
          ? payment.amountInFacilityCurrency ?? null
          : null,

        addToFreeBalance: hasBillableServices ? payment.addToFreeBalance ?? false : null,
        useBalanceToSettleDebts: hasBillableServices
          ? payment.useBalanceToSettleDebts ?? false
          : null,

        cardNumber: hasBillableServices ? payment.cardNumber ?? null : null,
        cardHolderName: hasBillableServices ? payment.cardHolderName ?? null : null,
        cardValidUntil: hasBillableServices ? toDateOnlyOrNull(payment.cardValidUntil) : null,

        chequeNumber: hasBillableServices ? payment.chequeNumber ?? null : null,
        chequeBankName: hasBillableServices ? payment.chequeBankName ?? null : null,
        chequeDueDate: hasBillableServices ? toDateOnlyOrNull(payment.chequeDueDate) : null,

        transferNumber: hasBillableServices ? payment.transferNumber ?? null : null,
        transferBankName: hasBillableServices ? payment.transferBankName ?? null : null,
        transferDate: hasBillableServices ? toDateOnlyOrNull(payment.transferDate) : null,

        services: (servicesRows ?? []).map(serviceRow => ({
          serviceId: Number((serviceRow as any).serviceId ?? 0),
          price: Number((serviceRow as any).price ?? 0),
          isExempted: Boolean((serviceRow as any).isExempted)
        }))
      };

      let paymentDetails: modelTypes.PatientPaymentDetails;

      if (paymentDto.id) {
        paymentDetails = await updatePayment({ id: paymentDto.id, body: paymentDto }).unwrap();
      } else {
        paymentDetails = await createPayment({ body: paymentDto }).unwrap();
      }

      if (paymentDetails?.payment) {
        const savedPayment: any = paymentDetails.payment;

        setPayment((previousPayment: any) => ({
          ...previousPayment,
          ...savedPayment,
          paidFromAmount: Number(savedPayment?.paidFromAmount ?? 0),
          paidFromBalance: Number(savedPayment?.paidFromBalance ?? 0),
          refunds: Number(savedPayment?.refunds ?? 0)
        }));
      }

      applySavedServicesToTable(paymentDetails);

      const departmentIdNum = Number(departmentId ?? 0);
      if (departmentIdNum) {
        const servicesResult: any = triggerGetServicesByDepartment(
          { sourceId: departmentIdNum, page: 0, size: 200, sort: 'id,asc' },
          true
        );
        if (servicesResult?.unwrap) await servicesResult.unwrap();
        applySavedServicesToTable(paymentDetails);
      }
    };

    const validateBeforeSave = () => {
      const validationDetails = validationResult?.details ?? {};
      const validatedFields = Object.keys(validationDetails);
      const hasRejectedFields = validatedFields.some(field =>
        (validationDetails[field] ?? []).some(
          (validationItem: any) => validationItem?.validationType === 'REJECT'
        )
      );

      if (hasRejectedFields) {
        const errorLines = validatedFields
          .filter(field =>
            (validationDetails[field] ?? []).some(
              (validationItem: any) => validationItem?.validationType === 'REJECT'
            )
          )
          .map(
            field =>
              `• ${PAYMENT_FIELD_LABELS[field] ?? field}: ${
                validationDetails[field]?.[0]?.message ?? 'is required'
              }`
          );

        dispatch(
          notify({
            msg: `Please fix the following fields:\n${errorLines.join('\n')}`,
            sev: 'warning'
          })
        );
        return false;
      }
      return true;
    };

    const handleConfirmSafe = async () => {
      if (isReadOnly) return false;
      if (!validateBeforeSave()) return false;

      try {
        await handleConfirm();
        setLockAfterConfirm(true);

        if (onPaymentSaved) await onPaymentSaved();

        return true;
      } catch (error: any) {
        setValidationResult(error?.data ?? error);
        handleCrudError(error, dispatch, PAYMENT_ERROR_MAP);
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      confirm: handleConfirmSafe,
      clear: handleClear,
      validate: validateBeforeSave
    }));

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const paginatedServices = useMemo(() => {
      const startIndex = page * rowsPerPage;
      return servicesRows.slice(startIndex, startIndex + rowsPerPage);
    }, [servicesRows, page, rowsPerPage]);

    useEffect(() => {
      const maxPage = Math.max(Math.ceil(servicesRows.length / rowsPerPage) - 1, 0);
      if (page > maxPage) setPage(maxPage);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [servicesRows.length, rowsPerPage]);

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    const hasServices = servicesRows.length > 0;

    return (
      <Form fluid layout="inline" className="fields-container" dir={dir}>
        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Due Amount"
          fieldName="dueAmount"
          record={{ ...payment, dueAmount: payment?.id ? payment?.dueAmount : uiDueAmount }}
          setRecord={setPayment}
        />

        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Patient's Balance"
          fieldName="patientBalance"
          record={payment}
          setRecord={setPayment}
        />

        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Debt"
          fieldName="debt"
          record={payment}
          setRecord={setPayment}
        />

        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Paid From Amount"
          fieldName="paidFromAmount"
          record={payment}
          setRecord={setPayment}
        />

        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Paid From Balance"
          fieldName="paidFromBalance"
          record={payment}
          setRecord={setPayment}
        />

        <MyInput
          vr={validationResult}
          column
          fieldLabel="Payment Type"
          fieldType="select"
          fieldName="paymentTypes"
          selectData={PaymentTypesEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={payment}
          setRecord={(updatedPayment: any) => {
            const nextPayment = { ...updatedPayment };

            if (
              nextPayment.paymentTypes === 'CASH' &&
              nextPayment.paymentMethods === 'INSURANCE_COVERAGE'
            ) {
              nextPayment.paymentMethods = null;
            }

            if (nextPayment.paymentTypes !== 'INSURANCE_PLAN') {
              nextPayment.insuranceKey = null;
              nextPayment.planId = null;
              setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
            }

            setPayment(nextPayment);
          }}
          disabled={isReadOnly || isLocked || !hasServices}
          required
          searchable={false}
          isEnum
        />

        <MyInput
          vr={validationResult}
          column
          fieldLabel="Payment Method"
          fieldType="select"
          fieldName="paymentMethods"
          selectData={PaymentMethodsEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={payment}
          setRecord={(updatedPayment: any) => {
            const nextPayment = { ...updatedPayment };

            if (nextPayment.paymentMethods !== 'CREDIT_DEBIT_CARD') {
              nextPayment.cardNumber = null;
              nextPayment.cardHolderName = null;
              nextPayment.cardValidUntil = null;
            }
            if (nextPayment.paymentMethods !== 'CHEQUE') {
              nextPayment.chequeNumber = null;
              nextPayment.chequeBankName = null;
              nextPayment.chequeDueDate = null;
            }
            if (nextPayment.paymentMethods !== 'BANK_TRANSFER') {
              nextPayment.transferNumber = null;
              nextPayment.transferBankName = null;
              nextPayment.transferDate = null;
            }

            setPayment(nextPayment);
          }}
          disabled={isReadOnly || isLocked || !hasServices}
          required
          searchable={false}
          isEnum
        />

        {isInsurancePlan ? (
          <>
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Patient Insurance"
              fieldType="selectPagination"
              fieldName="insuranceKey"
              selectData={insuranceSelectData}
              selectDataLabel="label"
              selectDataValue="id"
              record={payment as any}
              setRecord={(updatedPayment: any) => {
                const selectedInsurance = (patientInsurancesList ?? []).find(
                  (insuranceItem: any) =>
                    String(insuranceItem?.id) === String(updatedPayment.insuranceKey)
                );

                if (!selectedInsurance) {
                  setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
                  updatedPayment.planId = null;
                  setPayment(updatedPayment);
                  return;
                }

                const insuranceInfo: any = selectedInsurance;

                const payorId = Number(insuranceInfo?.payorId);
                const payorPlanId = Number(insuranceInfo?.planId);

                const payorName =
                  conjureValueBasedOnIDFromList(payorsList, payorId, 'name') ||
                  insuranceInfo?.payorName ||
                  insuranceInfo?.insuranceProvider ||
                  '';

                const cachedPlans = plansByPayorId[payorId] ?? [];
                const cachedPlanName =
                  conjureValueBasedOnIDFromList(cachedPlans, payorPlanId, 'name') ||
                  insuranceInfo?.planName ||
                  insuranceInfo?.plan?.name ||
                  '';

                setPatientInsurance({ ...insuranceInfo, payorName, planName: cachedPlanName });

                updatedPayment.planId = insuranceInfo?.id ?? null;
                setPayment(updatedPayment);

                if (payorId && !plansByPayorId[payorId]) {
                  triggerGetPlans({ payorId, page: 0, size: 1000, sort: 'name,asc' }, true)
                    .unwrap()
                    .then(plansResponse => {
                      const fetchedPlans = plansResponse?.data ?? [];
                      setPlansByPayorId(previousPlans => ({
                        ...previousPlans,
                        [payorId]: fetchedPlans
                      }));

                      const fetchedPlanName =
                        conjureValueBasedOnIDFromList(fetchedPlans, payorPlanId, 'name') ||
                        insuranceInfo?.planName ||
                        insuranceInfo?.plan?.name ||
                        '';

                      setPatientInsurance((previousInsurance: any) => ({
                        ...previousInsurance,
                        payorName,
                        planName: fetchedPlanName
                      }));
                    })
                    .catch(() =>
                      setPlansByPayorId(previousPlans => ({ ...previousPlans, [payorId]: [] }))
                    );
                }
              }}
              disabled={isReadOnly || isLocked}
              searchable={true}
              loading={patientInsuranceResponse.isFetching || payorFetching}
              hasMore={hasMoreInsurances}
              onFetchMore={handleLoadMoreInsurances}
              searchKeyWard={insuranceSearchKeyword}
              setSearchKeyWard={setInsuranceSearchKeyword}
            />

            <MyInput
              column
              disabled={true}
              fieldLabel="Payor"
              fieldType="text"
              fieldName="payorName"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true}
              fieldLabel="Plan"
              fieldType="text"
              fieldName="planName"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true}
              fieldLabel="Policy Number"
              fieldType="number"
              fieldName="policyNumber"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true}
              fieldLabel="Group Number"
              fieldType="number"
              fieldName="groupNumber"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true}
              fieldLabel="Expiration Date"
              fieldType="date"
              fieldName="expirationDate"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true}
              fieldLabel="Primary Insurance"
              fieldType="checkbox"
              fieldName="isPrimary"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
          </>
        ) : null}

        {showCardFields || showChequeFields || showBankTransferFields ? (
          <div className="payment-info__full-width-divider" />
        ) : null}

        {showCardFields ? (
          <>
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Card Number"
              fieldType="number"
              fieldName="cardNumber"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Holder Name"
              fieldType="text"
              fieldName="cardHolderName"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Valid until"
              fieldType="date"
              fieldName="cardValidUntil"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
          </>
        ) : null}

        {showChequeFields ? (
          <>
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Cheque Number"
              fieldType="number"
              fieldName="chequeNumber"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Bank Name"
              fieldType="text"
              fieldName="chequeBankName"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Cheque Due Date"
              fieldType="date"
              fieldName="chequeDueDate"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
          </>
        ) : null}

        {showBankTransferFields ? (
          <>
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Transfer Number"
              fieldType="number"
              fieldName="transferNumber"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Bank Name"
              fieldType="text"
              fieldName="transferBankName"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
            <MyInput
              vr={validationResult}
              column
              required
              fieldLabel="Transfer Date"
              fieldType="date"
              fieldName="transferDate"
              record={payment}
              setRecord={setPayment}
              disabled={isReadOnly || isLocked}
            />
          </>
        ) : null}

        <br />

        <Form layout="inline" fluid className="fields-container">
          <MyInput
            vr={validationResult}
            column
            fieldLabel="Amount"
            fieldType="number"
            fieldName="amount"
            record={payment}
            setRecord={setPayment}
            disabled={isReadOnly || isLocked || !hasServices}
            required
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Currency"
            fieldType="select"
            fieldName="currency"
            selectData={CurrencyEnum ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={payment}
            setRecord={(updatedPayment: any) => {
              const nextPayment = { ...updatedPayment };
              if (!nextPayment.currency && nextPayment.facilityDefaultCurrency)
                nextPayment.currency = nextPayment.facilityDefaultCurrency;
              setPayment(nextPayment);
            }}
            disabled={isReadOnly || isLocked || !hasServices}
            required
            searchable
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Default Currency"
            fieldType="select"
            fieldName="facilityDefaultCurrency"
            selectData={DefaultCurrencySelectData}
            selectDataLabel="label"
            selectDataValue="value"
            record={payment}
            setRecord={() => {}}
            disabled={true}
            searchable={false}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Amount in default currency"
            fieldName="amountInFacilityCurrency"
            record={payment}
            setRecord={setPayment}
            disabled={true}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Remaining"
            fieldName="remaining"
            record={payment}
            setRecord={setPayment}
            disabled={true}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Refunds"
            fieldName="refunds"
            record={payment}
            setRecord={setPayment}
            disabled={true}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Add to free balance"
            fieldType="checkbox"
            fieldName="addToFreeBalance"
            record={payment}
            setRecord={setPayment}
            disabled={isReadOnly || isLocked}
          />

          <MyInput
            vr={validationResult}
            column
            fieldLabel="Use balance to settle debts"
            fieldType="checkbox"
            fieldName="useBalanceToSettleDebts"
            record={payment}
            setRecord={setPayment}
            disabled={isReadOnly || isLocked}
          />
        </Form>

        <div className="payment-info__table-wrapper">
          <MyTable
            data={paginatedServices}
            columns={serviceColumns}
            loading={lazyServicesByDepartmentResponse?.isFetching}
            height={320}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={servicesRows.length}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={event => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            tableButtons={
              showInternalButtons ? (
                <div className="payment-info__table-actions">
                  <MyButton
                    appearance="subtle"
                    onClick={handleClear}
                    disabled={isReadOnly || isLocked}
                  >
                    Clear
                  </MyButton>

                  <MyButton
                    appearance="primary"
                    loading={creating || updating}
                    onClick={handleConfirmSafe}
                    disabled={isReadOnly || isLocked}
                  >
                    Confirm
                  </MyButton>
                </div>
              ) : null
            }
          />
        </div>
      </Form>
    );
  }
);

export default PatientPaymentInfo;
