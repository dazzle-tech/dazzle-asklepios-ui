import { useEffect, useMemo, useState } from 'react';

import { useGetPatientFinancialDocumentsQuery } from '@/services/billing/invoiceGenerationService';
import { useLazyGetInvoiceAdjustmentsQuery } from '@/services/billing/financialDocumentAdjustmentService';
import { useGetPatientLedgerSummaryQuery } from '@/services/encounters/patientPaymentsService';

import {
  computePatientRemainingBalance,
  resolvePatientWalletAvailable,
  resolvePatientWalletReserved
} from '../utils/billingAccountingUtils';

const isPatientInvoice = (document: {
  documentType?: string;
  documentSubtype?: string;
  status?: string;
}) =>
  document.documentType === 'INVOICE' &&
  (document.documentSubtype === 'PATIENT' || document.documentSubtype == null) &&
  document.status !== 'CANCELLED';

export const usePatientRemainingBalance = (patientId: number | null | undefined) => {
  const {
    currentData: ledgerSummary,
    isLoading: loadingLedgerInitial,
    refetch: refetchLedgerSummary
  } = useGetPatientLedgerSummaryQuery(
    { patientId: patientId as number },
    { skip: patientId == null, refetchOnMountOrArgChange: true }
  );

  const {
    data: financialDocuments = [],
    isFetching: loadingDocuments,
    refetch: refetchFinancialDocuments
  } = useGetPatientFinancialDocumentsQuery(patientId as number, {
    skip: patientId == null
  });

  const [fetchInvoiceAdjustments] = useLazyGetInvoiceAdjustmentsQuery();
  const [invoiceOutstandingTotal, setInvoiceOutstandingTotal] = useState(0);
  const [loadingInvoiceOutstanding, setLoadingInvoiceOutstanding] = useState(false);

  const patientInvoices = useMemo(
    () => financialDocuments.filter(isPatientInvoice),
    [financialDocuments]
  );

  const invoiceIdsKey = useMemo(
    () =>
      patientInvoices
        .map(invoice => invoice.id)
        .sort((first, second) => first - second)
        .join(','),
    [patientInvoices]
  );

  useEffect(() => {
    if (patientId == null || invoiceIdsKey.length === 0) {
      setInvoiceOutstandingTotal(0);
      setLoadingInvoiceOutstanding(false);
      return;
    }

    let cancelled = false;
    setLoadingInvoiceOutstanding(true);

    Promise.all(
      patientInvoices.map(invoice =>
        fetchInvoiceAdjustments(invoice.id)
          .unwrap()
          .catch(() => null)
      )
    )
      .then(results => {
        if (cancelled) {
          return;
        }

        const total = results.reduce(
          (sum, summary) => sum + Number(summary?.outstandingBalance ?? 0),
          0
        );
        setInvoiceOutstandingTotal(total);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInvoiceOutstanding(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, invoiceIdsKey, patientInvoices, fetchInvoiceAdjustments, ledgerSummary?.totalDebt]);

  const remainingBalance = computePatientRemainingBalance(
    ledgerSummary,
    invoiceOutstandingTotal
  );

  const walletAvailable = resolvePatientWalletAvailable(ledgerSummary);
  const walletReserved = resolvePatientWalletReserved(ledgerSummary);
  const walletConsumed = Number(ledgerSummary?.consumedAmount ?? 0);

  const refreshBalance = async () => {
    await Promise.all([refetchLedgerSummary(), refetchFinancialDocuments()]);
  };

  return {
    ledgerSummary,
    walletAvailable,
    walletReserved,
    walletConsumed,
    invoiceOutstandingTotal,
    remainingBalance,
    loadingBalance:
      (patientId != null &&
        loadingLedgerInitial &&
        ledgerSummary == null) ||
      loadingDocuments ||
      loadingInvoiceOutstanding,
    refreshBalance
  };
};
