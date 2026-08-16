import { useMemo } from 'react';

import type { EncounterBillingSummary, PatientServiceAndProduct } from '@/types/model-types-new';
import { useGetEncounterBillingSummaryQuery } from '@/services/billing/billingTransactionService';
import { useGetPatientServicesAndProductsByEncounterQuery } from '@/services/encounters/patientServicesAndProductsService';
import {
  mergeBillingChargeRows,
  type UnifiedBillingChargeRow
} from '@/pages/billing-module/accounting/utils/billingAccountingUtils';

export const useInvoicePrintLookups = (encounterId: number | null) => {
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

  const chargeRows = useMemo(
    () => mergeBillingChargeRows(billingSummary, pspRows),
    [billingSummary, pspRows]
  );

  const isReady =
    encounterId != null && !loadingBillingSummary && !loadingPsp;

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
