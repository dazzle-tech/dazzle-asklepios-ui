import { useMemo } from 'react';

import { useEnumByName, useEnumOptions } from '@/services/enumsApi';

export const FINANCIAL_DOCUMENT_TYPE_ENUM = 'FinancialDocumentType';

export function useFinancialDocumentTypeOptions() {
  return useEnumOptions(FINANCIAL_DOCUMENT_TYPE_ENUM);
}

export function useFinancialDocumentTypes() {
  const values = useEnumByName(FINANCIAL_DOCUMENT_TYPE_ENUM);
  const options = useFinancialDocumentTypeOptions();

  return useMemo(() => {
    const resolve = (documentType: string) =>
      values.find(value => value.toUpperCase() === documentType.toUpperCase()) ?? '';

    const labelFor = (documentType: string) =>
      options.find(option => option.value.toUpperCase() === documentType.toUpperCase())
        ?.label ?? documentType.replace(/_/g, ' ').toLowerCase();

    return {
      values,
      options,
      resolve,
      labelFor,
      invoice: resolve('INVOICE'),
      creditNote: resolve('CREDIT_NOTE'),
      debitNote: resolve('DEBIT_NOTE'),
      receipt: resolve('RECEIPT'),
      payment: resolve('PAYMENT')
    };
  }, [options, values]);
}
