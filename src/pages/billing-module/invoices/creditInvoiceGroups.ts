export const CREDIT_INVOICE_SECTIONS = {
  service: 'Service',
  laboratory: 'Laboratory',
  radiology: 'Radiology',
  pathology: 'Pathology',
  procedure: 'Procedure',
  pharmacy: 'Pharmacy Medicine'
} as const;

export const CREDIT_INVOICE_GROUP_ORDER = [
  CREDIT_INVOICE_SECTIONS.service,
  CREDIT_INVOICE_SECTIONS.laboratory,
  CREDIT_INVOICE_SECTIONS.radiology,
  CREDIT_INVOICE_SECTIONS.pathology,
  CREDIT_INVOICE_SECTIONS.procedure,
  'Pharmacy Consumable',
  CREDIT_INVOICE_SECTIONS.pharmacy
];

export type CreditInvoiceGroupInput = {
  billingItemType?: string | null;
  serviceSource?: string | null;
  serviceType?: string | null;
  name?: string | null;
  code?: string | null;
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;
  brandMedicationId?: number | null;
};

const SECTION_BY_TOKEN: Record<string, string> = {
  LABORATORY: CREDIT_INVOICE_SECTIONS.laboratory,
  LAB: CREDIT_INVOICE_SECTIONS.laboratory,
  DIAGNOSTIC: CREDIT_INVOICE_SECTIONS.laboratory,
  DIAGNOSTIC_TEST: CREDIT_INVOICE_SECTIONS.laboratory,
  RADIOLOGY: CREDIT_INVOICE_SECTIONS.radiology,
  RAD: CREDIT_INVOICE_SECTIONS.radiology,
  PATHOLOGY: CREDIT_INVOICE_SECTIONS.pathology,
  PROCEDURE: CREDIT_INVOICE_SECTIONS.procedure,
  DENTAL_PROCEDURE: CREDIT_INVOICE_SECTIONS.procedure,
  MEDICATION: CREDIT_INVOICE_SECTIONS.pharmacy,
  MEDICINE: CREDIT_INVOICE_SECTIONS.pharmacy,
  PHARMACY: CREDIT_INVOICE_SECTIONS.pharmacy,
  PRESCRIPTION: CREDIT_INVOICE_SECTIONS.pharmacy,
  SERVICE: CREDIT_INVOICE_SECTIONS.service,
  SERVICES: CREDIT_INVOICE_SECTIONS.service,
  CONSULT: CREDIT_INVOICE_SECTIONS.service,
  CONSULTATION: CREDIT_INVOICE_SECTIONS.service,
  CONSULTATION_PORTAL: CREDIT_INVOICE_SECTIONS.service,
  ENCOUNTER_DEFAULT_SERVICE: CREDIT_INVOICE_SECTIONS.service,
  SERVICE_AND_PRODUCT: CREDIT_INVOICE_SECTIONS.service
};

const isSpecialty = (section: string | null | undefined) =>
  Boolean(section) &&
  section !== CREDIT_INVOICE_SECTIONS.service &&
  section !== 'Services';

const normalizeToken = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');

const sectionFromToken = (value?: string | null) => {
  const token = normalizeToken(value);
  if (!token || token === '-' || token === 'UNDEFINED' || token === 'BILLING_ENGINE') {
    return null;
  }

  const exact = SECTION_BY_TOKEN[token];
  if (exact) {
    return exact;
  }

  if (token.includes('LABORATORY')) return CREDIT_INVOICE_SECTIONS.laboratory;
  if (token.includes('RADIOLOGY')) return CREDIT_INVOICE_SECTIONS.radiology;
  if (token.includes('PATHOLOGY')) return CREDIT_INVOICE_SECTIONS.pathology;
  if (token.includes('PROCEDURE')) return CREDIT_INVOICE_SECTIONS.procedure;
  if (
    token.includes('MEDICATION') ||
    token.includes('MEDICINE') ||
    token.includes('PHARMACY')
  ) {
    return CREDIT_INVOICE_SECTIONS.pharmacy;
  }
  if (token.includes('DIAGNOSTIC')) return CREDIT_INVOICE_SECTIONS.laboratory;
  if (token.includes('CONSULT') || token === 'SERVICE') return CREDIT_INVOICE_SECTIONS.service;

  return null;
};

const positiveId = (value?: number | null) => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const sectionFromCode = (code?: string | null) => {
  const compact = String(code ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!compact) {
    return null;
  }
  if (compact.startsWith('585')) {
    return CREDIT_INVOICE_SECTIONS.radiology;
  }
  if (/^73[012]/.test(compact)) {
    return CREDIT_INVOICE_SECTIONS.laboratory;
  }

  return null;
};

const sectionFromName = (name?: string | null) => {
  const label = String(name ?? '').toLowerCase();
  if (!label) {
    return null;
  }

  if (/radiolog|radiograph|x-?ray|\bmri\b|ct scan/.test(label)) {
    return CREDIT_INVOICE_SECTIONS.radiology;
  }
  if (label.includes('patholog')) {
    return CREDIT_INVOICE_SECTIONS.pathology;
  }
  if (
    /laboratory|measurement of|blood count|\bcbc\b|creatinine|aminotransferase|amino transferase|alanine|aspartate|h[ae]emoglobin|triglyceride|cholesterol|ferritin|fasting blood|hba1c|\bfbs\b|\btsh\b|thyroid stimulating/.test(
      label
    )
  ) {
    return CREDIT_INVOICE_SECTIONS.laboratory;
  }

  return null;
};

const firstSpecialty = (...sections: Array<string | null>) =>
  sections.find(isSpecialty) ?? null;

/**
 * Section header for the detailed credit invoice.
 * The service type shown on the standard invoice is the section header.
 * Other signals are used only when that type is missing.
 */
export const classifyCreditInvoiceGroup = (input: CreditInvoiceGroupInput = {}) => {
  const fromServiceType = sectionFromToken(input.serviceType);
  if (isSpecialty(fromServiceType)) {
    return fromServiceType;
  }

  const rawServiceType = String(input.serviceType ?? '').trim();
  if (
    rawServiceType &&
    rawServiceType !== '-' &&
    rawServiceType.toUpperCase() !== 'UNDEFINED' &&
    !fromServiceType
  ) {
    return rawServiceType;
  }

  const fromType = firstSpecialty(
    sectionFromToken(input.billingItemType),
    sectionFromToken(input.serviceSource)
  );
  if (fromType) {
    return fromType;
  }

  if (positiveId(input.diagnosticTestId) != null) {
    return (
      sectionFromName(input.name) === CREDIT_INVOICE_SECTIONS.radiology ||
      sectionFromCode(input.code) === CREDIT_INVOICE_SECTIONS.radiology
        ? CREDIT_INVOICE_SECTIONS.radiology
        : CREDIT_INVOICE_SECTIONS.laboratory
    );
  }
  if (positiveId(input.procedureId) != null) {
    return CREDIT_INVOICE_SECTIONS.procedure;
  }
  if (positiveId(input.brandMedicationId) != null) {
    return CREDIT_INVOICE_SECTIONS.pharmacy;
  }

  return (
    sectionFromCode(input.code) ||
    sectionFromName(input.name) ||
    fromServiceType ||
    sectionFromToken(input.billingItemType) ||
    sectionFromToken(input.serviceSource) ||
    (positiveId(input.serviceId) != null ? CREDIT_INVOICE_SECTIONS.service : null) ||
    CREDIT_INVOICE_SECTIONS.service
  );
};
