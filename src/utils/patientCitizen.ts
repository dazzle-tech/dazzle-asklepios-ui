export const isCitizenFromDocumentType = (documentType?: string | null): boolean =>
  String(documentType ?? '').trim().toUpperCase() === 'NATIONAL_ID';
