import React, { useMemo, useState } from 'react';
import { MdModeEdit, MdAddCircleOutline } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import ExpandableText from '@/components/ExpandMore/ExpandableText';

import { useGetOrdersByEncounterQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useGetTestsByOrderIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllActiveDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';

import {
  useCancelClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestResultService';
import {
  useCancelClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery
} from '@/services/billing/claimEncounterCopyDiagnosticOrderTestReportService';

import AddClaimEncounterCopyDiagnosticOrderTestResult from './AddClaimEncounterCopyDiagnosticOrderTestResult';
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

  const [cancelResult] =
    useCancelClaimEncounterCopyDiagnosticOrderTestResultMutation();

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

      const copy = isLab
        ? resultCopies.find(
            (r: any) => String(r.orderTestId) === String(test.id)
          )
        : reportCopies.find(
            (r: any) => String(r.orderTestId) === String(test.id)
          );

      return {
        ...test,
        isLab,
        copy,
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
      if (selectedTestRow.isLab) {
        await cancelResult({
          id: selectedTestRow.copy.id,
          data: { cancellationReason: cancelReason.trim() }
        }).unwrap();
      } else {
        await cancelReport({
          id: selectedTestRow.copy.id,
          data: { cancellationReason: cancelReason.trim() }
        }).unwrap();
      }

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
      title: <Translate>Value</Translate>,
      flexGrow: 2,
      render: (row: any) => {
        if (!row.copy) {
          return '-';
        }

        if (row.isLab) {
          return row.copy.resultValueNumber != null
            ? String(row.copy.resultValueNumber)
            : row.copy.resultValueText || '-';
        }

        return row.copy.report ? (
          <ExpandableText text={row.copy.report} />
        ) : (
          '-'
        );
      }
    },
    {
      key: 'copyStatus',
      title: <Translate>Copy Status</Translate>,
      flexGrow: 1.5,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row.copy ? row.copy.status : 'NOT COPIED'}
          color={
            !row.copy
              ? '#6c757d'
              : row.copy.status === 'CANCELLED'
                ? '#dc3545'
                : '#28a745'
          }
        />
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: any) => (
        <div className="flex-gap-12" onClick={e => e.stopPropagation()}>
          {(!row.copy || row.copy.status !== 'CANCELLED') && (
            row.copy ? (
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
            )
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
                  !selectedTestRow?.copy ||
                  selectedTestRow.copy.status === 'CANCELLED'
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
        <AddClaimEncounterCopyDiagnosticOrderTestResult
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          orderTestId={selectedTestRow.id}
          testName={selectedTestRow.testName}
          initialData={selectedTestRow.copy ?? null}
        />
      )}

      {selectedTestRow && !selectedTestRow.isLab && (
        <AddClaimEncounterCopyDiagnosticOrderTestReport
          open={openModal}
          setOpen={setOpenModal}
          claimEncounterCopyId={claimEncounterCopyId}
          orderTestId={selectedTestRow.id}
          testName={selectedTestRow.testName}
          initialData={selectedTestRow.copy ?? null}
        />
      )}

      <CancellationModal
        title="Cancel Diagnostic Result"
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
