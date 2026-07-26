import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPrint } from '@fortawesome/free-solid-svg-icons';
import QRCode from 'qrcode';

import MyButton from '@/components/MyButton/MyButton';
import { INVOICE_PRINT_CSS, INVOICE_PRINT_PAGE_CSS } from './invoicePrintStyles';
import {
  getInvoicePrintVersion,
  invoicePrintVersionLabel,
  markInvoiceAsPrinted,
  type InvoicePrintVersion
} from './invoicePrintVersion';
import {
  adjustmentTypeLabel,
  type AdjustmentPrintData
} from './adjustmentPrintUtils';

import './styles.less';

type AdjustmentPrintModalProps = {
  open: boolean;
  onClose: () => void;
  adjustments: AdjustmentPrintData[];
  autoPrint?: boolean;
};

const formatMoney = (amount: number, currency: string) =>
  `${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;

type AdjustmentDocumentProps = {
  adjustment: AdjustmentPrintData;
  qrDataUrl?: string;
  printVersion: InvoicePrintVersion;
};

const AdjustmentDocument: React.FC<AdjustmentDocumentProps> = ({
  adjustment,
  qrDataUrl,
  printVersion
}) => {
  const isInsurance = adjustment.invoiceType === 'INSURANCE_CLAIM';
  const isCopy = printVersion === 'COPY';
  const isCredit = adjustment.documentType === 'CREDIT_NOTE';

  return (
    <div className="invoice-print">
      <div className="invoice-print__header">
        {qrDataUrl ? (
          <div className="invoice-print__qr">
            <img src={qrDataUrl} alt="Document QR code" />
          </div>
        ) : (
          <div className="invoice-print__qr invoice-print__qr--placeholder" />
        )}

        <div className="invoice-print__header-main">
          <div className="invoice-print__brand">{adjustment.facilityName}</div>
          <div className="invoice-print__subtitle">
            {adjustmentTypeLabel(adjustment.documentType, adjustment.invoiceType)}
          </div>
          {(adjustment.facilityAddress || adjustment.vatRegistrationNumber) && (
            <div className="invoice-print__facility-meta">
              {adjustment.facilityAddress ? <span>{adjustment.facilityAddress}</span> : null}
              {adjustment.facilityAddress && adjustment.vatRegistrationNumber ? (
                <span className="invoice-print__facility-meta-sep"> · </span>
              ) : null}
              {adjustment.vatRegistrationNumber ? (
                <span>VAT: {adjustment.vatRegistrationNumber}</span>
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
              <span className="invoice-print__meta-label">Document No.</span>
              <span className="invoice-print__sequence">{adjustment.documentNumber}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Date</span>
              <span>{adjustment.documentDate}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Original Invoice</span>
              <span className="invoice-print__sequence">{adjustment.originalInvoiceNumber}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Visit</span>
              <span className="invoice-print__sequence">{adjustment.visitNumber}</span>
            </div>
            {adjustment.visitDate ? (
              <div className="invoice-print__meta-item">
                <span className="invoice-print__meta-label">Visit date</span>
                <span>{adjustment.visitDate}</span>
              </div>
            ) : null}
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Status</span>
              <span className="invoice-print__status">{adjustment.status}</span>
            </div>
          </div>
        </div>
      </div>

      {adjustment.adjustmentReason ? (
        <div className="invoice-print__section">
          <div className="invoice-print__section-title">Reason</div>
          <div>{adjustment.adjustmentReason}</div>
        </div>
      ) : null}

      <div className="invoice-print__section">
        <div className="invoice-print__section-title">Patient Information</div>
        <div className="invoice-print__grid">
          <div>
            <strong>{adjustment.patientName}</strong>
          </div>
          <div>MRN: {adjustment.patientMrn}</div>
          {adjustment.nationalId ? <div>National ID: {adjustment.nationalId}</div> : null}
          {adjustment.mobileNumber ? <div>Mobile: {adjustment.mobileNumber}</div> : null}
        </div>
      </div>

      {isInsurance ? (
        <div className="invoice-print__section">
          <div className="invoice-print__section-title">Insurance Information</div>
          <div className="invoice-print__grid">
            {adjustment.insuranceCompany ? (
              <div>Insurance company: {adjustment.insuranceCompany}</div>
            ) : null}
            {adjustment.payerId ? <div>Payer ID: {adjustment.payerId}</div> : null}
            {adjustment.policyNumber ? <div>Policy #: {adjustment.policyNumber}</div> : null}
            {adjustment.memberNumber ? <div>Member #: {adjustment.memberNumber}</div> : null}
            {adjustment.benefitClass ? <div>Benefit class: {adjustment.benefitClass}</div> : null}
            {adjustment.eligibilityReference ? (
              <div>Eligibility #: {adjustment.eligibilityReference}</div>
            ) : null}
            {adjustment.claimReference ? <div>Claim #: {adjustment.claimReference}</div> : null}
            {adjustment.providerName ? <div>Provider: {adjustment.providerName}</div> : null}
            {adjustment.providerId ? <div>Provider ID: {adjustment.providerId}</div> : null}
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
            {adjustment.items.length > 0 ? (
              adjustment.items.map((item, index) => (
                <tr key={`${item.serviceName}-${index}`}>
                  <td>{item.serviceName}</td>
                  <td>{item.serviceType}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice, adjustment.currency)}</td>
                  {isInsurance ? (
                    <>
                      <td>{formatMoney(item.patientShare ?? 0, adjustment.currency)}</td>
                      <td>{formatMoney(item.insuranceShare ?? 0, adjustment.currency)}</td>
                    </>
                  ) : (
                    <td>{formatMoney(item.amount, adjustment.currency)}</td>
                  )}
                  <td>{formatMoney(item.taxAmount ?? 0, adjustment.currency)}</td>
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
          <span>{formatMoney(adjustment.totals.grossAmount, adjustment.currency)}</span>
        </div>
        <div className="invoice-print__total-row">
          <span>Tax (VAT)</span>
          <span>{formatMoney(adjustment.totals.taxAmount, adjustment.currency)}</span>
        </div>
        <div className="invoice-print__total-row invoice-print__total-row--highlight">
          <span>{isCredit ? 'Total credit amount' : 'Total debit amount'}</span>
          <span>{formatMoney(adjustment.totals.netAmount, adjustment.currency)}</span>
        </div>
        {isInsurance ? (
          <>
            <div className="invoice-print__total-row">
              <span>Total patient share</span>
              <span>{formatMoney(adjustment.totals.patientShare, adjustment.currency)}</span>
            </div>
            <div className="invoice-print__total-row">
              <span>Total insurance share</span>
              <span>{formatMoney(adjustment.totals.insuranceShare, adjustment.currency)}</span>
            </div>
          </>
        ) : null}
      </div>

      <div className="invoice-print__footer">
        This is an official {isCredit ? 'credit note' : 'debit note'} document. Please retain it
        for your records.
      </div>
    </div>
  );
};

const AdjustmentPrintModal: React.FC<AdjustmentPrintModalProps> = ({
  open,
  onClose,
  adjustments,
  autoPrint = false
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const hasAutoPrintedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [printVersions, setPrintVersions] = useState<Record<string, InvoicePrintVersion>>({});

  const activeAdjustment = adjustments[activeIndex] ?? null;
  const hasMultiple = adjustments.length > 1;

  const resolvePrintVersion = useCallback(
    (documentNumber: string) =>
      printVersions[documentNumber] ?? getInvoicePrintVersion(documentNumber),
    [printVersions]
  );

  const activePrintVersion = activeAdjustment
    ? resolvePrintVersion(activeAdjustment.documentNumber)
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
      adjustments.reduce<Record<string, InvoicePrintVersion>>((acc, adjustment) => {
        acc[adjustment.documentNumber] = getInvoicePrintVersion(adjustment.documentNumber);
        return acc;
      }, {})
    );
  }, [open, adjustments]);

  useEffect(() => {
    if (!activeAdjustment?.qrCodePayload) {
      setQrDataUrl(undefined);
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(activeAdjustment.qrCodePayload, {
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
  }, [activeAdjustment?.qrCodePayload]);

  const handlePrint = useCallback(() => {
    if (!printRef.current || !activeAdjustment) {
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
          <title>${adjustmentTypeLabel(activeAdjustment.documentType, activeAdjustment.invoiceType)} ${activeAdjustment.documentNumber}</title>
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

    markInvoiceAsPrinted(activeAdjustment.documentNumber);
    setPrintVersions(current => ({
      ...current,
      [activeAdjustment.documentNumber]: 'COPY'
    }));
  }, [activeAdjustment]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!autoPrint || adjustments.length === 0 || hasAutoPrintedRef.current) {
      return;
    }

    hasAutoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      handlePrint();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [open, autoPrint, adjustments.length, handlePrint]);

  if (!activeAdjustment) {
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
          {adjustmentTypeLabel(activeAdjustment.documentType, activeAdjustment.invoiceType)} —{' '}
          {activeAdjustment.documentNumber}
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
              Document {activeIndex + 1} of {adjustments.length}
            </span>
            <MyButton
              appearance="subtle"
              disabled={activeIndex >= adjustments.length - 1}
              onClick={() => setActiveIndex(index => Math.min(adjustments.length - 1, index + 1))}
            >
              Next <FontAwesomeIcon icon={faChevronRight} />
            </MyButton>
          </div>
        ) : null}

        <div className="invoice-print-modal__paper" ref={printRef}>
          <AdjustmentDocument
            adjustment={activeAdjustment}
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

export default AdjustmentPrintModal;
