import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Loader } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
  useGetEncounterExecutedServicesQuery,
  type EncounterExecutedServiceLine,
  type EncounterListVM,
} from '@/services/encounters/patientEncounterService';
import { formatBillingItemType } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import { formatEnumString } from '@/utils';

type EncounterServicesModalProps = {
  open: boolean;
  encounter: EncounterListVM | null;
  onClose: () => void;
};

type ServiceLineRow = EncounterExecutedServiceLine & {
  isTotal?: boolean;
};

const sumAmount = (
  rows: EncounterExecutedServiceLine[],
  pick: (row: EncounterExecutedServiceLine) => number | null | undefined
) =>
  rows.reduce((total, row) => {
    const value = Number(pick(row));
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

const formatAmount = (value?: number | null, currency?: string | null) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  const amount = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${amount} ${currency}` : amount;
};

const formatPercent = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const EncounterServicesModal = ({
  open,
  encounter,
  onClose,
}: EncounterServicesModalProps) => {
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    setShowCancelled(false);
  }, [encounter?.id]);

  const { data, isFetching, isError } = useGetEncounterExecutedServicesQuery(
    encounter?.id ?? 0,
    { skip: !open || !encounter?.id }
  );

  const lines = data?.lines ?? [];
  const visibleLines = useMemo(
    () => (showCancelled ? lines : lines.filter(line => !line.cancelled)),
    [lines, showCancelled]
  );
  const tableRows = useMemo<ServiceLineRow[]>(() => {
    if (visibleLines.length === 0) {
      return [];
    }

    const billableLines = visibleLines.filter(line => !line.cancelled);
    const currency = billableLines.find(line => line.currency)?.currency ?? null;
    const cashPrices = billableLines
      .map(line => line.setupUnitPrice)
      .filter((value): value is number => value != null && Number.isFinite(Number(value)));

    const totalRow: ServiceLineRow = {
      id: -1,
      isTotal: true,
      cancelled: false,
      paymentStatus: null,
      chargedAt: null,
      source: null,
      type: null,
      code: null,
      item: 'Total',
      quantity: null,
      priceSource: null,
      unitPrice: sumAmount(billableLines, line => line.unitPrice),
      netAmount: sumAmount(billableLines, line => line.netAmount),
      patientShareAmount: sumAmount(billableLines, line => line.patientShareAmount),
      insuranceShareAmount: sumAmount(billableLines, line => line.insuranceShareAmount),
      currency,
      grossAmount: sumAmount(billableLines, line => line.grossAmount),
      patientPaidAmount: sumAmount(billableLines, line => line.patientPaidAmount),
      setupUnitPrice: cashPrices.length
        ? cashPrices.reduce((total, value) => total + Number(value), 0)
        : null,
      discountPercentage: null,
      coverageStatus: null,
    };

    return [...visibleLines, totalRow];
  }, [visibleLines]);
  const encounterNumber = data?.encounterNumber || encounter?.encounterNumber || '—';
  const patientName = data?.patientName || encounter?.patientFullName || '—';
  const summaryCurrency =
    visibleLines.find(line => line.currency)?.currency ?? null;
  const summaryCards = [
    {
      key: 'totalAmount',
      label: 'Total amount',
      value: formatAmount(encounter?.calculatedTotal ?? encounter?.amount, summaryCurrency),
      tone: 'amount',
    },
    {
      key: 'copayment',
      label: 'Patient share',
      value: formatAmount(encounter?.patientTotal, summaryCurrency),
      tone: 'copayment',
    },
    {
      key: 'claimShare',
      label: 'Claim share',
      value: formatAmount(encounter?.insuranceTotal ?? 0, summaryCurrency),
      tone: 'claim',
    },
    {
      key: 'patientPaid',
      label: 'Patient paid',
      value: formatAmount(encounter?.patientPaidTotal, summaryCurrency),
      tone: 'paid',
    },
  ];
  const insuranceEncounter =
    String(data?.coverageType || encounter?.coverageType || encounter?.paymentType || '')
      .trim()
      .toUpperCase() === 'INSURANCE';

  const columns = useMemo(
    () => [
      {
        key: 'type',
        title: 'Type',
        width: 120,
        render: (row: ServiceLineRow) =>
          row.isTotal ? '' : formatBillingItemType(row.type) || '—',
      },
      {
        key: 'code',
        title: 'Code',
        width: 140,
        render: (row: ServiceLineRow) => (row.isTotal ? '' : row.code || '—'),
      },
      {
        key: 'item',
        title: 'Item',
        width: 280,
        render: (row: ServiceLineRow) =>
          row.isTotal ? (
            <strong>Total</strong>
          ) : (
            <span
              className={
                row.cancelled
                  ? 'encounter-services-item encounter-services-item--cancelled'
                  : 'encounter-services-item'
              }
              title={row.item || undefined}
            >
              {row.item || '—'}
            </span>
          ),
      },
      {
        key: 'source',
        title: 'Source',
        width: 160,
        render: (row: ServiceLineRow) =>
          row.isTotal ? '' : formatEnumString(row.source || '') || '—',
      },
      ...(insuranceEncounter
        ? [
            {
              key: 'coverageStatus',
              title: 'Insurance coverage',
              width: 160,
              render: (row: ServiceLineRow) =>
                row.isTotal ? '' : formatEnumString(row.coverageStatus || '') || '—',
            },
          ]
        : []),
      {
        key: 'priceSource',
        title: 'Price source',
        width: 130,
        render: (row: ServiceLineRow) =>
          row.isTotal ? '' : formatEnumString(row.priceSource || '') || '—',
      },
      {
        key: 'unitPrice',
        title: 'Unit price (Gross amount)',
        width: 180,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          formatAmount(row.unitPrice, row.currency),
      },
      {
        key: 'setupUnitPrice',
        title: 'Cash price',
        width: 140,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          row.setupUnitPrice != null
            ? formatAmount(row.setupUnitPrice, row.currency)
            : '—',
      },
      {
        key: 'discountPercentage',
        title: 'Discount %',
        width: 120,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          row.isTotal ? '' : formatPercent(row.discountPercentage),
      },
      {
        key: 'netAmount',
        title: 'Net amount',
        width: 140,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          formatAmount(row.netAmount, row.currency),
      },
      {
        key: 'patientShareAmount',
        title: 'Patient share',
        width: 140,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          formatAmount(row.patientShareAmount, row.currency),
      },
      {
        key: 'insuranceShareAmount',
        title: 'Claim share',
        width: 140,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          formatAmount(row.insuranceShareAmount ?? 0, row.currency),
      },
      {
        key: 'patientPaidAmount',
        title: 'Patient paid',
        width: 150,
        align: 'right' as const,
        render: (row: ServiceLineRow) =>
          formatAmount(row.patientPaidAmount, row.currency),
      },
    ],
        [insuranceEncounter]
    );

  return (
    <MyModal
      open={open}
      setOpen={nextOpen => {
        if (!nextOpen) onClose();
      }}
      title="Services & products"
      size="92vw"
      bodyheight="64vh"
      hideActionBtn
      cancelButtonLabel="Close"
      customClassName="encounter-services-modal"
      content={
        <div className="encounter-services-sheet">
          <div className="encounter-services-meta">
            <div className="encounter-services-identity">
              <strong>{encounterNumber}</strong>
              <span>{patientName}</span>
            </div>
            <Checkbox
              checked={showCancelled}
              onChange={(_, checked) => setShowCancelled(checked)}
            >
              Show cancelled
            </Checkbox>
          </div>

          <div className="encounter-services-summary">
            {summaryCards.map(card => (
              <div
                key={card.key}
                className={`encounter-services-summary-card encounter-services-summary-card--${card.tone}`}
              >
                <span className="encounter-services-summary-label">{card.label}</span>
                <strong className="encounter-services-summary-value">{card.value}</strong>
              </div>
            ))}
          </div>

          {isFetching ? (
            <div className="encounter-services-state">
              <Loader size="sm" content="Loading services..." />
            </div>
          ) : isError ? (
            <div className="encounter-services-state">
              Unable to load services for this encounter.
            </div>
          ) : visibleLines.length === 0 ? (
            <div className="encounter-services-state">
              No services found for this encounter.
            </div>
          ) : (
            <MyTable
              height={420}
              data={tableRows}
              columns={columns}
              rowClassName={row =>
                row.isTotal ? 'encounter-services-total-row' : ''
              }
            />
          )}
        </div>
      }
    />
  );
};

export default EncounterServicesModal;
