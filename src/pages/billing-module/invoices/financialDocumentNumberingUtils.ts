import type { FinancialDocumentNumbering } from '@/types/model-types-new';

export type AdjustmentKind = 'CREDIT_NOTE' | 'DEBIT_NOTE';

export const isFinancialDocumentNumberingReady = (
  configurations: FinancialDocumentNumbering[],
  documentType: string
): boolean => {
  if (!documentType) {
    return false;
  }

  const normalizedType = String(documentType).toUpperCase();
  const config = configurations.find(
    item => String(item.documentType ?? '').toUpperCase() === normalizedType
  );

  return Boolean(config?.active) && String(config?.status ?? '').toUpperCase() === 'ACTIVE';
};

export const getFinancialDocumentNumberingConfig = (
  configurations: FinancialDocumentNumbering[],
  documentType: string
): FinancialDocumentNumbering | undefined => {
  const normalizedType = String(documentType ?? '').toUpperCase();
  return configurations.find(
    item => String(item.documentType ?? '').toUpperCase() === normalizedType
  );
};

export const resolveAdjustmentDocumentType = (kind: AdjustmentKind): string => kind;

export const numberingSetupHint = (documentType: string, documentTypeLabel?: string) => {
  const label = documentTypeLabel ?? documentType.replace(/_/g, ' ').toLowerCase();

  return `Configure an active ${label} sequence in Financial Document Numbering setup before issuing documents.`;
};
