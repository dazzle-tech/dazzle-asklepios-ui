import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPrint } from '@fortawesome/free-solid-svg-icons';
import QRCode from 'qrcode';

import MyButton from '@/components/MyButton/MyButton';
import type { InvoicePrintData } from './invoicePrintUtils';
import { invoiceTypeLabel } from './invoicePrintUtils';
import { INVOICE_PRINT_CSS, INVOICE_PRINT_PAGE_CSS } from './invoicePrintStyles';
import {
  getInvoicePrintVersion,
  invoicePrintVersionLabel,
  markInvoiceAsPrinted,
  type InvoicePrintVersion
} from './invoicePrintVersion';

import './styles.less';

type InvoicePrintModalProps = {
  open: boolean;
  onClose: () => void;
  invoices: InvoicePrintData[];
  autoPrint?: boolean;
};

const formatMoney = (amount: number, currency: string) =>
  `${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;

type InvoiceDocumentProps = {
  invoice: InvoicePrintData;
  qrDataUrl?: string;
  printVersion: InvoicePrintVersion;
};

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  qrDataUrl,
  printVersion
}) => {
  const isInsurance = invoice.invoiceType === 'INSURANCE_CLAIM';
  const isCopy = printVersion === 'COPY';

  return (
    <div className="invoice-print">
      <div className="invoice-print__header">
        {qrDataUrl ? (
          <div className="invoice-print__qr">
            <img src={qrDataUrl} alt="Invoice QR code" />
          </div>
        ) : (
          <div className="invoice-print__qr invoice-print__qr--placeholder" />
        )}

        <div className="invoice-print__header-main">
          <div className="invoice-print__brand">{invoice.facilityName}</div>
          <div className="invoice-print__subtitle">{invoiceTypeLabel(invoice.invoiceType)}</div>
          {(invoice.facilityAddress || invoice.vatRegistrationNumber) && (
            <div className="invoice-print__facility-meta">
              {invoice.facilityAddress ? <span>{invoice.facilityAddress}</span> : null}
              {invoice.facilityAddress && invoice.vatRegistrationNumber ? (
                <span className="invoice-print__facility-meta-sep"> · </span>
              ) : null}
              {invoice.vatRegistrationNumber ? (
                <span>VAT: {invoice.vatRegistrationNumber}</span>
              ) : null}
            </div>
          )}
        </div>

        <div className="invoice-print__meta">
          <div
            className={`invoice-print__version${
              isCopy ? ' invoice-print__version--copy' : ''
            }`}
          >
            {invoicePrintVersionLabel(printVersion)}
          </div>
          <div className="invoice-print__meta-grid">
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Invoice No.</span>
              <span className="invoice-print__sequence">{invoice.invoiceNumber}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Date</span>
              <span>{invoice.invoiceDate}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Visit</span>
              <span className="invoice-print__sequence">{invoice.visitNumber}</span>
            </div>
            {invoice.visitDate ? (
              <div className="invoice-print__meta-item">
                <span className="invoice-print__meta-label">Visit date</span>
                <span>{invoice.visitDate}</span>
              </div>
            ) : null}
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Status</span>
              <span className="invoice-print__status">{invoice.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-print__section">
        <div className="invoice-print__section-title">Patient Information</div>
        <div className="invoice-print__grid">
          <div>
            <strong>{invoice.patientName}</strong>
          </div>
          <div>MRN: {invoice.patientMrn}</div>
          {invoice.nationalId ? <div>National ID: {invoice.nationalId}</div> : null}
          {invoice.mobileNumber ? <div>Mobile: {invoice.mobileNumber}</div> : null}
        </div>
      </div>

      {isInsurance ? (
        <div className="invoice-print__section">
          <div className="invoice-print__section-title">Insurance Information</div>
          <div className="invoice-print__grid">
            {invoice.insuranceCompany ? (
              <div>Insurance company: {invoice.insuranceCompany}</div>
            ) : null}
            {invoice.payerId ? <div>Payer ID: {invoice.payerId}</div> : null}
            {invoice.policyNumber ? <div>Policy #: {invoice.policyNumber}</div> : null}
            {invoice.memberNumber ? <div>Member #: {invoice.memberNumber}</div> : null}
            {invoice.benefitClass ? <div>Benefit class: {invoice.benefitClass}</div> : null}
            {invoice.eligibilityReference ? (
              <div>Eligibility #: {invoice.eligibilityReference}</div>
            ) : null}
            {invoice.claimReference ? <div>Claim #: {invoice.claimReference}</div> : null}
            {invoice.authorizationNumber ? (
              <div>Authorization #: {invoice.authorizationNumber}</div>
            ) : null}
            {invoice.authorizationDate ? (
              <div>Authorization date: {invoice.authorizationDate}</div>
            ) : null}
            {invoice.providerName ? <div>Provider: {invoice.providerName}</div> : null}
            {invoice.providerId ? <div>Provider ID: {invoice.providerId}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="invoice-print__section">
        <div className="invoice-print__section-title">Service Details</div>
        <table className="invoice-print__table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Service Type</th>
              <th>Qty</th>
              <th>Unit Price</th>
              {isInsurance ? (
                <>
                  <th>Patient Share</th>
                  <th>Insurance Share</th>
                </>
              ) : (
                <th>Amount</th>
              )}
              <th>VAT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={`${item.serviceName}-${index}`}>
                  <td>{item.serviceName}</td>
                  <td>{item.serviceType}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice, invoice.currency)}</td>
                  {isInsurance ? (
                    <>
                      <td>{formatMoney(item.patientShare ?? 0, invoice.currency)}</td>
                      <td>{formatMoney(item.insuranceShare ?? 0, invoice.currency)}</td>
                    </>
                  ) : (
                    <td>{formatMoney(item.amount, invoice.currency)}</td>
                  )}
                  <td>{formatMoney(item.taxAmount ?? 0, invoice.currency)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isInsurance ? 7 : 6}>No line items available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="invoice-print__totals">
        <div className="invoice-print__total-row">
          <span>Gross amount</span>
          <span>{formatMoney(invoice.totals.grossAmount, invoice.currency)}</span>
        </div>
        <div className="invoice-print__total-row">
          <span>Tax (VAT)</span>
          <span>{formatMoney(invoice.totals.taxAmount, invoice.currency)}</span>
        </div>
        <div className="invoice-print__total-row">
          <span>Net amount</span>
          <span>{formatMoney(invoice.totals.netAmount, invoice.currency)}</span>
        </div>
        {isInsurance ? (
          <>
            <div className="invoice-print__total-row">
              <span>Total patient share</span>
              <span>{formatMoney(invoice.totals.patientShare, invoice.currency)}</span>
            </div>
            <div className="invoice-print__total-row invoice-print__total-row--highlight">
              <span>Total insurance claim</span>
              <span>{formatMoney(invoice.totals.insuranceShare, invoice.currency)}</span>
            </div>
          </>
        ) : (
          <div className="invoice-print__total-row invoice-print__total-row--highlight">
            <span>Total patient responsibility</span>
            <span>
              {formatMoney(
                invoice.totals.patientShare || invoice.totals.netAmount,
                invoice.currency
              )}
            </span>
          </div>
        )}
      </div>

      <div className="invoice-print__footer">
        This is an official invoice document. Please retain it for your records.
      </div>
    </div>
  );
};

const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  open,
  onClose,
  invoices,
  autoPrint = false
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const hasAutoPrintedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [printVersions, setPrintVersions] = useState<Record<string, InvoicePrintVersion>>({});

  const activeInvoice = invoices[activeIndex] ?? null;
  const hasMultiple = invoices.length > 1;

  const resolvePrintVersion = useCallback(
    (invoiceNumber: string) => printVersions[invoiceNumber] ?? getInvoicePrintVersion(invoiceNumber),
    [printVersions]
  );

  const activePrintVersion = activeInvoice
    ? resolvePrintVersion(activeInvoice.invoiceNumber)
    : 'ORIGINAL';

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
      hasAutoPrintedRef.current = false;
      setQrDataUrl(undefined);
      setPrintVersions({});
      return;
    }

    setPrintVersions(
      invoices.reduce<Record<string, InvoicePrintVersion>>((acc, invoice) => {
        acc[invoice.invoiceNumber] = getInvoicePrintVersion(invoice.invoiceNumber);
        return acc;
      }, {})
    );
  }, [open, invoices]);

  useEffect(() => {
    if (!activeInvoice?.qrCodePayload) {
      setQrDataUrl(undefined);
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(activeInvoice.qrCodePayload, {
      margin: 1,
      width: 192
    })
      .then(url => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeInvoice?.qrCodePayload]);

  const handlePrint = useCallback(() => {
    if (!printRef.current || !activeInvoice) {
      return;
    }

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
          <title>Invoice ${activeInvoice.invoiceNumber}</title>
          <style>${INVOICE_PRINT_PAGE_CSS}</style>
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

    markInvoiceAsPrinted(activeInvoice.invoiceNumber);
    setPrintVersions(current => ({
      ...current,
      [activeInvoice.invoiceNumber]: 'COPY'
    }));
  }, [activeInvoice]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!autoPrint || invoices.length === 0 || hasAutoPrintedRef.current) {
      return;
    }

    hasAutoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      handlePrint();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [open, autoPrint, invoices.length, handlePrint]);

  if (!activeInvoice) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      overflow={false}
      enforceFocus={false}
      backdrop="static"
      container={document.body}
      className="invoice-print-modal"
    >
      <Modal.Header>
        <Modal.Title>
          {invoiceTypeLabel(activeInvoice.invoiceType)} — {activeInvoice.invoiceNumber}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <style>{INVOICE_PRINT_CSS}</style>

        {hasMultiple ? (
          <div className="billing-invoices__print-nav">
            <MyButton
              appearance="subtle"
              disabled={activeIndex <= 0}
              onClick={() => setActiveIndex(index => Math.max(0, index - 1))}
            >
              <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </MyButton>
            <span>
              Invoice {activeIndex + 1} of {invoices.length}
            </span>
            <MyButton
              appearance="subtle"
              disabled={activeIndex >= invoices.length - 1}
              onClick={() => setActiveIndex(index => Math.min(invoices.length - 1, index + 1))}
            >
              Next <FontAwesomeIcon icon={faChevronRight} />
            </MyButton>
          </div>
        ) : null}

        <div className="invoice-print-modal__paper" ref={printRef}>
          <InvoiceDocument
            invoice={activeInvoice}
            qrDataUrl={qrDataUrl}
            printVersion={activePrintVersion}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={onClose}>Close</MyButton>
        <MyButton
          appearance="primary"
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
          onClick={handlePrint}
        >
          Print {invoicePrintVersionLabel(activePrintVersion).toLowerCase()}
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default InvoicePrintModal;
