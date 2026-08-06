import { useMemo } from 'react';

import type { EncounterBillingSummary, PatientServiceAndProduct } from '@/types/model-types-new';
import { useGetEncounterBillingSummaryQuery } from '@/services/billing/billingTransactionService';
import { useGetPatientServicesAndProductsByEncounterQuery } from '@/services/encounters/patientServicesAndProductsService';
import {
  mergeBillingChargeRows,
  type UnifiedBillingChargeRow
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { useBillingCatalogLookups } from '@/pages/billing-module/accounting/hooks/useBillingCatalogLookups';

export const useInvoicePrintLookups = (
  encounterId: number | null,
  departmentId?: number | null
) => {
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

  const { lookups, lookupsLoading } = useBillingCatalogLookups({
    encounterId,
    summary: billingSummary,
    pspRows,
    departmentId
  });

  const chargeRows = useMemo(
    () => mergeBillingChargeRows(billingSummary, pspRows, lookups),
    [billingSummary, lookups, pspRows]
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
