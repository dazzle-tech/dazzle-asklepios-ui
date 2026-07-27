import React, { useCallback, useEffect, useRef } from 'react';
import { Modal } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import type { PaymentReceiptData } from './paymentPreviewUtils';
import { markInvoiceAsPrinted } from '@/pages/billing-module/invoices/invoicePrintVersion';

type PaymentReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  receipt: PaymentReceiptData | null;
  autoPrint?: boolean;
};

const formatMoney = (amount: number, currency: string) =>
  `${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;

const RECEIPT_PRINT_STYLES = `
  body { font-family: Arial, sans-serif; color: #1c1c1e; margin: 24px; }
  .payment-receipt { max-width: 760px; margin: 0 auto; }
  .payment-receipt__header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
  .payment-receipt__brand { font-size: 22px; font-weight: 700; color: #0f766e; }
  .payment-receipt__subtitle { margin-top: 4px; font-size: 13px; color: #64748b; }
  .payment-receipt__meta { text-align: right; font-size: 13px; line-height: 1.7; color: #374151; }
  .payment-receipt__sequence { font-family: Consolas, monospace; font-size: 15px; font-weight: 700; color: #111827; }
  .payment-receipt__section { margin-bottom: 18px; }
  .payment-receipt__section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
  .payment-receipt__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .payment-receipt__table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .payment-receipt__table th, .payment-receipt__table td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; font-size: 13px; }
  .payment-receipt__table th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
  .payment-receipt__totals { margin-top: 18px; border-top: 2px solid #e5e7eb; padding-top: 12px; }
  .payment-receipt__total-row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; font-size: 14px; color: #374151; }
  .payment-receipt__total-row--highlight { font-size: 18px; font-weight: 700; color: #0f766e; border-top: 1px dashed #cbd5e1; margin-top: 8px; padding-top: 12px; }
  .payment-receipt__footer { margin-top: 28px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f1f5f9; padding-top: 16px; }
`;

const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  open,
  onClose,
  receipt,
  autoPrint = false
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const hasAutoPrintedRef = useRef(false);

  const handlePrint = useCallback(() => {
    if (!printRef.current) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'aria-hidden',
      'true'
    );
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const printDocument =
      iframe.contentDocument ??
      iframe.contentWindow?.document;

    if (
      !printDocument ||
      !iframe.contentWindow
    ) {
      document.body.removeChild(iframe);
      return;
    }

    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt ${receipt?.receiptNumber ?? ''}</title>
          <style>${RECEIPT_PRINT_STYLES}</style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printDocument.close();

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(
          iframe
        );
      }
    };

    iframe.contentWindow.onafterprint = cleanup;

    if (receipt?.receiptNumber) {
      markInvoiceAsPrinted(receipt.receiptNumber);
    }

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    window.setTimeout(cleanup, 2000);
  }, [receipt?.receiptNumber]);

  useEffect(() => {
    if (!open) {
      hasAutoPrintedRef.current = false;
      return;
    }

    if (
      !autoPrint ||
      !receipt ||
      hasAutoPrintedRef.current
    ) {
      return;
    }

    hasAutoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      handlePrint();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, autoPrint, receipt, handlePrint]);

  if (!receipt) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      overflow={false}
      enforceFocus={false}
      backdrop="static"
      container={document.body}
      className="payment-receipt-modal"
    >
      <Modal.Header>
        <Modal.Title>Payment Receipt</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={printRef} className="payment-receipt">
          <div className="payment-receipt__header">
            <div>
              <div className="payment-receipt__brand">{receipt.facilityName}</div>
              <div className="payment-receipt__subtitle">Official payment receipt</div>
            </div>
            <div className="payment-receipt__meta">
              <div>
                Receipt No.{' '}
                <span className="payment-receipt__sequence">{receipt.receiptNumber}</span>
              </div>
              {receipt.transactionNumber && receipt.transactionNumber !== '-' ? (
                <div>
                  Transaction No.{' '}
                  <span className="payment-receipt__sequence">{receipt.transactionNumber}</span>
                </div>
              ) : null}
              <div>{receipt.paymentDate}</div>
              {receipt.chargeNumber && receipt.chargeNumber !== '-' ? (
                <div>
                  Charge No.{' '}
                  <span className="payment-receipt__sequence">{receipt.chargeNumber}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="payment-receipt__section">
            <div className="payment-receipt__section-title">Patient</div>
            <div className="payment-receipt__grid">
              <div>
                <strong>{receipt.patientName}</strong>
              </div>
              <div>MRN: {receipt.patientMrn}</div>
              <div>Encounter: {receipt.encounterNumber}</div>
              <div>Coverage: {receipt.coverageType}</div>
            </div>
          </div>

          <div className="payment-receipt__section">
            <div className="payment-receipt__section-title">Services</div>
            <table className="payment-receipt__table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Service Type</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Net</th>
                  <th>Patient Share</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPrice, receipt.currency)}</td>
                    <td>{formatMoney(item.netAmount, receipt.currency)}</td>
                    <td>{formatMoney(item.patientShare, receipt.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="payment-receipt__totals">
            <div className="payment-receipt__total-row">
              <span>Gross amount</span>
              <span>{formatMoney(receipt.totals.grossAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Discount</span>
              <span>{formatMoney(receipt.totals.discountAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Exemption</span>
              <span>{formatMoney(receipt.totals.exemptionAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Tax</span>
              <span>{formatMoney(receipt.totals.taxAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Net amount</span>
              <span>{formatMoney(receipt.totals.netAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Patient share</span>
              <span>{formatMoney(receipt.totals.patientResponsibilityAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row payment-receipt__total-row--highlight">
              <span>Amount received</span>
              <span>{formatMoney(receipt.paymentAmount, receipt.currency)}</span>
            </div>
            <div className="payment-receipt__total-row">
              <span>Payment method</span>
              <span>{receipt.paymentMethod}</span>
            </div>
          </div>

          {receipt.notes ? (
            <div className="payment-receipt__section">
              <div className="payment-receipt__section-title">Notes</div>
              <div>{receipt.notes}</div>
            </div>
          ) : null}

          <div className="payment-receipt__footer">
            Thank you for your payment. Please keep this receipt for your records.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={onClose}>Close</MyButton>
        <MyButton appearance="primary" prefixIcon={() => <FontAwesomeIcon icon={faPrint} />} onClick={handlePrint}>
          Print receipt
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentReceiptModal;
