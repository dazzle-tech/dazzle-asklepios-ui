import CancellationModal from '@/components/CancellationModal';
import ChatModal from '@/components/ChatModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useAcceptDiagnosticOrderTestMutation,
  useBulkAcceptDiagnosticOrderTestsMutation,
  useBulkRejectDiagnosticOrderTestsMutation,
  useFilterDiagnosticOrderTestsQuery,
  useRejectDiagnosticOrderTestMutation,
  useCancelDiagnosticOrderTestMutation,
  useUndoAcceptDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useCreateDiagnosticOrderTestTechnicianNoteMutation,
  useGetNotesByOrderTestIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestTechnicianNoteService';
import {
  useFinishRadiologyImageMutation,
  useLazyGetRadiologyReportByOrderTestIdQuery,
  usePauseRadiologyImageMutation,
  useResumeRadiologyImageMutation,
  useStartRadiologyImageMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllRadiologiesQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import {
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faCalendarCheck, faCirclePause, faCircleStop, faComment, faEllipsisVertical, faHospitalUser, faPlay , faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import ReloadIcon from '@rsuite/icons/Reload';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Checkbox, Dropdown, Form, HStack, Panel, Popover, Tooltip, Whisper } from 'rsuite';
import PatientArrivalModal from './PatientArrivalModal';
import RescheduleAppointmentsLookupModal from '@/pages/encounter/encounter-component/diagnostics-order-new/RescheduleAppointmentsLookupModal';
import './styles.less';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import UserDateCell from '@/components/UserDateCell';

type Props = {
  order: any;
  test: any;
  setTest: (t: any) => void;
  loading?: boolean;
  refetchAllRadData: () => Promise<void>;
};





const Tests = forwardRef<any, Props>(
  (
    {
      order,
      test,
      setTest,
      refetchAllRadData,
      loading,
    },
    ref
  ) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const selectedDepartment = authSlice.selectedDepartment;
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [testKeyFilter, setTestKeyFilter] = useState({ value: '' });
    const [selectedRows, setSelectedRows] = useState<(number)[]>([]);
    const [localHasNoteIds, setLocalHasNoteIds] = useState<(number | string)[]>([]);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [sortColumn, setSortColumn] = useState("status");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");
    const [openArrivalModal, setOpenArrivalModal] = useState(false);
    const [reportsByTestId, setReportsByTestId] = useState<Record<number, any>>({});
    const [selectedNoteTestId, setSelectedNoteTestId] = useState<number | string | null>(null);
    const [openUndoAcceptModal, setOpenUndoAcceptModal] = useState(false);
    const [undoAcceptReason, setUndoAcceptReason] = useState('');
    const [undoAcceptTargetId, setUndoAcceptTargetId] = useState<number | null>(null);

    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);


    const [rescheduleAppointmentsModalOpen, setRescheduleAppointmentsModalOpen] = useState(false);
    const [selectedOrderTestForReschedule, setSelectedOrderTestForReschedule] = useState<any>(null);


    const handleCancelClick = (rowData: any) => {
      setCancelTargetId(rowData.id);
      setTest(rowData);
      setCancelReason('');
      setOpenCancelModal(true);
    };


    const notifyFromApiError = (e: any) => {
      const status = e?.status || e?.originalStatus;

      const backendMessage =
        e?.data?.message ||
        e?.data?.detail ||
        e?.error;

      if (backendMessage === 'error.validation') {
        const fieldErrors = e?.data?.fieldErrors;

        if (fieldErrors?.length) {
          const readableMessage = fieldErrors
            .map((f: any) => `${f.field} is invalid`)
            .join(', ');

          dispatch(
            notify({
              msg: readableMessage,
              sev: 'warning'
            })
          );
          return;
        }

        dispatch(
          notify({
            msg: 'Validation error. Please check your input.',
            sev: 'warning'
          })
        );
        return;
      }

      dispatch(
        notify({
          msg: backendMessage || 'Something went wrong',
          sev: status >= 500 ? 'error' : 'warning'
        })
      );
    };

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: "testId,asc",
    });

    const [startImage] = useStartRadiologyImageMutation();
    const [pauseImage] = usePauseRadiologyImageMutation();
    const [resumeImage] = useResumeRadiologyImageMutation();
    const [finishImage] = useFinishRadiologyImageMutation();

    const { data: radCategoriesLovQueryResponse } = useGetLovValuesByCodeQuery('RAD_CATEGORIES');

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

    const [
      createNote,
      { isLoading: isSendingNote }
    ] = useCreateDiagnosticOrderTestTechnicianNoteMutation();

    const handleSendMessage = async (value: string) => {
      if (!test?.id || !order?.id) {
        dispatch(notify({ msg: 'Select a test first', sev: 'warning' }));
        return;
      }
      try {
        await createNote({
          orderId: order.id,
          orderTestId: test.id,
          note: value
        }).unwrap();

        dispatch(notify({ msg: 'Note sent successfully', sev: 'success' }));

        setLocalHasNoteIds(prev =>
          prev.includes(test.id) ? prev : [...prev, test.id]
        );

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
          excludeStatus: 'NEW',
          receivedDepartmentId: selectedDepartment?.departmentId,
          page: pageIndex,
          size: rowsPerPage,
          orderType: 'RADIOLOGY',
          category: testKeyFilter.value || undefined
        }
        : skipToken
    );

    const orderTests = testsResponse?.data ?? [];

    useImperativeHandle(ref, () => ({
      fetchTest
    }));

    const [cancelTest] = useCancelDiagnosticOrderTestMutation();
    const [acceptTest] = useAcceptDiagnosticOrderTestMutation();
    const [rejectTest] = useRejectDiagnosticOrderTestMutation();
    const [undoAcceptTest, { isLoading: isUndoing }] = useUndoAcceptDiagnosticOrderTestMutation();
    const [openBulkRejectModal, setOpenBulkRejectModal] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');




    const testsMap = useMemo(() => {
      return new Map(allTests.map(t => [t.id, t]));
    }, [allTests]);

    const { data: allRadiologiesResponse } = useGetAllRadiologiesQuery({
      page: 0,
      size: 10000,
      sort: 'testId,asc'
    });

    const [bulkAccept, { isLoading: isBulkAccepting }] =
      useBulkAcceptDiagnosticOrderTestsMutation();

    const [bulkReject, { isLoading: isBulkRejecting }] =
      useBulkRejectDiagnosticOrderTestsMutation();


    const [
      getReportByTestId,
      { data: singleReport }
    ] = useLazyGetRadiologyReportByOrderTestIdQuery();


    const allRadiologies = allRadiologiesResponse?.data ?? [];

    const radiologyByTestIdMap = useMemo(() => {
      return new Map(allRadiologies.map(r => [r.testId, r]));
    }, [allRadiologies]);

    const normalizedOrderTests = useMemo(() => {
      return (orderTests ?? [])
        .filter(t => t && t.id)
        .map(orderTest => {
          const test = testsMap.get(orderTest.testId);
          const radiology = radiologyByTestIdMap.get(orderTest.testId);
          const report = reportsByTestId[orderTest.id];

          return {
            ...orderTest,
            test,
            radiology,
            imageStatus: report?.imageStatus,
            orderType: orderTest.orderType ?? test?.type
          };
        });
    }, [orderTests, testsMap, radiologyByTestIdMap, reportsByTestId]);

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
    const isTestSelected = (rowData: any) => {
      if (rowData && test && rowData.id === test.id) return 'selected-row';
      return '';
    };

    const filteredTests = useMemo(() => {
      const sorted = [...normalizedOrderTests];

      if (!sortColumn) return sorted;

      sorted.sort((a: any, b: any) => {
        let aValue;
        let bValue;

        if (sortColumn === 'createdDate') {
          aValue = new Date(a.createdDate).getTime();
          bValue = new Date(b.createdDate).getTime();
        }
        else if (sortColumn === 'status') {
          aValue = formatEnumString(a.processingStatus ?? '').toLowerCase();
          bValue = formatEnumString(b.processingStatus ?? '').toLowerCase();
        }
        else {
          aValue = a[sortColumn];
          bValue = b[sortColumn];
        }

        if (aValue < bValue) return sortType === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortType === 'asc' ? 1 : -1;
        return 0;
      });

      return sorted;
    }, [normalizedOrderTests, sortColumn, sortType]);


    const pagedData = useMemo(() => {
      const start = pageIndex * rowsPerPage;
      const end = start + rowsPerPage;

      return filteredTests
        .filter(r => r && r.id)
        .slice(start, end);
    }, [filteredTests, pageIndex, rowsPerPage]);

    const effectiveTotalCount = filteredTests.length;

    const handleAcceptTest = async (rowData: any) => {
      try {
        await acceptTest(rowData.id).unwrap();

        dispatch(
          notify({ msg: 'Accepted successfully', sev: 'success' })
        );

        setTest(rowData);
      } catch (e: any) {
        dispatch(
          notify({
            msg:
              e?.data?.message ||
              e?.data?.detail ||
              'Accept failed',
            sev: 'error'
          })
        );
        return;
      }
      try {
        await refetchAllRadData();
      } catch (e) {
        console.warn('Tests refetch failed', e);
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
        dispatch(
          notify({
            msg: 'This test cannot be rejected',
            sev: 'warning'
          })
        );
        return;
      }

      try {
        await rejectTest({
          id: test.id,
          body: {
            rejectedReason: test.rejectedReason
          }
        }).unwrap();

        dispatch(notify({ msg: 'Rejected successfully', sev: 'success' }));
        setOpenRejectedModal(false);
        await refetchAllRadData();
      } catch (e: any) {
        const backendMessage =
          e?.data?.message ||
          e?.data?.detail ||
          e?.error ||
          'Reject failed';

        dispatch(notify({ msg: backendMessage, sev: 'error' }));
      }
    };


    const handleUndoAcceptClick = (rowData: any) => {
      setUndoAcceptTargetId(rowData.id);
      setTest(rowData);
      setUndoAcceptReason('');
      setOpenUndoAcceptModal(true);
    };

    const handleOpenRescheduleAppointments = (rowData: any) => {
      setSelectedOrderTestForReschedule(rowData);
      setRescheduleAppointmentsModalOpen(true);
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
          undoAcceptReason
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

        await refetchAllRadData();

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

        dispatch(notify({ msg, sev: 'error' }));
      }
    };


    const { data: ReasonLovQueryResponse } =
      useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
    const { data: timeUnitLov } = useGetLovValuesByCodeQuery('TIME_UNITS');

    const resolveReasonLabel = (reasonKey?: string) =>
      ReasonLovQueryResponse?.object?.find(
        r => String(r.key) === String(reasonKey)
      )?.lovDisplayVale ?? reasonKey ?? '';

    const resolveCategoryLabel = (key?: any) =>
      radCategoriesLovQueryResponse?.object?.find(
        c => String(c.key) === String(key)
      )?.lovDisplayVale;




    const isRescheduledTest = (rowData: any) => {
      const rowStatus = String(
        rowData?.status ??
        rowData?.processingStatus ??
        ''
      ).toUpperCase();

      return rowStatus.includes('RESCHEDULE');
    };

    const handleCheckboxChange = (rowId: number) => {
      setSelectedRows(prev =>
        prev.includes(rowId)
          ? prev.filter(id => id !== rowId)
          : [...prev, rowId]
      );
    };

    const allRowIds = useMemo(
      () => pagedData
        .filter(row => !isRescheduledTest(row))
        .map(row => row.id),
      [pagedData]
    );

    const isAllSelected =
      allRowIds.length > 0 &&
      allRowIds.every(id => selectedRows.includes(id));

    const isSomeSelected =
      allRowIds.some(id => selectedRows.includes(id)) && !isAllSelected;

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        setSelectedRows(prev =>
          Array.from(new Set([...prev, ...allRowIds]))
        );
      } else {
        setSelectedRows(prev =>
          prev.filter(id => !allRowIds.includes(id))
        );
      }
    };

    const ThreeDotsMenu = ({ rowData, disabled = false }: { rowData: any; disabled?: boolean }) => {
      const isAccepted =
        rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED;

      const imageStatus = rowData.imageStatus;

      const isRunning =
        imageStatus === 'STARTED' || imageStatus === 'RESUMED';

      const isPaused = imageStatus === 'PAUSED';

      if (disabled || !isAccepted) {
        return (
          <FontAwesomeIcon
            className='icon-radiologist-worklist-size'
            icon={faEllipsisVertical}
            style={{ cursor: 'not-allowed', opacity: 0.4 }}
            onClick={e => e.stopPropagation()}
          />
        );
      }

      const speaker = (
        <Popover full>
          <Dropdown.Menu>
            <Dropdown.Item
              icon={<FontAwesomeIcon icon={faPlay} />}
              disabled={!!imageStatus}
              onSelect={async () => {
                if (imageStatus) return;
                await startImage(rowData.id).unwrap();
                await refetchAllRadData();
              }}
            >
              Start
            </Dropdown.Item>

            <Dropdown.Item
              icon={
                <FontAwesomeIcon
                  icon={isPaused ? faPlay : faCirclePause}
                />
              }
              disabled={!isRunning && !isPaused}
              onSelect={async () => {
                if (isPaused) {
                  await resumeImage(rowData.id).unwrap();
                } else if (isRunning) {
                  await pauseImage(rowData.id).unwrap();
                }
                await refetchAllRadData();
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Dropdown.Item>




            <Dropdown.Item
              icon={<FontAwesomeIcon icon={faCircleStop} />}
              disabled={!isRunning}
              onSelect={async () => {
                if (!isRunning) return;
                await finishImage(rowData.id).unwrap();
                await refetchAllRadData();
              }}
            >
              Finish
            </Dropdown.Item>

          </Dropdown.Menu>
        </Popover>
      );

      return (
        <Whisper
          placement="bottomEnd"
          trigger="click"
          speaker={speaker}
        >
          <FontAwesomeIcon
            className='icon-radiologist-worklist-size'
            icon={faEllipsisVertical}
            style={{ cursor: 'pointer' }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          />
        </Whisper>
      );
    };

    const canAcceptTest = (t: any) =>
      t.processingStatus === DiagnosticOrderTestStatus.PATIENT_ARRIVED;

    const canRejectTest = (t: any) =>
      t.processingStatus !== DiagnosticOrderTestStatus.RESULT_APPROVED &&
      t.processingStatus !== DiagnosticOrderTestStatus.REJECTED;


    const handleBulkAccept = async () => {
      if (!selectedRows.length) {
        dispatch(notify({ msg: 'Select tests first', sev: 'warning' }));
        return;
      }

      const eligibleIds = normalizedOrderTests
        .filter(
          t =>
            selectedRows.includes(t.id) &&
            canAcceptTest(t) &&
            !isRescheduledTest(t)
        )
        .map(t => t.id);

      if (!eligibleIds.length) {
        dispatch(
          notify({
            msg: 'No tests eligible for accept',
            sev: 'warning'
          })
        );
        return;
      }

      try {
        await bulkAccept({ ids: eligibleIds }).unwrap();

        dispatch(
          notify({
            msg: `Accepted ${eligibleIds.length} tests successfully`,
            sev: 'success'
          })
        );

        setSelectedRows([]);
        await refetchAllRadData();
      } catch (e: any) {
        notifyFromApiError(e);
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
            canRejectTest(t) &&
            !isRescheduledTest(t)
        )
        .map(t => t.id);

      if (!eligibleIds.length) {
        dispatch(
          notify({
            msg: 'No tests eligible for reject',
            sev: 'warning'
          })
        );
        return;
      }

      try {
        await bulkReject({
          ids: eligibleIds,
          rejectedReason: bulkRejectReason
        }).unwrap();

        dispatch(
          notify({
            msg: `Rejected ${eligibleIds.length} tests successfully`,
            sev: 'success'
          })
        );

        setSelectedRows([]);
        setBulkRejectReason('');
        setOpenBulkRejectModal(false);
        await refetchAllRadData();
      } catch (e: any) {
        notifyFromApiError(e);
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
        render: (rowData: any) => {
          const rowId = rowData.id;
          const isRescheduled = isRescheduledTest(rowData);

          return (
            <Checkbox
              checked={selectedRows.includes(rowId)}
              disabled={isRescheduled}
              onChange={() => {
                if (isRescheduled) return;
                handleCheckboxChange(rowId);
              }}
              onClick={e => e.stopPropagation()}
            />
          );
        }
      },
      {
        key: 'category',
        title: <Translate>TEST CATEGORY</Translate>,
        width: 140,
        align: 'center',
        render: (rowData: any) =>
          resolveCategoryLabel(rowData.radiology?.category)
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        align: 'center',
        render: (rowData: any) => rowData.test?.name
      },
      {
        key: 'reason',
        title: <Translate>REASON</Translate>,
        width: 160,
        align: 'center',
        render: (rowData: any) =>
          resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
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
        key: 'duration',
        title: <Translate>DURATION</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => {
          const duration = rowData.radiology?.imageDuration;
          return duration ? `${duration} min` : ' ';
        }
      },
      {
        key: 'createdDate',
        title: <Translate>PHYSICIAN</Translate>,
        width: 170,
        align: 'center',
        render: (row: any) => (
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
        )
      },
      {
        key: 'orderNotes',
        title: <Translate>ORDER NOTES</Translate>,
        width: 200,
        align: 'left',
        render: (rowData: any) =>
          rowData.orderNotes ?? rowData.notes ?? ' '
      },
      {
        key: 'technicianNotes',
        title: <Translate>TECHNICIAN NOTES</Translate>,
        width: 80,
        align: 'center',
        render: (rowData: any) => {
          const hasNote =
            rowData.hasNote === true ||
            localHasNoteIds.includes(rowData.id);

          return (
            <FontAwesomeIcon
              className='icon-radiologist-worklist-size'
              icon={faComment}
              style={{
                cursor: 'pointer',
                color: hasNote ? 'var(--primary-blue)' : '#999'
              }}
              onClick={() => {
                setTest(rowData);
                setSelectedNoteTestId(rowData.id);
                setOpenNoteModal(true);
              }}
            />
          );
        }
      },
      {
        key: 'patientArrived',
        title: <Translate>PATIENT ARRIVED</Translate>,
        render: (rowData: any) => {
          const isRescheduled = String(rowData?.status ?? '')
            .toUpperCase()
            .includes('RESCHEDULE');

          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                className='icon-radiologist-worklist-size'
                icon={faHospitalUser}
                onClick={() => {
                  if (!isRescheduled) {
                    setOpenArrivalModal(true);
                  }
                }}
                color={isRescheduled ? '#bdbdbd' : undefined}
                style={{
                  cursor: isRescheduled ? 'not-allowed' : 'pointer',
                  opacity: isRescheduled ? 0.5 : 1
                }}
              />
            </HStack>
          );
        }
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) =>
          formatEnumString(rowData.processingStatus ?? ' ')
      },
      {
        key: 'imagestatus',
        title: 'Image Status',
        width: 120,
        render: row => (formatEnumString(row.imageStatus))
      },
      {
        key: 'action',
        dataKey: '',
        title: <Translate>ACTION</Translate>,
        width: 180,
        align: 'center',
        render: (rowData: any) => {
          const isRescheduled = isRescheduledTest(rowData);

          const isCancelled =
            rowData.processingStatus === DiagnosticOrderTestStatus.CANCELLED;

          const canAccept =
            !isRescheduled &&
            !isCancelled &&
            rowData.processingStatus === DiagnosticOrderTestStatus.PATIENT_ARRIVED;

          const canUndoAccept =
            !isRescheduled &&
            !isCancelled &&
            rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED &&
            !rowData.imageStatus;

          const canReject =
            !isRescheduled &&
            !isCancelled &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.ACCEPTED &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.EXAM_DONE &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.RESULT_APPROVED &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.REJECTED;

          const canCancel =
            !isRescheduled &&
            !isCancelled;

          const canReschedule =
            !isRescheduled &&
            !isCancelled &&
            [
              DiagnosticOrderTestStatus.NEW,
              DiagnosticOrderTestStatus.REJECTED
            ].includes(rowData.processingStatus);

          const rescheduleTooltip = canReschedule
            ? 'Reschedule appointment'
            : 'Reschedule not available';

          const rescheduleColor = canReschedule
            ? 'var(--primary-gray)'
            : 'orange';

          const rescheduleCursor = canReschedule
            ? 'pointer'
            : 'not-allowed';

          return (
            <HStack spacing={8}>
              <Whisper speaker={<Tooltip>Accept</Tooltip>}>
                <span>
                  <CheckRoundIcon
                    className="icon-radiologist-worklist-size"
                    style={{
                      cursor: canAccept ? 'pointer' : 'not-allowed',
                      opacity: canAccept ? 1 : 0.4
                    }}
                    onClick={() => {
                      if (!canAccept) return;
                      setTest(rowData);
                      handleAcceptTest(rowData);
                    }}
                  />
                </span>
              </Whisper>

              <Whisper speaker={<Tooltip>Undo Accept</Tooltip>}>
                <span>
                  <ReloadIcon
                    className="icon-radiologist-worklist-size"
                    style={{
                      cursor: canUndoAccept ? 'pointer' : 'not-allowed',
                      opacity: canUndoAccept ? 1 : 0.4,
                      color: canUndoAccept ? '#1675e0' : 'gray'
                    }}
                    onClick={() => {
                      if (!canUndoAccept) return;
                      handleUndoAcceptClick(rowData);
                    }}
                  />
                </span>
              </Whisper>

              <Whisper speaker={<Tooltip>Reject</Tooltip>}>
                <span>
                  <WarningRoundIcon
                    className="icon-radiologist-worklist-size"
                    style={{
                      cursor: canReject ? 'pointer' : 'not-allowed',
                      opacity: canReject ? 1 : 0.4
                    }}
                    onClick={() => {
                      if (!canReject) return;
                      setTest(rowData);
                      setOpenRejectedModal(true);
                    }}
                  />
                </span>
              </Whisper>

              <Whisper speaker={<Tooltip>Cancellation</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="icon-radiologist-worklist-size"
                    style={{
                      color: canCancel ? '#dc3545' : '#bdbdbd',
                      cursor: canCancel ? 'pointer' : 'not-allowed',
                      opacity: canCancel ? 1 : 0.4,
                      fontSize: '20px'
                    }}
                    onClick={() => {
                      if (!canCancel) return;
                      setTest(rowData);
                      handleCancelClick(rowData);
                    }}
                  />
                </span>
              </Whisper>

              <Whisper
                placement="top"
                speaker={<Tooltip>{rescheduleTooltip}</Tooltip>}
              >
                <FontAwesomeIcon
                  icon={faCalendarCheck}
                  className="icons-styles"
                  color={rescheduleColor}
                  onClick={() => {
                    if (!canReschedule) return;
                    handleOpenRescheduleAppointments(rowData);
                  }}
                  style={{
                    cursor: rescheduleCursor,
                    opacity: canReschedule ? 1 : 0.4
                  }}
                />
              </Whisper>

              <ThreeDotsMenu
                rowData={rowData}
                disabled={isRescheduled || isCancelled}
              />
            </HStack>
          );
        }
      },
      {
        key: 'acceptedAtBy',
        title: <Translate>ACCEPTED BY/AT</Translate>,
        expandable: true,
        width: 180,
        render: (rowData: any) => (
          <UserDateCell
            login={rowData.acceptedBy}
            date={rowData.acceptedAt}
          />
        )
      },
      {
        key: 'rejectedAtBy',
        title: <Translate>REJECTED BY/AT</Translate>,
        expandable: true,
        width: 180,
        render: (rowData: any) => (
          <UserDateCell
            login={rowData.rejectedBy}
            date={rowData.rejectedAt}
          />
        )
      },
      {
        key: 'rejectedReason',
        title: <Translate>REJECT REASON</Translate>,
        expandable: true,
        width: 220,
        render: (rowData: any) => rowData.rejectedReason ?? '-'
      },
      {
        key: 'undoAcceptAtBy',
        title: <Translate>UNDO ACCEPT BY/AT</Translate>,
        expandable: true,
        width: 180,
        render: (rowData: any) => (
          <UserDateCell
            login={rowData.undoAcceptBy}
            date={rowData.undoAcceptDate}
          />
        )
      },
      {
        key: 'undoAcceptReason',
        title: <Translate>UNDO ACCEPT REASON</Translate>,
        expandable: true,
        width: 220,
        render: (rowData: any) => rowData.undoAcceptReason ?? '-'
      },
            {
        key: 'cancelledAtBy',
        title: <Translate>CANCELLED BY/AT</Translate>,
        expandable: true,
        width: 180,
        render: (rowData: any) => (
          <UserDateCell
            login={rowData.cancelledBy}
            date={rowData.cancelledDate}
          />
        )
      },
      {
        key: 'cancellationReason',
        title: <Translate>CANCELLATION REASON</Translate>,
        expandable: true,
        width: 220,
        render: (rowData: any) => rowData.cancellationReason ?? '-'
      }
    ];

    const filters = () => (
      <Form>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
          <MyInput
            fieldType="select"
            fieldName="value"
            fieldLabel='Category'
            width={200}
            placeholder="Select Category"
            selectData={radCategoriesLovQueryResponse?.object}
            selectDataLabel="lovDisplayVale"
            disableByField='isValid'

            selectDataValue="key"
            record={testKeyFilter}
            setRecord={setTestKeyFilter}

            searchable={false}
          />
          <div className='test-table-buttons-main-container'>
          </div>
        </div>
      </Form>
    );

    const hasBulkAcceptEligible = useMemo(() => {
      return normalizedOrderTests.some(
        t =>
          selectedRows.includes(t.id) &&
          canAcceptTest(t) &&
          !isRescheduledTest(t)
      );
    }, [normalizedOrderTests, selectedRows]);


    const tableButtons = (<>
      <div className='rad-test-table-buttons-main-container'>
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
      </div>
    </>);

    useEffect(() => {
      setSelectedRows([]);
    }, [order?.id]);

    const handlePageChange = (_: any, newPage: number) => {
      setPaginationParams(prev => ({
        ...prev,
        page: newPage,
      }));
    };

    const handleRowsPerPageChange = (e: any) => {
      const newSize = Number(e.target.value);
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
      }));
    };

    const handleSortChange = (column: string, type: "asc" | "desc") => {
      setSortColumn(column);
      setSortType(type);

      setPaginationParams(prev => ({
        ...prev,
        sort: `${column},${type}`,
        page: 0,
      }));
    };


    useEffect(() => {
      const fetchReports = async () => {
        const result: Record<number, any> = {};

        for (const t of orderTests) {
          try {
            const report = await getReportByTestId(t.id).unwrap();
            if (report) {
              result[t.id] = report;
            }
          } catch {
          }
        }

        setReportsByTestId(result);
      };

      if (orderTests.length > 0) {
        fetchReports();
      }
    }, [orderTests, refetchAllRadData]);



    const handleCancelConfirm = async () => {
  if (!cancelTargetId) {
    dispatch(
      notify({
        msg: 'No test selected',
        sev: 'warning'
      })
    );
    return;
  }

  if (!cancelReason.trim()) {
    dispatch(
      notify({
        msg: 'Cancellation Reason is required',
        sev: 'warning'
      })
    );
    return;
  }

  try {
    await cancelTest({
      id: cancelTargetId,
      body: {
        cancellationReason: cancelReason.trim()
      }
    }).unwrap();

    dispatch(
      notify({
        msg: 'Test cancelled successfully',
        sev: 'success'
      })
    );

    setOpenCancelModal(false);
    setCancelReason('');
    setCancelTargetId(null);

    await refetchAllRadData();
  } catch (e: any) {
    const backendMessage =
      e?.data?.detail ||
      e?.data?.message ||
      e?.error ||
      'Cancellation failed';

    dispatch(
      notify({
        msg: backendMessage,
        sev: 'error'
      })
    );
  }
      };

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
      <div dir={dir}>
        <Panel ref={ref} defaultExpanded>

          <div className="rad-test-table-main-size">
            <MyTable
              filters={filters()}
              columns={columns}
              tableButtons={tableButtons}
              data={pagedData}
              loading={loading || isTestsFetching}
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={effectiveTotalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sortColumn={sortColumn}
              sortType={sortType}
              onSortChange={handleSortChange}
              onRowClick={rowData => setTest(rowData)}
              rowClassName={isTestSelected}
              loadingHeight={200}
            />
          </div>

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
          />

          <PatientArrivalModal
            open={openArrivalModal}
            setOpen={setOpenArrivalModal}
            test={test}
            setTest={setTest}
            fetchTest={fetchTest}
            fetchAllTests={refetchAllRadData}
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
            required
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
            required
          />

          <RescheduleAppointmentsLookupModal
            open={rescheduleAppointmentsModalOpen}
            setOpen={setRescheduleAppointmentsModalOpen}
            orderTest={selectedOrderTestForReschedule}
            facilityId={selectedDepartment?.facilityId}
            onClose={() => setSelectedOrderTestForReschedule(null)}
            onSuccess={refetchAllRadData}
          />


          <CancellationModal
            open={openCancelModal}
            setOpen={setOpenCancelModal}
            fieldName="cancellationReason"
            object={{ cancellationReason: cancelReason }}
            setObject={(obj: any) =>
              setCancelReason(obj.cancellationReason)
            }
            fieldLabel="Cancellation Reason"
            title="Cancellation"
            required
            handleCancle={handleCancelConfirm}
          />

        </Panel>
      </div>
    );
  }
);

export default Tests;
