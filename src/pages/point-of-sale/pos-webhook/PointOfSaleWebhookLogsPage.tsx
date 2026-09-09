import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import { useGetWebhookLogsQuery } from '@/services/point-of-sale/pointOfSaleWebhookLogService';
import { Form } from 'rsuite';

const initialFilter = {
  externalTransactionId: '',
  orderId: '',
  responseCode: '',
  processingStatus: ''
};

const PointOfSaleWebhookLogsPage = () => {
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);

  const { data, isLoading } = useGetWebhookLogsQuery({
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
    </div>
  );
};

export default PointOfSaleWebhookLogsPage;