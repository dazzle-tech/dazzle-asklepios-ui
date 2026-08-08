import { useMemo } from 'react';

import { useAppSelector } from '@/hooks';
import { newEncounterBillingSummary } from '@/types/model-types-constructor-new';
import {
  useGetEncounterBillingSummaryQuery,
  useGetWaseelCoverageQuery
} from '@/services/billing/billingTransactionService';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useGetPatientServicesAndProductsByEncounterQuery } from '@/services/encounters/patientServicesAndProductsService';
import {
  useGetPatientBalanceQuery,
  useGetPatientLedgerSummaryQuery
} from '@/services/encounters/patientPaymentsService';
import { useGetInsurancesByPatientQuery } from '@/services/patients/patientInsurancesService';
import {
  useGetPatientFinancialDocumentsQuery,
  type PatientFinancialInvoice
} from '@/services/billing/invoiceGenerationService';
import {
  useGetInvoiceAdjustmentsQuery,
  useGetInvoiceLineItemsQuery
} from '@/services/billing/financialDocumentAdjustmentService';
import {
  buildTimelineEvents,
  findRejectedPreAuthItems,
  mergeEncounterSummaryWithInvoiceContext,
  mergeBillingChargeRows,
  resolveDisplayChargeRows,
  resolveEncounterPatientInvoiceId,
  resolvePatientWalletAvailable,
  resolvePatientWalletReserved,
  resolvePatientId
} from '../utils/billingAccountingUtils';
import { useBillingCatalogLookups } from './useBillingCatalogLookups';

type UseBillingAccountingDataArgs = {
  patient: any;
  selectedEncounterId: number | null;
  selectedInsuranceId: number | null;
  coverageType: 'SELF_PAY' | 'INSURANCE';
};

export const useBillingAccountingData = ({
  patient,
  selectedEncounterId,
  selectedInsuranceId,
  coverageType
}: UseBillingAccountingDataArgs) => {
  const authSlice = useAppSelector(state => state.auth);
  const patientId = resolvePatientId(patient);
  const facilityId = authSlice?.tenant?.selectedFacility?.id ?? null;
  const facilityCurrency =
    authSlice?.tenant?.selectedFacility?.defaultCurrency ?? 'SAR';

  const {
    data: encountersResponse,
    isFetching: loadingEncounters,
    refetch: refetchEncounters
  } = useGetEncountersByPatientQuery(
    { patientId: patientId as number, page: 0, size: 100, sort: 'createdDate,desc' },
    { skip: patientId == null }
  );

  const {
    currentData: billingSummary,
    isLoading: loadingSummaryInitial,
    isFetching: fetchingSummary,
    refetch: refetchSummary
  } = useGetEncounterBillingSummaryQuery(
    { encounterId: selectedEncounterId as number },
    {
      skip: selectedEncounterId == null,
      refetchOnMountOrArgChange: true
    }
  );

  const {
    currentData: pspResponse,
    isLoading: loadingPspInitial,
    isFetching: fetchingPsp,
    refetch: refetchPsp
  } = useGetPatientServicesAndProductsByEncounterQuery(
    {
      encounterId: selectedEncounterId as number,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: selectedEncounterId == null, refetchOnMountOrArgChange: true }
  );

  const {
    data: waseelCoverage,
    isFetching: loadingWaseelCoverage,
    isError: waseelCoverageError,
    refetch: refetchWaseelCoverage
  } = useGetWaseelCoverageQuery(
    {
      patientId: patientId as number,
      patientInsuranceId: selectedInsuranceId
    },
    {
      skip:
        patientId == null ||
        coverageType !== 'INSURANCE' ||
        selectedInsuranceId == null
    }
  );

  const { data: patientWalletBalance, refetch: refetchWalletBalance } =
    useGetPatientBalanceQuery(
      { patientId: patientId as number },
      { skip: patientId == null, refetchOnMountOrArgChange: true }
    );

  const {
    currentData: patientLedgerSummary,
    isLoading: loadingLedgerInitial,
    refetch: refetchLedgerSummary
  } = useGetPatientLedgerSummaryQuery(
    { patientId: patientId as number },
    { skip: patientId == null, refetchOnMountOrArgChange: true }
  );

  const { data: insuranceResponse, isFetching: loadingInsurances } =
    useGetInsurancesByPatientQuery(
      { patientId, page: 0, size: 200, sort: 'id,desc' },
      { skip: patientId == null }
    );

  const {
    currentData: financialDocuments = [],
    isFetching: fetchingFinancialDocuments,
    refetch: refetchFinancialDocuments
  } = useGetPatientFinancialDocumentsQuery(patientId as number, {
    skip: patientId == null,
    refetchOnMountOrArgChange: true
  });

  const encounters = encountersResponse?.data ?? [];
  const selectedEncounter =
    encounters.find(encounter => encounter.id === selectedEncounterId) ?? null;

  const fallbackSummary = useMemo(
    () =>
      ({
        ...newEncounterBillingSummary,
        patientId: patientId ?? 0,
        encounterId: selectedEncounterId ?? 0
      }) as NonNullable<typeof billingSummary>,
    [patientId, selectedEncounterId]
  );

  const summaryMatchesEncounter =
    billingSummary != null &&
    Number(billingSummary.encounterId) === Number(selectedEncounterId);

  const summaryReady =
    selectedEncounterId == null ||
    !(loadingSummaryInitial && billingSummary == null);

  const ledgerReady =
    patientId == null ||
    !(loadingLedgerInitial && patientLedgerSummary == null);

  const summary = summaryMatchesEncounter ? billingSummary : fallbackSummary;

  const resolvedInvoiceId = useMemo(
    () =>
      resolveEncounterPatientInvoiceId(
        selectedEncounterId,
        summary,
        financialDocuments as PatientFinancialInvoice[]
      ),
    [selectedEncounterId, summary, financialDocuments]
  );

  const {
    currentData: invoiceAdjustments,
    isFetching: fetchingInvoiceAdjustments,
    refetch: refetchInvoiceAdjustments
  } = useGetInvoiceAdjustmentsQuery(resolvedInvoiceId as number, {
    skip: resolvedInvoiceId == null,
    refetchOnMountOrArgChange: true
  });

  const {
    currentData: invoiceLineItems,
    isFetching: fetchingInvoiceLineItems,
    refetch: refetchInvoiceLineItems
  } = useGetInvoiceLineItemsQuery(resolvedInvoiceId as number, {
    skip: resolvedInvoiceId == null,
    refetchOnMountOrArgChange: true
  });

  const effectiveSummary = useMemo(
    () =>
      mergeEncounterSummaryWithInvoiceContext(
        summary,
        resolvedInvoiceId,
        invoiceAdjustments ?? null
      ),
    [summary, resolvedInvoiceId, invoiceAdjustments]
  );

  const loadingBillingMetrics =
    selectedEncounterId != null &&
    (!summaryReady ||
      !ledgerReady ||
      (resolvedInvoiceId != null &&
        (fetchingInvoiceAdjustments || fetchingInvoiceLineItems) &&
        invoiceAdjustments == null));

  const loadingSummary =
    selectedEncounterId != null &&
    loadingSummaryInitial &&
    billingSummary == null;

  const loadingPsp =
    selectedEncounterId != null && (loadingPspInitial || fetchingPsp);

  const pspRows = pspResponse?.data ?? [];

  const { lookups } = useBillingCatalogLookups({
    encounterId: selectedEncounterId,
    pspRows
  });

  const chargeRows = useMemo(
    () =>
      resolveDisplayChargeRows(
        effectiveSummary,
        pspRows,
        invoiceLineItems ?? [],
        resolvedInvoiceId
      ),
    [effectiveSummary, invoiceLineItems, pspRows, resolvedInvoiceId]
  );

  const timelineEvents = useMemo(
    () =>
      buildTimelineEvents(selectedEncounter, effectiveSummary, pspRows),
    [selectedEncounter, effectiveSummary, pspRows]
  );

  const rejectedPreAuthItems = useMemo(
    () => findRejectedPreAuthItems(pspRows),
    [pspRows]
  );

  const walletBalance = resolvePatientWalletAvailable(
    patientLedgerSummary,
    effectiveSummary?.wallet?.availableBalance,
    patientWalletBalance
  );

  const reservedBalance = resolvePatientWalletReserved(
    patientLedgerSummary,
    effectiveSummary?.wallet?.reservedBalance
  );

  const refreshAll = async () => {
    await Promise.all([
      refetchEncounters(),
      selectedEncounterId != null ? refetchSummary() : Promise.resolve(),
      selectedEncounterId != null ? refetchPsp() : Promise.resolve(),
      refetchWalletBalance(),
      refetchLedgerSummary(),
      patientId != null ? refetchFinancialDocuments() : Promise.resolve(),
      resolvedInvoiceId != null ? refetchInvoiceAdjustments() : Promise.resolve(),
      resolvedInvoiceId != null ? refetchInvoiceLineItems() : Promise.resolve(),
      coverageType === 'INSURANCE' && selectedInsuranceId != null
        ? refetchWaseelCoverage()
        : Promise.resolve()
    ]);
  };

  return {
    patientId,
    facilityId,
    facilityCurrency,
    encounters,
    loadingEncounters,
    selectedEncounter,
    summary: effectiveSummary,
    summaryForDisplay: summaryMatchesEncounter ? billingSummary ?? null : null,
    loadingSummary,
    loadingBillingMetrics,
    pspRows,
    loadingPsp,
    chargeRows,
    resolvedInvoiceId,
    invoiceAdjustments:
      resolvedInvoiceId != null ? invoiceAdjustments ?? null : null,
    loadingInvoiceContext:
      resolvedInvoiceId != null &&
      (fetchingInvoiceAdjustments ||
        fetchingInvoiceLineItems ||
        fetchingFinancialDocuments),
    timelineEvents,
    rejectedPreAuthItems,
    waseelCoverage,
    loadingWaseelCoverage,
    waseelCoverageError,
    walletBalance,
    reservedBalance,
    patientLedgerSummary,
    patientInsurances: insuranceResponse?.data ?? [],
    loadingInsurances,
    refreshAll
  };
};
