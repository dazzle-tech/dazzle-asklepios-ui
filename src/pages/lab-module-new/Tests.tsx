import CancellationModal from '@/components/CancellationModal';
import ChatModal from '@/components/ChatModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useAcceptDiagnosticOrderTestMutation,
  useBulkAcceptDiagnosticOrderTestsMutation,
  useBulkRejectDiagnosticOrderTestsMutation,
  useFilterDiagnosticOrderTestsQuery,
  useRejectDiagnosticOrderTestMutation,
  useUndoAcceptDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useCreateDiagnosticOrderTestTechnicianNoteMutation,
  useGetNotesByOrderTestIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestTechnicianNoteService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faPlusCircle, faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ReloadIcon from '@rsuite/icons/Reload';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Checkbox, Form, HStack, Panel, Tooltip, Whisper } from 'rsuite';
import AddResultModal from './AddResultModal';
import BulkCollectSampleModal from './BulkCollectSampleModal';
import ExternalLabAction from './ExternalLabAction';
import SampleModal from './SampleModal';
import './styles.less';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import PrintSampleLabelAction from './PrintSampleLabelAction';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';

type Props = {
  order: any;
  test: any;
  setTest: () => any;
  samplesList?: any;
  fecthSample?: () => any;
  loading?: boolean;
  refetchAllLabData: () => Promise<void>;
  onTestsLoaded?: (tests: any[]) => void;
};

const today = new Date();

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const Tests = forwardRef<any, Props>(
  (
    { order, test, setTest, samplesList, fecthSample, refetchAllLabData, onTestsLoaded, loading },
    ref
  ) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const selectedDepartment = authSlice.selectedDepartment;
    const [testKeyFilter, setTestKeyFilter] = useState({ value: '' });
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [localHasNoteIds, setLocalHasNoteIds] = useState<(number | string)[]>([]);
    const [openSingleSampleModal, setOpenSingleSampleModal] = useState(false);
    const [openBulkSampleModal, setOpenBulkSampleModal] = useState(false);
    const [openAddResultModal, setOpenAddResultModal] = useState(false);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [openBulkRejectModal, setOpenBulkRejectModal] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');
    const [selectedNoteTestId, setSelectedNoteTestId] = useState<number | null>(null);
    // ✅ undo-accept modal state
    const [openUndoAcceptModal, setOpenUndoAcceptModal] = useState(false);
    const [undoAcceptTargetId, setUndoAcceptTargetId] = useState<number | null>(null);

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: 'testId,asc'
    });

    const [undoAcceptReason, setUndoAcceptReason] = useState('');

    const { data: todayTestsResponse } = useFilterDiagnosticOrderTestsQuery({
      page: 0,
      size: 1000,
      orderType: 'LABORATORY',
      receivedDepartmentId: selectedDepartment?.departmentId,
      createdDateFrom: startOfDay(today).toISOString(),
      createdDateTo: endOfDay(today).toISOString()
    });

    const todayDepartmentTests = todayTestsResponse?.data ?? [];

    useEffect(() => {
      onTestsLoaded?.(todayDepartmentTests);
    }, [todayDepartmentTests]);

    const { data: labCatLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');

    const { data: allTestsResponse } = useGetAllDiagnosticTestsQuery({
      page: 0,
      size: 10000
    });

    const allTests = allTestsResponse?.data ?? [];

    const {
      data: notesResponse,
      isFetching: isNotesFetching,
      refetch: refetchNotes
    } = useGetNotesByOrderTestIdQuery(
  selectedNoteTestId
    ? {
        orderTestId: selectedNoteTestId,
        page: 0,
        size: 100
      }
    : skipToken
);


    const [createNote, { isLoading: isSendingNote }] =
      useCreateDiagnosticOrderTestTechnicianNoteMutation();

    const handleSendMessage = async (value: string) => {
      if (!selectedNoteTestId || !order?.id) {
        dispatch(notify({ msg: 'Select a test first', sev: 'warning' }));
        return;
      }
      try {
        await createNote({
          orderId: order.id,
          orderTestId: selectedNoteTestId,
          note: value
        }).unwrap();

        dispatch(notify({ msg: 'Note sent successfully', sev: 'success' }));
        setLocalHasNoteIds(prev => (prev.includes(test.id) ? prev : [...prev, test.id]));
        refetchNotes();
      } catch (e) {
        dispatch(notify({ msg: 'Send failed', sev: 'error' }));
      }
    };

    const {
      data: testsResponse,
      isFetching: isTestsFetching,
      refetch: fetchTest
    } = useFilterDiagnosticOrderTestsQuery(
      order?.id
        ? {
          orderId: order.id,
          status: 'SUBMITTED',
          receivedDepartmentId: selectedDepartment?.departmentId,
          page: paginationParams.page,
          size: paginationParams.size,
          sort: paginationParams.sort,
          orderType: 'LABORATORY',
          category: testKeyFilter.value || undefined
        }
        : skipToken
    );

    const orderTests = testsResponse?.data ?? [];

    useImperativeHandle(ref, () => ({
      fetchTest
    }));

    const [bulkAccept, { isLoading: isBulkAccepting }] =
      useBulkAcceptDiagnosticOrderTestsMutation();

    const [bulkReject, { isLoading: isBulkRejecting }] =
      useBulkRejectDiagnosticOrderTestsMutation();

    const [acceptTest] = useAcceptDiagnosticOrderTestMutation();
    const [rejectTest] = useRejectDiagnosticOrderTestMutation();
    const [undoAcceptTest, { isLoading: isUndoing }] = useUndoAcceptDiagnosticOrderTestMutation();

    const testsMap = useMemo(() => {
      return new Map(allTests.map(t => [t.id, t]));
    }, [allTests]);

    const { data: allLabsResponse } = useGetAllLaboratoriesQuery({
      page: 0,
      size: 10000
    });

    const allLabs = allLabsResponse?.data ?? [];

    const labByTestIdMap = useMemo(() => {
      return new Map(allLabs.map(lab => [lab.testId, lab]));
    }, [allLabs]);

    const normalizedOrderTests = useMemo(() => {
      return orderTests.map(orderTest => {
        const test = testsMap.get(orderTest.testId);
        const lab = labByTestIdMap.get(orderTest.testId);
        return {
          ...orderTest,
          test,
          lab,
          orderType: orderTest.orderType ?? test?.type
        };
      });
    }, [orderTests, testsMap, labByTestIdMap]);

    const acceptedStatuses = [
      DiagnosticOrderTestStatus.ACCEPTED,
      DiagnosticOrderTestStatus.PARTIALLY
    ];

    const acceptedTests = useMemo(
      () => normalizedOrderTests.filter(t => acceptedStatuses.includes(t.processingStatus)),
      [normalizedOrderTests]
    );

    const pagedData = normalizedOrderTests;
    const [
      fetchIcdByIds,
      {
        data: icdDiagnosesByIds,
        isLoading: isLoadingActiveIngredientsByIds,
      },
    ] = useLazyGetIcdDiagnosesByIdsQuery();

    const icdIds = useMemo(() => {
      const tests = normalizedOrderTests ?? [];

      const ids = tests.map((item) => {

        return item.icdDiagnosisId;
      });


      const filtered = ids.filter((id): id is number => id != null);


      return filtered;
    }, [normalizedOrderTests]);


    useEffect(() => {
      if (!icdIds.length) return;
      fetchIcdByIds({
        ids: icdIds
      });
    }, [icdIds, fetchIcdByIds]);
    const icdDiagnosesMap = useMemo(() => {
      return new Map(
        (icdDiagnosesByIds ?? []).map((item) => [item.id, item])
      );
    }, [icdDiagnosesByIds]);

    const handleAcceptTest = async (rowData: any) => {
      if (rowData.processingStatus !== DiagnosticOrderTestStatus.SAMPLE_COLLECTED) {
        dispatch(notify({ msg: 'Collect a sample first.', sev: 'warning' }));
        return;
      }
      try {
        await acceptTest(rowData.id).unwrap();
        dispatch(notify({ msg: 'Accepted successfully', sev: 'success' }));
        await refetchAllLabData();
        await fetchTest();
        setTest(rowData);
      } catch (e) {
        dispatch(notify({ msg: 'Accept failed', sev: 'error' }));
      }
    };

    const handleRejectedTest = async () => {
      if (!test?.id) {
        dispatch(notify({ msg: 'Select a test first', sev: 'warning' }));
        return;
      }
      if (
        test.status === DiagnosticOrderTestStatus.REJECTED ||
        test.status === DiagnosticOrderTestStatus.RESULT_APPROVED
      ) {
        dispatch(notify({ msg: 'This test cannot be rejected', sev: 'warning' }));
        return;
      }
      try {
        await rejectTest({
          id: test.id,
          body: { rejectedReason: test.rejectedReason }
        }).unwrap();
        dispatch(notify({ msg: 'Rejected successfully', sev: 'success' }));
        setOpenRejectedModal(false);
        await refetchAllLabData();
      } catch (e: any) {
        const rawMessage =
          e?.data?.message ||
          e?.data?.detail ||
          e?.error ||
          'Reject failed';

        const cleanMessage = rawMessage.replace(/^error\./i, '');

        dispatch(
          notify({
            msg: cleanMessage,
            sev: 'error'
          })
        );
      }
    };

    const handleUndoAcceptClick = (rowData: any) => {
      setUndoAcceptTargetId(rowData.id);
      setTest(rowData);
      setUndoAcceptReason('');
      setOpenUndoAcceptModal(true);
    };

    const handleUndoAcceptConfirm = async () => {
      if (!undoAcceptTargetId) return;

      if (!undoAcceptReason?.trim()) {
        dispatch(notify({ msg: 'Please enter undo accept reason', sev: 'warning' }));
        return;
      }

      try {
        await undoAcceptTest({
          id: undoAcceptTargetId,
          undoAcceptReason: undoAcceptReason
        }).unwrap();

        dispatch(
          notify({
            msg: 'Undo accept successful',
            sev: 'success'
          })
        );

        setOpenUndoAcceptModal(false);
        setUndoAcceptReason('');
        setUndoAcceptTargetId(null);

        await refetchAllLabData();
        await fetchTest();

      } catch (e: any) {
        const errorKey = e?.data?.errorKey || e?.data?.message || e?.error;
        const errorMessage = e?.data?.message || e?.data?.detail || '';

        let msg = 'Undo accept failed';

        if (
          errorKey === 'billed_item_cannot_undo_accept' ||
          errorMessage.includes('already billed')
        ) {
          msg = 'Cannot undo accept because this test is already billed';
        } else if (
          errorKey === 'invalid_transition' ||
          errorMessage.includes('Undo accept is allowed only from ACCEPTED')
        ) {
          msg = 'Undo accept is allowed only for accepted tests';
        } else if (errorMessage) {
          msg = errorMessage;
        }

        dispatch(
          notify({
            msg,
            sev: 'error'
          })
        );
      }
    };

    const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
    const { data: timeUnitLov } = useGetLovValuesByCodeQuery('TIME_UNITS');

    const resolveReasonLabel = (reasonKey?: string) =>
      ReasonLovQueryResponse?.object?.find(r => String(r.key) === String(reasonKey))
        ?.lovDisplayVale ??
      reasonKey ??
      '';

    const resolveCategoryLabel = (key?: any) =>
      labCatLovQueryResponse?.object?.find(c => String(c.key) === String(key))?.lovDisplayVale;

    const resolveTimeUnitLabel = (key?: any) =>
      timeUnitLov?.object?.find(u => String(u.key) === String(key))?.lovDisplayVale ?? '';

    const handleCheckboxChange = (rowId: number) => {
      setSelectedRows(prev =>
        prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
      );
    };

    const handleBulkAccept = async () => {
      if (!selectedRows.length) {
        dispatch(notify({ msg: 'Select tests first', sev: 'warning' }));
        return;
      }
      const eligibleIds = normalizedOrderTests
        .filter(
          t =>
            selectedRows.includes(t.id) &&
            t.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED
        )
        .map(t => t.id);

      if (!eligibleIds.length) {
        dispatch(notify({ msg: 'Cannot Accept This Test', sev: 'warning' }));
        return;
      }
      try {
        await bulkAccept({ ids: eligibleIds }).unwrap();
        dispatch(
          notify({ msg: `Accepted ${eligibleIds.length} tests successfully`, sev: 'success' })
        );
        setSelectedRows([]);
        await refetchAllLabData();
      } catch (e) {
        dispatch(notify({ msg: 'Bulk accept failed', sev: 'error' }));
      }
    };

    const handleBulkReject = async () => {
      if (!selectedRows.length) {
        dispatch(notify({ msg: 'Select tests first', sev: 'warning' }));
        return;
      }
      const eligibleIds = normalizedOrderTests
        .filter(
          t =>
            selectedRows.includes(t.id) &&
            t.status !== DiagnosticOrderTestStatus.RESULT_APPROVED &&
            t.status !== DiagnosticOrderTestStatus.REJECTED
        )
        .map(t => t.id);

      if (!eligibleIds.length) {
        dispatch(notify({ msg: 'No tests eligible for bulk reject', sev: 'warning' }));
        return;
      }
      try {
        await bulkReject({ ids: eligibleIds, rejectedReason: bulkRejectReason }).unwrap();
        dispatch(
          notify({ msg: `Rejected ${eligibleIds.length} tests successfully`, sev: 'success' })
        );
        setSelectedRows([]);
        setBulkRejectReason('');
        setOpenBulkRejectModal(false);
        await refetchAllLabData();
      } catch (e) {
        dispatch(notify({ msg: 'Bulk reject failed', sev: 'error' }));
      }
    };

    const hasBulkAcceptEligible = useMemo(() => {
      return normalizedOrderTests.some(
        t =>
          selectedRows.includes(t.id) &&
          t.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED
      );
    }, [normalizedOrderTests, selectedRows]);

    const allRowIds = useMemo(() => pagedData.map(row => row.id), [pagedData]);
    const isAllSelected = allRowIds.length > 0 && allRowIds.every(id => selectedRows.includes(id));
    const isSomeSelected = allRowIds.some(id => selectedRows.includes(id)) && !isAllSelected;

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        setSelectedRows(prev => Array.from(new Set([...prev, ...allRowIds])));
      } else {
        setSelectedRows(prev => prev.filter(id => !allRowIds.includes(id)));
      }
    };

    const columns: ColumnConfig[] = [
      {
        key: 'check',
        title: (
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={(_, checked) => handleSelectAll(checked)}
            onClick={e => e.stopPropagation()}
          />
        ),
        width: 60,
        align: 'center',
        render: (rowData: any) => (
          <Checkbox
            checked={selectedRows.includes(rowData.id)}
            onChange={() => handleCheckboxChange(rowData.id)}
            onClick={e => e.stopPropagation()}
          />
        )
      },
      {
        key: 'category',
        title: <Translate>TEST CATEGORY</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => resolveCategoryLabel(rowData.lab?.category)
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => rowData.test?.name
      },
      {
        key: 'reason',
        title: <Translate>REASON</Translate>,
        width: 120,
        align: 'center',
        render: rowData => resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
      },
      {
        key: 'icdDiagnosis',
        title: <Translate>ICD DIAGNOSIS</Translate>,
        width: 160,
        align: 'center',
        render: (rowData: any) => {
          const diagnosis = icdDiagnosesMap.get(rowData.icdDiagnosisId);
          return diagnosis
            ? `${diagnosis.icdCode ?? ''} - ${diagnosis.icdShortDescription ?? ''}`.replace(/^ - | - $/, '')
            : '—';
        }
      },
      {
        key: 'physician',
        title: <Translate>PHYSICIAN</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        )
      },
      {
        key: 'duration',
        title: <Translate>DURATION</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => {
          const duration = rowData.lab?.testDurationTime;
          const unit = resolveTimeUnitLabel(rowData.lab?.timeUnit);
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {duration} {unit}
            </span>
          );
        }
      },
      {
        key: 'notes',
        title: <Translate>NOTES</Translate>,
        width: 120,
        align: 'center',
        render: rowData => rowData.notes ?? ''
      },
      {
        key: 'technicannotes',
        dataKey: '',
        title: <Translate>TECHNICIAN NOTES</Translate>,
        width: 60,
        align: 'center',
        render: (rowData: any) => {
          const hasNote = rowData.hasNote === true || localHasNoteIds.includes(rowData.id);
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faComment}
                className="icon-laboratory-size"
                style={{
                  fontSize: '1em',
                  cursor: 'pointer',
                  color: hasNote ? '#1675e0' : 'var(--primary-gray)'
                }}
                onClick={() => {
                  setTest(rowData);
                  setSelectedNoteTestId(rowData.id);
                  setOpenNoteModal(true);
                }}
              />
            </HStack>
          );
        }
      },
      {
        key: 'collectsample',
        title: <Translate>COLLECT SAMPLE</Translate>,
        width: 60,
        align: 'center',
        render: (rowData: any) => {
          const canCollectSample =
            rowData.status === DiagnosticOrderTestStatus.SUBMITTED &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.REJECTED;
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faVialCircleCheck}
                className="icon-laboratory-size"
                style={{ fontSize: '1em', cursor: canCollectSample ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!canCollectSample) {
                    dispatch(
                      notify({
                        msg: 'Cannot collect sample for accepted or rejected test',
                        sev: 'warning'
                      })
                    );
                    return;
                  }
                  setTest(rowData);
                  setOpenSingleSampleModal(true);
                }}
              />
            </HStack>
          );
        }
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        width: 80,
        align: 'center',
        render: (rowData: any) => <>{formatEnumString(rowData.processingStatus ?? '—')}</>
      },
      {
        key: 'action',
        dataKey: '',
        title: <Translate>ACTION</Translate>,
        width: 140,
        align: 'center',
        render: (rowData: any) => {
          const isLocked =
            rowData.processingStatus === DiagnosticOrderTestStatus.RESULT_APPROVED ||
            rowData.processingStatus === DiagnosticOrderTestStatus.RESULT_REJECTED ||
            rowData.processingStatus === DiagnosticOrderTestStatus.REJECTED;

          const canAccept =
            !isLocked &&
            rowData.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED;

          const canReject =
            !isLocked &&
            ![
              DiagnosticOrderTestStatus.RESULT_READY,
              DiagnosticOrderTestStatus.RESULT_APPROVED,
              DiagnosticOrderTestStatus.REJECTED
            ].includes(rowData.processingStatus);

          const canUndoAccept =
            !isLocked &&
            rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED;

          return (
            <HStack spacing={10}>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Accept</Tooltip>}>
                <CheckRoundIcon
                  onClick={() => {
                    if (!canAccept) return;
                    setTest(rowData);
                    handleAcceptTest(rowData);
                  }}
                  className="icon-laboratory-size"
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    cursor: canAccept ? 'pointer' : 'not-allowed',
                    opacity: canAccept ? 1 : 0.35
                  }}
                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Undo Accept</Tooltip>}>
                <ReloadIcon
                  className="icon-laboratory-size"
                  onClick={() => {
                    if (!canUndoAccept) return;
                    handleUndoAcceptClick(rowData);
                  }}
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color: canUndoAccept ? '#1675e0' : 'gray',
                    cursor: canUndoAccept ? 'pointer' : 'not-allowed',
                    opacity: canUndoAccept ? 1 : 0.35
                  }}
                />
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
                <WarningRoundIcon
                  className="icon-laboratory-size"
                  onClick={() => {
                    if (!canReject) return;
                    setTest(rowData);
                    setOpenRejectedModal(true);
                  }}
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    cursor: canReject ? 'pointer' : 'not-allowed',
                    opacity: canReject ? 1 : 0.35
                  }}
                />
              </Whisper>

              <span
                style={{
                  pointerEvents: isLocked ? 'none' : 'auto',
                  opacity: isLocked ? 0.35 : 1
                }}
              >
                <ExternalLabAction
                  key={`${rowData.id}-${order?.id}`}
                  rowData={rowData}
                  onSuccess={async () => {
                    await refetchAllLabData();
                  }}
                />
              </span>
            </HStack>
          );
        }
      },
      {
        key: 'print',
        title: <Translate>PRINT</Translate>,
        width: 60,
        align: 'center',
        render: (rowData: any) => <PrintSampleLabelAction rowData={rowData} />
      },
      {
        key: 'acceptedatby',
        dataKey: '',
        title: <Translate>ACCEPTED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData.acceptedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.acceptedAt)}</span>
          </>
        )
      },
      {
        key: 'rejectedatby',
        dataKey: '',
        title: <Translate>REJECTED AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData.rejectedBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.rejectedAt)}</span>
          </>
        )
      },
      {
        key: 'rejectedReason',
        dataKey: 'rejectedReason',
        title: <Translate>REJECTED REASON</Translate>,
        expandable: true
      },
      // ✅ undo-accept columns
      {
        key: 'undoAcceptReason',
        dataKey: 'undoAcceptReason',
        title: <Translate>UNDO ACCEPT REASON</Translate>,
        expandable: true,
        render: (rowData: any) => rowData.undoAcceptReason ?? '—'
      },
      {
        key: 'undoAcceptAtBy',
        dataKey: '',
        title: <Translate>UNDO ACCEPT AT/BY</Translate>,
        expandable: true,
        render: (rowData: any) => (
          <>
            <span>{rowData.undoAcceptBy ?? '—'}</span>
            <br />
            <span className="date-table-style">
              {rowData.undoAcceptDate ? formatDateWithoutSeconds(rowData.undoAcceptDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'attachment',
        dataKey: '',
        title: <Translate>ATTACHMENT</Translate>,
        expandable: true
      }
    ];

    const tablebuttons = (
      <HStack spacing={10} style={{ marginBottom: 10 }}>
        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Add Result</Tooltip>}>
          <span style={{ display: 'inline-block' }}>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faPlusCircle} />}
              onClick={() => setOpenAddResultModal(true)}
            >
              Add Result
            </MyButton>
          </span>
        </Whisper>

        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Collect Sample</Tooltip>}>
          <span style={{ display: 'inline-block' }}>
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faVialCircleCheck} />}
              disabled={!selectedRows.length}
              onClick={() => setOpenBulkSampleModal(true)}
            >
              Bulk Collect Sample
            </MyButton>
          </span>
        </Whisper>

        <Whisper placement="top" speaker={<Tooltip>Accept</Tooltip>}>
          <span style={{ display: 'inline-block' }}>
            <MyButton
              prefixIcon={() => <CheckRoundIcon />}
              disabled={!hasBulkAcceptEligible}
              onClick={handleBulkAccept}
            >
              Accept Selected
            </MyButton>
          </span>
        </Whisper>

        <Whisper placement="top" speaker={<Tooltip>Reject</Tooltip>}>
          <span style={{ display: 'inline-block' }}>
            <MyButton
              prefixIcon={() => <WarningRoundIcon />}
              appearance="ghost"
              disabled={!selectedRows.length}
              onClick={() => setOpenBulkRejectModal(true)}
            >
              Reject Selected
            </MyButton>
          </span>
        </Whisper>
      </HStack>
    );

    const filters = () => (
      <Form>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <MyInput
            fieldType="select"
            fieldName="value"
            fieldLabel="Category"
            width={200}
            placeholder="Select Category"
            selectData={labCatLovQueryResponse?.object}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={testKeyFilter}
            setRecord={setTestKeyFilter}
            searchable={false}
          />
          <div className="test-table-buttons-main-container">{tablebuttons}</div>
        </div>
      </Form>
    );

    useEffect(() => {
      setSelectedRows([]);
    }, [order?.id]);

    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';
    const dir = isRTL ? 'rtl' : 'ltr';

    return (
      <div dir={dir}>
        <Panel ref={ref} defaultExpanded>
          <div className='laboratory-table-size-container'>
            <MyTable
              data={normalizedOrderTests}
              totalCount={testsResponse?.totalCount ?? 0}
              page={paginationParams.page}
              filters={filters()}
              rowsPerPage={paginationParams.size}
              columns={columns}
              onRowClick={rowData => {
                setTest(rowData);
              }}
              rowClassName={rowData => (rowData.id === test?.id ? 'selected-row' : '')}
              onPageChange={(_, newPage) =>
                setPaginationParams(prev => ({ ...prev, page: newPage }))
              }
              onRowsPerPageChange={e =>
                setPaginationParams(prev => ({ ...prev, size: Number(e.target.value), page: 0 }))
              }
              
              onSortChange={(column, type) => {
                const invalidSortFields = ['action', 'check', 'collectsample', 'print'];

                if (invalidSortFields.includes(column)) {
                  return; // ignore
                }

                setPaginationParams(prev => ({
                  ...prev,
                  sort: `${column},${type}`,
                  page: 0
                }));
              }}
            />
          </div>

          <SampleModal
            open={openSingleSampleModal}
            setOpen={setOpenSingleSampleModal}
            orderTest={test}
            onSuccess={async () => {
              setSelectedRows([]);
              refetchAllLabData?.();
            }}
          />

          <CancellationModal
            open={openRejectedModal}
            setOpen={setOpenRejectedModal}
            fieldName="rejectedReason"
            handleCancle={handleRejectedTest}
            object={test}
            setObject={setTest}
            fieldLabel="Reject Reason"
            title="Reject"
            required
          />

          <ChatModal
            open={openNoteModal}
            setOpen={setOpenNoteModal}
            title="Technician Notes"
            list={notesResponse?.data ?? []}
            fieldShowName="note"
            handleSendMessage={handleSendMessage}
            loading={isNotesFetching || isSendingNote}
          />

          <BulkCollectSampleModal
            open={openBulkSampleModal}
            setOpen={setOpenBulkSampleModal}
            orderId={order?.id}
            selectedTests={normalizedOrderTests.filter(t => selectedRows.includes(t.id))}
            onSuccess={() => {
              setSelectedRows([]);
              refetchAllLabData?.();
            }}
          />

          <CancellationModal
            open={openBulkRejectModal}
            setOpen={setOpenBulkRejectModal}
            fieldName="rejectedReason"
            handleCancle={handleBulkReject}
            object={{ rejectedReason: bulkRejectReason }}
            setObject={(obj: any) => setBulkRejectReason(obj.rejectedReason)}
            fieldLabel="Reject Reason"
            title="Bulk Reject"
          />

          <AddResultModal
            open={openAddResultModal}
            setOpen={setOpenAddResultModal}
            acceptedTests={acceptedTests}
            onSuccess={async () => {
              await refetchAllLabData();
            }}
          />

          <CancellationModal
            open={openUndoAcceptModal}
            setOpen={setOpenUndoAcceptModal}
            fieldName="undoAcceptReason"
            handleCancle={handleUndoAcceptConfirm}
            object={{ undoAcceptReason }}
            setObject={(obj: any) => setUndoAcceptReason(obj.undoAcceptReason)}
            fieldLabel="Undo Accept Reason"
            title="Undo Accept"
          />
        </Panel>
      </div>
    );
  }
);

export default Tests;