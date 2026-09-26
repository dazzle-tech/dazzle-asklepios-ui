import type { InvoiceLineItem } from '@/services/billing/financialDocumentAdjustmentService';
import type {
  BillingEligibilitySnapshot,
  EncounterInvoiceDetails,
  PatientFinancialInvoice
} from '@/services/billing/invoiceGenerationService';
import type {
  EncounterBillingItemSummary,
  PatientInsurance,
  PatientServiceAndProduct
} from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

import type {
  FacilityPrintInfo,
  InvoicePrintData,
  InvoicePrintLineItem
} from './invoicePrintUtils';
import type { InvoicePrintChargeContext } from './useInvoicePrintLookups';
import { buildInvoicePrintDataFromIssuedInvoice } from './invoicePrintUtils';

export type InsuranceCreditPrintLine = {
  serviceDate: string;
  code: string;
  description: string;
  quantityLabel: string;
  unitPrice: number;
  gross: number;
  discount: number;
  netBeforeVat: number;
  subtotalInclVat: number;
  vatPercent: number;
  vatAmount: number;
  patientAmount: number;
  sponsorAmount: number;
  /** Checkout Type label used for section grouping (Service / Laboratory / …). */
  groupTitle: string;
};

export type InsuranceCreditPrintGroup = {
  title: string;
  lines: InsuranceCreditPrintLine[];
};

export type InsuranceCreditPrintData = {
  facilityName: string;
  fileNo: string;
  patientName: string;
  patientNameAr: string;
  sex: string;
  doctor: string;
  nationality: string;
  nationalId: string;
  contact: string;
  companyVatNo: string;
  companyAddress: string;
  invoiceNo: string;
  invoiceIssueDate: string;
  invoiceIssueTime: string;
  tpa: string;
  insuranceCorp: string;
  policyNo: string;
  expiryDate: string;
  claimFormNo: string;
  episodeNo: string;
  sellerId: string;
  groups: InsuranceCreditPrintGroup[];
  /** Flat fallback used when grouping is empty. */
  lines: InsuranceCreditPrintLine[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const GROUP_ORDER = [
  'Service',
  'Services',
  'Laboratory',
  'Radiology',
  'Pathology',
  'Procedure',
  'Pharmacy Consumable',
  'Pharmacy Medicine'
];

type ChargeTypeRef = {
  billingItemType?: string | null;
  source?: string | null;
};

type GroupHints = {
  diagnosticTestId?: number | null;
  serviceId?: number | null;
  procedureId?: number | null;
  brandMedicationId?: number | null;
};

const readBillingItemType = (...values: Array<unknown>) => {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text || text === '-' || text.toUpperCase() === 'UNDEFINED') continue;
      return text;
    }
    if (typeof value === 'object' && value && 'name' in (value as object)) {
      const named = String((value as { name?: unknown }).name ?? '').trim();
      if (named && named !== '-') return named;
    }
  }
  return null;
};

const readServiceSource = (...values: Array<unknown>) => {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (!text || text === '-') continue;
    if (text.toUpperCase() === 'BILLING_ENGINE') continue;
    return text;
  }
  return null;
};

/** Map raw Checkout Type / Source to the section header shown on the credit invoice. */
const titleFromCheckoutType = (raw?: string | null) => {
  const type = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (!type || type === '-' || type === 'UNDEFINED') return null;
  if (type === 'LABORATORY' || type.includes('LABORATORY')) return 'Laboratory';
  if (type === 'RADIOLOGY' || type.includes('RADIOLOGY')) return 'Radiology';
  if (type === 'PATHOLOGY' || type.includes('PATHOLOGY')) return 'Pathology';
  if (type === 'PROCEDURE' || type.includes('PROCEDURE')) return 'Procedure';
  if (
    type === 'MEDICATION' ||
    type.includes('MEDICATION') ||
    type.includes('MEDICINE') ||
    type.includes('PHARMACY')
  ) {
    return 'Pharmacy Medicine';
  }
  if (type.includes('DIAGNOSTIC')) return 'Laboratory';
  if (type === 'SERVICE' || type === 'CONSULTATION' || type.includes('CONSULT')) {
    return 'Service';
  }
  // Already-formatted labels from print utils ("Laboratory", "Service", …)
  if (type === 'LABORATORY' || raw === 'Laboratory') return 'Laboratory';
  if (raw === 'Service' || raw === 'Services') return 'Service';
  return null;
};

const titleFromCheckoutSource = (raw?: string | null) => {
  const source = String(raw ?? '').trim().toUpperCase();
  if (!source || source === 'BILLING_ENGINE') return null;
  if (source === 'LABORATORY') return 'Laboratory';
  if (source === 'RADIOLOGY') return 'Radiology';
  if (source === 'PATHOLOGY') return 'Pathology';
  if (source === 'PROCEDURE' || source === 'DENTAL_PROCEDURE') return 'Procedure';
  if (source === 'PRESCRIPTION') return 'Pharmacy Medicine';
  if (
    source === 'ENCOUNTER_DEFAULT_SERVICE' ||
    source === 'CONSULTATION_PORTAL' ||
    source === 'SERVICE_AND_PRODUCT'
  ) {
    return 'Service';
  }
  return null;
};

const titleFromNameOrCode = (name?: string | null, code?: string | null) => {
  const label = String(name ?? '').toLowerCase();
  const codeText = String(code ?? '').toUpperCase();

  if (
    label.includes('radiolog') ||
    label.includes('radiograph') ||
    label.includes('x-ray') ||
    label.includes('xray') ||
    label.includes('ct scan') ||
    label.includes('mri') ||
    codeText.startsWith('585')
  ) {
    return 'Radiology';
  }

  if (
    label.includes('laboratory') ||
    label.includes('measurement of') ||
    label.includes('blood count') ||
    label.includes('(cbc)') ||
    label.includes(' cbc') ||
    label.includes('creatinine') ||
    label.includes('amino transferase') ||
    label.includes('alanine') ||
    label.includes('aspartate') ||
    label.includes('hemoglobin') ||
    label.includes('haemoglobin') ||
    label.includes('patholog') ||
    codeText.startsWith('730') ||
    codeText.startsWith('731')
  ) {
    return label.includes('patholog') ? 'Pathology' : 'Laboratory';
  }

  return null;
};

/**
 * Group titles follow the same Type / Source classification shown in
 * Checkout & settlement (BillingChargesTable Type column).
 */
const groupTitleFor = (
  billingItemType?: string | null,
  serviceSource?: string | null,
  name?: string | null,
  serviceType?: string | null,
  hints?: GroupHints,
  code?: string | null
) => {
  // 1) Exact Checkout Type
  const fromType =
    titleFromCheckoutType(billingItemType) || titleFromCheckoutType(serviceType);
  // Specialty types always win
  if (
    fromType &&
    fromType !== 'Service' &&
    fromType !== 'Services'
  ) {
    return fromType;
  }

  // 2) Checkout Source (Lab source wins even if Type was Service)
  const fromSource = titleFromCheckoutSource(serviceSource);
  if (fromSource && fromSource !== 'Service') {
    return fromSource;
  }

  // 3) PSP identity hints
  if (hints?.diagnosticTestId != null) {
    return titleFromNameOrCode(name, code) === 'Radiology' ? 'Radiology' : 'Laboratory';
  }
  if (hints?.procedureId != null) return 'Procedure';
  if (hints?.brandMedicationId != null) return 'Pharmacy Medicine';

  // 4) Name / code heuristics (covers SERVICE-typed lab & rad lines)
  const fromName = titleFromNameOrCode(name, code);
  if (fromName) return fromName;

  // 5) Generic service
  if (fromType === 'Service' || fromSource === 'Service' || hints?.serviceId != null) {
    return 'Service';
  }

  return 'Service';
};

/**
 * Public classifier used when building and when rendering the credit invoice.
 */
export const classifyInsuranceCreditGroupTitle = (
  billingItemType?: string | null,
  serviceSource?: string | null,
  name?: string | null,
  serviceType?: string | null,
  hints?: GroupHints,
  code?: string | null
) => groupTitleFor(billingItemType, serviceSource, name, serviceType, hints, code);

const buildChargeTypeIndex = (chargeRows?: Array<{
  chargeLineId?: number | null;
  patientServiceProductId?: number | null;
  itemCode?: string | null;
  billingItemType?: string | null;
  source?: string | null;
}> | null) => {
  const byChargeLineId = new Map<number, ChargeTypeRef>();
  const byPspId = new Map<number, ChargeTypeRef>();
  const byCode = new Map<string, ChargeTypeRef>();

  (chargeRows ?? []).forEach(row => {
    const ref: ChargeTypeRef = {
      billingItemType: row.billingItemType,
      source: row.source
    };
    if (row.chargeLineId != null) {
      byChargeLineId.set(Number(row.chargeLineId), ref);
    }
    if (row.patientServiceProductId != null) {
      byPspId.set(Number(row.patientServiceProductId), ref);
    }
    const code = String(row.itemCode ?? '').trim().toUpperCase();
    if (code) {
      byCode.set(code, ref);
    }
  });

  return { byChargeLineId, byPspId, byCode };
};

const resolveChargeTypeRef = (
  index: ReturnType<typeof buildChargeTypeIndex>,
  {
    chargeLineId,
    patientServiceProductId,
    code
  }: {
    chargeLineId?: number | null;
    patientServiceProductId?: number | null;
    code?: string | null;
  }
) => {
  if (chargeLineId != null && index.byChargeLineId.has(Number(chargeLineId))) {
    return index.byChargeLineId.get(Number(chargeLineId));
  }
  if (
    patientServiceProductId != null &&
    index.byPspId.has(Number(patientServiceProductId))
  ) {
    return index.byPspId.get(Number(patientServiceProductId));
  }
  const normalizedCode = String(code ?? '').trim().toUpperCase();
  if (normalizedCode && index.byCode.has(normalizedCode)) {
    return index.byCode.get(normalizedCode);
  }
  return undefined;
};

const money = (value?: number | null) => Number(value ?? 0);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const parseDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatServiceDate = (value?: string | Date | null) => {
  const date = parseDate(value);
  if (!date) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const formatIssueDate = (value?: string | Date | null) => {
  const date = parseDate(value);
  if (!date) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatIssueTime = (value?: string | Date | null) => {
  const date = parseDate(value);
  if (!date) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const formatExpiryDate = (value?: string | Date | null) => {
  if (!value) {
    return '';
  }

  const date = parseDate(value);
  if (!date) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const datePart = `${day}-${month}-${date.getFullYear()}`;
  const raw = String(value);
  const hasTime = raw.includes('T') || /\d{1,2}:\d{2}/.test(raw);
  if (!hasTime) {
    return datePart;
  }

  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const time = `${String(hours12).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${suffix}`;
  return `${datePart} ${time}`;
};

const formatQuantity = (quantity?: number | null) =>
  money(quantity || 1).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatSex = (patient?: any) => {
  const raw = String(patient?.sexAtBirth ?? patient?.gender ?? patient?.genderLkey ?? '')
    .trim()
    .toUpperCase();

  if (!raw) {
    return '';
  }
  if (raw === 'M' || raw === 'MALE') {
    return 'Male';
  }
  if (raw === 'F' || raw === 'FEMALE') {
    return 'Female';
  }

  return formatEnumString(raw) || raw;
};

const formatPersonName = (patient?: any, fallback?: string | null) => {
  const composed = [patient?.firstName, patient?.secondName, patient?.thirdName, patient?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return composed || patient?.fullName || patient?.name || fallback || '';
};

const formatArabicName = (patient?: any) =>
  [
    patient?.firstNameSecondaryLang,
    patient?.secondNameSecondaryLang,
    patient?.thirdNameSecondaryLang,
    patient?.lastNameSecondaryLang
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

const displayText = (value?: string | number | null) => {
  const text = String(value ?? '').trim();
  return text && text !== '-' ? text : '';
};

/** Formats enum-like tokens (e.g. SAUDI_ARABIA → Saudi Arabia) inside an address. */
const formatFacilityAddress = (value?: string | null) => {
  const text = displayText(value);
  if (!text) {
    return '';
  }

  return text
    .split(',')
    .map(part => {
      const trimmed = part.trim();
      if (!trimmed) {
        return '';
      }
      if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(trimmed)) {
        return formatEnumString(trimmed);
      }
      return trimmed;
    })
    .filter(Boolean)
    .join(', ');
};

const vatPercent = (vatAmount: number, netBeforeVat: number) => {
  if (vatAmount <= 0 || netBeforeVat <= 0) {
    return 0;
  }

  const percent = (vatAmount / netBeforeVat) * 100;
  const rounded = Math.round(percent * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return Math.round(rounded);
  }

  return rounded;
};

const buildLine = ({
  serviceDate,
  code,
  description,
  quantity,
  unitPrice,
  gross,
  discount,
  vatAmount,
  patientAmount,
  sponsorAmount
}: {
  serviceDate?: string | Date | null;
  code?: string | null;
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  gross?: number | null;
  discount?: number | null;
  vatAmount?: number | null;
  patientAmount?: number | null;
  sponsorAmount?: number | null;
}): InsuranceCreditPrintLine => {
  const safeQuantity = money(quantity) > 0 ? money(quantity) : 1;
  const safeGross = roundMoney(money(gross) || money(unitPrice) * safeQuantity);
  const safeDiscount = roundMoney(money(discount));
  const netBeforeVat = roundMoney(Math.max(0, safeGross - safeDiscount));
  const safeVat = roundMoney(money(vatAmount));
  const safeUnitPrice = roundMoney(
    money(unitPrice) || (safeQuantity > 0 ? safeGross / safeQuantity : 0)
  );

  return {
    serviceDate: formatServiceDate(serviceDate),
    code: displayText(code),
    description: displayText(description) || '-',
    quantityLabel: formatQuantity(safeQuantity),
    unitPrice: safeUnitPrice,
    gross: safeGross,
    discount: safeDiscount,
    netBeforeVat,
    subtotalInclVat: roundMoney(netBeforeVat + safeVat),
    vatPercent: vatPercent(safeVat, netBeforeVat),
    vatAmount: safeVat,
    patientAmount: roundMoney(money(patientAmount)),
    sponsorAmount: roundMoney(money(sponsorAmount)),
    groupTitle: 'Service'
  };
};

const withGroupTitle = (
  line: InsuranceCreditPrintLine,
  title: string
): InsuranceCreditPrintLine => ({
  ...line,
  groupTitle: title || line.groupTitle || 'Service'
});

const sumLines = (lines?: Array<InsuranceCreditPrintLine | null | undefined> | null) =>
  (lines ?? [])
    .filter((line): line is InsuranceCreditPrintLine => line != null)
    .reduce(
      (totals, line) => ({
        gross: totals.gross + money(line.gross),
        discount: totals.discount + money(line.discount),
        netBeforeVat: totals.netBeforeVat + money(line.netBeforeVat),
        subtotalInclVat: totals.subtotalInclVat + money(line.subtotalInclVat),
        vatAmount: totals.vatAmount + money(line.vatAmount),
        patientAmount: totals.patientAmount + money(line.patientAmount),
        sponsorAmount: totals.sponsorAmount + money(line.sponsorAmount)
      }),
      {
        gross: 0,
        discount: 0,
        netBeforeVat: 0,
        subtotalInclVat: 0,
        vatAmount: 0,
        patientAmount: 0,
        sponsorAmount: 0
      }
    );

export const sumInsuranceCreditLines = sumLines;

const groupLines = (entries: Array<{ title: string; line: InsuranceCreditPrintLine }>) => {
  const grouped = new Map<string, InsuranceCreditPrintLine[]>();

  entries.forEach(entry => {
    if (entry?.line == null) {
      return;
    }

    const title = entry.title || 'Service';
    const current = grouped.get(title) ?? [];
    current.push(entry.line);
    grouped.set(title, current);
  });

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      const leftIndex = GROUP_ORDER.indexOf(left);
      const rightIndex = GROUP_ORDER.indexOf(right);
      return (
        (leftIndex === -1 ? GROUP_ORDER.length : leftIndex) -
        (rightIndex === -1 ? GROUP_ORDER.length : rightIndex)
      );
    })
    .map(([title, lines]) => ({ title, lines }));
};

const insuranceCompanyLabel = (
  insurance?: PatientInsurance | null,
  eligibility?: BillingEligibilitySnapshot | null,
  fallbackCompany?: string | null
) => {
  const payer =
    displayText(insurance?.payerName) ||
    displayText(eligibility?.policyHolder) ||
    displayText(fallbackCompany);
  const network =
    displayText(eligibility?.network) ||
    displayText(eligibility?.policyClassName) ||
    displayText(insurance?.policyClassName);

  if (!payer) {
    return network;
  }
  if (!network || payer.toLowerCase().includes(network.toLowerCase())) {
    return payer;
  }

  return `${payer} - ${network}`;
};

const normalizeList = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) {
    return raw.filter(Boolean) as T[];
  }
  if (raw && typeof raw === 'object') {
    const maybeData = (raw as { data?: unknown; items?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData.filter(Boolean) as T[];
    }
    const maybeItems = (raw as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems.filter(Boolean) as T[];
    }
  }
  return [];
};

const SKIPPED_BILLING_STATUSES = new Set([
  'CANCELLED',
  'CANCELED',
  'REVERSED',
  'VOID',
  'DELETED'
]);

const creditLinesFromBillingItems = (
  items: EncounterBillingItemSummary[],
  pspRows: PatientServiceAndProduct[],
  fallbackDate?: string | null,
  chargeRows?: Array<{
    chargeLineId?: number | null;
    patientServiceProductId?: number | null;
    itemCode?: string | null;
    billingItemType?: string | null;
    source?: string | null;
  }> | null
) => {
  const pspById = new Map(pspRows.map(row => [Number(row.id), row]));
  const chargeIndex = buildChargeTypeIndex(chargeRows);

  return items
    .filter(item => !SKIPPED_BILLING_STATUSES.has(String(item.status ?? '').toUpperCase()))
    .map(item => {
      const psp =
        item.patientServiceProductId != null
          ? pspById.get(Number(item.patientServiceProductId))
          : undefined;
      const description = item.itemName || item.itemDescription || psp?.itemName || '-';
      const code = item.priceListItemCode || item.itemCode || psp?.itemCode;
      const chargeRef = resolveChargeTypeRef(chargeIndex, {
        chargeLineId: item.chargeLineId,
        patientServiceProductId: item.patientServiceProductId,
        code
      });
      const itemAny = item as EncounterBillingItemSummary & {
        billing_item_type?: string | null;
        service_source?: string | null;
      };
      const quantity = money(item.quantity) > 0 ? money(item.quantity) : 1;
      const gross = money(item.grossAmount) || money(item.unitPrice) * quantity;
      const discount = money(item.discountAmount);
      const vatAmount = money(item.taxAmount);
      const patientAmount = money(item.patientResponsibilityAmount);
      const sponsorAmount = money(item.insuranceResponsibilityAmount);
      const fallbackPatient =
        patientAmount <= 0 && sponsorAmount <= 0 ? money(item.netAmount) : patientAmount;

      const title = groupTitleFor(
        readBillingItemType(
          chargeRef?.billingItemType,
          item.billingItemType,
          itemAny.billing_item_type,
          psp?.billingItemType
        ),
        readServiceSource(
          chargeRef?.source,
          psp?.serviceSource,
          item.serviceSource,
          itemAny.service_source
        ),
        description,
        null,
        {
          diagnosticTestId: psp?.diagnosticTestId,
          serviceId: psp?.serviceId,
          procedureId: psp?.procedureId,
          brandMedicationId: psp?.brandMedicationId
        },
        code
      );

      return {
        title,
        line: withGroupTitle(
          buildLine({
            serviceDate: item.chargedAt || psp?.createdDate || fallbackDate,
            code,
            description,
            quantity,
            unitPrice: money(item.unitPrice) || (quantity > 0 ? gross / quantity : 0),
            gross,
            discount,
            vatAmount,
            patientAmount: fallbackPatient,
            sponsorAmount
          }),
          title
        )
      };
    });
};

const creditLineFromPrintItem = (
  item: InvoicePrintLineItem,
  billingItem?: EncounterBillingItemSummary | null,
  serviceDate?: string | null
): InsuranceCreditPrintLine => {
  const taxRate = item.appliedTaxes?.find(tax => tax.rate != null)?.rate;
  const patientAmount =
    money(billingItem?.patientResponsibilityAmount) || money(item.patientShare);
  const sponsorAmount =
    money(billingItem?.insuranceResponsibilityAmount) ||
    money(item.insuranceShare) ||
    (patientAmount > 0 ? 0 : money(item.amount));

  const line = buildLine({
    serviceDate: billingItem?.chargedAt || serviceDate,
    code: item.serviceCode || billingItem?.priceListItemCode || billingItem?.itemCode,
    description: item.serviceName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    gross:
      money(billingItem?.grossAmount) ||
      money(item.grossAmount) ||
      money(item.unitPrice) * money(item.quantity),
    discount: money(billingItem?.discountAmount) || money(item.discountAmount),
    vatAmount: money(billingItem?.taxAmount) || money(item.taxAmount),
    patientAmount,
    sponsorAmount
  });

  if (taxRate != null && Number(taxRate) > 0) {
    line.vatPercent = Number(taxRate);
  }

  return line;
};

const creditLinesFromPrintItems = (
  items: InvoicePrintLineItem[],
  billingItems: EncounterBillingItemSummary[],
  serviceDate?: string | null,
  chargeRows?: Array<{
    chargeLineId?: number | null;
    patientServiceProductId?: number | null;
    itemCode?: string | null;
    billingItemType?: string | null;
    source?: string | null;
  }> | null
) => {
  const byCode = new Map(
    billingItems
      .filter(item => displayText(item.priceListItemCode || item.itemCode))
      .map(item => [String(item.priceListItemCode || item.itemCode).trim().toUpperCase(), item])
  );
  const byName = new Map(
    billingItems
      .filter(item => displayText(item.itemName))
      .map(item => [String(item.itemName).trim().toLowerCase(), item])
  );
  const chargeIndex = buildChargeTypeIndex(chargeRows);

  return items.filter(Boolean).map(item => {
    const billingItem =
      (displayText(item.serviceCode)
        ? byCode.get(String(item.serviceCode).trim().toUpperCase())
        : undefined) ??
      (displayText(item.serviceName)
        ? byName.get(String(item.serviceName).trim().toLowerCase())
        : undefined);
    const chargeRef = resolveChargeTypeRef(chargeIndex, {
      chargeLineId: billingItem?.chargeLineId,
      patientServiceProductId: billingItem?.patientServiceProductId,
      code: item.serviceCode || billingItem?.priceListItemCode || billingItem?.itemCode
    });

    const title = groupTitleFor(
      readBillingItemType(
        chargeRef?.billingItemType,
        billingItem?.billingItemType,
        item.serviceType
      ),
      readServiceSource(chargeRef?.source, billingItem?.serviceSource),
      item.serviceName,
      item.serviceType,
      undefined,
      item.serviceCode || billingItem?.priceListItemCode || billingItem?.itemCode
    );

    return {
      title,
      line: withGroupTitle(creditLineFromPrintItem(item, billingItem, serviceDate), title)
    };
  });
};

const creditLinesFromInvoiceItems = (
  items: InvoiceLineItem[],
  billingItems: EncounterBillingItemSummary[],
  pspRows: PatientServiceAndProduct[],
  fallbackDate?: string | null,
  chargeRows?: Array<{
    chargeLineId?: number | null;
    patientServiceProductId?: number | null;
    itemCode?: string | null;
    billingItemType?: string | null;
    source?: string | null;
  }> | null
) => {
  const billingByChargeLine = new Map(
    billingItems
      .filter(item => item?.chargeLineId != null)
      .map(item => [Number(item.chargeLineId), item])
  );
  const billingByPsp = new Map(
    billingItems
      .filter(item => item?.patientServiceProductId != null)
      .map(item => [Number(item.patientServiceProductId), item])
  );
  const pspById = new Map(pspRows.map(row => [Number(row.id), row]));
  const chargeIndex = buildChargeTypeIndex(chargeRows);

  return items.map(item => {
    const billingItem =
      (item.chargeLineId != null ? billingByChargeLine.get(Number(item.chargeLineId)) : undefined) ??
      (item.patientServiceProductId != null
        ? billingByPsp.get(Number(item.patientServiceProductId))
        : undefined);
    const psp =
      item.patientServiceProductId != null
        ? pspById.get(Number(item.patientServiceProductId))
        : undefined;

    const description =
      item.itemDescription ||
      billingItem?.itemName ||
      billingItem?.itemDescription ||
      psp?.itemName ||
      item.itemCode ||
      '-';
    const code =
      billingItem?.priceListItemCode ||
      item.itemCode ||
      billingItem?.itemCode ||
      psp?.itemCode;
    const chargeRef = resolveChargeTypeRef(chargeIndex, {
      chargeLineId: item.chargeLineId ?? billingItem?.chargeLineId,
      patientServiceProductId:
        item.patientServiceProductId ?? billingItem?.patientServiceProductId,
      code
    });
    const quantity = money(item.quantity) > 0 ? money(item.quantity) : money(billingItem?.quantity) || 1;
    const gross =
      money(item.grossAmount) ||
      money(billingItem?.grossAmount) ||
      money(item.unitPrice) * quantity;
    const discount = money(item.discountAmount) || money(billingItem?.discountAmount);
    const vatAmount = money(item.taxAmount) || money(billingItem?.taxAmount);
    const patientAmount =
      money(item.patientShareAmount) || money(billingItem?.patientResponsibilityAmount);
    const sponsorAmount =
      money(item.insuranceShareAmount) ||
      money(billingItem?.insuranceResponsibilityAmount) ||
      money(item.netAmount);

    const taxRate = item.appliedTaxes?.find(tax => tax.rate != null)?.rate;
    const line = buildLine({
      serviceDate: billingItem?.chargedAt || psp?.createdDate || fallbackDate,
      code,
      description,
      quantity,
      unitPrice:
        money(item.unitPrice) || money(billingItem?.unitPrice) || (quantity > 0 ? gross / quantity : 0),
      gross,
      discount,
      vatAmount,
      patientAmount,
      sponsorAmount
    });

    if (taxRate != null && Number(taxRate) > 0) {
      line.vatPercent = Number(taxRate);
    }

    const title = groupTitleFor(
      readBillingItemType(
        chargeRef?.billingItemType,
        billingItem?.billingItemType,
        psp?.billingItemType
      ),
      readServiceSource(
        chargeRef?.source,
        psp?.serviceSource,
        billingItem?.serviceSource
      ),
      description,
      null,
      {
        diagnosticTestId: psp?.diagnosticTestId,
        serviceId: psp?.serviceId,
        procedureId: psp?.procedureId,
        brandMedicationId: psp?.brandMedicationId
      },
      code
    );

    return {
      title,
      line: withGroupTitle(line, title)
    };
  });
};

const creditLinesFromChargeRows = (
  chargeRows: Array<{
    chargeLineId?: number | null;
    patientServiceProductId?: number | null;
    itemCode?: string | null;
    itemName?: string | null;
    billingItemType?: string | null;
    source?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
    patientAmount?: number | null;
    insuranceAmount?: number | null;
    chargedAt?: string | null;
  }>,
  fallbackDate?: string | null
) =>
  (chargeRows ?? [])
    .filter(Boolean)
    .map(row => {
      const description = displayText(row.itemName) || '-';
      const quantity = money(row.quantity) > 0 ? money(row.quantity) : 1;
      const unitPrice = money(row.unitPrice);
      const gross = roundMoney(unitPrice * quantity);
      const patientAmount = money(row.patientAmount);
      const sponsorAmount = money(row.insuranceAmount);

      const title = groupTitleFor(
        row.billingItemType,
        row.source,
        description,
        null,
        null,
        row.itemCode
      );

      return {
        title,
        line: withGroupTitle(
          buildLine({
            serviceDate: row.chargedAt || fallbackDate,
            code: row.itemCode,
            description,
            quantity,
            unitPrice,
            gross,
            discount: 0,
            vatAmount: 0,
            patientAmount,
            sponsorAmount
          }),
          title
        )
      };
    });

export const buildInsuranceCreditPrintData = ({
  invoice,
  lineItems,
  encounterDetails,
  eligibilitySnapshot,
  patient,
  facility,
  billingItems,
  pspRows,
  doctorName,
  insurance,
  episodeNo,
  chargeContext,
  printData
}: {
  invoice: PatientFinancialInvoice;
  lineItems: InvoiceLineItem[] | unknown;
  encounterDetails?: EncounterInvoiceDetails | null;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  patient?: any;
  facility: FacilityPrintInfo;
  billingItems?: EncounterBillingItemSummary[] | unknown;
  pspRows?: PatientServiceAndProduct[] | unknown;
  doctorName?: string | null;
  insurance?: PatientInsurance | null;
  episodeNo?: string | null;
  chargeContext?: InvoicePrintChargeContext;
  /** Prefer reusing the same print payload as the standard invoice Print button. */
  printData?: InvoicePrintData | null;
}): InsuranceCreditPrintData => {
  const fallbackDate = encounterDetails?.encounterDate || invoice.createdDate;
  const safeBillingItems = normalizeList<EncounterBillingItemSummary>(billingItems);
  const safePspRows = normalizeList<PatientServiceAndProduct>(pspRows);
  const safeLineItems = normalizeList<InvoiceLineItem>(lineItems);
  const safeChargeRows = chargeContext?.chargeRows ?? [];

  const resolvedPrintData =
    printData ??
    (chargeContext
      ? buildInvoicePrintDataFromIssuedInvoice({
          invoice,
          lineItems: safeLineItems,
          encounterDetails,
          eligibilitySnapshot,
          patient,
          facility,
          chargeContext
        })
      : null);

  // Prefer billing summary (patient + sponsor split), then print items, then
  // invoice lines, then raw checkout charge rows. Never stop at an empty first source.
  let entries: Array<{ title: string; line: InsuranceCreditPrintLine }> = [];

  if (safeBillingItems.length > 0) {
    entries = creditLinesFromBillingItems(
      safeBillingItems,
      safePspRows,
      fallbackDate,
      safeChargeRows
    );
  }
  if (
    entries.length === 0 &&
    resolvedPrintData &&
    Array.isArray(resolvedPrintData.items) &&
    resolvedPrintData.items.length > 0
  ) {
    entries = creditLinesFromPrintItems(
      resolvedPrintData.items,
      safeBillingItems,
      resolvedPrintData.visitDate || fallbackDate,
      safeChargeRows
    );
  }
  if (entries.length === 0 && safeLineItems.length > 0) {
    entries = creditLinesFromInvoiceItems(
      safeLineItems,
      safeBillingItems,
      safePspRows,
      fallbackDate,
      safeChargeRows
    );
  }
  if (entries.length === 0 && safeChargeRows.length > 0) {
    entries = creditLinesFromChargeRows(safeChargeRows, fallbackDate);
  }

  const specialty = new Set([
    'Laboratory',
    'Radiology',
    'Pathology',
    'Procedure',
    'Pharmacy Consumable',
    'Pharmacy Medicine'
  ]);

  const chargeIndex = buildChargeTypeIndex(safeChargeRows);

  const mergedEntries = entries
    .filter(entry => entry?.line != null)
    .map(entry => {
      const chargeRef = resolveChargeTypeRef(chargeIndex, {
        code: entry.line.code
      });
      const fromCharge = groupTitleFor(
        chargeRef?.billingItemType,
        chargeRef?.source,
        entry.line.description,
        null,
        null,
        entry.line.code
      );
      const firstTitle = entry.title || entry.line.groupTitle || 'Service';
      const descTitle =
        groupTitleFor(
          null,
          null,
          entry.line.description,
          null,
          null,
          entry.line.code
        ) || 'Service';

      const title = specialty.has(fromCharge)
        ? fromCharge
        : specialty.has(firstTitle)
          ? firstTitle
          : specialty.has(descTitle)
            ? descTitle
            : firstTitle === 'Services'
              ? 'Service'
              : firstTitle;

      return {
        title,
        line: withGroupTitle(entry.line, title)
      };
    });

  const groups = groupLines(mergedEntries);
  const lines = mergedEntries.map(entry => entry.line);

  const nationalId =
    encounterDetails?.patient?.nationalId ||
    patient?.nationalId ||
    patient?.documentNo ||
    patient?.documentId ||
    '';

  const episode = displayText(episodeNo || resolvedPrintData?.visitNumber).replace(/^#/, '');

  return {
    facilityName: facility.name || resolvedPrintData?.facilityName || '',
    fileNo:
      encounterDetails?.patient?.medicalRecordNumber ||
      patient?.medicalRecordNumber ||
      patient?.mrn ||
      resolvedPrintData?.patientMrn ||
      '',
    patientName:
      formatPersonName(patient, encounterDetails?.patient?.fullName) ||
      resolvedPrintData?.patientName ||
      '',
    patientNameAr: formatArabicName(patient),
    sex: formatSex(patient),
    doctor: displayText(doctorName) || displayText(resolvedPrintData?.physician),
    nationality:
      formatEnumString(String(patient?.nationality ?? '')) || displayText(patient?.nationality),
    nationalId: displayText(nationalId) || displayText(resolvedPrintData?.nationalId),
    contact:
      encounterDetails?.patient?.mobileNumber ||
      patient?.primaryMobileNumber ||
      patient?.mobileNumber ||
      patient?.phoneNumber ||
      resolvedPrintData?.mobileNumber ||
      '',
    companyVatNo:
      displayText(facility.vatRegistrationNumber) ||
      displayText(resolvedPrintData?.vatRegistrationNumber),
    companyAddress: formatFacilityAddress(
      facility.address || resolvedPrintData?.facilityAddress
    ),
    invoiceNo: invoice.documentNumber || resolvedPrintData?.invoiceNumber || '',
    invoiceIssueDate: formatIssueDate(invoice.createdDate || resolvedPrintData?.invoiceDate),
    invoiceIssueTime: formatIssueTime(invoice.createdDate || resolvedPrintData?.invoiceDate),
    tpa: displayText((insurance as { tpaName?: string | null } | null | undefined)?.tpaName),
    insuranceCorp: insuranceCompanyLabel(
      insurance,
      eligibilitySnapshot,
      resolvedPrintData?.insuranceCompany
    ),
    policyNo: displayText(
      eligibilitySnapshot?.policyNumber ??
        insurance?.policyNumber ??
        resolvedPrintData?.policyNumber
    ),
    expiryDate: formatExpiryDate(eligibilitySnapshot?.expiryDate || insurance?.expirationDate),
    claimFormNo: displayText(invoice.claimReference || resolvedPrintData?.claimReference),
    episodeNo: episode,
    sellerId: displayText(facility.providerId || resolvedPrintData?.providerId),
    groups: groups.length > 0 ? groups : lines.length > 0 ? [{ title: 'Service', lines }] : [],
    lines
  };
};
