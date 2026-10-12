import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { useGetWebhookLogsQuery } from '@/services/point-of-sale/pointOfSaleWebhookLogService';
import { useCompletePaymentMutation } from '@/services/point-of-sale/PointOfSaleTransactionService';
import {
  BillingPaymentSummaryDTO,
  useGetPaymentsByEncounterQuery,
  useGetPaymentsByPatientQuery
} from '@/services/billing/billingTransactionService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { Form } from 'rsuite';

const ExistingPaymentsTable = ({
  payments
}: {
  payments: BillingPaymentSummaryDTO[];
}) => (
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr>
        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 4 }}>
          Payment #
        </th>
        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 4 }}>
          Category
        </th>
        <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 4 }}>
          Amount
        </th>
        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 4 }}>
          Status
        </th>
        <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 4 }}>
          Date
        </th>
      </tr>
    </thead>
    <tbody>
      {payments.map(payment => (
        <tr key={payment.paymentId}>
          <td style={{ padding: 4 }}>{payment.paymentNumber}</td>
          <td style={{ padding: 4 }}>{payment.paymentCategory}</td>
          <td style={{ padding: 4, textAlign: 'right' }}>
            {payment.amount} {payment.currency}
          </td>
          <td style={{ padding: 4 }}>{payment.status}</td>
          <td style={{ padding: 4 }}>
            {payment.paymentDate
              ? new Date(payment.paymentDate).toLocaleString()
              : ''}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const initialFilter = {
  externalTransactionId: '',
  orderId: '',
  encounterNumber: '',
  responseCode: '',
  processingStatus: ''
};

const CompletePaymentModal = ({
  open,
  setOpen,
  webhook,
  onCompleted
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  webhook: any;
  onCompleted: () => void;
}) => {
  const dispatch = useAppDispatch();

  const encounterId = webhook?.encounterId ?? null;
  const patientId = webhook?.patientId ?? null;
  const isWalletTopUp = webhook?.sourceType === 'WALLET_BALANCE';
  const transactionId = webhook?.transactionId ?? null;

  const {
    data: encounterPayments = [],
    isFetching: isFetchingEncounterPayments
  } = useGetPaymentsByEncounterQuery(
    encounterId as number,
    { skip: !open || !encounterId }
  );

  const {
    data: walletPayments = [],
    isFetching: isFetchingWalletPayments
  } = useGetPaymentsByPatientQuery(
    patientId as number,
    { skip: !open || !isWalletTopUp || !patientId }
  );

  const existingPayments = isWalletTopUp ? walletPayments : encounterPayments;
  const isFetching = isWalletTopUp ? isFetchingWalletPayments : isFetchingEncounterPayments;

  const [completePayment, { isLoading }] = useCompletePaymentMutation();

  const handleConfirm = async () => {
    if (!transactionId) {
      return;
    }

    try {
      await completePayment(transactionId).unwrap();
      dispatch(notify({ msg: 'Payment completed successfully.', sev: 'success' }));
      onCompleted();
      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.message ??
            error?.data?.title ??
            'Failed to complete payment.',
          sev: 'error'
        })
      );
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Complete Payment"
      size="md"
      actionButtonLabel="Complete Payment"
      actionButtonFunction={handleConfirm}
      actionButtonLoading={isLoading}
      isDisabledActionBtn={!transactionId}
      content={
        <div>
          <p>
            {isWalletTopUp ? (
              <>
                Wallet Top-up for Patient: <strong>{patientId ?? 'N/A'}</strong>
              </>
            ) : (
              <>
                Encounter: <strong>{webhook?.encounterNumber ?? 'N/A'}</strong>
              </>
            )}
            {' · '}
            Order: <strong>{webhook?.orderId ?? 'N/A'}</strong>
            {' · '}
            Response Code: <strong>{webhook?.responseCode ?? 'N/A'}</strong>
          </p>

          {encounterId || (isWalletTopUp && patientId) ? (
            <>
              <p>
                {isWalletTopUp
                  ? 'Existing completed payments already recorded for this patient — review before confirming, since the patient may have already topped up another way while this card transaction was still processing:'
                  : 'Existing payments already recorded for this encounter — review before confirming, since the patient may have already paid (e.g. cash) while this card transaction was still processing:'}
              </p>

              {isFetching ? (
                <p>Loading existing payments...</p>
              ) : existingPayments.length === 0 ? (
                <p>
                  {isWalletTopUp
                    ? 'No existing completed payments found for this patient.'
                    : 'No existing payments found for this encounter.'}
                </p>
              ) : (
                <ExistingPaymentsTable payments={existingPayments} />
              )}
            </>
          ) : (
            <p>This transaction is not linked to an encounter or a patient wallet.</p>
          )}

          {!transactionId && (
            <p style={{ color: 'red' }}>
              This webhook has no linked POS transaction, payment cannot be completed.
            </p>
          )}
        </div>
      }
    />
  );
};

const PointOfSaleWebhookLogsPage = () => {
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingWebhook, setCompletingWebhook] = useState<any>(null);

  const { data, isLoading, refetch } = useGetWebhookLogsQuery({
    ...filter,
    page,
    size: rowsPerPage,
  });

  const rows = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const processingStatusOptions: any[] = [
    { label: 'SUCCESS', value: 'SUCCESS' },
    { label: 'FAILED', value: 'FAILED' }
  ];

  const columns: ColumnConfig[] = [
    { key: 'createdDate', title: 'Created Date', width: 180, dataKey: 'createdDate' },
    {
      key: 'encounterNumber',
      title: 'Encounter / Wallet',
      width: 170,
      render: rowData =>
        rowData.sourceType === 'WALLET_BALANCE'
          ? `Wallet Top-up (Patient #${rowData.patientId ?? 'N/A'})`
          : rowData.encounterNumber ?? ''
    },
    { key: 'orderId', title: 'Order Id', width: 180, dataKey: 'orderId' },
    { key: 'externalTransactionId', title: 'Transaction Id', width: 220, dataKey: 'externalTransactionId' },
    { key: 'responseCode', title: 'Response Code', width: 120, dataKey: 'responseCode' },
    { key: 'responseMessage', title: 'Response Message', dataKey: 'responseMessage' },
    { key: 'transactionStatus', title: 'POS Status', width: 150, dataKey: 'transactionStatus' },
    { key: 'rrn', title: 'RRN', width: 180, dataKey: 'rrn' },
    { key: 'authCode', title: 'Auth Code', width: 140, dataKey: 'authCode' },
    {
      key: 'processingStatus',
      title: 'Processing',
      width: 140,
      render: rowData => rowData.processingStatus
    },
    {
      key: 'payload',
      title: 'Details',
      width: 120,
      render: rowData => (
        <MyButton
          size="xs"
          onClick={() => {
            setSelectedWebhook(rowData);
            setPayloadOpen(true);
          }}
        >
          View
        </MyButton>
      )
    },
    {
      key: 'processed',
      title: 'Processed',
      width: 120,
      render: rowData => (rowData.processed ? 'Yes' : 'No')
    },
    {
      key: 'completePayment',
      title: 'Complete Payment',
      width: 160,
      render: rowData => (
        <MyButton
          size="xs"
          appearance="primary"
          disabled={
            rowData.transactionStatus !== 'APPROVED' ||
            !rowData.transactionId
          }
          onClick={() => {
            setCompletingWebhook(rowData);
            setCompleteOpen(true);
          }}
        >
          Complete Payment
        </MyButton>
      )
    }
  ];

  const handleClearFilters = () => {
    setFilter(initialFilter);
    setPage(0);
  };

  const tableFilters = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'flex-end'
      }}
    >
      <Form layout="inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <MyInput
          width={'11vw'}
          fieldLabel="Encounter Number"
          fieldName="encounterNumber"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width={'11vw'}
          fieldLabel="Transaction Id"
          fieldName="externalTransactionId"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width={'11vw'}
          fieldLabel="Order Id"
          fieldName="orderId"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width={'11vw'}
          fieldLabel="Response Code"
          fieldName="responseCode"
          record={filter}
          setRecord={setFilter}
        />

        <MyInput
          width={'11vw'}
          fieldLabel="Processing Status"
          fieldType="select"
          fieldName="processingStatus"
          record={filter}
          setRecord={setFilter}
          selectData={processingStatusOptions}
          selectDataLabel="label"
          selectDataValue="value"
          searchable={false}
          cleanable
        />
      </Form>
      <MyButton appearance="ghost" onClick={handleClearFilters}>
        Clear Filters
      </MyButton>
    </div>
  );

  return (
    <div className="page-content">
      <MyTable
        data={rows}
        columns={columns}
        loading={isLoading}
        height={500}
        filters={tableFilters}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={event => {
          const nextRowsPerPage = Number(event.target.value);
          setRowsPerPage(nextRowsPerPage);
          setPage(0);
        }}
      />
      <MyModal
        open={payloadOpen}
        setOpen={setPayloadOpen}
        title="Webhook Payload"
        size="lg"
        bodyheight="65vh"
        hideActionBtn
        content={
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {JSON.stringify(selectedWebhook?.rawPayload ?? selectedWebhook ?? {}, null, 2)}
          </pre>
        }
      />
      <CompletePaymentModal
        open={completeOpen}
        setOpen={setCompleteOpen}
        webhook={completingWebhook}
        onCompleted={() => refetch()}
      />
    </div>
  );
};

export default PointOfSaleWebhookLogsPage;
