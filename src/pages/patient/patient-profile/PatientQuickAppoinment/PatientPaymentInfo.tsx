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
  useGetPatientLedgerSummaryQuery
} from '@/services/encounters/patientPaymentsService';

import { useGetFacilityByIdQuery } from '@/services/security/facilityService';

import { useGetInsurancesByPatientQuery } from '@/services/patients/patientInsurancesService';
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useLazyGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';

import { conjureValueBasedOnIDFromList } from '@/utils';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';

// -----------------------------------------------------------------------------
// Currency conversion (free API)
// -----------------------------------------------------------------------------
async function convertCurrencyFree(amount: number, from: string, to: string): Promise<number> {
  if (!amount || amount <= 0) return 0;
  if (!from || !to) return 0;

  const f = String(from).toUpperCase();
  const t = String(to).toUpperCase();

  if (f === t) return amount;

  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(f)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Currency API failed');

  const json = await res.json();

  if (json?.result !== 'success') {
    throw new Error('Currency API error');
  }

  const rate = json?.rates?.[t];
  const numeric = Number(rate ?? 0);

  return Number.isFinite(numeric) ? amount * numeric : 0;
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------
const PAYMENT_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Payment data is required.',
  'patient.invalid': 'Invalid patient id.',
  'patient.notfound': 'Patient not found.',
  'encounter.invalid': 'Invalid encounter id.',
  'encounter.notfound': 'Encounter not found.',
  'id.notfound': 'Payment record not found.',
  notfound: 'Payment record not found.',
  duplicate: 'Duplicate record.',
  'db.constraint': 'Database constraint violation while saving payment.'
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
  remaining: 'Remaining',
  refunds: 'Refunds',
  addToFreeBalance: 'Add to free balance',
  useBalanceToSettleDebts: 'Use balance to settle debts',
  paidFromAmount: 'Paid from amount',
  paidFromBalance: 'Paid from balance',
  dept: 'Debt', // NEW

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

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? err ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  const normalizeMsg = (msg: string) => {
    const m = (msg || '').toLowerCase();
    if (m.includes('must not be null')) return 'is required';
    if (m.includes('must not be blank')) return 'must not be blank';
    if (m.includes('size')) return 'length is out of range';
    if (m.includes('greater')) return 'value is too small';
    if (m.includes('less')) return 'value is too large';
    return msg || 'invalid value';
  };

  const toLabel = (field: string) => PAYMENT_FIELD_LABELS[field] ?? field;

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map(
      (fe: any) => `• ${toLabel(fe.field)}: ${normalizeMsg(fe.message)}`
    );

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';
  const errorKey =
    (messageProp && messageProp.startsWith('error.') ? messageProp.substring(6) : undefined) ||
    data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(
    notify({
      msg: humanMsg + suffix,
      sev: 'error'
    })
  );
};

// -----------------------------------------------------------------------------
// Date helpers
// -----------------------------------------------------------------------------
const toDateOnlyOrNull = (v: any) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
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
      setPatientInsurance
    }: any,
    ref
  ) => {
    const dispatch = useAppDispatch();

    const PaymentTypesEnum = useEnumOptions('PaymentTypes');

    const CurrencyEnum = useEnumCapitalized('Currency', {
      labelFormatter: v => String(v).toUpperCase()
    });

    const [validationResult, setValidationResult] = useState<any>({});
    const authSlice = useAppSelector(state => state.auth);
    // -----------------------------------------------------------------------------
    // Facility (FINAL FIXED VERSION)
    // -----------------------------------------------------------------------------

    const selectedFacilityId =
      localEncounter?.facilityId ??
      localEncounter?.facility?.id ??
      authSlice?.tenant?.selectedFacility?.id ??
      null;

    // IMPORTANT: pass ID directly (NOT object)
    const { data: facilityResponse, isFetching: facilityLoading } = useGetFacilityByIdQuery(
      selectedFacilityId,
      { skip: !selectedFacilityId }
    );

    // support both response shapes
    const facilityDefaultCurrency =
      facilityResponse?.defaultCurrency ?? facilityResponse?.data?.defaultCurrency ?? null;

    console.log('selectedFacilityId:', selectedFacilityId);
    console.log('facilityResponse:', facilityResponse);
    console.log('facilityDefaultCurrency:', facilityDefaultCurrency);
    // NEW: lock editing after successful confirm
    const [lockAfterConfirm, setLockAfterConfirm] = useState(false);

    // effective readonly inside this component
    const isLocked = Boolean(isReadOnly || lockAfterConfirm);

    // keep patient/encounter/default currency synced
    useEffect(() => {
      if (!facilityDefaultCurrency) return;
      // if (!payment?.facilityDefaultCurrency) req('facilityDefaultCurrency');
      setPayment((prev: any) => ({
        ...prev,
        patientId: localPatient?.id ?? localPatient?.key ?? prev.patientId ?? 0,

        encounterId: localEncounter?.id ?? prev.encounterId ?? 0,

        facilityDefaultCurrency: facilityDefaultCurrency,

        // never send empty string
        currency: prev.currency ?? facilityDefaultCurrency
      }));
    }, [localPatient?.id, localPatient?.key, localEncounter?.id, facilityDefaultCurrency]);

    // -------------------------------------------------------------------------
    // NEW: Ledger summary (Debt) from backend
    // -------------------------------------------------------------------------
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

      if (Number(payment?.dept ?? NaN) !== Number(totalDebt)) {
        setPayment((prev: any) => ({ ...prev, dept: totalDebt }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ledgerSummaryResponse?.data]);

    // Default currency options
    const DefaultCurrencySelectData = useMemo(() => {
      const def = payment?.facilityDefaultCurrency;
      const base = CurrencyEnum ?? [];
      if (!def) return base;

      const exists = base.some((x: any) => x?.value === def);
      return exists ? base : [{ label: def, value: def }, ...base];
    }, [CurrencyEnum, payment?.facilityDefaultCurrency]);

    // services rows (UI)
    const [servicesRows, setServicesRows] = useState<UiPaymentServiceRow[]>([]);
    const savedExemptedByServiceIdRef = useRef<Map<number, boolean>>(new Map());

    const PaymentMethodsEnum = useEnumOptions('PaymentMethods', {
      exclude: payment?.paymentTypes === 'OUT_OF_POCKET' ? ['INSURANCE_COVERAGE'] : []
    });

    // Insurance queries
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
      const r: any = patientInsuranceResponse?.data;
      if (Array.isArray(r?.data)) return r.data;
      if (Array.isArray(r?.data?.data)) return r.data.data;
      if (Array.isArray(r?.object)) return r.object;
      return [];
    }, [patientInsuranceResponse?.data]);

    // Insurance pagination in select
    const [insurancePage, setInsurancePage] = useState(0);
    const [insuranceSearchKeyword, setInsuranceSearchKeyword] = useState('');
    const INSURANCE_PAGE_SIZE = 20;

    useEffect(() => {
      setInsurancePage(0);
    }, [insuranceSearchKeyword]);

    const filteredInsurances = useMemo(() => {
      const kw = insuranceSearchKeyword.trim().toLowerCase();
      if (!kw) return patientInsurancesList ?? [];

      return (patientInsurancesList ?? []).filter((x: any) => {
        const payorName =
          conjureValueBasedOnIDFromList(payorsList, x?.payorId, 'name') ||
          x?.payorName ||
          x?.insuranceProvider ||
          '';

        const plans = plansByPayorId[Number(x?.payorId)] ?? [];
        const planName =
          conjureValueBasedOnIDFromList(plans, x?.planId, 'name') ||
          x?.planName ||
          x?.plan?.name ||
          '';

        const policy = String(x?.policyNumber ?? '');
        const group = String(x?.groupNumber ?? '');

        const hay = `${payorName} ${planName} ${policy} ${group}`.toLowerCase();
        return hay.includes(kw);
      });
    }, [patientInsurancesList, insuranceSearchKeyword, payorsList, plansByPayorId]);

    const insurancePageSlice = useMemo(() => {
      const start = insurancePage * INSURANCE_PAGE_SIZE;
      return (filteredInsurances ?? []).slice(start, start + INSURANCE_PAGE_SIZE);
    }, [filteredInsurances, insurancePage]);

    const hasMoreInsurances = useMemo(() => {
      return (insurancePage + 1) * INSURANCE_PAGE_SIZE < (filteredInsurances?.length ?? 0);
    }, [filteredInsurances?.length, insurancePage]);

    const handleLoadMoreInsurances = () => {
      if (hasMoreInsurances) setInsurancePage(p => p + 1);
    };

    const visiblePayorIdsForInsurance = useMemo(() => {
      const ids = new Set<number>();
      (insurancePageSlice ?? []).forEach((row: any) => {
        const payorId = Number(row?.payorId);
        if (!Number.isNaN(payorId)) ids.add(payorId);
      });
      return Array.from(ids);
    }, [insurancePageSlice]);

    useEffect(() => {
      const loadPlans = async () => {
        for (const payorId of visiblePayorIdsForInsurance) {
          if (plansByPayorId[payorId]) continue;

          try {
            const res = await triggerGetPlans(
              { payorId, page: 0, size: 1000, sort: 'name,asc' },
              true
            ).unwrap();
            setPlansByPayorId(prev => ({ ...prev, [payorId]: res?.data ?? [] }));
          } catch {
            setPlansByPayorId(prev => ({ ...prev, [payorId]: [] }));
          }
        }
      };

      if (visiblePayorIdsForInsurance.length > 0) loadPlans();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visiblePayorIdsForInsurance]);

    const insuranceSelectData = useMemo(() => {
      return (insurancePageSlice ?? []).map((item: any) => {
        const payorName =
          conjureValueBasedOnIDFromList(payorsList, item?.payorId, 'name') ||
          item?.payorName ||
          item?.insuranceProvider ||
          '';

        const plans = plansByPayorId[Number(item?.payorId)] ?? [];
        const planName =
          conjureValueBasedOnIDFromList(plans, item?.planId, 'name') ||
          item?.planName ||
          item?.plan?.name ||
          '';

        const label = `${payorName || 'Payor'} • ${planName || 'Plan'}`;
        return { ...item, label, payorDisplayName: payorName, planDisplayName: planName };
      });
    }, [insurancePageSlice, payorsList, plansByPayorId]);

    const isInsurancePlan = payment?.paymentTypes === 'INSURANCE_PLAN';
    const pm = payment?.paymentMethods;

    const showCardFields = pm === 'CREDIT_DEBIT_CARD';
    const showChequeFields = pm === 'CHEQUE';
    const showBankTransferFields = pm === 'BANK_TRANSFER';

    // Currency conversion
    const isCurrencyChanged =
      !!payment?.currency &&
      !!payment?.facilityDefaultCurrency &&
      payment.currency !== payment.facilityDefaultCurrency;

    // Patient balance from backend
    const patientBalanceResponse = useGetPatientBalanceQuery(
      { patientId: effectivePatientId },
      { skip: !effectivePatientId }
    );

    useEffect(() => {
      const bal = patientBalanceResponse?.data;
      if (bal == null) return;

      if (Number(payment?.patientBalance ?? NaN) !== Number(bal)) {
        setPayment((prev: any) => ({ ...prev, patientBalance: Number(bal) }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientBalanceResponse?.data]);

    // Department services
    const departmentId =
      localEncounter?.departmentId ??
      localEncounter?.department?.id ??
      localEncounter?.clinicDepartmentId ??
      null;

    const [triggerGetServicesByDepartment, lazyServicesByDepartmentResponse] =
      useLazyGetServicesByDepartmentQuery();

    useEffect(() => {
      const depIdNum = Number(departmentId ?? 0);
      if (!depIdNum) {
        setServicesRows([]);
        return;
      }

      triggerGetServicesByDepartment(
        { sourceId: depIdNum, page: 0, size: 200, sort: 'id,asc' },
        true
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentId]);

    // map services to table rows (preserve saved isExempted)
    useEffect(() => {
      const r: any = lazyServicesByDepartmentResponse?.data;
      const rows = Array.isArray(r?.data) ? r.data : [];
      const defCur = payment?.facilityDefaultCurrency || '';

      const mapped: UiPaymentServiceRow[] = (rows ?? []).map((s: any) => {
        const price = Number(s?.price ?? s?.servicePrice ?? s?.defaultPrice ?? 0);
        const sid = Number(s?.id ?? s?.serviceId ?? 0);

        const savedEx = sid ? savedExemptedByServiceIdRef.current.get(sid) : undefined;

        return {
          id: s?.id ?? s?.serviceId ?? `${s?.id ?? ''}`,
          serviceId: s?.id ?? s?.serviceId ?? null,
          price,
          isExempted: savedEx != null ? Boolean(savedEx) : Boolean(s?.isExempted),
          serviceType: s?.serviceType ?? s?.type ?? s?.category ?? '',
          serviceName: s?.name ?? s?.serviceName ?? '',
          defaultCurrency: String(s?.currency ?? s?.defaultCurrency ?? defCur)
        } as any;
      });

      if (!departmentId) return;

      setServicesRows(prev => {
        const prevByServiceId = new Map<string, UiPaymentServiceRow>();
        (prev ?? []).forEach(p => {
          const key = String((p as any).serviceId ?? p.id ?? '');
          prevByServiceId.set(key, p);
        });

        return mapped.map(m => {
          const key = String((m as any).serviceId ?? m.id ?? '');
          const old = prevByServiceId.get(key);
          return old ? { ...m, isExempted: Boolean(old.isExempted) } : m;
        });
      });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lazyServicesByDepartmentResponse?.data, departmentId, payment?.facilityDefaultCurrency]);

    // UI-only due amount (before save)
    const uiDueAmount = useMemo(() => {
      return (servicesRows ?? [])
        .filter(s => !Boolean((s as any).isExempted))
        .reduce((acc, s: any) => acc + Number(s?.price ?? 0), 0);
    }, [servicesRows]);

    // convert amount to facility currency when currency differs
    useEffect(() => {
      let cancelled = false;

      (async () => {
        try {
          const amount = Number(payment?.amount ?? 0);
          const from = payment?.currency;
          const to = payment?.facilityDefaultCurrency;

          if (!isCurrencyChanged) {
            if (payment?.amountInFacilityCurrency != null) {
              setPayment((prev: any) => ({ ...prev, amountInFacilityCurrency: null }));
            }
            return;
          }

          const converted = await convertCurrencyFree(amount, from, to);
          if (!cancelled) {
            setPayment((prev: any) => ({
              ...prev,
              amountInFacilityCurrency: converted
            }));
          }
        } catch {
          if (!cancelled) {
            setPayment((prev: any) => ({
              ...prev,
              amountInFacilityCurrency: null
            }));
          }
        }
      })();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payment?.amount, payment?.currency, payment?.facilityDefaultCurrency, isCurrencyChanged]);

    // validation
    useEffect(() => {
      const vr: any = { details: {} };
      const req = (field: string, msg = 'Required') => {
        vr.details[field] = [{ validationType: 'REJECT', message: msg }];
      };

      if (!payment?.paymentTypes) req('paymentTypes');
      if (!payment?.paymentMethods) req('paymentMethods');

      if (payment?.amount == null || String(payment.amount).trim() === '') req('amount');
      if (!payment?.currency) req('currency');

      if (isInsurancePlan) {
        if (!payment?.insuranceKey && !payment?.planId) req('planId');
      }

      if (showCardFields) {
        if (!payment?.cardNumber) req('cardNumber');
        if (!payment?.cardHolderName) req('cardHolderName');
        if (!payment?.cardValidUntil) req('cardValidUntil');
      }

      if (showChequeFields) {
        if (!payment?.chequeNumber) req('chequeNumber');
        if (!payment?.chequeBankName) req('chequeBankName');
        if (!payment?.chequeDueDate) req('chequeDueDate');
      }

      if (showBankTransferFields) {
        if (!payment?.transferNumber) req('transferNumber');
        if (!payment?.transferBankName) req('transferBankName');
        if (!payment?.transferDate) req('transferDate');
      }

      setValidationResult(vr);
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

    // Exempted toggles
    const allExempted = servicesRows.length > 0 && servicesRows.every(s => !!s.isExempted);
    const someExempted = servicesRows.some(s => !!s.isExempted);

    const toggleAllExempted = (checked: boolean) => {
      setServicesRows(prev => prev.map(s => ({ ...s, isExempted: checked })));
    };

    const toggleOneExempted = (id: any, checked: boolean) => {
      setServicesRows(prev =>
        prev.map(s => (String(s.id) === String(id) ? { ...s, isExempted: checked } : s))
      );
    };

    const exemptionBadge = (isExempted: boolean | null | undefined) => {
      const value = Boolean(isExempted);
      const color = value ? '#388E3C' : '#ff8902ff';
      const label = value ? 'Yes' : 'No';
      return <MyBadgeStatus color={color} contant={label} />;
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

    // Mutations
    const [createPayment, { isLoading: creating }] = useCreatePaymentMutation();
    const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation();

    // Clear
    const handleClear = () => {
      setPayment((prev: any) => ({
        ...newPatientPayments,
        patientId: prev.patientId,
        encounterId: prev.encounterId,
        facilityDefaultCurrency: prev.facilityDefaultCurrency,
        currency: prev.facilityDefaultCurrency,
        useBalanceToSettleDebts: false,
        dept: prev.dept ?? 0 // keep displayed debt
      }));

      setServicesRows(prev => prev.map(s => ({ ...s, isExempted: false })));
      savedExemptedByServiceIdRef.current = new Map();
      setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
      setValidationResult({});
    };

    const applySavedServicesToTable = (details: modelTypes.PatientPaymentDetails | any) => {
      const saved = details?.services ?? [];
      if (!Array.isArray(saved)) return;

      const m = new Map<number, boolean>();
      saved.forEach((x: any) => {
        const sid = Number(x?.serviceId ?? 0);
        if (!sid) return;
        m.set(sid, Boolean(x?.isExempted));
      });

      savedExemptedByServiceIdRef.current = m;

      setServicesRows(prev =>
        (prev ?? []).map(r => {
          const sid = Number((r as any)?.serviceId ?? 0);
          if (!sid) return r;
          if (!m.has(sid)) return r;
          return { ...r, isExempted: Boolean(m.get(sid)) };
        })
      );
    };

    // Confirm (create/update)
    const handleConfirm = async () => {
      console.log('payment to save confirm:', payment);
      const dto: modelTypes.PatientPaymentDTO = {
        id: payment.id,
        patientId: payment.patientId,
        encounterId: payment.encounterId,
        planId: payment.planId ?? null,

        paymentTypes: payment.paymentTypes,
        paymentMethods: payment.paymentMethods,

        amount: Number(payment.amount ?? 0),
        currency: payment.currency ?? null,
        facilityDefaultCurrency: payment.facilityDefaultCurrency ?? null,
        amountInFacilityCurrency: payment.amountInFacilityCurrency ?? null,

        addToFreeBalance: Boolean(payment.addToFreeBalance),

        useBalanceToSettleDebts: Boolean(payment.useBalanceToSettleDebts),

        cardNumber: payment.cardNumber ?? null,
        cardHolderName: payment.cardHolderName ?? null,
        cardValidUntil: toDateOnlyOrNull(payment.cardValidUntil),

        chequeNumber: payment.chequeNumber ?? null,
        chequeBankName: payment.chequeBankName ?? null,
        chequeDueDate: toDateOnlyOrNull(payment.chequeDueDate),

        transferNumber: payment.transferNumber ?? null,
        transferBankName: payment.transferBankName ?? null,
        transferDate: toDateOnlyOrNull(payment.transferDate),

        services: (servicesRows ?? []).map(s => ({
          serviceId: Number((s as any).serviceId ?? 0),
          price: Number((s as any).price ?? 0),
          isExempted: Boolean((s as any).isExempted)
        }))
      };

      let details: modelTypes.PatientPaymentDetails;

      if (dto.id) {
        details = await updatePayment({ id: dto.id, body: dto }).unwrap();
      } else {
        details = await createPayment({ body: dto }).unwrap();
      }

      const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      if (details?.payment) {
        const p: any = details.payment;

        setPayment((prev: any) => ({
          ...prev,
          ...p,
          paidFromAmount: Number(p?.amountPaid ?? 0),
          paidFromBalance: Number(p?.paidFromBalance ?? 0),
          refunds: Number(p?.refunds ?? 0)
        }));
      }
      console.log('payment from backend:', details?.payment);

      applySavedServicesToTable(details);

      const depIdNum = Number(departmentId ?? 0);
      if (depIdNum) {
        const res: any = triggerGetServicesByDepartment(
          { sourceId: depIdNum, page: 0, size: 200, sort: 'id,asc' },
          true
        );
        if (res?.unwrap) await res.unwrap();
        applySavedServicesToTable(details);
      }
    };

    // External validation used by modal footer
    const validateBeforeSave = () => {
      const details = validationResult?.details ?? {};
      const fields = Object.keys(details);
      const hasReject = fields.some(f =>
        (details[f] ?? []).some((x: any) => x?.validationType === 'REJECT')
      );

      if (hasReject) {
        const lines = fields
          .filter(f => (details[f] ?? []).some((x: any) => x?.validationType === 'REJECT'))
          .map(
            f => `• ${PAYMENT_FIELD_LABELS[f] ?? f}: ${details[f]?.[0]?.message ?? 'is required'}`
          );

        dispatch(
          notify({
            msg: `Please fix the following fields:\n${lines.join('\n')}`,
            sev: 'error'
          })
        );
        return false;
      }
      return true;
    };

    const handleConfirmSafe = async () => {
      console.log(
        'handleConfirmSafe called. isReadOnly:',
        isReadOnly,
        'validationResult:',
        validationResult
      );
      if (isReadOnly) return false;
      if (!validateBeforeSave()) return false;

      try {
        await handleConfirm();
        setLockAfterConfirm(true);
        dispatch(notify({ msg: 'Payment Saved Successfully', sev: 'success' }));
        return true;
      } catch (err: any) {
        setValidationResult(err?.data ?? err);
        handleCrudError(err, dispatch, PAYMENT_ERROR_MAP);
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      confirm: handleConfirmSafe,
      clear: handleClear,
      validate: validateBeforeSave
    }));

    // Table pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const paginatedServices = useMemo(() => {
      const start = page * rowsPerPage;
      return servicesRows.slice(start, start + rowsPerPage);
    }, [servicesRows, page, rowsPerPage]);

    useEffect(() => {
      const maxPage = Math.max(Math.ceil(servicesRows.length / rowsPerPage) - 1, 0);
      if (page > maxPage) setPage(maxPage);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [servicesRows.length, rowsPerPage]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
      <Form fluid layout="inline" className="fields-container">
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
          fieldLabel="Patient’s Balance"
          fieldName="patientBalance"
          record={payment}
          setRecord={setPayment}
        />

        {/* NEW: dept (total debt) from ledger summary endpoint */}
        <MyInput
          vr={validationResult}
          column
          disabled={true}
          fieldLabel="Debt"
          fieldName="dept"
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
          setRecord={(updated: any) => {
            const next = { ...updated };

            if (
              next.paymentTypes === 'OUT_OF_POCKET' &&
              next.paymentMethods === 'INSURANCE_COVERAGE'
            ) {
              next.paymentMethods = null;
            }

            if (next.paymentTypes !== 'INSURANCE_PLAN') {
              next.insuranceKey = null;
              next.planId = null;
              setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
            }

            setPayment(next);
          }}
          disabled={isReadOnly || isLocked}
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
          setRecord={(updated: any) => {
            const next = { ...updated };

            if (next.paymentMethods !== 'CREDIT_DEBIT_CARD') {
              next.cardNumber = null;
              next.cardHolderName = null;
              next.cardValidUntil = null;
            }
            if (next.paymentMethods !== 'CHEQUE') {
              next.chequeNumber = null;
              next.chequeBankName = null;
              next.chequeDueDate = null;
            }
            if (next.paymentMethods !== 'BANK_TRANSFER') {
              next.transferNumber = null;
              next.transferBankName = null;
              next.transferDate = null;
            }

            setPayment(next);
          }}
          disabled={isReadOnly || isLocked}
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
              setRecord={(updated: any) => {
                const selected = (patientInsurancesList ?? []).find(
                  (x: any) => String(x?.id) === String(updated.insuranceKey)
                );

                if (!selected) {
                  setPatientInsurance({ ...newPatientInsurance, payorName: '', planName: '' });
                  updated.planId = null;
                  setPayment(updated);
                  return;
                }

                const pi: any = selected;

                const payorId = Number(pi?.payorId);
                const payorPlanId = Number(pi?.planId);

                const payorName =
                  conjureValueBasedOnIDFromList(payorsList, payorId, 'name') ||
                  pi?.payorName ||
                  pi?.insuranceProvider ||
                  '';

                const cachedPlans = plansByPayorId[payorId] ?? [];
                const cachedPlanName =
                  conjureValueBasedOnIDFromList(cachedPlans, payorPlanId, 'name') ||
                  pi?.planName ||
                  pi?.plan?.name ||
                  '';

                setPatientInsurance({ ...pi, payorName, planName: cachedPlanName });

                updated.planId = pi?.id ?? null;
                setPayment(updated);

                if (payorId && !plansByPayorId[payorId]) {
                  triggerGetPlans({ payorId, page: 0, size: 1000, sort: 'name,asc' }, true)
                    .unwrap()
                    .then(res => {
                      const plans = res?.data ?? [];
                      setPlansByPayorId(prev => ({ ...prev, [payorId]: plans }));

                      const fetchedPlanName =
                        conjureValueBasedOnIDFromList(plans, payorPlanId, 'name') ||
                        pi?.planName ||
                        pi?.plan?.name ||
                        '';

                      setPatientInsurance((prev: any) => ({
                        ...prev,
                        payorName,
                        planName: fetchedPlanName
                      }));
                    })
                    .catch(() => setPlansByPayorId(prev => ({ ...prev, [payorId]: [] })));
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
              disabled={true || isLocked}
              fieldLabel="Payor"
              fieldType="text"
              fieldName="payorName"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true || isLocked}
              fieldLabel="Plan"
              fieldType="text"
              fieldName="planName"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true || isLocked}
              fieldLabel="Policy Number"
              fieldType="number"
              fieldName="policyNumber"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true || isLocked}
              fieldLabel="Group Number"
              fieldType="number"
              fieldName="groupNumber"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true || isLocked}
              fieldLabel="Expiration Date"
              fieldType="date"
              fieldName="expirationDate"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
            <MyInput
              column
              disabled={true || isLocked}
              fieldLabel="Primary Insurance"
              fieldType="checkbox"
              fieldName="isPrimary"
              record={patientInsurance as any}
              setRecord={() => {}}
            />
          </>
        ) : null}

        {showCardFields || showChequeFields || showBankTransferFields ? (
          <div style={{ flexBasis: '100%', width: '100%', height: 0 }} />
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
            disabled={isReadOnly || isLocked}
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
            setRecord={(updated: any) => {
              const next = { ...updated };
              if (!next.currency && next.facilityDefaultCurrency)
                next.currency = next.facilityDefaultCurrency;
              setPayment(next);
            }}
            disabled={isReadOnly || isLocked}
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

        <div style={{ width: '100%', marginTop: 10 }}>
          <MyTable
            data={paginatedServices}
            columns={serviceColumns}
            loading={lazyServicesByDepartmentResponse?.isFetching}
            height={320}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={servicesRows.length}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            tableButtons={
              showInternalButtons ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'flex-end',
                    width: '100%'
                  }}
                >
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
