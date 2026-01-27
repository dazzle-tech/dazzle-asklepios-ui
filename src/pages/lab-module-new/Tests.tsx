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
  useUndoAcceptDiagnosticOrderTestMutation,
  useBulkAcceptDiagnosticOrderTestsMutation,
  useBulkRejectDiagnosticOrderTestsMutation
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import SampleModal from './SampleModal';
import './styles.less';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Checkbox, Form, HStack, Panel, Tooltip, Whisper } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faRightFromBracket, faVialCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetNotesByOrderTestIdQuery,
  useCreateDiagnosticOrderTestTechnicianNoteMutation
} from '@/services/diagnosic-order/diagnosticOrderTestTechnicianNoteService';
import ChatModal from '@/components/ChatModal';
import BulkCollectSampleModal from './BulkCollectSampleModal';
import { formatEnumString } from '@/utils';
import {
  DiagnosticStatus,
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';
import ExternalLabModal from './ExternalLabModal';
import {
  useGetExternalTestByTestIdQuery
} from '@/services/diagnosic-order/externalTestService';
import MyButton from '@/components/MyButton/MyButton';

type Props = {
  order: any;
  test: any;
  setTest: () => any;
  samplesList?: any;
  fecthSample?: () => any;
  fetchAllTests?: () => any;
  loading?: boolean;
  refetchAllLabData: () => Promise<void>;
};


const Tests = forwardRef<any, Props>(
  (
    {
      order,
      test,
      setTest,
      samplesList,
      fetchAllTests,
      fecthSample,
      refetchAllLabData,
      loading
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
    const [openExternalLabModal, setOpenExternalLabModal] = useState(false);

    const [openSingleSampleModal, setOpenSingleSampleModal] = useState(false);
    const [openBulkSampleModal, setOpenBulkSampleModal] = useState(false);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);
    const [openBulkRejectModal, setOpenBulkRejectModal] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');
    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: "testId,asc",
    });

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
      if (!samplesList?.length) {
        dispatch(notify({ msg: 'Collect a sample first.', sev: 'warning' }));
        return;
      }

      try {
        await acceptTest(rowData.id).unwrap();
        dispatch(notify({ msg: 'Accepted successfully', sev: 'success' }));

        await refetchAllLabData();
        // refresh
        await fetchTest();
        try {
          await fetchAllTests?.();
        } catch { }
        try {
          await resultFetch?.();
        } catch { }

        // keep selection updated
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
        await refetchAllLabData();
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
      labCatLovQueryResponse?.object?.find(
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

    const ExternalLabButton = ({
      rowData,
      onClick
    }: {
      rowData: any;
      onClick: () => void;
    }) => {
      const { data: externalTest, isFetching } =
        useGetExternalTestByTestIdQuery(rowData.id, {
          skip: !rowData?.id
        });

      const isRejected =
        rowData.status === DiagnosticOrderTestStatus.REJECTED ||
        rowData.processingStatus === DiagnosticOrderTestStatus.REJECTED;

      const isSentToExternal = !!externalTest?.id;

      const isDisabled = isRejected || isSentToExternal;
      const color = isRejected
        ? 'gray'
        : isSentToExternal
          ? '#1675e0'
          : 'inherit';

      return (
        <Whisper
          placement="top"
          trigger="hover"
          speaker={
            <Tooltip>
              {isRejected
                ? 'Rejected test cannot be sent to external lab'
                : isSentToExternal
                  ? 'Sent to External Lab'
                  : 'Send to External Lab'}
            </Tooltip>
          }
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            style={{
              fontSize: '1em',
              marginRight: 10,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              color,
              opacity: isDisabled ? 0.5 : 1
            }}
            onClick={() => {
              if (isDisabled) return;
              onClick();
            }}
          />
        </Whisper>
      );
    };

    const columns = [
      {
        key: 'check',
        title: <Translate>#</Translate>,
        width: 60,
        align: 'center',
        render: (rowData: any) => {
          const rowId = rowData.id;
          const status = rowData.status;

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
        width: 120,
        align: 'center',
        render: (rowData: any) =>
        resolveCategoryLabel(rowData.lab?.category)
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        width: 120,
        align: 'center',
        render: (rowData: any) => {
          return rowData.test?.name;
        }
      },
      {
        key: 'reason',
        title: <Translate>REASON</Translate>,
        width: 120,
        align: 'center',
        render: rowData =>
          resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
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
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>
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
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faComment}
                style={{ fontSize: '1em', cursor: 'pointer' }}
                onClick={() => {
                  setTest(rowData);
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
                style={{
                  fontSize: '1em',
                  cursor: canCollectSample ? 'pointer' : 'not-allowed',
                  color: canCollectSample ? 'inherit' : 'gray'
                }}
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
        render: (rowData: any) => (
          <>
            {formatEnumString(
              rowData.processingStatus ??
              '—'
            )}
          </>
        )
      },
      {
        key: 'action',
        dataKey: '',
        title: <Translate>ACTION</Translate>,
        width: 140,
        align: 'center',
        render: (rowData: any) => {
          console.log('rowData.processingStatus =', rowData.processingStatus);
          console.log('rowData.status =', rowData.status);


          const canAccept =
            rowData.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED;

          const canReject =
            rowData.status !== DiagnosticOrderTestStatus.APPROVED &&
            rowData.status !== DiagnosticOrderTestStatus.REJECTED;

          const canUndoAccept =
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
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color: canAccept ? 'inherit' : 'gray',
                    cursor: canAccept ? 'pointer' : 'not-allowed'
                  }}
                />
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Undo Accept</Tooltip>}>
                <ReloadIcon
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
                      await refetchAllLabData();
                      await fetchTest();
                      setTest(rowData);
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
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color: canUndoAccept ? '#1675e0' : 'gray',
                    cursor: canUndoAccept ? 'pointer' : 'not-allowed',
                    opacity: canUndoAccept ? 1 : 0.5
                  }}
                />
              </Whisper>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
                <WarningRoundIcon
                  onClick={() => {
                    if (!canReject) {
                      dispatch(
                        notify({
                          msg: 'Cannot reject an accepted or already rejected test',
                          sev: 'warning'
                        })
                      );
                      return;
                    }

                    setTest(rowData);
                    setOpenRejectedModal(true);
                  }}
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color: canReject ? 'inherit' : 'gray',
                    cursor: canReject ? 'pointer' : 'not-allowed'
                  }}
                />

              </Whisper>

              <ExternalLabButton
                rowData={rowData}
                onClick={() => {
                  setTest(rowData);
                  setOpenExternalLabModal(true);
                }}
              />

            </HStack>
          );
        }
      },
      {
        key: 'acceptedatby',
        dataKey: '',
        title: <Translate>ACCEPTED AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.acceptedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.acceptedAt)}
              </span>
            </>
          );
        }
      },
      {
        key: 'rejectedatby',
        dataKey: '',
        title: <Translate>REJECTED AT/BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (rowData: any) => {
          return (
            <>
              <span>{rowData.rejectedBy}</span>
              <br />
              <span className="date-table-style">
                {formatDateWithoutSeconds(rowData.rejectedAt)}
              </span>
            </>
          );
        }
      },
      {
        key: 'rejectedReason',
        dataKey: 'rejectedReason',
        title: <Translate>REJECTED REASON</Translate>,
        flexGrow: 1,
        expandable: true
      },
      {
        key: 'attachment',
        dataKey: '',
        title: <Translate>ATTACHMENT</Translate>,
        flexGrow: 1,
        expandable: true
      }
    ];

    const [record, setRecord] = useState({});

    const tablebuttons = (
      <HStack spacing={10} style={{ marginBottom: 10 }}>

        <Whisper
          placement="top"
          trigger="hover"
          speaker={<Tooltip>Collect Sample</Tooltip>}
        >
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
        <MyInput
          fieldType="select"
          fieldName="value"
          fieldLabel='Category'
          width={200}
          placeholder="Select Category"
          selectData={labCatLovQueryResponse?.object}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={testKeyFilter}
          setRecord={setTestKeyFilter}

          searchable={false}
        />
<div className='test-table-buttons-main-container'>
        {tablebuttons}
</div>
      </Form>
    );

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
        dispatch(
          notify({
            msg: 'Cannot Accept This Test',
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
            t.status !== DiagnosticOrderTestStatus.APPROVED &&
            t.status !== DiagnosticOrderTestStatus.REJECTED
        )
        .map(t => t.id);

      if (!eligibleIds.length) {
        dispatch(
          notify({
            msg: 'No tests eligible for bulk reject',
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


    return (
      <Panel ref={ref} defaultExpanded>

      <div style={{ minHeight: 600 }}>
        <MyTable
          filters={filters()}
          columns={columns}
          height={500}
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
          selectedTestIds={selectedRows}
          onSuccess={() => {
            setSelectedRows([]);
            refetchAllLabData?.();
          }}
        />

        <ExternalLabModal
          open={openExternalLabModal}
          setOpen={setOpenExternalLabModal}
          orderTest={test}
          onSuccess={async () => {
            await refetchAllLabData();
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

      </Panel>
    );
  }
);

export default Tests;
