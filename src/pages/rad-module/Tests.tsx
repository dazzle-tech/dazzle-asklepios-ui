import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';
import ReloadIcon from '@rsuite/icons/Reload';
import {
  useGetTestsByOrderIdQuery,
  useAcceptDiagnosticOrderTestMutation,
  useRejectDiagnosticOrderTestMutation,
  useFilterDiagnosticOrderTestsQuery,
  useUndoAcceptDiagnosticOrderTestMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Checkbox, Form, HStack, Panel, Popover, Tooltip, Whisper } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCircleStop, faComment, faEllipsisVertical, faHospitalUser, faPlay, faPlusCircle, faRightFromBracket, faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetNotesByOrderTestIdQuery,
  useCreateDiagnosticOrderTestTechnicianNoteMutation
} from '@/services/diagnosic-order/diagnosticOrderTestTechnicianNoteService';
import ChatModal from '@/components/ChatModal';
import { formatEnumString } from '@/utils';
import {
  DiagnosticStatus,
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';
import {
  useGetExternalTestByTestIdQuery
} from '@/services/diagnosic-order/externalTestService';
import MyButton from '@/components/MyButton/MyButton';
import { useGetAllRadiologiesQuery, useGetRadiologyByTestIdQuery } from '@/services/setup/diagnosticTest/radiologyTestService';
import PatientArrivalModal from './PatientArrivalModal';
import { Dropdown } from 'rsuite';
import {
  useStartRadiologyImageMutation,
  usePauseRadiologyImageMutation,
  useResumeRadiologyImageMutation,
  useFinishRadiologyImageMutation,
  useGetRadiologyReportByOrderTestIdQuery,
  useLazyGetRadiologyReportByOrderTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';


type Props = {
  order: any;
  test: any;
  setTest: (t: any) => void;
  fetchAllTests?: () => any;
  loading?: boolean;
  refetchAllRadData: () => Promise<void>;
  saveTest: (payload: any) => Promise<void>;
};

const Tests = forwardRef<any, Props>(
  (
    {
      order,
      test,
      setTest,
      fetchAllTests,
      refetchAllRadData,
      loading,
      saveTest
    },
    ref
  ) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const selectedDepartment = authSlice.selectedDepartment;
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [testKeyFilter, setTestKeyFilter] = useState({ value: '' });
    const [selectedRows, setSelectedRows] = useState<(number | string)[]>([]);
    const [localHasNoteIds, setLocalHasNoteIds] = useState<(number | string)[]>([]);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");
    const [openArrivalModal, setOpenArrivalModal] = useState(false);
    const [reportsByTestId, setReportsByTestId] = useState<Record<number, any>>({});


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
      test?.id
        ? {
          orderTestId: test.id,
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
          status: 'SUBMITTED',
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

    const [acceptTest] = useAcceptDiagnosticOrderTestMutation();
    const [rejectTest] = useRejectDiagnosticOrderTestMutation();
    const [undoAcceptTest, { isLoading: isUndoing }] = useUndoAcceptDiagnosticOrderTestMutation();

    const testsMap = useMemo(() => {
      return new Map(allTests.map(t => [t.id, t]));
    }, [allTests]);

    const { data: allRadiologiesResponse } = useGetAllRadiologiesQuery({
      page: 0,
      size: 10000,
      sort: 'testId,asc'
    });


    
const [
  getReportByTestId,
  { data: singleReport }
] = useLazyGetRadiologyReportByOrderTestIdQuery();


    const allRadiologies = allRadiologiesResponse?.data ?? [];

    const radiologyByTestIdMap = useMemo(() => {
      return new Map(allRadiologies.map(r => [r.testId, r]));
    }, [allRadiologies]);

    const normalizedOrderTests = useMemo(() => {
      return orderTests.map(orderTest => {
        const test = testsMap.get(orderTest.testId);
        const radiology = radiologyByTestIdMap.get(orderTest.testId);
        const report = reportsByTestId[orderTest.id];

        return {
          ...orderTest,
          test,
          radiology,
          imageStatus: report?.imageStatus, // ⭐⭐⭐ هذا المهم
          orderType: orderTest.orderType ?? test?.type
        };
      });
    }, [orderTests, testsMap, radiologyByTestIdMap, reportsByTestId]);

    const acceptedStatuses = [
      DiagnosticOrderTestStatus.ACCEPTED,
      DiagnosticOrderTestStatus.PARTIALLY
    ];

    const acceptedTests = useMemo(
      () =>
        normalizedOrderTests.filter(t =>
          acceptedStatuses.includes(t.processingStatus)
        ),
      [normalizedOrderTests]
    );

    const isTestSelected = (rowData: any) => {
      if (rowData && test && rowData.id === test.id) return 'selected-row';
      return '';
    };

    const filteredTests = normalizedOrderTests;

    const pagedData = useMemo(() => {
      const start = pageIndex * rowsPerPage;
      const end = start + rowsPerPage;
      return filteredTests.slice(start, end);
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
        test.status === DiagnosticOrderTestStatus.APPROVED
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

    const resolveTimeUnitLabel = (key?: any) =>
      timeUnitLov?.object?.find(
        u => String(u.key) === String(key)
      )?.lovDisplayVale ?? '';

    console.log("orderTests", orderTests);

    const handleCheckboxChange = (rowId: number | string) => {
      setSelectedRows(prev =>
        prev.includes(rowId)
          ? prev.filter(id => id !== rowId)
          : [...prev, rowId]
      );
    };

    const allRowIds = useMemo(
      () => pagedData.map(row => row.id),
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

    const ThreeDotsMenu = ({ rowData }: { rowData: any }) => {
      const isAccepted =
        rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED;

      const imageStatus = rowData.imageStatus;

    const isRunning =
      imageStatus === 'STARTED' || imageStatus === 'RESUMED';

    const isPaused = imageStatus === 'PAUSED';
    const isFinished = imageStatus === 'FINISHED';

      if (!isAccepted) {
        return (
          <FontAwesomeIcon
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
            icon={faEllipsisVertical}
            style={{ cursor: 'pointer' }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          />
        </Whisper>
      );
    };

    const columns = [
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

          return (
            <Checkbox
              checked={selectedRows.includes(rowId)}
              onChange={() => handleCheckboxChange(rowId)}
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
        flexGrow: 1,
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
        key: 'duration',
        title: <Translate>DURATION</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => {
          const duration = rowData.radiology?.imageDuration;
          console.log('RAD META', {
            testId: rowData.test?.id,
            radiology: rowData.radiology
          });
          return duration ? `${duration} min` : ' ';
        }
      },
      {
        key: 'physician',
        title: <Translate>PHYSICIAN</Translate>,
        width: 170,
        align: 'center',
        render: (rowData: any) => (
          <>
            <div>{rowData.createdBy}</div>
            <div className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdDate)}
            </div>
          </>
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
              icon={faComment}
              style={{
                cursor: 'pointer',
                color: hasNote ? '#1675e0' : '#999'
              }}
              onClick={() => {
                setTest(rowData);
                setOpenNoteModal(true);
              }}
            />
          );
        }
      },
      {
        key: 'patientArrived',
        title: <Translate>PATIENT ARRIVED</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faHospitalUser}
                style={{ fontSize: '1em' }}
                onClick={() => setOpenArrivalModal(true)}
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
        key: 'action',
        dataKey: '',
        title: <Translate>ACTION</Translate>,
        width: 180,
        align: 'center',
        render: (rowData: any) => {
          const canAccept =
            rowData.processingStatus === DiagnosticOrderTestStatus.PATIENT_ARRIVED;

          const canUndoAccept =
            rowData.processingStatus === DiagnosticOrderTestStatus.ACCEPTED;

          const canReject =
            rowData.processingStatus !== DiagnosticOrderTestStatus.RESULT_APPROVED &&
            rowData.processingStatus !== DiagnosticOrderTestStatus.REJECTED;

            console.log(
              'ROW IMAGE STATUS',
              rowData.id,
              rowData.imageStatus
            );

          return (
            <HStack spacing={8}>
              <Whisper speaker={<Tooltip>Accept</Tooltip>}>
                <span>
                  <CheckRoundIcon
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
                    style={{
                      cursor: canUndoAccept ? 'pointer' : 'not-allowed',
                      opacity: canUndoAccept ? 1 : 0.4,
                      color: canUndoAccept ? '#1675e0' : 'gray'
                    }}
                    onClick={async () => {
                      if (!canUndoAccept) return;

                      try {
                        await undoAcceptTest(rowData.id).unwrap();
                        dispatch(
                          notify({
                            msg: 'Undo accept successful',
                            sev: 'success'
                          })
                        );
                        await refetchAllRadData();
                      } catch (e: any) {
                        dispatch(
                          notify({
                            msg:
                              e?.data?.message ||
                              e?.data?.detail ||
                              'Undo accept failed',
                            sev: 'error'
                          })
                        );
                      }
                    }}
                  />
                </span>
              </Whisper>

              <Whisper speaker={<Tooltip>Reject</Tooltip>}>
                <span>
                  <WarningRoundIcon
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
              <ThreeDotsMenu rowData={rowData} />
            </HStack>
          );
        }
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

    return (
      <Panel ref={ref} defaultExpanded>

        <div style={{ minHeight: 600 }}>
          <MyTable
            filters={filters()}
            columns={columns}
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
            minHeight={600}
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

        <PatientArrivalModal
          open={openArrivalModal}
          setOpen={setOpenArrivalModal}
          test={test}
          setTest={setTest}
          saveTest={saveTest}
          fetchTest={fetchTest}
          fetchAllTests={refetchAllRadData}
        />

      </Panel>
    );
  }
);

export default Tests;
