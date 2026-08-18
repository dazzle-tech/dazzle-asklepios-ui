import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Modal, Text } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import type { PatientFinancialInvoice } from '@/services/billing/invoiceGenerationService';
import type {
  AddableChargeLine,
  CreateAdjustmentRequest,
  InvoiceAdjustmentSummary,
  InvoiceLineAdjustmentRequest,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import AddBillingServiceProductModal, {
  type PendingNewServiceLine
} from './AddBillingServiceProductModal';
import {
  lineNetAmount,
  projectInvoiceLineNetAfterChange,
  resolvePricingBreakdown
} from './invoiceLinePricingUtils';
import './styles.less';

type AdjustmentKind = 'CREDIT_NOTE' | 'DEBIT_NOTE';

type CreditLineDraft = {
  lineId: number;
  enabled: boolean;
  action: 'REMOVE' | 'PARTIAL_CREDIT' | 'REDUCE';
  amount: number;
  quantity: number;
  unitPrice: number;
};

type DebitAddDraft = {
  chargeLineId: number;
  enabled: boolean;
};

type DebitIncreaseDraft = {
  lineId: number;
  enabled: boolean;
  quantity: number;
  unitPrice: number;
};

type InvoiceAdjustmentModalProps = {
  open: boolean;
  kind: AdjustmentKind;
  invoice: PatientFinancialInvoice | null;
  summary?: InvoiceAdjustmentSummary | null;
  invoiceLines?: InvoiceLineItem[];
  addableChargeLines?: AddableChargeLine[];
  patientId?: number | null;
  encounterId?: number | null;
  facilityId?: number | null;
  patientInsuranceId?: number | null;
  loading?: boolean;
  loadingLines?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdjustmentRequest) => Promise<void>;
};

const kindLabel = (kind: AdjustmentKind) =>
  kind === 'CREDIT_NOTE' ? 'Credit Note' : 'Debit Note';

const formatMoney = (value?: number, currency = 'SAR') => {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2)} ${currency}`;
};

const renderDiscount = (amount: number, currency: string) =>
  amount > 0 ? (
    <span className="invoice-detail__amount-discount">-{formatMoney(amount, currency)}</span>
  ) : (
    formatMoney(0, currency)
  );

const createPricingColumns = (
  currency: string,
  getRow: (row: any) => Parameters<typeof resolvePricingBreakdown>[0]
) => [
  {
    key: 'price',
    title: 'Price',
    render: (row: any) => formatMoney(resolvePricingBreakdown(getRow(row)).grossAmount, currency)
  },
  {
    key: 'itemDiscountAmount',
    title: 'Item disc.',
    render: (row: any) =>
      renderDiscount(resolvePricingBreakdown(getRow(row)).itemDiscountAmount, currency)
  },
  {
    key: 'itemTaxAmount',
    title: 'Item tax',
    render: (row: any) =>
      formatMoney(resolvePricingBreakdown(getRow(row)).itemTaxAmount, currency)
  },
  {
    key: 'invoiceDiscountAmount',
    title: 'Inv. disc.',
    render: (row: any) =>
      renderDiscount(resolvePricingBreakdown(getRow(row)).invoiceDiscountAmount, currency)
  },
  {
    key: 'invoiceTaxAmount',
    title: 'Inv. tax',
    render: (row: any) =>
      formatMoney(resolvePricingBreakdown(getRow(row)).invoiceTaxAmount, currency)
  },
  {
    key: 'netAmount',
    title: 'Net',
    render: (row: any) => (
      <strong>{formatMoney(resolvePricingBreakdown(getRow(row)).netAmount, currency)}</strong>
    )
  }
];

const creditActionOptions = [
  { label: 'Remove service', value: 'REMOVE' },
  { label: 'Partial credit', value: 'PARTIAL_CREDIT' },
  { label: 'Update qty/price (reduce)', value: 'REDUCE' }
];

const actionLabel = (action?: string) => {
  switch (String(action ?? '').toUpperCase()) {
    case 'REMOVE':
      return 'Remove';
    case 'PARTIAL_CREDIT':
      return 'Partial credit';
    case 'REDUCE':
      return 'Reduce';
    case 'ADD':
      return 'Add from visit';
    case 'ADD_NEW':
      return 'Add new service';
    case 'INCREASE':
      return 'Increase';
    default:
      return action ?? '-';
  }
};

const hasCreditableBalance = (line: InvoiceLineItem) =>
  Number(line.remainingAmount ?? 0) > 0.0001 ||
  (Number(line.netAmount ?? 0) > 0.0001 && Number(line.paidAmount ?? 0) > 0.0001);

const InvoiceAdjustmentModal: React.FC<InvoiceAdjustmentModalProps> = ({
  open,
  kind,
  invoice,
  summary,
  invoiceLines = [],
  addableChargeLines = [],
  patientId,
  encounterId,
  facilityId,
  patientInsuranceId,
  loading = false,
  loadingLines = false,
  onClose,
  onSubmit
}) => {
  const currency = invoice?.currency ?? summary?.currency ?? 'SAR';
  const [form, setForm] = useState({ reason: '' });
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [pendingNewServices, setPendingNewServices] = useState<PendingNewServiceLine[]>([]);
  const [creditDrafts, setCreditDrafts] = useState<CreditLineDraft[]>([]);
  const [debitAdds, setDebitAdds] = useState<DebitAddDraft[]>([]);
  const [debitIncreases, setDebitIncreases] = useState<DebitIncreaseDraft[]>([]);

  const creditableLines = useMemo(
    () => invoiceLines.filter(hasCreditableBalance),
    [invoiceLines]
  );

  const invoiceOnlyLines = useMemo(
    () =>
      invoiceLines.filter(
        line => String(line.lineSource ?? 'INVOICE').toUpperCase() !== 'DEBIT_NOTE'
      ),
    [invoiceLines]
  );

  useEffect(() => {
    if (!open) {
      setForm({ reason: '' });
      setCreditDrafts([]);
      setDebitAdds([]);
      setDebitIncreases([]);
      setPendingNewServices([]);
      return;
    }

    if (kind === 'CREDIT_NOTE') {
      setCreditDrafts(
        creditableLines.map(line => ({
          lineId: line.id,
          enabled: false,
          action: 'REMOVE',
          amount: Number(line.netAmount ?? line.remainingAmount ?? 0),
          quantity: Number(line.quantity ?? 1),
          unitPrice: Number(line.unitPrice ?? 0)
        }))
      );
    } else {
      setDebitAdds(
        addableChargeLines.map(line => ({
          chargeLineId: line.chargeLineId,
          enabled: false
        }))
      );
      setDebitIncreases(
        invoiceOnlyLines.map(line => ({
          lineId: line.id,
          enabled: false,
          quantity: Number(line.quantity ?? 1),
          unitPrice: Number(line.unitPrice ?? 0)
        }))
      );
    }
  }, [open, kind, creditableLines, addableChargeLines, invoiceOnlyLines, invoice?.id]);

  const selectedCreditTotal = useMemo(() => {
    return creditDrafts.reduce((sum, draft) => {
      if (!draft.enabled) return sum;
      const line = invoiceLines.find(item => item.id === draft.lineId);
      if (!line) return sum;

      if (draft.action === 'REMOVE') {
        return sum + Number(line.netAmount ?? 0);
      }
      if (draft.action === 'PARTIAL_CREDIT') {
        return sum + Number(draft.amount ?? 0);
      }
      const oldNet = lineNetAmount(line);
      const projectedNet = projectInvoiceLineNetAfterChange(
        line,
        Number(draft.quantity ?? 0),
        Number(draft.unitPrice ?? 0),
        invoice?.documentSubtype
      );
      return sum + Math.max(0, oldNet - projectedNet);
    }, 0);
  }, [creditDrafts, invoiceLines, invoice?.documentSubtype]);

  const selectedCreditOutstandingReduction = useMemo(() => {
    return creditDrafts.reduce((sum, draft) => {
      if (!draft.enabled) return sum;
      const line = invoiceLines.find(item => item.id === draft.lineId);
      if (!line) return sum;

      if (draft.action === 'REMOVE') {
        return sum + Number(line.remainingAmount ?? 0);
      }
      if (draft.action === 'PARTIAL_CREDIT') {
        const partialAmount = Number(draft.amount ?? 0);
        const remainingOnLine = Number(line.remainingAmount ?? 0);
        // Only the unpaid portion reduces invoice outstanding; the rest is a refund on paid lines.
        return sum + Math.min(partialAmount, remainingOnLine);
      }
      const oldNet = lineNetAmount(line);
      const projectedNet = projectInvoiceLineNetAfterChange(
        line,
        Number(draft.quantity ?? 0),
        Number(draft.unitPrice ?? 0),
        invoice?.documentSubtype
      );
      const credit = Math.max(0, Math.min(Number(line.remainingAmount ?? 0), oldNet - projectedNet));
      return sum + credit;
    }, 0);
  }, [creditDrafts, invoiceLines, invoice?.documentSubtype]);

  const creditWithinLineLimits = useMemo(
    () =>
      creditDrafts.every(draft => {
        if (!draft.enabled) return true;
        const line = invoiceLines.find(item => item.id === draft.lineId);
        if (!line) return true;

        if (draft.action === 'PARTIAL_CREDIT') {
          const amount = Number(draft.amount ?? 0);
          const maxLineCredit = Number(line.netAmount ?? line.remainingAmount ?? 0);
          return amount > 0.0001 && amount <= maxLineCredit + 0.0001;
        }

        if (draft.action === 'REDUCE') {
          const oldNet = lineNetAmount(line);
          const projectedNet = projectInvoiceLineNetAfterChange(
            line,
            Number(draft.quantity ?? 0),
            Number(draft.unitPrice ?? 0),
            invoice?.documentSubtype
          );
          return oldNet - projectedNet > 0.0001;
        }

        return true;
      }),
    [creditDrafts, invoiceLines, invoice?.documentSubtype]
  );

  const selectedDebitTotal = useMemo(() => {
    const addTotal = debitAdds.reduce((sum, draft) => {
      if (!draft.enabled) return sum;
      const line = addableChargeLines.find(item => item.chargeLineId === draft.chargeLineId);
      if (!line) return sum;
      const share =
        invoice?.documentSubtype === 'INSURANCE_CLAIM'
          ? Number(line.insuranceShareAmount ?? line.netAmount ?? 0)
          : Number(line.patientShareAmount ?? line.netAmount ?? 0);
      return sum + share;
    }, 0);

    const increaseTotal = debitIncreases.reduce((sum, draft) => {
      if (!draft.enabled) return sum;
      const line = invoiceOnlyLines.find(item => item.id === draft.lineId);
      if (!line) return sum;
      const oldNet = lineNetAmount(line);
      const projectedNet = projectInvoiceLineNetAfterChange(
        line,
        Number(draft.quantity ?? 0),
        Number(draft.unitPrice ?? 0),
        invoice?.documentSubtype
      );
      return sum + Math.max(0, projectedNet - oldNet);
    }, 0);

    return addTotal + increaseTotal + pendingNewServices.reduce((sum, line) => {
      if (invoice?.documentSubtype === 'INSURANCE_CLAIM' && line.insuranceShareAmount != null) {
        return sum + Number(line.insuranceShareAmount);
      }
      if (line.patientShareAmount != null) {
        return sum + Number(line.patientShareAmount);
      }
      if (line.netAmount != null) {
        return sum + Number(line.netAmount);
      }
      const qty = Number(line.quantity ?? 0);
      const unitPrice = Number(line.unitPrice ?? 0);
      return sum + qty * unitPrice;
    }, 0);
  }, [debitAdds, debitIncreases, addableChargeLines, invoiceOnlyLines, invoice?.documentSubtype, pendingNewServices]);

  const buildCreditLines = (): InvoiceLineAdjustmentRequest[] =>
    creditDrafts
      .filter(draft => draft.enabled)
      .map(draft => {
        if (draft.action === 'REMOVE') {
          return { action: 'REMOVE', documentItemId: draft.lineId };
        }
        if (draft.action === 'PARTIAL_CREDIT') {
          return {
            action: 'PARTIAL_CREDIT',
            documentItemId: draft.lineId,
            amount: draft.amount
          };
        }
        return {
          action: 'REDUCE',
          documentItemId: draft.lineId,
          quantity: draft.quantity,
          unitPrice: draft.unitPrice
        };
      });

  const buildDebitLines = (): InvoiceLineAdjustmentRequest[] => {
    const addLines = debitAdds
      .filter(draft => draft.enabled)
      .map(draft => ({
        action: 'ADD' as const,
        chargeLineId: draft.chargeLineId
      }));

    const increaseLines = debitIncreases
      .filter(draft => draft.enabled)
      .map(draft => ({
        action: 'INCREASE' as const,
        documentItemId: draft.lineId,
        quantity: draft.quantity,
        unitPrice: draft.unitPrice
      }));

    return [...addLines, ...increaseLines, ...pendingNewServices.map(({ tempId, itemLabel, ...line }) => line)];
  };

  const selectedLineCount =
    kind === 'CREDIT_NOTE'
      ? creditDrafts.filter(draft => draft.enabled).length
      : debitAdds.filter(draft => draft.enabled).length +
        debitIncreases.filter(draft => draft.enabled).length +
        pendingNewServices.length;

  const totalAmount = kind === 'CREDIT_NOTE' ? selectedCreditTotal : selectedDebitTotal;
  const maxCredit = Number(summary?.outstandingBalance ?? 0);
  const creditExceedsOutstanding =
    kind === 'CREDIT_NOTE' && selectedCreditOutstandingReduction > maxCredit + 0.0001;
  const creditWithinLimit =
    kind !== 'CREDIT_NOTE' ||
    (!creditExceedsOutstanding && creditWithinLineLimits);

  const handleSubmit = async () => {
    const lines = kind === 'CREDIT_NOTE' ? buildCreditLines() : buildDebitLines();
    if (!lines.length) return;

    await onSubmit({
      reason: form.reason.trim(),
      lines
    });
  };

  const creditColumns = [
    {
      key: 'select',
      title: '',
      width: 48,
      render: (row: InvoiceLineItem) => {
        const draft = creditDrafts.find(item => item.lineId === row.id);
        return (
          <Checkbox
            checked={draft?.enabled ?? false}
            onChange={(_, checked) =>
              setCreditDrafts(current =>
                current.map(item =>
                  item.lineId === row.id ? { ...item, enabled: checked } : item
                )
              )
            }
          />
        );
      }
    },
    { key: 'itemCode', title: 'Code', render: (row: InvoiceLineItem) => row.itemCode ?? '-' },
    {
      key: 'itemDescription',
      title: 'Service',
      render: (row: InvoiceLineItem) =>
        row.lineSource === 'DEBIT_NOTE'
          ? `[Debit note] ${row.itemDescription ?? '-'}`
          : row.itemDescription ?? '-'
    },
    { key: 'quantity', title: 'Qty' },
    {
      key: 'unitPrice',
      title: 'Unit Price',
      render: (row: InvoiceLineItem) => formatMoney(row.unitPrice, currency)
    },
    {
      key: 'netAmount',
      title: 'Net',
      render: (row: InvoiceLineItem) => formatMoney(row.netAmount, currency)
    },
    {
      key: 'remainingAmount',
      title: 'Remaining',
      render: (row: InvoiceLineItem) => formatMoney(row.remainingAmount, currency)
    },
    {
      key: 'action',
      title: 'Action',
      render: (row: InvoiceLineItem) => {
        const draft = creditDrafts.find(item => item.lineId === row.id);
        if (!draft) return '-';
        return (
          <select
            value={draft.action}
            disabled={!draft.enabled}
            onChange={event =>
              setCreditDrafts(current =>
                current.map(item =>
                  item.lineId === row.id
                    ? {
                        ...item,
                        action: (event.target.value as CreditLineDraft['action']) ?? 'REMOVE'
                      }
                    : item
                )
              )
            }
            className="billing-invoices__inline-input"
            style={{ width: 180 }}
          >
            {creditActionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }
    },
    {
      key: 'details',
      title: 'Details',
      render: (row: InvoiceLineItem) => {
        const draft = creditDrafts.find(item => item.lineId === row.id);
        if (!draft?.enabled) return '-';

        if (draft.action === 'PARTIAL_CREDIT') {
          return (
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.amount}
              onChange={event =>
                setCreditDrafts(current =>
                  current.map(item =>
                    item.lineId === row.id
                      ? { ...item, amount: Number(event.target.value) }
                      : item
                  )
                )
              }
              className="billing-invoices__inline-input"
            />
          );
        }

        if (draft.action === 'REDUCE') {
          return (
            <div className="billing-invoices__inline-fields">
              <input
                type="number"
                min={0}
                step="1"
                value={draft.quantity}
                onChange={event =>
                  setCreditDrafts(current =>
                    current.map(item =>
                      item.lineId === row.id
                        ? { ...item, quantity: Number(event.target.value) }
                        : item
                    )
                  )
                }
                className="billing-invoices__inline-input"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.unitPrice}
                onChange={event =>
                  setCreditDrafts(current =>
                    current.map(item =>
                      item.lineId === row.id
                        ? { ...item, unitPrice: Number(event.target.value) }
                        : item
                    )
                  )
                }
                className="billing-invoices__inline-input"
              />
            </div>
          );
        }

        return actionLabel(draft.action);
      }
    }
  ];

  const addableColumns = [
    {
      key: 'select',
      title: '',
      width: 48,
      render: (row: AddableChargeLine) => {
        const draft = debitAdds.find(item => item.chargeLineId === row.chargeLineId);
        return (
          <Checkbox
            checked={draft?.enabled ?? false}
            onChange={(_, checked) =>
              setDebitAdds(current =>
                current.map(item =>
                  item.chargeLineId === row.chargeLineId
                    ? { ...item, enabled: checked }
                    : item
                )
              )
            }
          />
        );
      }
    },
    { key: 'itemCode', title: 'Code', render: (row: AddableChargeLine) => row.itemCode ?? '-' },
    {
      key: 'itemDescription',
      title: 'Service',
      render: (row: AddableChargeLine) => row.itemDescription ?? '-'
    },
    { key: 'quantity', title: 'Qty' },
    ...createPricingColumns(currency, row => ({
      unitPrice: row.unitPrice,
      grossAmount: row.grossAmount,
      discountAmount: row.discountAmount,
      taxAmount: row.taxAmount,
      netAmount: row.netAmount,
      quantity: row.quantity
    }))
  ];

  const increaseColumns = [
    {
      key: 'select',
      title: '',
      width: 48,
      render: (row: InvoiceLineItem) => {
        const draft = debitIncreases.find(item => item.lineId === row.id);
        return (
          <Checkbox
            checked={draft?.enabled ?? false}
            onChange={(_, checked) =>
              setDebitIncreases(current =>
                current.map(item =>
                  item.lineId === row.id ? { ...item, enabled: checked } : item
                )
              )
            }
          />
        );
      }
    },
    { key: 'itemCode', title: 'Code', render: (row: InvoiceLineItem) => row.itemCode ?? '-' },
    {
      key: 'itemDescription',
      title: 'Service',
      render: (row: InvoiceLineItem) => row.itemDescription ?? '-'
    },
    ...createPricingColumns(currency, row => ({
      unitPrice: row.unitPrice,
      grossAmount: row.grossAmount,
      discountAmount: row.discountAmount,
      taxAmount: row.taxAmount,
      netAmount: row.netAmount,
      quantity: row.quantity,
      appliedDiscounts: row.appliedDiscounts,
      appliedTaxes: row.appliedTaxes
    })),
    {
      key: 'quantity',
      title: 'New Qty',
      render: (row: InvoiceLineItem) => {
        const draft = debitIncreases.find(item => item.lineId === row.id);
        if (!draft?.enabled) return '-';
        return (
          <input
            type="number"
            min={0}
            step="1"
            value={draft.quantity}
            onChange={event =>
              setDebitIncreases(current =>
                current.map(item =>
                  item.lineId === row.id
                    ? { ...item, quantity: Number(event.target.value) }
                    : item
                )
              )
            }
            className="billing-invoices__inline-input"
          />
        );
      }
    },
    {
      key: 'unitPrice',
      title: 'New Unit Price',
      render: (row: InvoiceLineItem) => {
        const draft = debitIncreases.find(item => item.lineId === row.id);
        if (!draft?.enabled) return '-';
        return (
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.unitPrice}
            onChange={event =>
              setDebitIncreases(current =>
                current.map(item =>
                  item.lineId === row.id
                    ? { ...item, unitPrice: Number(event.target.value) }
                    : item
                )
              )
            }
            className="billing-invoices__inline-input"
          />
        );
      }
    }
  ];

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      overflow={false}
      enforceFocus={!addServiceOpen}
      className={addServiceOpen ? 'invoice-adjustment-modal--child-open' : undefined}
    >
      <Modal.Header>
        <Modal.Title>Create {kindLabel(kind)}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form fluid>
          <Text muted>
            Invoice {invoice?.documentNumber ?? '-'} ·{' '}
            {formatMoney(summary?.invoiceTotal ?? invoice?.totalAmount, currency)}
          </Text>

          {summary != null && (
            <div className="billing-invoices__adjustment-hints">
              <Text size="sm" muted>
                Outstanding: {formatMoney(summary.outstandingBalance, currency)}
              </Text>
              {kind === 'CREDIT_NOTE' && (
                <Text size="sm" muted>
                  Selected credit: {formatMoney(selectedCreditTotal, currency)}
                </Text>
              )}
              {kind === 'DEBIT_NOTE' && (
                <Text size="sm" muted>
                  Selected debit: {formatMoney(selectedDebitTotal, currency)}
                </Text>
              )}
            </div>
          )}

          {kind === 'CREDIT_NOTE' ? (
            <>
              <Text weight="bold">Select lines to credit</Text>
              {creditableLines.length === 0 ? (
                <Text size="sm" muted>
                  {Number(summary?.outstandingBalance ?? 0) > 0
                    ? 'No creditable lines were returned. If a debit note added the outstanding balance, restart the patient service and refresh — or use Pay invoice balance on the Invoice Accounts tab.'
                    : 'All invoice services have already been fully credited or removed.'}
                </Text>
              ) : (
                <MyTable
                  data={creditableLines}
                  columns={creditColumns}
                  loading={loadingLines}
                />
              )}
            </>
          ) : (
            <>
              <div className="billing-invoices__invoice-actions">
                <Text weight="bold">Add service / product (catalog)</Text>
                <MyButton
                  appearance="primary"
                  disabled={patientId == null || encounterId == null}
                  onClick={() => setAddServiceOpen(true)}
                >
                  Add service / product
                </MyButton>
              </div>

              {pendingNewServices.length > 0 && (
                <MyTable
                  data={pendingNewServices}
                  columns={[
                    {
                      key: 'itemLabel',
                      title: 'Service',
                      render: (row: PendingNewServiceLine) => row.itemLabel ?? '-'
                    },
                    { key: 'billingItemType', title: 'Category' },
                    { key: 'quantity', title: 'Qty' },
                    ...createPricingColumns(currency, row => ({
                      unitPrice: row.unitPrice,
                      grossAmount: row.grossAmount,
                      itemDiscountAmount: row.itemDiscountAmount,
                      itemTaxAmount: row.itemTaxAmount,
                      invoiceDiscountAmount: row.invoiceDiscountAmount,
                      invoiceTaxAmount: row.invoiceTaxAmount,
                      discountAmount: row.discountAmount,
                      taxAmount: row.taxAmount,
                      netAmount: row.netAmount,
                      quantity: row.quantity
                    })),
                    {
                      key: 'actions',
                      title: '',
                      render: (row: PendingNewServiceLine) => (
                        <MyButton
                          appearance="subtle"
                          color="red"
                          onClick={() =>
                            setPendingNewServices(current =>
                              current.filter(item => item.tempId !== row.tempId)
                            )
                          }
                        >
                          Remove
                        </MyButton>
                      )
                    }
                  ]}
                />
              )}

              <Text weight="bold" style={{ marginTop: 16 }}>
                Add from visit charge lines
              </Text>
              <MyTable
                data={addableChargeLines}
                columns={addableColumns}
                loading={loadingLines}
              />

              <Text weight="bold" style={{ marginTop: 16 }}>
                Update existing services
              </Text>
              <MyTable
                data={invoiceOnlyLines}
                columns={increaseColumns}
                loading={loadingLines}
              />
            </>
          )}

          <MyInput
            column
            fieldType="textarea"
            fieldLabel="Reason"
            fieldName="reason"
            record={form}
            setRecord={setForm}
            width="100%"
            placeholder={`Why is this ${kindLabel(kind).toLowerCase()} being issued?`}
          />

          {creditExceedsOutstanding && (
            <Form.HelpText style={{ color: '#e74c3c' }}>
              Selected credit exceeds outstanding balance.
            </Form.HelpText>
          )}
          {!creditWithinLineLimits && (
            <Form.HelpText style={{ color: '#e74c3c' }}>
              Partial credit must be within the line amount, and qty/price updates must reduce the
              current line.
            </Form.HelpText>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <MyButton appearance="subtle" onClick={onClose} disabled={loading}>
          Cancel
        </MyButton>
        <MyButton
          appearance="primary"
          color={kind === 'CREDIT_NOTE' ? 'orange' : 'blue'}
          loading={loading}
          disabled={
            selectedLineCount === 0 ||
            totalAmount <= 0 ||
            !creditWithinLimit ||
            (kind === 'CREDIT_NOTE' && creditableLines.length === 0)
          }
          onClick={handleSubmit}
        >
          Issue {kindLabel(kind)} ({formatMoney(totalAmount, currency)})
        </MyButton>
      </Modal.Footer>

    </Modal>

      <AddBillingServiceProductModal
        open={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        patientId={patientId as number}
        encounterId={encounterId as number}
        facilityId={facilityId}
        invoiceId={invoice?.id ?? null}
        currency={currency}
        documentSubtype={invoice?.documentSubtype}
        patientInsuranceId={patientInsuranceId}
        referenceInvoiceLines={invoiceLines}
        onAdd={line => setPendingNewServices(current => [...current, line])}
      />
    </>
  );
};

export default InvoiceAdjustmentModal;
