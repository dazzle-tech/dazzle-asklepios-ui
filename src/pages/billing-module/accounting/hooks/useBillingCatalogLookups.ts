import { useEffect, useMemo, useState } from 'react';

import type {
  EncounterBillingSummary,
  PatientServiceAndProduct
} from '@/types/model-types-new';
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import {
  useLazyGetServicesBulkByIdsQuery,
  useLazyGetServicesByDepartmentQuery
} from '@/services/setup/serviceService';

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
  mergeServiceCatalogs,
  type BillingCatalogLookups
} from '../utils/billingAccountingUtils';

type UseBillingCatalogLookupsArgs = {
  encounterId: number | null;
  summary: EncounterBillingSummary | null | undefined;
  pspRows: PatientServiceAndProduct[];
  departmentId?: number | null;
};

export const useBillingCatalogLookups = ({
  encounterId,
  summary,
  pspRows,
  departmentId = null
}: UseBillingCatalogLookupsArgs) => {
  const [lookups, setLookups] = useState<BillingCatalogLookups>(
    emptyBillingCatalogLookups
  );
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const [fetchServicesBulk] = useLazyGetServicesBulkByIdsQuery();
  const [fetchBrandMedicationsBulk] = useLazyGetBrandMedicationsByIdsQuery();
  const [fetchDiagnosticTestsBulk] = useLazyGetDiagnosticTestsByIdsQuery();
  const [fetchProcedureById] = useLazyGetProcedureByIdQuery();
  const [fetchDepartmentServices] = useLazyGetServicesByDepartmentQuery();

  const serviceIds = useMemo(
    () => collectServiceIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const medicationIds = useMemo(
    () => collectMedicationIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const diagnosticTestIds = useMemo(
    () => collectDiagnosticTestIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const procedureIds = useMemo(
    () => collectProcedureIdsForLookup(summary, pspRows),
    [summary, pspRows]
  );

  const lookupKey = useMemo(
    () =>
      [
        serviceIds.slice().sort((a, b) => a - b).join(','),
        medicationIds.slice().sort((a, b) => a - b).join(','),
        diagnosticTestIds.slice().sort((a, b) => a - b).join(','),
        procedureIds.slice().sort((a, b) => a - b).join(','),
        departmentId ?? ''
      ].join('|'),
    [departmentId, diagnosticTestIds, medicationIds, procedureIds, serviceIds]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      if (encounterId == null) {
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
          proceduresResult,
          departmentResult
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
        const resolvedDepartment =
          departmentResult.status === 'fulfilled' ? departmentResult.value : null;

        setLookups({
          serviceCatalog: mergeServiceCatalogs(
            buildServiceCatalog(resolvedDepartment),
            buildServiceCatalog(resolvedServices)
          ),
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
    departmentId,
    encounterId,
    fetchBrandMedicationsBulk,
    fetchDepartmentServices,
    fetchDiagnosticTestsBulk,
    fetchProcedureById,
    fetchServicesBulk,
    lookupKey
  ]);

  return {
    lookups,
    lookupsLoading
  };
};
