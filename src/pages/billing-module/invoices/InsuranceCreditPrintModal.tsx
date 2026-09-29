import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { useAppSelector } from '@/hooks';
import { useBranding } from '@/hooks/useBranding';
import { useGetSystemConfigDetailsQuery } from '@/services/systemConfigService';

import { classifyCreditInvoiceGroup } from './creditInvoiceGroups';
import {
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
  TYPE: 'النوع',
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

const COLUMN_COUNT = 14;

const TEXT_HEADERS = new Set(['Date', 'Code', 'Service Description', 'Type']);

const HeaderCell = ({ label, secondary }: { label: string; secondary: string }) => (
  <th className={TEXT_HEADERS.has(label) ? 'col-text' : 'num'}>
    {label}
    {secondary && secondary !== label ? <span className="ar">{secondary}</span> : null}
  </th>
);

const classifyLineGroupTitle = (line: InsuranceCreditPrintLine) =>
  classifyCreditInvoiceGroup({
    serviceType: line?.serviceType,
    billingItemType: line?.billingItemType,
    serviceSource: line?.serviceSource,
    name: line?.description,
    code: line?.code,
    diagnosticTestId: line?.diagnosticTestId,
    serviceId: line?.serviceId,
    procedureId: line?.procedureId,
    brandMedicationId: line?.brandMedicationId
  });

const sectionTitleForLine = (line: InsuranceCreditPrintLine) => {
  const invoiceType = String(line?.serviceType ?? '').trim();
  if (invoiceType && invoiceType !== '-' && invoiceType !== 'Service' && invoiceType !== 'Services') {
    return invoiceType;
  }

  const classified = classifyLineGroupTitle(line);
  if (classified && classified !== 'Service' && classified !== 'Services') {
    return classified;
  }

  return invoiceType || classified || 'Service';
};

const PUBLIC_LOGO_HOSTS = [
  'https://asklepios.sfo3.cdn.digitaloceanspaces.com',
  'https://asklepios.sfo3.digitaloceanspaces.com'
];

const collectLogoCandidates = (values: Array<string | null | undefined>) => {
  const urls: string[] = [];
  const add = (value?: string | null) => {
    const text = String(value ?? '').trim();
    if (
      !text ||
      text === '-' ||
      text === 'null' ||
      text === '/clinicle.png' ||
      text.endsWith('/clinicle.png')
    ) {
      return;
    }
    if (!urls.includes(text)) {
      urls.push(text);
    }
  };

  values.forEach(value => {
    const raw = String(value ?? '').trim();
    if (!raw || raw === '-' || raw === 'null') {
      return;
    }

    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      add(raw);
      return;
    }

    const key = raw.replace(/^\/+/, '');
    if (key.startsWith('config/')) {
      PUBLIC_LOGO_HOSTS.forEach(host => add(`${host}/${key}`));
    }
  });

  return urls;
};

const useFirstWorkingImage = (candidates: string[]) => {
  const [src, setSrc] = useState('');
  const signature = candidates.join('\n');

  useEffect(() => {
    let cancelled = false;
    setSrc('');

    const attempt = (index: number) => {
      if (cancelled) {
        return;
      }
      const next = candidates[index];
      if (!next) {
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (!cancelled) {
          setSrc(next);
        }
      };
      image.onerror = () => attempt(index + 1);
      image.src = next;
    };

    attempt(0);

    return () => {
      cancelled = true;
    };
  }, [signature, candidates]);

  return src;
};

const CreditLogo = ({ src }: { src: string }) => {
  if (!src) {
    return null;
  }

  return (
    <img
      className="credit-invoice__logo"
      src={src}
      alt=""
      style={{ display: 'block', width: 92, height: 64, objectFit: 'contain' }}
    />
  );
};

const CreditDocument: React.FC<{
  data: InsuranceCreditPrintData;
  logoSrc: string;
  secondary: (label: string) => string;
}> = ({ data, logoSrc, secondary }) => {
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
  const grand = sumInsuranceCreditLines(flatLines);

  const columns = [
    'Date',
    'Code',
    'Service Description',
    'Type',
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
    <div className="credit-invoice">
      <div className="credit-invoice__sheet">
        <div className="credit-invoice__masthead">
          <div className="credit-invoice__brand">
            <CreditLogo src={logoSrc} />
          </div>
          <div className="credit-invoice__center">
            <div className="credit-invoice__brand-name">{data.facilityName}</div>
            <div className="credit-invoice__title">Out-Patient Invoice Credit - Detailed</div>
          </div>
          <div className="credit-invoice__brand credit-invoice__brand--end">
            <CreditLogo src={logoSrc} />
          </div>
        </div>

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
            <col className="col-type" />
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
            {flatLines.length === 0 ? (
              <tr>
                <td className="credit-invoice__empty" colSpan={COLUMN_COUNT}>
                  No service lines available.
                </td>
              </tr>
            ) : (
              flatLines.map((line, index) => (
                <tr key={`${line.code}-${line.description}-${index}`}>
                  <td className="col-text">{line.serviceDate}</td>
                  <td className="col-text">{line.code}</td>
                  <td className="col-text">{line.description}</td>
                  <td className="col-text">{sectionTitleForLine(line)}</td>
                  <td className="num">{line.quantityLabel}</td>
                  <td className="num">{formatAmount(line.unitPrice)}</td>
                  {amountCells(line)}
                </tr>
              ))
            )}
            {flatLines.length > 0 ? (
              <tr className="credit-invoice__subtotal">
                <td colSpan={6} className="label">
                  {secondary('Sub Total') !== 'Sub Total'
                    ? `Sub Total ${secondary('Sub Total')} (SAR)`
                    : 'Sub Total (SAR)'}
                </td>
                {amountCells({ ...grand, vatPercent: null })}
              </tr>
            ) : null}
          </tbody>
          {flatLines.length > 0 ? (
            <tfoot>
              <tr className="credit-invoice__grand">
                <td colSpan={6} className="label">
                  {secondary('Total') !== 'Total'
                    ? `Total ${secondary('Total')} (SAR)`
                    : 'Total (SAR)'}
                </td>
                {amountCells({ ...grand, vatPercent: null })}
              </tr>
            </tfoot>
          ) : null}
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
  const branding = useBranding();
  const { data: configRows } = useGetSystemConfigDetailsQuery(undefined, { skip: !open });
  const logoCandidates = useMemo(() => {
    const rows = Array.isArray(configRows) ? configRows : [];
    const readConfig = (key: string) =>
      rows.find(row => String(row.configKey) === key)?.configValue;

    return collectLogoCandidates([
      readConfig('SYSTEM_LOGO'),
      readConfig('SIDEBAR_LOGO'),
      ...(data?.logoUrls ?? []),
      data?.logoUrl,
      branding.logo,
      branding.sidebarLogo
    ]);
  }, [branding.logo, branding.sidebarLogo, configRows, data?.logoUrl, data?.logoUrls]);
  const logoSrc = useFirstWorkingImage(logoCandidates);

  const handlePrint = useCallback(() => {
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
    const escapedTitle = printTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapedTitle}</title>
          <style>${INSURANCE_CREDIT_PRINT_PAGE_CSS}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.document.title = printTitle;

    const images = Array.from(printWindow.document.images);
    const ready = Promise.all(
      images.map(
        image =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                image.onload = () => resolve();
                image.onerror = () => resolve();
              })
      )
    );
    const closeWindow = () => {
      printWindow.close();
    };
    printWindow.onafterprint = closeWindow;
    void ready.then(() => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 50);
    });
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

  if (!open) {
    return null;
  }

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        data?.invoiceNo
          ? `Out-Patient Invoice Credit — ${data.invoiceNo}`
          : 'Out-Patient Invoice Credit'
      }
      size="96vw"
      bodyheight="82vh"
      position="center"
      enforceFocus={false}
      customClassName="invoice-print-modal credit-invoice-modal"
      cancelButtonLabel="Close"
      handleCancelFunction={onClose}
      actionButtonLabel="Print credit invoice"
      actionButtonFunction={handlePrint}
      content={() =>
        data ? (
          <>
            <style>{INSURANCE_CREDIT_PRINT_CSS}</style>
            <div className="invoice-print-modal__paper" ref={printRef}>
              <CreditDocument data={data} logoSrc={logoSrc} secondary={secondary} />
            </div>
          </>
        ) : (
          <div className="credit-invoice__loading">Loading credit invoice...</div>
        )
      }
      footerButtons={
        <MyButton
          appearance="primary"
          disabled={!data}
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
