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
  useFilterDiagnosticOrderTestsQuery
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
import { formatEnumString} from '@/utils';
import {
  DiagnosticStatus,
  DiagnosticOrderTestStatus
} from '@/types/model-types-new';

type Props = {
  order: any;
  test: any;
  setTest: Dispatch<any>;
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

    const [testKeyFilter, setTestKeyFilter] = useState(null);
    const [selectedRows, setSelectedRows] = useState<(number | string)[]>([]);

    const [openSingleSampleModal, setOpenSingleSampleModal] = useState(false);
    const [openBulkSampleModal, setOpenBulkSampleModal] = useState(false);
    const [openRejectedModal, setOpenRejectedModal] = useState(false);
    const [openNoteModal, setOpenNoteModal] = useState(false);

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
        size: rowsPerPage
      }
    : skipToken
);

    const orderTests = testsResponse?.data ?? [];

    useImperativeHandle(ref, () => ({
      fetchTest
    }));

    const [acceptTest] = useAcceptDiagnosticOrderTestMutation();
    const [rejectTest] = useRejectDiagnosticOrderTestMutation();


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


    const filteredTests = useMemo(() => {
      if (!testKeyFilter) return normalizedOrderTests;

      return normalizedOrderTests.filter(
        t => String(t.test?.id) === String(testKeyFilter)
      );
    }, [normalizedOrderTests, testKeyFilter]);



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
      } catch (e) {
        dispatch(notify({ msg: 'Reject failed', sev: 'error' }));
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
          ? prev.filter(id => id !== rowId) // unselect
          : [...prev, rowId]               // select
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
        flexGrow: 1,
        render: (rowData: any) =>
          resolveCategoryLabel(rowData.lab?.category)
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          return rowData.test?.name;
        }
      },
      {
        key: 'reason',
        title: <Translate>REASON</Translate>,
        flexGrow: 1,
        render: rowData =>
          resolveReasonLabel(rowData.reason ?? rowData.reasonLkey)
      },
      {
        key: 'physician',
        title: <Translate>PHYSICIAN</Translate>,
        flexGrow: 1,
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
        flexGrow: 1,
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
        flexGrow: 1,
        render: rowData => rowData.notes ?? ''
      },
      {
        key: 'technicannotes',
        dataKey: '',
        title: <Translate>TECHNICIAN NOTES</Translate>,
        flexGrow: 1,
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
        flexGrow: 1,
        render: (rowData: any) => (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faVialCircleCheck}
              style={{ fontSize: '1em', cursor: 'pointer' }}
              onClick={() => {
                setTest(rowData);
                setOpenSingleSampleModal(true);
              }}
            />
          </HStack>
        )
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
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
        flexGrow: 1,
        render: (rowData: any) => {
          console.log('rowData.processingStatus =', rowData.processingStatus);
          console.log('rowData.status =', rowData.status);

          const canAccept =
            rowData.processingStatus === DiagnosticOrderTestStatus.SAMPLE_COLLECTED;

          const canReject =
            rowData.status !== DiagnosticOrderTestStatus.APPROVED &&
            rowData.status !== DiagnosticOrderTestStatus.CANCELLED;

          return (
            <HStack spacing={10}>
              {/* ✅ ACCEPT */}
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

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Undo Accepted</Tooltip>}>
                <ReloadIcon
                  style={{
                    fontSize: '1em',
                    marginRight: 10,
                    color: 'gray',
                    cursor: 'not-allowed'
                  }}
                />
              </Whisper>

              {/* ❌ REJECT */}
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
                <WarningRoundIcon
                  onClick={() => {
                    if (!canReject) return;
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

              {/* 🚚 SEND TO EXTERNAL LAB (placeholder) */}
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Send to External Lab</Tooltip>}
              >
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  style={{ fontSize: '1em', marginRight: 10, cursor: 'pointer' }}
                />
              </Whisper>
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

    const filters = () => (
      <Form>
        <MyInput
          fieldType="select"
          fieldName="testKey"
          width={200}
          placeholder="Select Category"
          selectData={labCatLovQueryResponse?.object}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
          onChange={(value: any) => {
            setTestKeyFilter(value ?? null);
            setPageIndex(0);
          }}
          onClean={() => {
            setTestKeyFilter(null);
            setPageIndex(0);
          }}
          searchable={false}
        />
      </Form>
    );

    const tablebuttons = (<>
      <HStack spacing={10} style={{ marginBottom: 10 }}>
        <FontAwesomeIcon
          icon={faVialCircleCheck}
          style={{
            fontSize: '1.2em',
            cursor: selectedRows.length ? 'pointer' : 'not-allowed',
            color: selectedRows.length ? '#1675e0' : 'gray'
          }}
          onClick={() => {
            if (!selectedRows.length) return;

            setOpenBulkSampleModal(true);
          }}
        />
        <span>
          Collect Sample ({selectedRows.length})
        </span>
      </HStack>
    </>);


    useEffect(() => {
      setSelectedRows([]);
    }, [order?.id]);


    return (
      <Panel ref={ref} defaultExpanded>
        <MyTable
          filters={filters()}
          columns={columns}
          height={450}
          tableButtons={tablebuttons}
          data={pagedData}        // ← normalized + filtered + paged
          loading={loading || isTestsFetching}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={effectiveTotalCount}
          onPageChange={(_, page) => setPageIndex(page)}
          onRowsPerPageChange={e => {
            setRowsPerPage(Number(e.target.value));
            setPageIndex(0);
          }}
          onRowClick={rowData => setTest(rowData)}
          rowClassName={isTestSelected}
        />


<SampleModal
  open={openSingleSampleModal}
  setOpen={setOpenSingleSampleModal}
  orderTest={test}
  onSuccess={async () => {
            setSelectedRows([]);
            refetchAllLabData?.();  }}
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


      </Panel>
    );
  }
);

export default Tests;
