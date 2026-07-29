import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Modal, SelectPicker, Text } from 'rsuite';

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
        invoiceLines.map(line => ({
          lineId: line.id,
          enabled: false,
          quantity: Number(line.quantity ?? 1),
          unitPrice: Number(line.unitPrice ?? 0)
        }))
      );
    }
  }, [open, kind, creditableLines, addableChargeLines, invoiceLines, invoice?.id]);

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
      const oldNet = Number(line.netAmount ?? 0);
      const newNet = Number(draft.quantity ?? 0) * Number(draft.unitPrice ?? 0);
      const credit = Math.max(0, Math.min(Number(line.remainingAmount ?? 0), oldNet - newNet));
      return sum + credit;
    }, 0);
  }, [creditDrafts, invoiceLines]);

  const selectedCreditOutstandingReduction = useMemo(() => {
    return creditDrafts.reduce((sum, draft) => {
      if (!draft.enabled) return sum;
      const line = invoiceLines.find(item => item.id === draft.lineId);
      if (!line) return sum;

      if (draft.action === 'REMOVE') {
        return sum + Number(line.remainingAmount ?? 0);
      }
      if (draft.action === 'PARTIAL_CREDIT') {
        return sum + Number(draft.amount ?? 0);
      }
      const oldNet = Number(line.netAmount ?? 0);
      const newNet = Number(draft.quantity ?? 0) * Number(draft.unitPrice ?? 0);
      const credit = Math.max(0, Math.min(Number(line.remainingAmount ?? 0), oldNet - newNet));
      return sum + credit;
    }, 0);
  }, [creditDrafts, invoiceLines]);

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
      const line = invoiceLines.find(item => item.id === draft.lineId);
      if (!line) return sum;
      const oldNet = Number(line.netAmount ?? 0);
      const newNet = Number(draft.quantity ?? 0) * Number(draft.unitPrice ?? 0);
      return sum + Math.max(0, newNet - oldNet);
    }, 0);

    return addTotal + increaseTotal + pendingNewServices.reduce((sum, line) => {
      const qty = Number(line.quantity ?? 0);
      const unitPrice = Number(line.unitPrice ?? 0);
      return sum + qty * unitPrice;
    }, 0);
  }, [debitAdds, debitIncreases, addableChargeLines, invoiceLines, invoice?.documentSubtype, pendingNewServices]);

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
  const allowsPaidLineRemoval =
    kind === 'CREDIT_NOTE' &&
    creditDrafts.some(
      draft =>
        draft.enabled &&
        draft.action === 'REMOVE' &&
        invoiceLines.some(
          line =>
            line.id === draft.lineId &&
            Number(line.netAmount ?? 0) > 0.0001 &&
            Number(line.paidAmount ?? 0) > 0.0001
        )
    );
  const creditWithinLimit =
    kind !== 'CREDIT_NOTE' ||
    selectedCreditOutstandingReduction <= maxCredit + 0.0001 ||
    (maxCredit <= 0 && allowsPaidLineRemoval && selectedCreditTotal > 0);

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
          <SelectPicker
            cleanable={false}
            searchable={false}
            size="sm"
            data={creditActionOptions}
            value={draft.action}
            disabled={!draft.enabled}
            onChange={value =>
              setCreditDrafts(current =>
                current.map(item =>
                  item.lineId === row.id
                    ? { ...item, action: (value as CreditLineDraft['action']) ?? 'REMOVE' }
                    : item
                )
              )
            }
            style={{ width: 180 }}
          />
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
    {
      key: 'netAmount',
      title: 'Amount',
      render: (row: AddableChargeLine) => formatMoney(row.netAmount, currency)
    }
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
    {
      key: 'netAmount',
      title: 'Current Net',
      render: (row: InvoiceLineItem) => formatMoney(row.netAmount, currency)
    },
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
    <Modal open={open} onClose={onClose} size="lg" overflow={false}>
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
                  data={pendingNewServices.map(line => ({
                    ...line,
                    estimatedAmount:
                      Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0)
                  }))}
                  columns={[
                    {
                      key: 'itemLabel',
                      title: 'Service',
                      render: (row: PendingNewServiceLine) => row.itemLabel ?? '-'
                    },
                    { key: 'billingItemType', title: 'Category' },
                    { key: 'quantity', title: 'Qty' },
                    {
                      key: 'unitPrice',
                      title: 'Unit Price',
                      render: (row: any) => formatMoney(row.unitPrice, currency)
                    },
                    {
                      key: 'estimatedAmount',
                      title: 'Amount',
                      render: (row: any) => formatMoney(row.estimatedAmount, currency)
                    },
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
                data={invoiceLines}
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

          {!creditWithinLimit && (
            <Form.HelpText style={{ color: '#e74c3c' }}>
              Selected credit exceeds outstanding balance.
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

      <AddBillingServiceProductModal
        open={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        patientId={patientId as number}
        encounterId={encounterId as number}
        facilityId={facilityId}
        currency={currency}
        onAdd={line => setPendingNewServices(current => [...current, line])}
      />
    </Modal>
  );
};

export default InvoiceAdjustmentModal;
