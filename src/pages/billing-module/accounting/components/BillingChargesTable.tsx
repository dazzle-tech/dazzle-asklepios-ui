import React, { useMemo } from 'react';
import { Checkbox, Loader, Tag } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import type { UnifiedBillingChargeRow } from '../utils/billingAccountingUtils';
import {
  computeRowRemainingAmount,
  formatBillingTimestamp,
  formatMoney,
  isPreAuthRejected,
  isRowCollectable,
  resolveRowPaymentStatus,
  ROW_PAYMENT_STATUS_COLORS,
  ROW_PAYMENT_STATUS_LABELS
} from '../utils/billingAccountingUtils';

type BillingChargesTableProps = {
  rows: UnifiedBillingChargeRow[];
  loading?: boolean;
  currency?: string;
  chargeClosed?: boolean;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onCollectPayment?: () => void;
};

const BillingChargesTable: React.FC<BillingChargesTableProps> = ({
  rows,
  loading = false,
  currency = 'SAR',
  chargeClosed = false,
  selectedRowIds = [],
  onSelectionChange,
  onCollectPayment
}) => {
  const selectable = Boolean(onSelectionChange);

  const collectableRows = useMemo(
    () => rows.filter(row => isRowCollectable(row)),
    [rows]
  );

  const settledCount = useMemo(
    () => rows.filter(row => resolveRowPaymentStatus(row) === 'SETTLED').length,
    [rows]
  );

  const toggleRow = (rowId: string) => {
    if (!onSelectionChange) return;
    const row = rows.find(item => item.id === rowId);
    if (row && !isRowCollectable(row)) return;

    if (selectedRowIds.includes(rowId)) {
      onSelectionChange(selectedRowIds.filter(id => id !== rowId));
      return;
    }
    onSelectionChange([...selectedRowIds, rowId]);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedRowIds.length === collectableRows.length) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(collectableRows.map(row => row.id));
  };

  const allSelected =
    collectableRows.length > 0 &&
    selectedRowIds.length === collectableRows.length;
  const isIndeterminate =
    selectedRowIds.length > 0 && selectedRowIds.length < collectableRows.length;

  const columns = [
    ...(selectable
      ? [
          {
            key: 'select',
            title: (
              <Checkbox
                checked={allSelected}
                indeterminate={isIndeterminate}
                disabled={!collectableRows.length}
                onChange={toggleAll}
              />
            ),
            width: 48,
            render: (row: UnifiedBillingChargeRow) => {
              const collectable = isRowCollectable(row);
              return (
                <Checkbox
                  checked={selectedRowIds.includes(row.id)}
                  disabled={!collectable}
                  onChange={() => toggleRow(row.id)}
                />
              );
            }
          }
        ]
      : []),
    {
      key: 'paymentStatus',
      title: 'Payment',
      width: 110,
      render: (row: UnifiedBillingChargeRow) => {
        const status = resolveRowPaymentStatus(row);
        return (
          <Tag color={ROW_PAYMENT_STATUS_COLORS[status]} size="sm">
            {ROW_PAYMENT_STATUS_LABELS[status]}
          </Tag>
        );
      }
    },
    {
      key: 'chargedAt',
      title: 'Charged at',
      width: 150,
      render: (row: UnifiedBillingChargeRow) => formatBillingTimestamp(row.chargedAt)
    },
    {
      key: 'source',
      title: 'Source',
      width: 130,
      render: (row: UnifiedBillingChargeRow) => <Tag size="sm">{row.source}</Tag>
    },
    {
      key: 'billingItemType',
      title: 'Type',
      width: 100,
      dataKey: 'billingItemType'
    },
    {
      key: 'itemName',
      title: 'Item',
      width: 220,
      dataKey: 'itemName'
    },
    {
      key: 'netAmount',
      title: 'Net',
      width: 100,
      render: (row: UnifiedBillingChargeRow) =>
        formatMoney(row.netAmount, row.currency || currency)
    },
    {
      key: 'patientAmount',
      title: 'Patient share',
      width: 110,
      render: (row: UnifiedBillingChargeRow) =>
        formatMoney(row.patientAmount, row.currency || currency)
    },
    {
      key: 'reservedAmount',
      title: 'Reserved',
      width: 100,
      render: (row: UnifiedBillingChargeRow) =>
        formatMoney(row.reservedAmount ?? 0, row.currency || currency)
    },
    {
      key: 'allocatedAmount',
      title: 'Applied',
      width: 100,
      render: (row: UnifiedBillingChargeRow) =>
        formatMoney(row.allocatedAmount ?? 0, row.currency || currency)
    },
    {
      key: 'remainingAmount',
      title: 'Remaining',
      width: 100,
      render: (row: UnifiedBillingChargeRow) => {
        const remaining = computeRowRemainingAmount(row);
        return (
          <span
            className={
              remaining > 0
                ? 'billing-accounting__encounter-pay-value--danger'
                : 'billing-accounting__encounter-pay-value--success'
            }
          >
            {formatMoney(remaining, row.currency || currency)}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: 'Line status',
      width: 120,
      render: (row: UnifiedBillingChargeRow) => {
        if (isPreAuthRejected(row.preAuthorizationStatus)) {
          return (
            <Tag color="orange" size="sm">
              Pre-auth rejected
            </Tag>
          );
        }
        return <Tag size="sm">{row.status}</Tag>;
      }
    }
  ];

  if (loading) {
    return (
      <div className="billing-accounting__empty">
        <Loader size="sm" content="Loading charge lines..." />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="billing-accounting__empty">
        No charge lines found for this encounter yet.
      </div>
    );
  }

  return (
    <div>
      <div className="billing-accounting__table-summary">
        <Tag color={chargeClosed ? 'green' : 'blue'} size="sm">
          {settledCount}/{rows.length} lines settled
        </Tag>
        {collectableRows.length === 0 ? (
          <span className="billing-accounting__table-summary-text">
            All lines are settled for this encounter.
          </span>
        ) : (
          <span className="billing-accounting__table-summary-text">
            {collectableRows.length} line(s) still need collection or reservation.
          </span>
        )}
      </div>
      <MyTable
        height={360}
        data={rows}
        columns={columns}
        tableButtons={
          onCollectPayment ? (
            <MyButton
              disabled={selectedRowIds.length === 0 || chargeClosed}
              onClick={onCollectPayment}
            >
              Collect payment ({selectedRowIds.length})
            </MyButton>
          ) : undefined
        }
      />
    </div>
  );
};

export default BillingChargesTable;
