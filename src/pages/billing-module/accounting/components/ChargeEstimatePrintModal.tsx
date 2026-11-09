import React, { useCallback, useRef } from 'react';
import { Modal } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import { INVOICE_PRINT_CSS, INVOICE_PRINT_PAGE_CSS } from '@/pages/billing-module/invoices/invoicePrintStyles';
import { formatMoney } from '../utils/billingAccountingUtils';
import {
  formatEstimateQuantity,
  type ChargeEstimatePrintData
} from '../utils/chargeEstimatePrintUtils';

import '@/pages/billing-module/invoices/styles.less';

type ChargeEstimatePrintModalProps = {
  open: boolean;
  onClose: () => void;
  estimate: ChargeEstimatePrintData | null;
};

const ChargeEstimateDocument: React.FC<{ estimate: ChargeEstimatePrintData }> = ({
  estimate
}) => {
  const isInsurance = estimate.coverageType === 'INSURANCE';

  return (
    <div className="invoice-print invoice-print--unofficial">
      <div className="invoice-print__watermark">Unofficial</div>

      <div className="invoice-print__unofficial-banner">
        <strong>Not an official invoice</strong>
        <span>
          This is a preliminary charge estimate so the patient can see what may be due
          before an official invoice is issued. It has no document number and is not
          saved to financial documents.
        </span>
      </div>

      <div className="invoice-print__header">
        <div className="invoice-print__stamp">
          <div className="invoice-print__stamp-title">Unofficial</div>
          <div className="invoice-print__stamp-sub">Not an invoice</div>
        </div>

        <div className="invoice-print__header-main">
          <div className="invoice-print__brand">{estimate.facilityName}</div>
          <div className="invoice-print__subtitle">Preliminary charge estimate</div>
          {(estimate.facilityAddress || estimate.vatRegistrationNumber) && (
            <div className="invoice-print__facility-meta">
              {estimate.facilityAddress ? <span>{estimate.facilityAddress}</span> : null}
              {estimate.facilityAddress && estimate.vatRegistrationNumber ? (
                <span className="invoice-print__facility-meta-sep"> · </span>
              ) : null}
              {estimate.vatRegistrationNumber ? (
                <span>VAT: {estimate.vatRegistrationNumber}</span>
              ) : null}
            </div>
          )}
        </div>

        <div className="invoice-print__meta">
          <div className="invoice-print__version invoice-print__version--copy">
            Estimate only
          </div>
          <div className="invoice-print__meta-grid">
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Invoice No.</span>
              <span>Not issued</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Printed</span>
              <span>{estimate.printedAt}</span>
            </div>
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Visit</span>
              <span className="invoice-print__sequence">{estimate.visitNumber}</span>
            </div>
            {estimate.visitDate ? (
              <div className="invoice-print__meta-item">
                <span className="invoice-print__meta-label">Visit date</span>
                <span>{estimate.visitDate}</span>
              </div>
            ) : null}
            <div className="invoice-print__meta-item">
              <span className="invoice-print__meta-label">Status</span>
              <span className="invoice-print__status invoice-print__status--estimate">
                Unofficial
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-print__section">
        <div className="invoice-print__section-title">Patient Information</div>
        <div className="invoice-print__grid">
          <div>
            <strong>{estimate.patientName}</strong>
          </div>
          <div>MRN: {estimate.patientMrn}</div>
          {estimate.nationalId ? <div>National ID: {estimate.nationalId}</div> : null}
          {estimate.mobileNumber ? <div>Mobile: {estimate.mobileNumber}</div> : null}
        </div>
      </div>

      {isInsurance ? (
        <div className="invoice-print__section">
          <div className="invoice-print__section-title">Insurance Information</div>
          <div className="invoice-print__grid">
            {estimate.insuranceCompany ? (
              <div>Insurance company: {estimate.insuranceCompany}</div>
            ) : null}
            {estimate.policyNumber ? <div>Policy #: {estimate.policyNumber}</div> : null}
            {estimate.memberNumber ? <div>Member #: {estimate.memberNumber}</div> : null}
            {estimate.benefitClass ? <div>Benefit class: {estimate.benefitClass}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="invoice-print__section">
        <div className="invoice-print__section-title">Services &amp; products</div>
        <table className="invoice-print__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Net</th>
              <th>Patient Share</th>
              {isInsurance ? <th>Insurance Share</th> : null}
              <th>Applied</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items.length > 0 ? (
              estimate.items.map((item, index) => (
                <tr key={`${item.itemCode}-${item.itemName}-${index}`}>
                  <td>
                    <div>{item.itemName}</div>
                    {item.itemCode !== '-' ? (
                      <div className="invoice-print__facility-meta">{item.itemCode}</div>
                    ) : null}
                  </td>
                  <td>{item.itemType}</td>
                  <td>{formatEstimateQuantity(item.quantity)}</td>
                  <td>{formatMoney(item.unitPrice, estimate.currency)}</td>
                  <td>{formatMoney(item.netAmount, estimate.currency)}</td>
                  <td>{formatMoney(item.patientShare, estimate.currency)}</td>
                  {isInsurance ? (
                    <td>{formatMoney(item.insuranceShare, estimate.currency)}</td>
                  ) : null}
                  <td>{formatMoney(item.appliedAmount, estimate.currency)}</td>
                  <td>{formatMoney(item.remainingAmount, estimate.currency)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isInsurance ? 9 : 8}>No services or products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="invoice-print__totals">
        <div className="invoice-print__total-row">
          <span>Services &amp; products total</span>
          <span>{formatMoney(estimate.totals.netAmount, estimate.currency)}</span>
        </div>
        <div className="invoice-print__total-row">
          <span>Patient share</span>
          <span>{formatMoney(estimate.totals.patientShare, estimate.currency)}</span>
        </div>
        {isInsurance ? (
          <div className="invoice-print__total-row">
            <span>Insurance share</span>
            <span>{formatMoney(estimate.totals.insuranceShare, estimate.currency)}</span>
          </div>
        ) : null}
        <div className="invoice-print__total-row">
          <span>Already applied</span>
          <span>{formatMoney(estimate.totals.appliedAmount, estimate.currency)}</span>
        </div>
        {estimate.totals.reservedAmount > 0 ? (
          <div className="invoice-print__total-row">
            <span>Reserved from wallet</span>
            <span>{formatMoney(estimate.totals.reservedAmount, estimate.currency)}</span>
          </div>
        ) : null}
        <div className="invoice-print__total-row invoice-print__total-row--highlight invoice-print__total-row--due">
          <span>Estimated amount due now</span>
          <span>{formatMoney(estimate.totals.remainingAmount, estimate.currency)}</span>
        </div>
      </div>

      <div className="invoice-print__footer invoice-print__footer--unofficial">
        This is not an official invoice. Amounts may change before invoice issuance.
        Do not use this printout as a financial document.
      </div>
    </div>
  );
};

const ChargeEstimatePrintModal: React.FC<ChargeEstimatePrintModalProps> = ({
  open,
  onClose,
  estimate
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printRef.current || !estimate) {
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
          <title>Unofficial charge estimate</title>
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
  }, [estimate]);

  if (!estimate) {
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
        <Modal.Title>Unofficial charge estimate — not an invoice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <style>{INVOICE_PRINT_CSS}</style>
        <div className="invoice-print-modal__paper" ref={printRef}>
          <ChargeEstimateDocument estimate={estimate} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={onClose}>Close</MyButton>
        <MyButton
          appearance="primary"
          prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
          onClick={handlePrint}
        >
          Print unofficial estimate
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default ChargeEstimatePrintModal;
