import React, { useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useAppSelector } from '@/hooks';

import {
  classifyInsuranceCreditGroupTitle,
  sumInsuranceCreditLines,
  type InsuranceCreditPrintData,
  type InsuranceCreditPrintLine
} from './insuranceCreditPrintUtils';
import {
  INSURANCE_CREDIT_PRINT_CSS,
  INSURANCE_CREDIT_PRINT_PAGE_CSS
} from './insuranceCreditPrintStyles';

type InsuranceCreditPrintModalProps = {
  open: boolean;
  data: InsuranceCreditPrintData | null;
  onClose: () => void;
};

const toTranslationKey = (value: string) =>
  value.normalize('NFD').replace(/\s+/g, '_').toUpperCase();

/** Default secondary language labels (Arabic) shown next to English. */
const ARABIC_LABELS: Record<string, string> = {
  FILE_NO: 'رقم الملف',
  PATIENT_NAME: 'اسم المريض',
  SEX: 'الجنس',
  DOCTOR: 'الطبيب',
  NATIONALITY: 'الجنسية',
  NATIONAL_ID: 'الهوية الوطنية',
  CONTACT: 'رقم التواصل',
  COMPANY_VAT_NO: 'الرقم الضريبي للمنشأة',
  COMPANY_ADDRESS: 'عنوان الشركة',
  INVOICE_NO: 'رقم الفاتورة',
  INVOICE_ISSUE_DATE: 'تاريخ الفاتورة',
  INVOICE_ISSUE_TIME: 'وقت إصدار الفاتورة',
  TPA: 'الطرف الثالث',
  'INSURANCE/CORP': 'اسم شركة التأمين',
  'POLICY_NO.': 'رقم البوليصة',
  EXPIRY_DATE: 'تاريخ الانتهاء',
  CLAIM_FORM_NO: 'استمارة المطالبة',
  EPISODE_NO: 'رقم الزيارة',
  SELLER_ID: 'معرف البائع',
  DATE: 'تاريخ',
  CODE: 'الشفرة',
  SERVICE_DESCRIPTION: 'وصف الخدمة',
  QTY: 'كمية',
  UNIT_PRICE: 'سعر الوحدة',
  GROSS: 'اجمالي المبلغ',
  DISCOUNT: 'الخصم',
  SUBTOTAL_INCL_VAT: 'شامل الضريبة',
  NET_AMT_BEFORE_VAT: 'صافي قبل الضريبة',
  NET_BEFORE_VAT: 'صافي قبل الضريبة',
  'INCL._VAT': 'شامل الضريبة',
  INCL_VAT: 'شامل الضريبة',
  'VAT%': 'نسبة الضريبة',
  VAT_AMT: 'قيمة الضريبة',
  PATIENT: 'المريض',
  SPONSOR: 'الشركة',
  SUB_TOTAL: 'المجموع الفرعي',
  TOTAL: 'مجموع',
  PAGE: 'صفحة',
  OF: 'من'
};

const formatAmount = (amount: number) =>
  Number(amount ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatVat = (percent: number) => {
  if (!Number.isFinite(percent)) {
    return '0';
  }

  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2);
};

/**
 * Secondary label next to English:
 * - English / Arabic / empty language → Arabic
 * - Any other system language → that language's translation (fallback to English default)
 */
const useSecondaryLabel = () => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);

  return useCallback(
    (englishLabel: string) => {
      const key = toTranslationKey(englishLabel);
      const normalized = String(lang ?? '')
        .trim()
        .toLowerCase();
      const useArabic =
        !normalized || normalized === 'en' || normalized === 'english' || normalized.startsWith('ar');

      if (useArabic) {
        return translations?.ar?.[key] || translations?.AR?.[key] || ARABIC_LABELS[key] || englishLabel;
      }

      const fromSelected = translations?.[lang as string]?.[key];
      if (fromSelected && fromSelected !== englishLabel) {
        return fromSelected;
      }

      return englishLabel;
    },
    [lang, translations]
  );
};

const Field = ({
  label,
  secondary,
  children
}: {
  label: string;
  secondary: string;
  children?: React.ReactNode;
}) => (
  <div className="credit-invoice__field">
    <span className="credit-invoice__label">{label}</span>
    <span className="credit-invoice__label-ar">
      {secondary && secondary !== label ? secondary : ''}
    </span>
    <span className="credit-invoice__value">{children}</span>
  </div>
);

const amountCells = (
  line: Pick<
    InsuranceCreditPrintLine,
    | 'gross'
    | 'discount'
    | 'netBeforeVat'
    | 'subtotalInclVat'
    | 'vatAmount'
    | 'patientAmount'
    | 'sponsorAmount'
  > & { vatPercent?: number | null }
) => (
  <>
    <td className="num">{formatAmount(line.gross)}</td>
    <td className="num">{formatAmount(line.discount)}</td>
    <td className="num">{formatAmount(line.netBeforeVat)}</td>
    <td className="num">{formatAmount(line.subtotalInclVat)}</td>
    <td className="num">{line.vatPercent == null ? '' : formatVat(line.vatPercent)}</td>
    <td className="num">{formatAmount(line.vatAmount)}</td>
    <td className="num">{formatAmount(line.patientAmount)}</td>
    <td className="num">{formatAmount(line.sponsorAmount)}</td>
  </>
);

const TEXT_HEADERS = new Set(['Date', 'Code', 'Service Description']);

const HeaderCell = ({ label, secondary }: { label: string; secondary: string }) => (
  <th className={TEXT_HEADERS.has(label) ? 'col-text' : 'num'}>
    {label}
    {secondary && secondary !== label ? <span className="ar">{secondary}</span> : null}
  </th>
);

const GROUP_ORDER = [
  'Service',
  'Laboratory',
  'Radiology',
  'Pathology',
  'Procedure',
  'Pharmacy Consumable',
  'Pharmacy Medicine'
];

/**
 * Local, dependency-free classifier so Lab/Rad never collapse into Service
 * even if the utils import is stale during HMR.
 */
const classifyLineGroupTitle = (line: InsuranceCreditPrintLine) => {
  const stored = String(line?.groupTitle ?? '').trim();
  const label = String(line?.description ?? '').toLowerCase();
  const code = String(line?.code ?? '')
    .trim()
    .toUpperCase();

  if (
    label.includes('radiolog') ||
    label.includes('radiograph') ||
    label.includes('x-ray') ||
    label.includes('xray') ||
    label.includes('ct scan') ||
    label.includes('mri') ||
    code.startsWith('585')
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
    code.startsWith('730') ||
    code.startsWith('731') ||
    code.startsWith('732')
  ) {
    return label.includes('patholog') ? 'Pathology' : 'Laboratory';
  }

  if (
    stored === 'Laboratory' ||
    stored === 'Radiology' ||
    stored === 'Pathology' ||
    stored === 'Procedure' ||
    stored === 'Pharmacy Medicine' ||
    stored === 'Pharmacy Consumable'
  ) {
    return stored;
  }

  try {
    const fromUtils = classifyInsuranceCreditGroupTitle(
      null,
      null,
      line?.description,
      null,
      undefined,
      line?.code
    );
    if (fromUtils && fromUtils !== 'Service' && fromUtils !== 'Services') {
      return fromUtils;
    }
  } catch {
    /* local rules above already applied */
  }

  if (stored === 'Services') return 'Service';
  return stored || 'Service';
};

const regroupCreditLines = (lines: InsuranceCreditPrintLine[]) => {
  const grouped = new Map<string, InsuranceCreditPrintLine[]>();
  const safeLines = (lines ?? []).filter(Boolean);

  safeLines.forEach(line => {
    const title = classifyLineGroupTitle(line);
    const current = grouped.get(title) ?? [];
    current.push(line);
    grouped.set(title, current);
  });

  const regrouped = [...grouped.entries()]
    .sort(([left], [right]) => {
      const leftIndex = GROUP_ORDER.indexOf(left);
      const rightIndex = GROUP_ORDER.indexOf(right);
      return (
        (leftIndex === -1 ? GROUP_ORDER.length : leftIndex) -
        (rightIndex === -1 ? GROUP_ORDER.length : rightIndex)
      );
    })
    .map(([title, groupLines]) => ({ title, lines: groupLines ?? [] }))
    .filter(group => group.lines.length > 0);

  if (regrouped.length === 0 && safeLines.length > 0) {
    return [{ title: 'Service', lines: safeLines }];
  }

  return regrouped;
};

const CreditDocument: React.FC<{
  data: InsuranceCreditPrintData;
  secondary: (label: string) => string;
}> = ({ data, secondary }) => {
  // Recompute every render (no useMemo) so grouping cannot stick to a stale
  // "Service-only" result after HMR / cached data.
  const fromGroups = Array.isArray(data?.groups) ? data.groups.filter(Boolean) : [];
  const fromGroupLines = fromGroups.flatMap(group =>
    Array.isArray(group?.lines) ? group.lines.filter(Boolean) : []
  );
  const flatLines =
    fromGroupLines.length > 0
      ? fromGroupLines
      : Array.isArray(data?.lines)
        ? data.lines.filter(Boolean)
        : [];
  const groups = regroupCreditLines(flatLines);
  const allLines = groups.flatMap(group => group.lines ?? []);
  const grand = sumInsuranceCreditLines(allLines);

  const columns = [
    'Date',
    'Code',
    'Service Description',
    'Qty',
    'Unit Price',
    'Gross',
    'Discount',
    'Net Amt Before VAT',
    'SubTotal Incl VAT',
    'VAT%',
    'VAT Amt',
    'Patient',
    'Sponsor'
  ].map(label => ({ label, secondary: secondary(label) }));

  return (
    <div className="credit-invoice" data-credit-group-count={groups.length}>
      <div className="credit-invoice__sheet">
        {data.facilityName ? (
          <div className="credit-invoice__facility">{data.facilityName}</div>
        ) : null}
        <div className="credit-invoice__title">Out-Patient Invoice Credit - Detailed</div>

        <div className="credit-invoice__identity">
          <div>
            <Field label="File No" secondary={secondary('File No')}>
              {data.fileNo}
            </Field>
            <Field label="Patient Name" secondary={secondary('Patient Name')}>
              <span className="credit-invoice__value--name">
                <span>{data.patientName}</span>
                {data.patientNameAr ? <span>{data.patientNameAr}</span> : null}
              </span>
            </Field>
            <Field label="Sex" secondary={secondary('Sex')}>
              {data.sex}
            </Field>
            <Field label="Doctor" secondary={secondary('Doctor')}>
              {data.doctor}
            </Field>
            <Field label="Nationality" secondary={secondary('Nationality')}>
              {data.nationality}
            </Field>
            <Field label="National ID" secondary={secondary('National ID')}>
              {data.nationalId}
            </Field>
            <Field label="Contact" secondary={secondary('Contact')}>
              {data.contact}
            </Field>
            <Field label="Company VAT No" secondary={secondary('Company VAT No')}>
              {data.companyVatNo}
            </Field>
            <Field label="Company Address" secondary={secondary('Company Address')}>
              {data.companyAddress}
            </Field>
          </div>
          <div>
            <Field label="Invoice No" secondary={secondary('Invoice No')}>
              {data.invoiceNo}
            </Field>
            <Field label="Invoice Issue Date" secondary={secondary('Invoice Issue Date')}>
              {data.invoiceIssueDate}
            </Field>
            <Field label="Invoice Issue Time" secondary={secondary('Invoice Issue Time')}>
              {data.invoiceIssueTime}
            </Field>
            <Field label="TPA" secondary={secondary('TPA')}>
              {data.tpa}
            </Field>
            <Field label="Insurance/Corp" secondary={secondary('Insurance/Corp')}>
              {data.insuranceCorp}
            </Field>
            <Field label="Policy No." secondary={secondary('Policy No.')}>
              {data.policyNo}
            </Field>
            <Field label="Expiry Date" secondary={secondary('Expiry Date')}>
              {data.expiryDate}
            </Field>
            <Field label="Claim Form No" secondary={secondary('Claim Form No')}>
              {data.claimFormNo}
            </Field>
            <Field label="Episode No" secondary={secondary('Episode No')}>
              {data.episodeNo}
            </Field>
          </div>
        </div>

        <div className="credit-invoice__seller">
          <span>Seller ID</span>
          <span className="credit-invoice__seller-ar">
            {secondary('Seller ID') !== 'Seller ID' ? secondary('Seller ID') : ''}
          </span>
          <span>{data.sellerId}</span>
        </div>

        <table className="credit-invoice__table">
          <colgroup>
            <col className="col-date" />
            <col className="col-code" />
            <col className="col-desc" />
            <col className="col-qty" />
            <col className="col-money" />
            <col className="col-money" />
            <col className="col-money" />
            <col className="col-money-wide" />
            <col className="col-money-wide" />
            <col className="col-vatpct" />
            <col className="col-money" />
            <col className="col-money" />
            <col className="col-money" />
          </colgroup>
          <thead>
            <tr>
              {columns.map(column => (
                <HeaderCell key={column.label} label={column.label} secondary={column.secondary} />
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td className="credit-invoice__empty" colSpan={13}>
                  No service lines available.
                </td>
              </tr>
            ) : (
              groups.map(group => {
                const groupLines = Array.isArray(group.lines) ? group.lines : [];
                const subtotal = sumInsuranceCreditLines(groupLines);
                return (
                  <React.Fragment key={`grp-${group.title}-${groupLines.length}`}>
                    <tr className="credit-invoice__group">
                      <td colSpan={13}>{group.title}</td>
                    </tr>
                    {groupLines.map((line, index) => (
                      <tr
                        key={`${group.title}-${line.code}-${line.description}-${index}`}
                        data-group-title={classifyLineGroupTitle(line)}
                      >
                        <td className="col-text">{line.serviceDate}</td>
                        <td className="col-text">{line.code}</td>
                        <td className="col-text">{line.description}</td>
                        <td className="num">{line.quantityLabel}</td>
                        <td className="num">{formatAmount(line.unitPrice)}</td>
                        {amountCells(line)}
                      </tr>
                    ))}
                    <tr className="credit-invoice__subtotal">
                      <td colSpan={5} className="label">
                        {secondary('Sub Total') !== 'Sub Total'
                          ? `Sub Total ${secondary('Sub Total')} (SAR)`
                          : 'Sub Total (SAR)'}
                      </td>
                      {amountCells({ ...subtotal, vatPercent: null })}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
            {allLines.length > 0 ? (
              <tr className="credit-invoice__grand">
                <td colSpan={5} className="label">
                  {secondary('Total') !== 'Total'
                    ? `Total ${secondary('Total')} (SAR)`
                    : 'Total (SAR)'}
                </td>
                {amountCells({ ...grand, vatPercent: null })}
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="credit-invoice__page">Page 1 of 1</div>
      </div>
    </div>
  );
};

const InsuranceCreditPrintModal: React.FC<InsuranceCreditPrintModalProps> = ({
  open,
  data,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const secondary = useSecondaryLabel();

  const handlePrint = useCallback(async () => {
    if (!printRef.current || !data) {
      return;
    }

    const fileNo = String(data.fileNo ?? '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ');
    const printTitle = fileNo
      ? `Out-Patient Invoice Credit - Detailed - ${fileNo}`
      : 'Out-Patient Invoice Credit - Detailed';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const printDocument = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!printDocument || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      return;
    }

    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${printTitle}</title>
          <style>${INSURANCE_CREDIT_PRINT_PAGE_CSS}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printDocument.close();

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.contentWindow.onafterprint = cleanup;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    window.setTimeout(cleanup, 2000);
  }, [data]);

  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(open) : next;
      if (!resolved) {
        onClose();
      }
    },
    [onClose, open]
  );

  if (!data) {
    return null;
  }

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`Out-Patient Invoice Credit — ${data.invoiceNo}`}
      size="96vw"
      bodyheight="82vh"
      position="center"
      enforceFocus={false}
      customClassName="invoice-print-modal credit-invoice-modal"
      cancelButtonLabel="Close"
      handleCancelFunction={onClose}
      actionButtonLabel="Print credit invoice"
      actionButtonFunction={handlePrint}
      content={() => (
        <>
          <style>{INSURANCE_CREDIT_PRINT_CSS}</style>
          <div className="invoice-print-modal__paper" ref={printRef}>
            <CreditDocument data={data} secondary={secondary} />
          </div>
        </>
      )}
      footerButtons={
        <MyButton
          appearance="primary"
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
          onClick={() => {
            void handlePrint();
          }}
        >
          Print credit invoice
        </MyButton>
      }
      hideActionBtn
    />
  );
};

export default InsuranceCreditPrintModal;
