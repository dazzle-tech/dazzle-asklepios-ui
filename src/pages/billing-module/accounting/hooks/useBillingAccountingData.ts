import { useEffect, useMemo, useState } from 'react';

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
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import {
  useLazyGetServiceByIdQuery,
  useLazyGetServicesByDepartmentQuery
} from '@/services/setup/serviceService';

import {
  buildMedicationNameLookup,
  buildServiceCatalog,
  buildTimelineEvents,
  collectMedicationIdsForLookup,
  collectServiceIdsForLookup,
  findRejectedPreAuthItems,
  mergeBillingChargeRows,
  mergeServiceCatalogs,
  resolvePatientId,
  type BillingServiceLookup
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

  const [serviceCatalog, setServiceCatalog] = useState<BillingServiceLookup[]>(
    []
  );
  const [medicationNames, setMedicationNames] = useState<
    Record<number, string>
  >({});

  const [fetchServiceById] = useLazyGetServiceByIdQuery();
  const [fetchBrandMedicationsBulk] = useLazyGetBrandMedicationsByIdsQuery();
  const [fetchDepartmentServices] = useLazyGetServicesByDepartmentQuery();

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
  const departmentId = selectedEncounter?.departmentId ?? null;

  const serviceIds = useMemo(
    () => collectServiceIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const medicationIds = useMemo(
    () => collectMedicationIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const serviceIdsKey = useMemo(
    () => serviceIds.slice().sort((first, second) => first - second).join(','),
    [serviceIds]
  );

  const medicationIdsKey = useMemo(
    () =>
      medicationIds.slice().sort((first, second) => first - second).join(','),
    [medicationIds]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      if (selectedEncounterId == null) {
        setServiceCatalog([]);
        setMedicationNames({});
        return;
      }

      const [serviceResults, medicationsResult, departmentResult] =
        await Promise.allSettled([
          Promise.all(
            serviceIds.map(async serviceId => {
              try {
                const service = await fetchServiceById(
                  serviceId,
                  true
                ).unwrap();
                return buildServiceCatalog([service])[0] ?? null;
              } catch {
                return null;
              }
            })
          ),
          medicationIds.length > 0
            ? fetchBrandMedicationsBulk({ ids: medicationIds }, true).unwrap()
            : Promise.resolve([]),
          departmentId != null
            ? fetchDepartmentServices(
                {
                  sourceId: departmentId,
                  page: 0,
                  size: 500,
                  sort: 'id,asc'
                },
                true
              ).unwrap()
            : Promise.resolve(null)
        ]);

      if (cancelled) {
        return;
      }

      const resolvedServices =
        serviceResults.status === 'fulfilled' ? serviceResults.value : [];
      const resolvedMedications =
        medicationsResult.status === 'fulfilled'
          ? medicationsResult.value
          : [];
      const resolvedDepartment =
        departmentResult.status === 'fulfilled' ? departmentResult.value : null;

      setServiceCatalog(
        mergeServiceCatalogs(
          buildServiceCatalog(resolvedDepartment),
          resolvedServices.filter(
            (service): service is BillingServiceLookup => service != null
          )
        )
      );
      setMedicationNames(buildMedicationNameLookup(resolvedMedications));
    };

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [
    selectedEncounterId,
    departmentId,
    serviceIdsKey,
    medicationIdsKey,
    serviceIds,
    medicationIds,
    fetchServiceById,
    fetchBrandMedicationsBulk,
    fetchDepartmentServices
  ]);

  const chargeRows = useMemo(
    () =>
      mergeBillingChargeRows(
        summary,
        pspRows,
        serviceCatalog,
        medicationNames
      ),
    [summary, pspRows, serviceCatalog, medicationNames]
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
