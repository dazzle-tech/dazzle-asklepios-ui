import React, { useEffect, useMemo, useState } from 'react';
import { Form, InputNumber, Modal, Radio, RadioGroup, SelectPicker, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import type {
  CreateDiscountCreditNoteRequest,
  DiscountCreditNotePreviewResponse,
  DiscountCreditScope,
  InvoiceAdjustmentSummary,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import { usePreviewDiscountCreditNoteMutation } from '@/services/billing/financialDocumentAdjustmentService';
import './styles.less';

type DiscountValueMode = 'AMOUNT' | 'PERCENT';

type DiscountCreditNoteModalProps = {
  open: boolean;
  invoice: PatientFinancialInvoice | null;
  summary?: InvoiceAdjustmentSummary | null;
  invoiceLines?: InvoiceLineItem[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDiscountCreditNoteRequest) => Promise<void>;
};

const formatMoney = (value?: number, currency = 'SAR') => {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2)} ${currency}`;
};

const lineDiscountBase = (line: InvoiceLineItem) => {
  const net = Number(line.netAmount ?? 0);
  const remaining = Number(line.remainingAmount ?? 0);
  const paid = Number(line.paidAmount ?? 0);
  const collected = remaining + paid;

  if (net <= 0) {
    return 0;
  }

  if (collected <= 0) {
    return net;
  }

  return Math.min(net, collected);
};

const hasDiscountableBalance = (line: InvoiceLineItem) =>
  lineDiscountBase(line) > 0.0001;

const DiscountCreditNoteModal: React.FC<DiscountCreditNoteModalProps> = ({
  open,
  invoice,
  summary,
  invoiceLines = [],
  loading = false,
  onClose,
  onSubmit
}) => {
  const currency = summary?.currency ?? invoice?.currency ?? 'SAR';
  const [scope, setScope] = useState<DiscountCreditScope>('LINE');
  const [documentItemId, setDocumentItemId] = useState<number | null>(null);
  const [valueMode, setValueMode] = useState<DiscountValueMode>('AMOUNT');
  const [form, setForm] = useState({
    discountAmount: '',
    discountPercent: '',
    reason: ''
  });
  const [preview, setPreview] = useState<DiscountCreditNotePreviewResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [previewDiscountCreditNote, { isLoading: previewLoading }] =
    usePreviewDiscountCreditNoteMutation();

  const creditableLines = useMemo(
    () => invoiceLines.filter(hasDiscountableBalance),
    [invoiceLines]
  );

  const lineOptions = useMemo(
    () =>
      creditableLines.map(line => ({
        label: `${line.itemDescription ?? line.itemCode ?? 'Service'} — up to ${formatMoney(
          lineDiscountBase(line),
          currency
        )}`,
        value: line.id
      })),
    [creditableLines, currency]
  );

  const selectedLine = useMemo(
    () => creditableLines.find(line => line.id === documentItemId) ?? null,
    [creditableLines, documentItemId]
  );

  const totalRemaining = useMemo(
    () =>
      creditableLines.reduce((sum, line) => sum + lineDiscountBase(line), 0),
    [creditableLines]
  );

  useEffect(() => {
    if (!open) {
      setScope('LINE');
      setDocumentItemId(null);
      setValueMode('AMOUNT');
      setForm({ discountAmount: '', discountPercent: '', reason: '' });
      setPreview(null);
      setSubmitting(false);
      return;
    }

    if (creditableLines.length === 1) {
      setDocumentItemId(creditableLines[0].id);
    }
  }, [open, creditableLines]);

  useEffect(() => {
    setPreview(null);
  }, [scope, documentItemId, valueMode, form.discountAmount, form.discountPercent]);

  const buildRequest = (): CreateDiscountCreditNoteRequest | null => {
    const parsedAmount = Number(form.discountAmount);
    const parsedPercent = Number(form.discountPercent);

    if (scope === 'LINE' && documentItemId == null) {
      return null;
    }

    if (valueMode === 'AMOUNT') {
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return null;
      }

      return {
        scope,
        documentItemId: scope === 'LINE' ? documentItemId ?? undefined : undefined,
        discountAmount: parsedAmount,
        reason: form.reason.trim() || undefined
      };
    }

    if (!Number.isFinite(parsedPercent) || parsedPercent <= 0 || parsedPercent > 100) {
      return null;
    }

    return {
      scope,
      documentItemId: scope === 'LINE' ? documentItemId ?? undefined : undefined,
      discountPercent: parsedPercent,
      reason: form.reason.trim() || undefined
    };
  };

  const handlePreview = async () => {
    const body = buildRequest();
    if (!invoice?.id || !body) {
      return;
    }

    const result = await previewDiscountCreditNote({
      invoiceId: invoice.id,
      body
    }).unwrap();

    setPreview(result);
  };

  const handleSubmit = async () => {
    const body = buildRequest();
    if (!body) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(body);
    } finally {
      setSubmitting(false);
    }
  };

  const canPreview = buildRequest() != null;
  const canSubmit = canPreview && preview != null;

  const previewColumns = [
    {
      key: 'service',
      title: 'Service',
      render: (row: DiscountCreditNotePreviewResponse['lines'][number]) =>
        row.itemDescription ?? row.itemCode ?? `#${row.documentItemId}`
    },
    {
      key: 'before',
      title: 'Available before',
      render: (row: DiscountCreditNotePreviewResponse['lines'][number]) =>
        formatMoney(row.lineRemainingBefore, currency)
    },
    {
      key: 'discount',
      title: 'Discount',
      render: (row: DiscountCreditNotePreviewResponse['lines'][number]) => (
        <span className="invoice-detail__amount-discount">
          -{formatMoney(row.discountAmount, currency)}
        </span>
      )
    },
    {
      key: 'after',
      title: 'Available after',
      render: (row: DiscountCreditNotePreviewResponse['lines'][number]) =>
        formatMoney(row.lineRemainingAfter, currency)
    }
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      overflow={false}
      className="discount-credit-note-modal"
    >
      <Modal.Header>
        <Modal.Title>Discount credit note</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Text muted size="sm" className="discount-credit-note-modal__intro">
          Issue a patient invoice discount as a credit note. Outstanding balance is reduced;
          invoice totals stay unchanged.
        </Text>

        <Form fluid className="discount-credit-note-modal__form">
          <Form.Group>
            <Form.ControlLabel>Discount scope</Form.ControlLabel>
            <RadioGroup
              inline
              value={scope}
              onChange={value => setScope(value as DiscountCreditScope)}
            >
              <Radio value="LINE">Line discount</Radio>
              <Radio value="INVOICE">Invoice discount</Radio>
            </RadioGroup>
          </Form.Group>

          {scope === 'LINE' ? (
            <Form.Group>
              <Form.ControlLabel>Invoice line</Form.ControlLabel>
              <SelectPicker
                block
                searchable
                cleanable={false}
                data={lineOptions}
                value={documentItemId}
                onChange={value => setDocumentItemId(value as number | null)}
                placeholder="Select invoice line"
              />
              {selectedLine ? (
                <Text muted size="sm">
                  Discount up to: {formatMoney(lineDiscountBase(selectedLine), currency)}
                  {Number(selectedLine.paidAmount ?? 0) > 0.0001 &&
                  Number(selectedLine.remainingAmount ?? 0) <= 0.0001
                    ? ' (paid line — excess goes to wallet refund)'
                    : null}
                </Text>
              ) : creditableLines.length === 0 ? (
                <Text muted size="sm">
                  No invoice lines were returned. Refresh the invoice and try again.
                </Text>
              ) : null}
            </Form.Group>
          ) : (
            <Text muted size="sm">
              Total discountable amount across lines: {formatMoney(totalRemaining, currency)}
            </Text>
          )}

          <Form.Group>
            <Form.ControlLabel>Discount type</Form.ControlLabel>
            <RadioGroup
              inline
              value={valueMode}
              onChange={value => setValueMode(value as DiscountValueMode)}
            >
              <Radio value="AMOUNT">Fixed amount</Radio>
              <Radio value="PERCENT">Percentage</Radio>
            </RadioGroup>
          </Form.Group>

          {valueMode === 'AMOUNT' ? (
            <Form.Group>
              <Form.ControlLabel>Discount amount ({currency})</Form.ControlLabel>
              <InputNumber
                min={0.01}
                step={0.01}
                value={form.discountAmount === '' ? null : Number(form.discountAmount)}
                onChange={value =>
                  setForm(current => ({
                    ...current,
                    discountAmount: value == null ? '' : String(value)
                  }))
                }
                placeholder="0.00"
              />
            </Form.Group>
          ) : (
            <Form.Group>
              <Form.ControlLabel>Discount percent (%)</Form.ControlLabel>
              <InputNumber
                min={0.01}
                max={100}
                step={0.01}
                value={form.discountPercent === '' ? null : Number(form.discountPercent)}
                onChange={value =>
                  setForm(current => ({
                    ...current,
                    discountPercent: value == null ? '' : String(value)
                  }))
                }
                placeholder="10"
              />
            </Form.Group>
          )}

          <MyInput
            column
            fieldType="textarea"
            fieldLabel="Reason (optional)"
            fieldName="reason"
            record={form}
            setRecord={setForm}
            width="100%"
            placeholder="Manager approval, loyalty discount, etc."
          />
        </Form>

        {preview ? (
          <div className="discount-credit-note-modal__preview">
            <div className="discount-credit-note-modal__preview-summary">
              <div>
                <span className="discount-credit-note-modal__preview-label">Outstanding before</span>
                <strong>{formatMoney(preview.outstandingBefore, currency)}</strong>
              </div>
              <div>
                <span className="discount-credit-note-modal__preview-label">Total discount</span>
                <strong className="invoice-detail__amount-discount">
                  -{formatMoney(preview.totalDiscount, currency)}
                </strong>
              </div>
              <div>
                <span className="discount-credit-note-modal__preview-label">Outstanding after</span>
                <strong>{formatMoney(preview.outstandingAfter, currency)}</strong>
              </div>
            </div>

            <MyTable
              data={preview.lines.map(line => ({ key: String(line.documentItemId), ...line }))}
              columns={previewColumns}
              height={Math.min(280, 56 + preview.lines.length * 42)}
            />
          </div>
        ) : null}
      </Modal.Body>

      <Modal.Footer>
        <MyButton appearance="subtle" onClick={onClose} disabled={loading || submitting}>
          Cancel
        </MyButton>
        <MyButton
          appearance="ghost"
          loading={previewLoading}
          disabled={!canPreview || loading || submitting}
          onClick={handlePreview}
        >
          Preview
        </MyButton>
        <MyButton
          appearance="primary"
          loading={loading || submitting}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Issue credit note
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default DiscountCreditNoteModal;
