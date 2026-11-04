import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Checkbox, Loader, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faVials, faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDispatch } from 'react-redux';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import {
  useBulkConfirmDiagnosticOrderTestsMutation,
  useConfirmDiagnosticOrderTestMutation,
  useFilterDiagnosticOrderTestsQuery,
  useLazyFilterDiagnosticOrderTestsQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';

export interface ApprovedTestRow {
  id: number;
  orderId?: number;
  testName: string;
  orderType?: string;
  approvedDate?: string;
}

interface ApprovedResultsCellProps {
  encounterId?: number;
  patientId?: number;
  onConfirm?: (test: ApprovedTestRow) => void | Promise<void>;
  onGoToDiagnosticsResults?: () => void;
}

const ApprovedResultsCell: React.FC<ApprovedResultsCellProps> = ({
  encounterId,
  patientId,
  onConfirm,
  onGoToDiagnosticsResults
}) => {
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDiagnosticOrderTest] = useConfirmDiagnosticOrderTestMutation();
  const [bulkConfirmDiagnosticOrderTests, { isLoading: isBulkConfirming }] =
    useBulkConfirmDiagnosticOrderTestsMutation();
  const [fetchApprovedTests, { data, isFetching, isError }] = useLazyFilterDiagnosticOrderTestsQuery();

  const baseFilter = useMemo(
    () => ({
      encounterIdIn: [encounterId],
      ...(patientId ? { patientIdIn: [patientId] } : {}),
      processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED,
      // only results that still need confirmation
      resultConfirmed: false,
      isReviewed: true
    }),
    [encounterId, patientId]
  );

  useEffect(() => {
    if (!encounterId) return;
    // size 1: we only need the X-Total-Count header
    fetchApprovedTests({ ...baseFilter, page: 0, size: 1 }, true);
  }, [encounterId, baseFilter, fetchApprovedTests]);

  // full list + test names are loaded only while the modal is open
  const { data: approvedTestsResponse, isFetching: isApprovedFetching } =
    useFilterDiagnosticOrderTestsQuery(
      openModal && encounterId
        ? { ...baseFilter, page: 0, size: 100, sort: 'approvedDate,desc' }
        : skipToken
    );

  // same params as RecentTestResults so the cached response is shared
  const { data: allTestsResponse, isFetching: isAllTestsFetching } = useGetAllDiagnosticTestsQuery(
    openModal ? { page: 0, size: 10000 } : skipToken
  );

  const diagnosticTestMap = useMemo(
    () => new Map((allTestsResponse?.data ?? []).map((test: any) => [test.id, test])),
    [allTestsResponse]
  );

  const approvedTests: ApprovedTestRow[] = useMemo(
    () =>
      (approvedTestsResponse?.data ?? []).map((orderTest: any) => {
        const diagnosticTest = diagnosticTestMap.get(orderTest.testId ?? orderTest.diagnosticTestId);
        return {
          id: orderTest.id,
          orderId: orderTest.orderId,
          testName:
            diagnosticTest?.name ?? orderTest.testName ?? orderTest.diagnosticTestName ?? '-',
          orderType: orderTest.orderType,
          approvedDate: orderTest.approvedDate
        };
      }),
    [approvedTestsResponse, diagnosticTestMap]
  );

  // drop selections that are no longer in the list (e.g. confirmed individually)
  useEffect(() => {
    const ids = new Set(approvedTests.map(test => test.id));
    setSelectedIds(prev => prev.filter(id => ids.has(id)));
  }, [approvedTests]);

  useEffect(() => {
    if (!openModal) setSelectedIds([]);
  }, [openModal]);

  const allSelected =
    approvedTests.length > 0 && approvedTests.every(test => selectedIds.includes(test.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? approvedTests.map(test => test.id) : []);

  const handleSelectRow = (id: number, checked: boolean) =>
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)));

  const handleBulkConfirm = async () => {
    if (isBulkConfirming || confirmingId !== null || selectedIds.length === 0) return;
    try {
      await bulkConfirmDiagnosticOrderTests({ ids: selectedIds }).unwrap();
      dispatch(
        notify({ msg: `${selectedIds.length} result(s) confirmed successfully`, sev: 'success' })
      );
      setSelectedIds([]);
      if (selectedIds.length === approvedTests.length) setOpenModal(false);
    } catch (err: any) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    }
  };

  const handleConfirm = async (test: ApprovedTestRow) => {
    if (confirmingId !== null || isBulkConfirming) return;
    try {
      setConfirmingId(test.id);
      await confirmDiagnosticOrderTest(test.id).unwrap();
      dispatch(notify({ msg: 'Result confirmed successfully', sev: 'success' }));
      await onConfirm?.(test);
    } catch (err: any) {
      dispatch(notify({ msg: extractApiErrorMessage(err), sev: 'error' }));
    } finally {
      setConfirmingId(null);
    }
  };

  const columns = [
    {
      key: 'select',
      width: 50,
      align: 'center' as const,
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          disabled={!approvedTests.length || isBulkConfirming}
          onChange={(_, checked) => handleSelectAll(checked)}
        />
      ),
      render: (row: ApprovedTestRow) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          disabled={isBulkConfirming || confirmingId === row.id}
          onChange={(_, checked) => handleSelectRow(row.id, checked)}
        />
      )
    },
    {
      key: 'index',
      title: '#',
      width: 50,
      render: (_row: ApprovedTestRow, rowIndex?: number) => (rowIndex ?? 0) + 1
    },
    {
       key: 'testName',
      title: 'TEST NAME',
      render: (row: ApprovedTestRow) => <strong>{row.testName}</strong>
    },
    {
      key: 'orderType',
      title: 'TYPE',
      render: (row: ApprovedTestRow) =>
        row.orderType ? <MyBadgeStatus contant={formatEnumString(row.orderType)} color="#2264e5" /> : '-'
    },
    {
      key: 'approvedDate',
      title: 'APPROVED DATE',
      render: (row: ApprovedTestRow) => formatDateWithoutSeconds(row.approvedDate) || '-'
    },
    {
      key: 'actions',
      title: '',
      width: 60,
      align: 'center' as const,
      render: (row: ApprovedTestRow) =>
        confirmingId === row.id ? (
          <Loader size="xs" />
        ) : (
          <Whisper trigger="hover" placement="top" speaker={<Tooltip>Confirm</Tooltip>}>
            <FontAwesomeIcon
              icon={faCircleCheck}
              style={{
                fontSize: 18,
                color: '#45b887',
                cursor: confirmingId === null ? 'pointer' : 'not-allowed'
              }}
              onClick={() => handleConfirm(row)}
            />
          </Whisper>
        )
    }
  ];

  if (!encounterId) return <span>-</span>;
  if (isFetching) return <Loader size="xs" />;
  if (isError) return <span>-</span>;

  const count = data?.totalCount ?? 0;
  const hasResults = count > 0;
  const isListLoading = isApprovedFetching || isAllTestsFetching;

  return (
    <>
      <Whisper
        trigger="hover"
        placement="top"
        speaker={
          <Tooltip>{hasResults ? `${count} Approved Result(s)` : 'No Approved Results'}</Tooltip>
        }
      >
        <span
          style={{ cursor: hasResults ? 'pointer' : 'default' }}
          onClick={e => {
            e.stopPropagation();
            if (hasResults) setOpenModal(true);
          }}
        >
          <Badge content={hasResults ? count : false}>
            <FontAwesomeIcon
              icon={faVialCircleCheck}
              style={{ fontSize: 18, color: hasResults ? '#45b887' : '#969fb0' }}
            />
          </Badge>
        </span>
      </Whisper>

      {openModal && (
        <MyModal
          open={openModal}
          setOpen={setOpenModal}
          title="Approved Results"
          size="750px"
          content={
            <MyTable
              data={approvedTests}
              columns={columns}
              loading={isListLoading}
              height={400}
              tableButtons={
                <div style={{ display: 'flex', gap: 8 }}>
                {onGoToDiagnosticsResults && (
                  <MyButton
                    appearance="ghost"
                    prefixIcon={() => <FontAwesomeIcon icon={faVials} />}
                    onClick={() => {
                      setOpenModal(false);
                      onGoToDiagnosticsResults();
                    }}
                  >
                    Go to Diagnostics Results
                  </MyButton>
                )}
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCircleCheck} />}
                  onClick={handleBulkConfirm}
                  loading={isBulkConfirming}
                  disabled={
                    isBulkConfirming ||
                    isListLoading ||
                    confirmingId !== null ||
                    selectedIds.length === 0
                  }
                >
                  {selectedIds.length
                    ? `Confirm Selected (${selectedIds.length})`
                    : 'Confirm Selected'}
                </MyButton>
                </div>
              }
            />
          }
          hideActionBtn={true}
          cancelButtonLabel="Close"
        />
      )}
    </>
  );
};

export default ApprovedResultsCell;
