import React, { useMemo } from 'react';

import { Checkbox, Loader, Tag } from 'rsuite';



import MyButton from '@/components/MyButton/MyButton';

import MyTable from '@/components/MyTable';

import type { EncounterBillingSummary } from '@/types/model-types-new';
import type { UnifiedBillingChargeRow } from '../utils/billingAccountingUtils';

import {

  computeRowRemainingAmount,

  formatBillingChargeStatus,

  formatBillingPriceSource,

  formatBillingSource,

  formatBillingTimestamp,

  formatMoney,

  isPreAuthRejected,

  isPreAuthPartial,

  isPreAuthApproved,

  isPreAuthRequiredRow,

  shouldShowPreAuthRowActions,

  isRowAwaitingBilling,

  isRowCollectable,

  resolveRowPaymentStatus,

  ROW_PAYMENT_STATUS_COLORS,

  ROW_PAYMENT_STATUS_LABELS

} from '../utils/billingAccountingUtils';

import { formatBillingItemType } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';



type BillingChargesTableProps = {
  rows: UnifiedBillingChargeRow[];
  billingSummary?: EncounterBillingSummary | null;
  loading?: boolean;
  currency?: string;
  chargeClosed?: boolean;
  disabled?: boolean;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onCollectPayment?: () => void;
  showPreAuthActions?: boolean;
  preAuthActionLoadingId?: number | null;
  onPayRejectedAsCash?: (patientServiceProductId: number) => void;
  onClonePreAuthorization?: (patientServiceProductId: number) => void;
};



const BillingChargesTable: React.FC<BillingChargesTableProps> = ({

  rows,

  billingSummary = null,

  loading = false,

  currency = 'SAR',

  chargeClosed = false,

  disabled = false,

  selectedRowIds = [],

  onSelectionChange,

  onCollectPayment,

  showPreAuthActions = false,

  preAuthActionLoadingId = null,

  onPayRejectedAsCash,

  onClonePreAuthorization

}) => {

  const selectable = Boolean(onSelectionChange);



  const collectableRows = useMemo(

    () => rows.filter(row => isRowCollectable(row, billingSummary)),

    [rows, billingSummary]

  );

  const awaitingBillingCount = useMemo(

    () => rows.filter(row => isRowAwaitingBilling(row)).length,

    [rows]

  );



  const settledCount = useMemo(

    () => rows.filter(row => resolveRowPaymentStatus(row, billingSummary) === 'SETTLED').length,

    [rows, billingSummary]

  );



  const toggleRow = (rowId: string) => {
    if (disabled || !onSelectionChange) return;

    const row = rows.find(item => item.id === rowId);

    if (row && !isRowCollectable(row, billingSummary)) return;



    if (selectedRowIds.includes(rowId)) {

      onSelectionChange(selectedRowIds.filter(id => id !== rowId));

      return;

    }

    onSelectionChange([...selectedRowIds, rowId]);

  };



  const toggleAll = () => {
    if (disabled || !onSelectionChange) return;

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

                disabled={disabled || !collectableRows.length}

                onChange={toggleAll}

              />

            ),

            width: 48,

            render: (row: UnifiedBillingChargeRow) => {

              const collectable = isRowCollectable(row, billingSummary);

              return (

                <Checkbox

                  checked={selectedRowIds.includes(row.id)}

                  disabled={disabled || !collectable}

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

        const status = resolveRowPaymentStatus(row, billingSummary);

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

      render: (row: UnifiedBillingChargeRow) => (
        <Tag size="sm">{formatBillingSource(row.source)}</Tag>
      )

    },

    {

      key: 'billingItemType',

      title: 'Type',

      width: 100,

      render: (row: UnifiedBillingChargeRow) =>
        formatBillingItemType(row.billingItemType)

    },

    {

      key: 'itemCode',

      title: 'Code',

      width: 110,

      render: (row: UnifiedBillingChargeRow) => row.itemCode ?? '-'

    },

    {

      key: 'itemName',

      title: 'Item',

      width: 220,

      render: (row: UnifiedBillingChargeRow) => row.itemName

    },

    {

      key: 'quantity',

      title: 'Qty',

      width: 70,

      render: (row: UnifiedBillingChargeRow) => {
        const qty = Number(row.quantity ?? 1);
        return Number.isInteger(qty) ? qty : qty.toFixed(2);
      }

    },

    {

      key: 'priceSource',

      title: 'Price source',

      width: 110,

      render: (row: UnifiedBillingChargeRow) => (
        <Tag size="sm">{formatBillingPriceSource(row.priceSource)}</Tag>
      )

    },

    {

      key: 'unitPrice',

      title: 'Unit price',

      width: 110,

      render: (row: UnifiedBillingChargeRow) =>
        formatMoney(row.unitPrice, row.currency || currency)

    },

    {

      key: 'setupUnitPrice',

      title: 'Setup price',

      width: 110,

      render: (row: UnifiedBillingChargeRow) =>
        row.setupUnitPrice != null
          ? formatMoney(row.setupUnitPrice, row.currency || currency)
          : '-'

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
        if (!isPreAuthRequiredRow(row)) {
          return <Tag size="sm">{formatBillingChargeStatus(row.status)}</Tag>;
        }

        if (isPreAuthPartial(row.preAuthorizationStatus)) {
          return (
            <Tag color="yellow" size="sm">
              Partial — communication required
            </Tag>
          );
        }

        if (isPreAuthRejected(row.preAuthorizationStatus)) {
          return (
            <Tag color="orange" size="sm">
              Pre-auth rejected
            </Tag>
          );
        }

        if (isPreAuthApproved(row.preAuthorizationStatus)) {
          return (
            <Tag color="green" size="sm">
              Pre-auth approved
            </Tag>
          );
        }

        return <Tag size="sm">{formatBillingChargeStatus(row.status)}</Tag>;
      }

    },

    ...(showPreAuthActions

      ? [

          {

            key: 'preAuthActions',

            title: 'Pre-auth',

            width: 220,

            render: (row: UnifiedBillingChargeRow) => {
              if (!shouldShowPreAuthRowActions(row, billingSummary)) {
                return null;
              }

              if (isPreAuthPartial(row.preAuthorizationStatus)) {
                return (
                  <Tag color="yellow" size="sm">
                    Communication required
                  </Tag>
                );
              }

              if (!isPreAuthRejected(row.preAuthorizationStatus)) {
                return null;
              }

              const pspId = row.patientServiceProductId;

              if (pspId == null) {
                return null;
              }

              const loading = preAuthActionLoadingId === pspId;

              return (
                <div className="billing-accounting__preauth-row-actions">
                  <MyButton
                    size="xs"
                    appearance="primary"
                    loading={loading}
                    disabled={disabled || loading}
                    onClick={() => onPayRejectedAsCash?.(pspId)}
                  >
                    Pay cash
                  </MyButton>

                  <MyButton
                    size="xs"
                    appearance="default"
                    loading={loading}
                    disabled={disabled || loading}
                    onClick={() => onClonePreAuthorization?.(pspId)}
                  >
                    Clone pre-auth
                  </MyButton>
                </div>
              );
            }

          }

        ]

      : [])

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

        {disabled ? (
          <span className="billing-accounting__table-summary-text">
            {chargeClosed
              ? 'Checkout or invoice is complete. Services & products are view-only — selection and collection are locked.'
              : 'Encounter closed for billing. Service selection and payment collection are locked.'}
          </span>
        ) : collectableRows.length === 0 ? (

          <span className="billing-accounting__table-summary-text">

            {rows.some(
              row =>
                resolveRowPaymentStatus(row, billingSummary) === 'RESERVED' ||
                resolveRowPaymentStatus(row, billingSummary) === 'PARTIAL'
            )

              ? 'Remaining balance is covered by advance reservations. Finalize checkout when ready.'

              : 'All lines are settled for this encounter.'}

          </span>

        ) : (

          <span className="billing-accounting__table-summary-text">

            {collectableRows.length} line(s) ready for payment

            {awaitingBillingCount > 0

              ? ` (${awaitingBillingCount} will be billed automatically on collect)`

              : ''}.

          </span>

        )}

      </div>

      <div className={disabled ? 'billing-accounting__table--locked' : undefined}>
      <MyTable

        height={360}

        data={rows}

        columns={columns}

        tableButtons={

          onCollectPayment ? (

            <MyButton

              disabled={
                disabled ||
                selectedRowIds.length === 0
              }

              onClick={onCollectPayment}

            >

              Collect payment ({selectedRowIds.length})

            </MyButton>

          ) : undefined

        }

      />
      </div>

    </div>

  );

};



export default BillingChargesTable;


