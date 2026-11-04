import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandHoldingDollar, faLock, faPercent, faWallet } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable';
import {
  useGetPatientWalletMovementsQuery,
  type PatientWalletMovement
} from '@/services/billing/billingTransactionService';
import type { EncounterBillingItemSummary, EncounterBillingSummary } from '@/types/model-types-new';
import type { InvoiceAdjustmentSummary } from '@/services/billing/financialDocumentAdjustmentService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  computeEncounterLedgerAmounts,
  computeRowRemainingAmount,
  encounterHasInvoice,
  formatMoney,
  isRowAwaitingBilling,
  type UnifiedBillingChargeRow
} from '../utils/billingAccountingUtils';

type DetailKind = 'wallet' | 'reserved' | 'collect' | 'discount';

type BillingSummaryCardsProps = {
  summary: EncounterBillingSummary;
  walletAvailable?: number;
  loading?: boolean;
  currency?: string;
  chargeRows?: UnifiedBillingChargeRow[];
  invoiceAdjustments?: InvoiceAdjustmentSummary | null;
};

type ServiceDetailRow = {
  id: string;
  itemName: string;
  itemCode: string | null;
  patientAmount: number;
  reservedAmount: number;
  collectAmount: number;
  currency: string;
  isTotal?: boolean;
};

type DiscountDetailRow = {
  id: string;
  itemName: string;
  itemCode: string | null;
  source: string;
  sourceHint: string | null;
  discountType: string;
  rate: string;
  amount: number;
  currency: string;
  isTotal?: boolean;
};

const PLACEHOLDER = '—';

const formatDiscountRate = (discountType?: string | null, discountRate?: number | null) => {
  if (String(discountType ?? '').toUpperCase() !== 'PERCENTAGE' || discountRate == null) {
    return PLACEHOLDER;
  }

  const value = Number(discountRate);
  if (!Number.isFinite(value) || value <= 0) {
    return PLACEHOLDER;
  }

  const text = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${text}%`;
};

const discountSourceLabel = (item: EncounterBillingItemSummary) =>
  item.discountSource || formatEnumString(item.priceSource || '') || 'Discount';

const LEDGER_LABELS = [
  'Gross Amount',
  'Net Amount',
  'Discount',
  'CoPayment',
  'Wallet',
  'Reserved',
  'Collect'
] as const;

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PAYMENT_CREDITED: 'Deposit',
  WALLET_CREDITED: 'Wallet credit',
  WALLET_RESERVED: 'Reserved for a service',
  WALLET_AVAILABLE_CONSUMED: 'Paid from wallet',
  RESERVATION_RELEASED: 'Reservation released',
  PAYMENT_REFUNDED: 'Refund',
  PAYMENT_CANCELLED: 'Payment cancelled',
  REFUND_COMPLETED: 'Refund',
  REFUND_REVERSED: 'Refund reversed',
  REFUND_REQUESTED: 'Refund requested',
  REVERSAL: 'Reversal',
  ADJUSTMENT: 'Adjustment',
  DEBIT_SETTLED: 'Debit settled',
  DEBIT_REVERSED: 'Debit reversed'
};

const movementTypeLabel = (transactionType?: string | null) => {
  if (!transactionType) {
    return PLACEHOLDER;
  }

  return MOVEMENT_TYPE_LABELS[transactionType] ?? formatEnumString(transactionType);
};

const uniqueLabels = (values: Array<string | null | undefined>) => {
  const labels = values.map(value => formatEnumString(value || '')).filter(Boolean);
  return labels.filter((value, index) => labels.indexOf(value) === index);
};

const movementDetails = (row: PatientWalletMovement) => {
  const service = row.serviceName
    ? row.serviceCode
      ? `${row.serviceName} (${row.serviceCode})`
      : row.serviceName
    : '';
  const method = uniqueLabels([row.paymentCategory, row.paymentMethod]).join(' · ');
  const reference = row.receiptNumber
    ? `Receipt ${row.receiptNumber}`
    : row.paymentNumber || row.referenceNumber || '';
  const encounter = row.encounterNumber ? `Encounter ${row.encounterNumber}` : '';
  const note =
    row.notes && row.notes !== row.description ? row.notes : '';
  const reason = row.reason ? formatEnumString(row.reason) : '';
  const extras = [method, reference, encounter, note, reason].filter(Boolean);

  if (!service && extras.length === 0) {
    return row.description || PLACEHOLDER;
  }

  return (
    <div>
      <strong>{service || extras[0]}</strong>
      <div className="billing-accounting__card-hint">
        {(service ? extras : extras.slice(1)).join(' · ') || row.description || ''}
      </div>
    </div>
  );
};

const serviceColumns = (currency: string): ColumnConfig[] => [
  {
    key: 'service',
    title: 'Service',
    width: 280,
    render: (row: ServiceDetailRow) => (
      <div>
        <strong>{row.isTotal ? row.itemName : row.itemName || 'Service'}</strong>
        {!row.isTotal && row.itemCode ? (
          <div className="billing-accounting__card-hint">{row.itemCode}</div>
        ) : null}
      </div>
    )
  },
  {
    key: 'patientAmount',
    title: 'Patient share',
    width: 140,
    align: 'right',
    render: (row: ServiceDetailRow) =>
      row.isTotal ? '' : formatMoney(row.patientAmount, row.currency || currency)
  },
  {
    key: 'reservedAmount',
    title: 'Covered',
    width: 140,
    align: 'right',
    render: (row: ServiceDetailRow) =>
      formatMoney(row.reservedAmount, row.currency || currency)
  },
  {
    key: 'collectAmount',
    title: 'To collect',
    width: 140,
    align: 'right',
    render: (row: ServiceDetailRow) =>
      formatMoney(row.collectAmount, row.currency || currency)
  }
];

const BillingSummaryCards: React.FC<BillingSummaryCardsProps> = ({
  summary,
  walletAvailable = 0,
  loading = false,
  currency,
  chargeRows = [],
  invoiceAdjustments = null
}) => {
  const [detail, setDetail] = useState<DetailKind | null>(null);
  const [movementPage, setMovementPage] = useState(0);
  const [movementPageSize, setMovementPageSize] = useState(10);
  const patientId = Number(summary.patientId || 0);
  const {
    data: walletMovementPage,
    isFetching: loadingWalletMovements,
    isError: walletMovementsFailed
  } = useGetPatientWalletMovementsQuery(
    {
      patientId,
      page: movementPage,
      size: movementPageSize
    },
    {
      skip: detail !== 'wallet' || patientId <= 0,
      refetchOnMountOrArgChange: true
    }
  );
  const walletMovements = walletMovementPage?.data ?? [];
  const walletMovementCount = walletMovementPage?.totalCount ?? 0;

  const resolvedCurrency =
    currency ?? invoiceAdjustments?.currency ?? summary.currency ?? 'SAR';
  const ledger = computeEncounterLedgerAmounts(summary, chargeRows);
  const reservedServices = chargeRows.filter(row => Number(row.reservedAmount ?? 0) > 0);
  const collectServices = chargeRows.filter(row => computeRowRemainingAmount(row) > 0);
  const encounterReserved = reservedServices.reduce(
    (total, row) => total + Number(row.reservedAmount ?? 0),
    0
  );
  const hasInvoice =
    encounterHasInvoice(summary) ||
    invoiceAdjustments != null ||
    Boolean(summary.invoiceNumber);
  const invoiceNumber =
    invoiceAdjustments?.documentNumber ?? summary.invoiceNumber ?? null;
  const invoiceTotal = Number(
    invoiceAdjustments?.invoiceTotal ?? summary.invoiceTotalAmount ?? 0
  );
  const invoicePaid = Number(invoiceAdjustments?.totalPaid ?? summary.invoicePaidAmount ?? 0);
  const invoiceOutstanding = Number(
    invoiceAdjustments?.outstandingBalance ?? summary.invoiceOutstandingAmount ?? 0
  );
  const totalCreditNotes = Number(invoiceAdjustments?.totalCreditNotes ?? 0);
  const totalDebitNotes = Number(invoiceAdjustments?.totalDebitNotes ?? 0);

  const toServiceRow = (row: UnifiedBillingChargeRow): ServiceDetailRow => ({
    id: row.id,
    itemName: row.itemName,
    itemCode: row.itemCode,
    patientAmount: Number(row.patientAmount ?? 0),
    reservedAmount: Number(row.reservedAmount ?? 0),
    collectAmount: computeRowRemainingAmount(row),
    currency: row.currency || resolvedCurrency
  });

  const reservedRows = useMemo<ServiceDetailRow[]>(() => {
    const rows = reservedServices.map(toServiceRow);
    if (rows.length === 0) {
      return rows;
    }

    return [
      ...rows,
      {
        id: 'reserved-total',
        itemName: 'Total',
        itemCode: null,
        patientAmount: 0,
        reservedAmount: encounterReserved,
        collectAmount: encounterReserved,
        currency: resolvedCurrency,
        isTotal: true
      }
    ];
  }, [chargeRows, encounterReserved, resolvedCurrency]);

  const collectTotal = collectServices.reduce(
    (total, row) => total + computeRowRemainingAmount(row),
    0
  );
  const collectRows = useMemo<ServiceDetailRow[]>(() => {
    const rows = collectServices.map(toServiceRow);
    if (rows.length === 0) {
      return rows;
    }

    return [
      ...rows,
      {
        id: 'collect-total',
        itemName: 'Total',
        itemCode: null,
        patientAmount: 0,
        reservedAmount: 0,
        collectAmount: collectTotal,
        currency: resolvedCurrency,
        isTotal: true
      }
    ];
  }, [chargeRows, collectTotal, resolvedCurrency]);

  const discountServices = useMemo(() => {
    const awaitingIds = new Set(
      chargeRows
        .filter(isRowAwaitingBilling)
        .map(row => row.patientServiceProductId)
        .filter((id): id is number => id != null)
    );

    return (summary.items ?? []).filter(item => {
      if (Number(item.discountAmount ?? 0) <= 0) {
        return false;
      }

      const status = String(item.status ?? '').toUpperCase();
      if (status === 'CANCELLED' || status === 'REVERSED') {
        return false;
      }

      if (item.chargeLineId == null) {
        return item.patientServiceProductId != null && awaitingIds.has(item.patientServiceProductId);
      }

      return true;
    });
  }, [chargeRows, summary.items]);

  const discountRows = useMemo<DiscountDetailRow[]>(() => {
    const rows = discountServices.map((item, index) => {
      const sourceHint = [
        item.discountSource ? formatEnumString(item.priceSource || '') : '',
        item.discountReason || ''
      ]
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
        .join(' · ');

      return {
        id: String(item.chargeLineId ?? `${item.patientServiceProductId ?? 'discount'}-${index}`),
        itemName: item.itemName || 'Service',
        itemCode: item.itemCode,
        source: discountSourceLabel(item),
        sourceHint: sourceHint || null,
        discountType: item.discountType ? formatEnumString(item.discountType) : PLACEHOLDER,
        rate: formatDiscountRate(item.discountType, item.discountRate),
        amount: Number(item.discountAmount ?? 0),
        currency: item.currency || resolvedCurrency
      };
    });

    if (rows.length === 0) {
      return rows;
    }

    return [
      ...rows,
      {
        id: 'discount-total',
        itemName: 'Total',
        itemCode: null,
        source: '',
        sourceHint: null,
        discountType: '',
        rate: '',
        amount: rows.reduce((total, row) => total + row.amount, 0),
        currency: resolvedCurrency,
        isTotal: true
      }
    ];
  }, [discountServices, resolvedCurrency]);

  const discountColumns = useMemo<ColumnConfig[]>(
    () => [
      {
        key: 'service',
        title: 'Service',
        width: 240,
        render: (row: DiscountDetailRow) => (
          <div>
            <strong>{row.itemName}</strong>
            {!row.isTotal && row.itemCode ? (
              <div className="billing-accounting__card-hint">{row.itemCode}</div>
            ) : null}
          </div>
        )
      },
      {
        key: 'source',
        title: 'Source',
        width: 220,
        render: (row: DiscountDetailRow) =>
          row.isTotal ? (
            ''
          ) : (
            <div>
              <strong>{row.source}</strong>
              {row.sourceHint ? (
                <div className="billing-accounting__card-hint">{row.sourceHint}</div>
              ) : null}
            </div>
          )
      },
      {
        key: 'discountType',
        title: 'Type',
        width: 140,
        render: (row: DiscountDetailRow) => (row.isTotal ? '' : row.discountType)
      },
      {
        key: 'rate',
        title: 'Rate',
        width: 100,
        render: (row: DiscountDetailRow) => (row.isTotal ? '' : row.rate)
      },
      {
        key: 'amount',
        title: 'Discount',
        width: 140,
        align: 'right',
        render: (row: DiscountDetailRow) => formatMoney(row.amount, row.currency || resolvedCurrency)
      }
    ],
    [resolvedCurrency]
  );

  const movementColumns = useMemo<ColumnConfig[]>(
    () => [
      {
        key: 'date',
        title: 'Date',
        width: 170,
        render: (row: PatientWalletMovement) =>
          row.transactionDate ? formatDateWithoutSeconds(row.transactionDate) : PLACEHOLDER
      },
      {
        key: 'movement',
        title: 'Movement',
        width: 130,
        render: (row: PatientWalletMovement) => (
          <span
            className={
              row.movement === 'DEDUCTION'
                ? 'billing-accounting__amount--deduction'
                : 'billing-accounting__amount--addition'
            }
          >
            {row.movement === 'DEDUCTION' ? 'Deduction' : 'Addition'}
          </span>
        )
      },
      {
        key: 'type',
        title: 'Type',
        width: 180,
        render: (row: PatientWalletMovement) => movementTypeLabel(row.transactionType)
      },
      {
        key: 'details',
        title: 'Details',
        width: 360,
        render: (row: PatientWalletMovement) => movementDetails(row)
      },
      {
        key: 'amount',
        title: 'Amount',
        width: 150,
        align: 'right',
        render: (row: PatientWalletMovement) => (
          <span
            className={
              row.movement === 'DEDUCTION'
                ? 'billing-accounting__amount--deduction'
                : 'billing-accounting__amount--addition'
            }
          >
            {row.movement === 'DEDUCTION' ? '−' : '+'}
            {formatMoney(Number(row.amount ?? 0), row.currency || resolvedCurrency)}
          </span>
        )
      },
      {
        key: 'balanceAfter',
        title: 'Balance after',
        width: 150,
        align: 'right',
        render: (row: PatientWalletMovement) =>
          row.balanceAfter == null
            ? PLACEHOLDER
            : formatMoney(Number(row.balanceAfter), row.currency || resolvedCurrency)
      }
    ],
    [resolvedCurrency]
  );

  const detailColumns = useMemo(() => {
    if (detail === 'collect') {
      return serviceColumns(resolvedCurrency).filter(column => column.key !== 'reservedAmount');
    }

    return serviceColumns(resolvedCurrency).filter(column => column.key !== 'collectAmount');
  }, [detail, resolvedCurrency]);

  const detailTitle =
    detail === 'wallet'
      ? 'Patient wallet'
      : detail === 'reserved'
        ? 'Reserved services'
        : detail === 'discount'
          ? 'Discount'
          : 'Amount to collect';
  const detailIcon =
    detail === 'wallet'
      ? faWallet
      : detail === 'reserved'
        ? faLock
        : detail === 'discount'
          ? faPercent
          : faHandHoldingDollar;
  const detailData = detail === 'collect' ? collectRows : reservedRows;

  if (loading) {
    return (
      <div className="billing-accounting__cards billing-accounting__cards--loading">
        {LEDGER_LABELS.map(label => (
          <div key={label} className="billing-accounting__card">
            <div className="billing-accounting__card-label">{label}</div>
            <div className="billing-accounting__card-value billing-accounting__card-value--loading">
              {PLACEHOLDER}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards: Array<{
    label: string;
    value: string;
    tone?: 'danger' | 'success';
    hint?: string;
    detail?: DetailKind;
  }> = hasInvoice
    ? [
        {
          label: 'Invoice total',
          value: formatMoney(invoiceTotal, resolvedCurrency),
          hint: invoiceNumber
            ? `Invoice ${invoiceNumber} · charge net ${formatMoney(ledger.netAmount, resolvedCurrency)}`
            : undefined
        },
        {
          label: 'Paid',
          value: formatMoney(invoicePaid, resolvedCurrency),
          tone: invoicePaid > 0 ? 'success' : undefined
        },
        {
          label: 'Outstanding',
          value: formatMoney(invoiceOutstanding, resolvedCurrency),
          tone: invoiceOutstanding > 0 ? 'danger' : 'success'
        },
        {
          label: 'Credit notes',
          value: formatMoney(totalCreditNotes, resolvedCurrency)
        },
        {
          label: 'Debit notes',
          value: formatMoney(totalDebitNotes, resolvedCurrency)
        }
      ]
    : [
        {
          label: 'Gross Amount',
          value: formatMoney(ledger.grossAmount, resolvedCurrency),
          hint: 'This encounter'
        },
        {
          label: 'Net Amount',
          value: formatMoney(ledger.netAmount, resolvedCurrency),
          hint: 'This encounter'
        },
        {
          label: 'Discount',
          value: formatMoney(ledger.discountAmount, resolvedCurrency),
          hint: 'This encounter',
          detail: 'discount'
        },
        {
          label: 'CoPayment',
          value: formatMoney(ledger.copaymentAmount, resolvedCurrency),
          hint: 'Patient share · this encounter'
        },
        {
          label: 'Wallet',
          value: formatMoney(walletAvailable, resolvedCurrency),
          tone: walletAvailable > 0 ? 'success' : undefined,
          hint: 'Available on the patient account',
          detail: 'wallet'
        },
        {
          label: 'Reserved',
          value: formatMoney(encounterReserved, resolvedCurrency),
          hint: 'This encounter',
          detail: 'reserved'
        },
        {
          label: 'Collect',
          value: formatMoney(ledger.collectAmount, resolvedCurrency),
          tone:
            ledger.collectAmount > 0
              ? 'danger'
              : ledger.copaymentAmount > 0
                ? 'success'
                : undefined,
          hint: 'This encounter',
          detail: 'collect'
        }
      ];

  return (
    <>
      <div className="billing-accounting__cards">
        {cards.map(card => {
          const valueClassName = `billing-accounting__card-value${
            card.tone === 'danger'
              ? ' billing-accounting__card-value--danger'
              : card.tone === 'success'
                ? ' billing-accounting__card-value--success'
                : ''
          }`;
          const body = (
            <>
              <div className="billing-accounting__card-label">{card.label}</div>
              <div className={valueClassName}>{card.value}</div>
              {card.hint ? <div className="billing-accounting__card-hint">{card.hint}</div> : null}
              {card.detail ? <div className="billing-accounting__card-action">View details</div> : null}
            </>
          );

          if (!card.detail) {
            return (
              <div key={card.label} className="billing-accounting__card">
                {body}
              </div>
            );
          }

          return (
            <button
              key={card.label}
              type="button"
              className="billing-accounting__card billing-accounting__card--button"
              onClick={() => {
                if (card.detail === 'wallet') {
                  setMovementPage(0);
                }
                setDetail(card.detail ?? null);
              }}
            >
              {body}
            </button>
          );
        })}
      </div>

      <MyModal
        open={detail != null}
        setOpen={open => {
          if (!open) {
            setDetail(null);
          }
        }}
        title={detailTitle}
        icon={detailIcon}
        size={detail === 'wallet' || detail === 'discount' ? 'lg' : 'md'}
        bodyheight={detail === 'wallet' ? '72vh' : 'auto'}
        hideActionBtn
        hideBack
        cancelButtonLabel="Close"
        content={
          detail === 'wallet' ? (
            <div>
              <div className="billing-accounting__wallet-summary">
                Available {formatMoney(walletAvailable, resolvedCurrency)}
              </div>
              {walletMovementsFailed ? (
                <div className="billing-accounting__wallet-summary">
                  Wallet movements could not be loaded.
                </div>
              ) : null}
              <MyTable
                data={walletMovements}
                columns={movementColumns}
                loading={loadingWalletMovements}
                height={420}
                dontTranslateData
                page={movementPage}
                rowsPerPage={movementPageSize}
                totalCount={walletMovementCount}
                onPageChange={(_, newPage) => setMovementPage(newPage)}
                onRowsPerPageChange={event => {
                  setMovementPageSize(Number(event.target.value));
                  setMovementPage(0);
                }}
              />
            </div>
          ) : detail === 'discount' ? (
            <MyTable
              data={discountRows}
              columns={discountColumns}
              height={360}
              dontTranslateData
            />
          ) : (
            <MyTable
              data={detailData}
              columns={detailColumns}
              height={360}
              dontTranslateData
            />
          )
        }
      />
    </>
  );
};

export default BillingSummaryCards;
