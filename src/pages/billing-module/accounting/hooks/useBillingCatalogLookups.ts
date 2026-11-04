import { useEffect, useMemo, useState } from 'react';

import type {
  EncounterBillingSummary,
  PatientServiceAndProduct
} from '@/types/model-types-new';
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';

import {
  buildDiagnosticTestCodeLookup,
  buildDiagnosticTestNameLookup,
  buildMedicationCodeLookup,
  buildMedicationNameLookup,
  buildProcedureCodeLookup,
  buildProcedureNameLookup,
  buildServiceCatalog,
  collectDiagnosticTestIdsForLookup,
  collectMedicationIdsForLookup,
  collectProcedureIdsForLookup,
  collectServiceIdsForLookup,
  emptyBillingCatalogLookups,
  type BillingCatalogLookups
} from '../utils/billingAccountingUtils';

type UseBillingCatalogLookupsArgs = {
  encounterId: number | null;
  pspRows: PatientServiceAndProduct[];
};

/** Setup bulk lookups for unbilled patient_service_and_product display (name/code only). */
export const useBillingCatalogLookups = ({
  encounterId,
  pspRows
}: UseBillingCatalogLookupsArgs) => {
  const [lookups, setLookups] = useState<BillingCatalogLookups>(
    emptyBillingCatalogLookups
  );
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [fetchServicesBulk] = useLazyGetServicesBulkByIdsQuery();
  const [fetchBrandMedicationsBulk] = useLazyGetBrandMedicationsByIdsQuery();
  const [fetchDiagnosticTestsBulk] = useLazyGetDiagnosticTestsByIdsQuery();
  const [fetchProcedureById] = useLazyGetProcedureByIdQuery();

  const serviceIds = useMemo(
    () => collectServiceIdsForLookup(null, pspRows),
    [pspRows]
  );

  const medicationIds = useMemo(
    () => collectMedicationIdsForLookup(null, pspRows),
    [pspRows]
  );

  const diagnosticTestIds = useMemo(
    () => collectDiagnosticTestIdsForLookup(null, pspRows),
    [pspRows]
  );

  const procedureIds = useMemo(
    () => collectProcedureIdsForLookup(null, pspRows),
    [pspRows]
  );

  const lookupKey = useMemo(
    () =>
      [
        serviceIds.slice().sort((a, b) => a - b).join(','),
        medicationIds.slice().sort((a, b) => a - b).join(','),
        diagnosticTestIds.slice().sort((a, b) => a - b).join(','),
        procedureIds.slice().sort((a, b) => a - b).join(',')
      ].join('|'),
    [diagnosticTestIds, medicationIds, procedureIds, serviceIds]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      if (encounterId == null || !pspRows.length) {
        setLookups(emptyBillingCatalogLookups());
        setLookupsLoading(false);
        return;
      }

      setLookupsLoading(true);

      try {
        const [
          servicesResult,
          medicationsResult,
          diagnosticTestsResult,
          proceduresResult
        ] = await Promise.allSettled([
          serviceIds.length
            ? fetchServicesBulk(serviceIds, true).unwrap()
            : Promise.resolve([]),
          medicationIds.length
            ? fetchBrandMedicationsBulk({ ids: medicationIds }, true).unwrap()
            : Promise.resolve([]),
          diagnosticTestIds.length
            ? fetchDiagnosticTestsBulk({ ids: diagnosticTestIds }, true).unwrap()
            : Promise.resolve([]),
          procedureIds.length
            ? Promise.all(
                procedureIds.map(async id => {
                  try {
                    return await fetchProcedureById({ id }, true).unwrap();
                  } catch {
                    return null;
                  }
                })
              )
            : Promise.resolve([])
        ]);

        if (cancelled) {
          return;
        }

        const resolvedServices =
          servicesResult.status === 'fulfilled' ? servicesResult.value : [];
        const resolvedMedications =
          medicationsResult.status === 'fulfilled'
            ? medicationsResult.value
            : [];
        const resolvedDiagnosticTests =
          diagnosticTestsResult.status === 'fulfilled'
            ? diagnosticTestsResult.value
            : [];
        const resolvedProcedures =
          proceduresResult.status === 'fulfilled'
            ? proceduresResult.value.filter(Boolean)
            : [];

        setLookups({
          serviceCatalog: buildServiceCatalog(resolvedServices),
          medicationNames: buildMedicationNameLookup(resolvedMedications),
          medicationCodes: buildMedicationCodeLookup(resolvedMedications),
          diagnosticTestNames: buildDiagnosticTestNameLookup(
            resolvedDiagnosticTests
          ),
          diagnosticTestCodes: buildDiagnosticTestCodeLookup(
            resolvedDiagnosticTests
          ),
          procedureNames: buildProcedureNameLookup(resolvedProcedures),
          procedureCodes: buildProcedureCodeLookup(resolvedProcedures)
        });
      } catch {
        if (!cancelled) {
          setLookups(emptyBillingCatalogLookups());
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
    fetchBrandMedicationsBulk,
    fetchDiagnosticTestsBulk,
    fetchProcedureById,
    fetchServicesBulk,
    lookupKey,
    pspRows.length
  ]);

  return {
    lookups,
    lookupsLoading
  };
};
