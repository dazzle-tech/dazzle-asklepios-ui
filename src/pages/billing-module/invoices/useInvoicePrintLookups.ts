import { useEffect, useMemo, useState } from 'react';

import type { EncounterBillingSummary, PatientServiceAndProduct } from '@/types/model-types-new';
import { useGetEncounterBillingSummaryQuery } from '@/services/billing/billingTransactionService';
import { useGetPatientServicesAndProductsByEncounterQuery } from '@/services/encounters/patientServicesAndProductsService';
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useLazyGetServicesByDepartmentQuery } from '@/services/setup/serviceService';
import { useLazyGetServiceByIdQuery } from '@/services/setup/serviceService';
import {
  buildMedicationNameLookup,
  buildServiceCatalog,
  collectMedicationIdsForLookup,
  collectServiceIdsForLookup,
  mergeBillingChargeRows,
  mergeServiceCatalogs,
  type BillingServiceLookup,
  type UnifiedBillingChargeRow
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

export const useInvoicePrintLookups = (
  encounterId: number | null,
  departmentId?: number | null
) => {
  const [serviceCatalog, setServiceCatalog] = useState<BillingServiceLookup[]>([]);
  const [medicationNames, setMedicationNames] = useState<Record<number, string>>({});
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [fetchServiceById] = useLazyGetServiceByIdQuery();
  const [fetchBrandMedicationsBulk] = useLazyGetBrandMedicationsByIdsQuery();
  const [fetchDepartmentServices] = useLazyGetServicesByDepartmentQuery();

  const {
    data: billingSummary,
    isFetching: loadingBillingSummary
  } = useGetEncounterBillingSummaryQuery(
    { encounterId: encounterId as number },
    { skip: encounterId == null }
  );

  const {
    data: pspResponse,
    isFetching: loadingPsp
  } = useGetPatientServicesAndProductsByEncounterQuery(
    {
      encounterId: encounterId as number,
      page: 0,
      size: 500,
      sort: 'id,asc'
    },
    { skip: encounterId == null }
  );

  const pspRows = (pspResponse?.data ?? []) as PatientServiceAndProduct[];

  const serviceIds = useMemo(
    () => collectServiceIdsForLookup(billingSummary, pspRows),
    [billingSummary, pspRows]
  );

  const medicationIds = useMemo(
    () => collectMedicationIdsForLookup(billingSummary, pspRows),
    [billingSummary, pspRows]
  );

  const serviceIdsKey = useMemo(
    () => serviceIds.slice().sort((first, second) => first - second).join(','),
    [serviceIds]
  );

  const medicationIdsKey = useMemo(
    () => medicationIds.slice().sort((first, second) => first - second).join(','),
    [medicationIds]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      if (encounterId == null) {
        setServiceCatalog([]);
        setMedicationNames({});
        return;
      }

      setLookupsLoading(true);

      try {
        const [serviceResults, medicationsResult, departmentResult] =
          await Promise.allSettled([
            Promise.all(
              serviceIds.map(async serviceId => {
                try {
                  const service = await fetchServiceById(serviceId, true).unwrap();
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
          medicationsResult.status === 'fulfilled' ? medicationsResult.value : [];
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
      } catch {
        if (!cancelled) {
          setServiceCatalog([]);
          setMedicationNames({});
        }
      } finally {
        if (!cancelled) {
          setLookupsLoading(false);
        }
      }
    };

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [
    encounterId,
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
    () => mergeBillingChargeRows(billingSummary, pspRows, serviceCatalog, medicationNames),
    [billingSummary, medicationNames, pspRows, serviceCatalog]
  );

  const isReady =
    encounterId != null &&
    !loadingBillingSummary &&
    !loadingPsp &&
    !lookupsLoading;

  return {
    billingSummary,
    pspRows,
    chargeRows,
    isReady
  };
};

export type InvoicePrintChargeContext = {
  billingSummary?: EncounterBillingSummary | null;
  chargeRows: UnifiedBillingChargeRow[];
};
