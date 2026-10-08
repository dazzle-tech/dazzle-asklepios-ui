import React, { useMemo, useState } from 'react';
import { MdModeEdit, MdAddCircleOutline } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';

import { useGetOrdersByEncounterQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useGetTestsByOrderIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllActiveDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import {
  useCancelClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestReportService';
import { useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery } from '@/services/billing/claimEncounterCopyDiagnosticOrderTestResultService';

import ClaimEncounterCopyDiagnosticOrderLabResultModal from './ClaimEncounterCopyDiagnosticOrderLabResultModal';
import AddClaimEncounterCopyDiagnosticOrderTestReport from './AddClaimEncounterCopyDiagnosticOrderTestReport';

interface ClaimEncounterCopyDiagnosticOrdersProps {
  claimEncounterCopyId: number;
  encounterId?: number;
}

const ClaimEncounterCopyDiagnosticOrders = ({
  claimEncounterCopyId,
  encounterId
}: ClaimEncounterCopyDiagnosticOrdersProps) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedTestRow, setSelectedTestRow] = useState<any | null>(null);

  const [showCancelled, setShowCancelled] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: ordersResponse, isFetching: isFetchingOrders } =
    useGetOrdersByEncounterQuery(
      { encounterId: encounterId as number, size: 1000 },
      { skip: !encounterId }
    );

  const { data: testsResponse, isFetching: isFetchingTests } =
    useGetTestsByOrderIdQuery(
      { orderId: selectedOrder?.id, size: 1000 },
      { skip: !selectedOrder?.id }
    );

  const { data: resultCopies = [] } =
    useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery({
      claimEncounterCopyId,
      showCancelled
    });

  const { data: reportCopies = [] } =
    useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery({
      claimEncounterCopyId,
      showCancelled
    });

  const { data: diagnosticTestsResponse } =
    useGetAllActiveDiagnosticTestsQuery({ page: 0, size: 1000 });

  const [cancelReport] =
    useCancelClaimEncounterCopyDiagnosticOrderTestReportMutation();

  const testNameMap = useMemo(() => {
    const map = new Map<number, string>();

    diagnosticTestsResponse?.data?.forEach((test: any) => {
      map.set(test.id, test.name);
    });

    return map;
  }, [diagnosticTestsResponse]);

  const testRows = useMemo(() => {
    return (testsResponse?.data ?? []).map((test: any) => {
      const isLab = test.orderType === 'LABORATORY';

      const copies = isLab
        ? resultCopies.filter(
            (r: any) => String(r.orderTestId) === String(test.id)
          )
        : reportCopies.filter(
            (r: any) => String(r.orderTestId) === String(test.id)
          );

      const hasActive = copies.some((c: any) => c.status === 'ACTIVE');
      const hasAny = copies.length > 0;

      return {
        ...test,
        isLab,
        copies,
        copy: copies[0] ?? null,
        hasActive,
        hasAny,
        testName: testNameMap.get(test.testId) || `Test #${test.testId}`
      };
    });
  }, [testsResponse, resultCopies, reportCopies, testNameMap]);

  const handleEdit = (row: any) => {
    setSelectedTestRow(row);
    setOpenModal(true);
  };

  const handleCancel = async () => {
    if (!selectedTestRow?.copy || !cancelReason.trim()) {
      return;
    }

    try {
      await cancelReport({
        id: selectedTestRow.copy.id,
        data: { cancellationReason: cancelReason.trim() }
      }).unwrap();

      setOpenCancelModal(false);
      setCancelReason('');
      setSelectedTestRow(null);
    } catch (error) {
      console.error(error);
    }
  };

  const isOrderSelected = (row: any) =>
    row.id === selectedOrder?.id ? 'selected-row' : '';

  const isTestSelected = (row: any) =>
    row.id === selectedTestRow?.id ? 'selected-row' : '';

  const orderColumns = [
    {
      key: 'orderNumber',
      title: <Translate>Order Number</Translate>,
      flexGrow: 2,
      render: (row: any) => row.orderNumber || `#${row.id}`
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (row: any) => row.status || '-'
    },
    {
      key: 'labStatus',
      title: <Translate>Lab Status</Translate>,
      flexGrow: 1,
      render: (row: any) => row.labStatus || '-'
    },
    {
      key: 'radStatus',
      title: <Translate>Rad Status</Translate>,
      flexGrow: 1,
      render: (row: any) => row.radStatus || '-'
    },
    {
      key: 'submittedDate',
      title: <Translate>Submitted Date</Translate>,
      flexGrow: 1.5,
      render: (row: any) =>
        row.submittedDate
          ? new Date(row.submittedDate).toLocaleString()
          : '-'
    }
  ];

  const testColumns = [
    {
      key: 'testName',
      title: <Translate>Test</Translate>,
      flexGrow: 2,
      render: (row: any) => row.testName
    },
    {
      key: 'orderType',
      title: <Translate>Type</Translate>,
      flexGrow: 1,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row.orderType}
          color={row.isLab ? '#007bff' : '#6f42c1'}
        />
      )
    },
    {
      key: 'value',
      title: <Translate>Results Filled</Translate>,
      flexGrow: 1,
      render: (row: any) =>
        row.isLab
          ? `${row.copies.filter((c: any) => c.status === 'ACTIVE').length} filled`
          : row.copy
            ? '1 filled'
            : '-'
    },
    {
      key: 'copyStatus',
      title: <Translate>Copy Status</Translate>,
      flexGrow: 1.5,
      render: (row: any) => (
        <MyBadgeStatus
          contant={
            !row.hasAny ? 'NOT COPIED' : row.hasActive ? 'ACTIVE' : 'CANCELLED'
          }
          color={
            !row.hasAny
              ? '#6c757d'
              : row.hasActive
                ? '#28a745'
                : '#dc3545'
          }
        />
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: any) => (
        <div className="flex-gap-12" onClick={e => e.stopPropagation()}>
          {row.hasAny ? (
            <MdModeEdit
              size={22}
              fill="var(--primary-gray)"
              className="pointer"
              onClick={event => {
                event.stopPropagation();
                handleEdit(row);
              }}
            />
          ) : (
            <MdAddCircleOutline
              size={22}
              fill="var(--primary-gray)"
              className="pointer"
              onClick={event => {
                event.stopPropagation();
                handleEdit(row);
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div dir={dir}>
      <MyTable
        height={250}
        data={ordersResponse?.data ?? []}
        loading={isFetchingOrders}
        columns={orderColumns}
        rowKey="id"
        onRowClick={row => {
          setSelectedOrder(row);
          setSelectedTestRow(null);
        }}
        rowClassName={isOrderSelected}
      />

      {selectedOrder && (
        <>
          <div className="bt-div-3" style={{ marginTop: 16 }}>
            <div className="flex-gap-12">
              <MyButton
                onClick={() => setOpenCancelModal(true)}
                disabled={
                  !selectedTestRow ||
                  selectedTestRow.isLab ||
                  !selectedTestRow.hasActive
                }
              >
                <Translate>Cancel</Translate>
              </MyButton>
            </div>

            <div className="bt-right-3">
              <MyInput
                fieldLabel="Show Cancelled"
                fieldType="check"
                fieldName="showCancelled"
                record={{ showCancelled }}
                setRecord={(record: any) =>
                  setShowCancelled(!!record.showCancelled)
                }
                showLabel={false}
              />
            </div>
          </div>

          <MyTable
            height={350}
            data={testRows}
            loading={isFetchingTests}
            columns={testColumns}
            rowKey="id"
            onRowClick={row => setSelectedTestRow(row)}
            rowClassName={isTestSelected}
          />
        </>
      )}

      {selectedTestRow && selectedTestRow.isLab && (
        <ClaimEncounterCopyDiagnosticOrderLabResultModal
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          orderTest={selectedTestRow}
          testName={selectedTestRow.testName}
          existingCopies={selectedTestRow.copies}
        />
      )}

      {selectedTestRow && !selectedTestRow.isLab && (
        <AddClaimEncounterCopyDiagnosticOrderTestReport
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          orderTestId={selectedTestRow.id}
          testId={selectedTestRow.testId}
          testName={selectedTestRow.testName}
          initialData={selectedTestRow.copy ?? null}
        />
      )}

      <CancellationModal
        title="Cancel Radiology Report"
        fieldLabel="Cancellation Reason"
        open={openCancelModal}
        setOpen={value => {
          setOpenCancelModal(value);

          if (!value) {
            setCancelReason('');
          }
        }}
        object={{ cancellationReason: cancelReason }}
        setObject={(object: any) =>
          setCancelReason(object.cancellationReason || '')
        }
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />
    </div>
  );
};

export default ClaimEncounterCopyDiagnosticOrders;
