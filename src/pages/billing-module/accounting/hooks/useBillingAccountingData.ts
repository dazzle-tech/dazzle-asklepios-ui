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
  buildTimelineEvents,
  findRejectedPreAuthItems,
  mergeBillingChargeRows,
  resolvePatientId
} from '../utils/billingAccountingUtils';

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
    data: billingSummaryResponse,
    isFetching: loadingSummary,
    refetch: refetchSummary
  } = useGetEncounterBillingSummaryQuery(
    { encounterId: selectedEncounterId as number },
    { skip: selectedEncounterId == null }
  );

  const {
    data: pspResponse,
    isFetching: loadingPsp,
    refetch: refetchPsp
  } = useGetPatientServicesAndProductsByEncounterQuery(
    {
      encounterId: selectedEncounterId as number,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: selectedEncounterId == null }
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
      { skip: patientId == null }
    );

  const { data: patientLedgerSummary, refetch: refetchLedgerSummary } =
    useGetPatientLedgerSummaryQuery(
      { patientId: patientId as number },
      { skip: patientId == null }
    );

  const { data: insuranceResponse, isFetching: loadingInsurances } =
    useGetInsurancesByPatientQuery(
      { patientId, page: 0, size: 200, sort: 'id,desc' },
      { skip: patientId == null }
    );

  const encounters = encountersResponse?.data ?? [];
  const selectedEncounter =
    encounters.find(encounter => encounter.id === selectedEncounterId) ?? null;

  const summary =
    billingSummaryResponse ??
    ({
      ...newEncounterBillingSummary,
      patientId: patientId ?? 0,
      encounterId: selectedEncounterId ?? 0
    } as typeof billingSummaryResponse);

  const pspRows = pspResponse?.data ?? [];
  const chargeRows = useMemo(
    () => mergeBillingChargeRows(summary, pspRows),
    [summary, pspRows]
  );

  const timelineEvents = useMemo(
    () => buildTimelineEvents(selectedEncounter, summary, pspRows),
    [selectedEncounter, summary, pspRows]
  );

  const rejectedPreAuthItems = useMemo(
    () => findRejectedPreAuthItems(pspRows),
    [pspRows]
  );

  const walletBalance = Number(
    summary?.wallet?.availableBalance ??
      patientLedgerSummary?.walletBalance ??
      patientWalletBalance ??
      0
  );

  const refreshAll = async () => {
    await Promise.all([
      refetchEncounters(),
      selectedEncounterId != null ? refetchSummary() : Promise.resolve(),
      selectedEncounterId != null ? refetchPsp() : Promise.resolve(),
      refetchWalletBalance(),
      refetchLedgerSummary(),
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
    summary,
    loadingSummary,
    pspRows,
    loadingPsp,
    chargeRows,
    timelineEvents,
    rejectedPreAuthItems,
    waseelCoverage,
    loadingWaseelCoverage,
    waseelCoverageError,
    walletBalance,
    reservedBalance: Number(summary?.wallet?.reservedBalance ?? 0),
    patientLedgerSummary,
    patientInsurances: insuranceResponse?.data ?? [],
    loadingInsurances,
    refreshAll
  };
};
