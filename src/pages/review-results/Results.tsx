import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect
} from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import ChatModal from '@/components/ChatModal';
import CancellationModal from '@/components/CancellationModal';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Panel, HStack, Tooltip, Whisper, Form, Checkbox } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCheck,
  faCircleExclamation,
  faComment,
  faFileLines,
  faPrint,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  useFilterDiagnosticOrderTestResultsQuery,
  useApproveDiagnosticOrderTestResultMutation,
  useRejectDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import {
  useGetNotesByResultIdQuery,
  useCreateDiagnosticOrderTestResultTechnicianNoteMutation
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import { useLazyGetPatientByIdQuery } from '@/services/patientService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { useLazyGetDiagnosticOrderByIdQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import { useLazyGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';

const renderMarker = (viewMarker?: string) => {
  switch (viewMarker) {
    case 'NORMAL_MARKER':
      return 'Normal';
    case 'ABNORMAL_MARKER':
      return <FontAwesomeIcon icon={faCircleExclamation} />;
    case 'UPPER_LIMIT':
      return <FontAwesomeIcon icon={faArrowUp} />;
    case 'LOWER_LIMIT':
      return <FontAwesomeIcon icon={faArrowDown} />;
    case 'CRITICAL_UPPER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowUp} />
        </HStack>
      );
    case 'CRITICAL_LOWER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowDown} />
        </HStack>
      );
    default:
      return ' ';
  }
};

const Result = forwardRef<any, any>(
  ({ loading, setTest, refetchAllLabData }, ref) => {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(15);
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [openNotesModal, setOpenNotesModal] = useState(false);
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [approvalDate, setApprovalDate] = useState({ fromDate: null, toDate: null });
    const [orderDate, setOrderDate] = useState({ fromDate: null, toDate: null });
    const [showReview, setShowReview] = useState(false);
    const [showAbnormal, setShowAbnormal] = useState(false);
    const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
    const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
    const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
    const [fetchPatientById] = useLazyGetPatientByIdQuery();

const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});
const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});




    const {
      data: resultsResponse,
      isFetching,
      refetch
    } = useFilterDiagnosticOrderTestResultsQuery({
      page,
      size,
      processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED
    });

    useImperativeHandle(ref, () => ({ refetch }));

    const results = resultsResponse?.data ?? [];
    const totalCount = resultsResponse?.totalCount ?? 0;

    const { data: notesResponse, refetch: refetchNotes } =
      useGetNotesByResultIdQuery(selectedResult?.id ?? skipToken);

    const [sendNote, { isLoading: sendingNote }] =
      useCreateDiagnosticOrderTestResultTechnicianNoteMutation();

    const handleSendNote = async (value: string) => {
      if (!selectedResult?.id) return;
      await sendNote({
        resultId: selectedResult.id,
        orderTestId: selectedResult.orderTestId,
        note: value
      }).unwrap();
      refetchNotes();
    };

    const [approveResult] =
      useApproveDiagnosticOrderTestResultMutation();
    const [rejectResult] =
      useRejectDiagnosticOrderTestResultMutation();

    const handleApprove = async (row: any) => {
      await approveResult(row.id).unwrap();
      setTest({
        id: row.orderTestId,
        processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED,
        status: row.status
      });
      await refetchAllLabData();
      refetch();
    };

    const handleReject = async () => {
      if (!selectedResult?.id) return;
      await rejectResult({
        id: selectedResult.id,
        body: { rejectedReason: rejectReason }
      }).unwrap();
      setRejectReason('');
      setOpenRejectModal(false);
      await refetchAllLabData();
      refetch();
    };

    useEffect(() => {
    if (!results.length) return;

    results.forEach(r => {
        // ========= ORDER =========
        if (r.orderId && !ordersMap[r.orderId]) {
        fetchOrderById(r.orderId)
            .unwrap()
            .then(order => {
            console.log('[ORDER]', order.id);
            setOrdersMap(prev => ({
                ...prev,
                [String(order.id)]: order
            }));
            })
            .catch(() => {});
        }

        // ========= ORDER TEST =========
        if (r.orderTestId && !orderTestsMap[r.orderTestId]) {
        fetchOrderTestById(r.orderTestId)
            .unwrap()
            .then(test => {
            console.log('[ORDER TEST]', test.id);
            setOrderTestsMap(prev => ({
                ...prev,
                [String(test.id)]: test
            }));
            })
            .catch(() => {});
        }
    });
    }, [results]);

    useEffect(() => {
    Object.values(ordersMap).forEach(order => {
        const patientId = order?.patientId ? String(order.patientId) : null;

        if (patientId && !patientsMap[patientId]) {
        fetchPatientById(patientId)
            .unwrap()
            .then(patient => {
            console.log('[PATIENT]', patientId);
            setPatientsMap(prev => ({
                ...prev,
                [patientId]: patient
            }));
            })
            .catch(() => {});
        }
    });
    }, [ordersMap]);

    const { data: profilesResponse } =
    useGetAllDiagnosticTestProfilesQuery({
        page: 0,
        size: 10000,
        sort: 'id,asc'
    });

    const profilesMap = useMemo(
    () => new Map(profilesResponse?.data?.map(p => [p.id, p]) ?? []),
    [profilesResponse]
    );


const normalizedResults = useMemo(() => {
  return results.map(r => {
    const order = ordersMap[r.orderId];
    const patient = patientsMap[order?.patientId];
    const profile = profilesMap.get(r.profileTestId);

    return {
      ...r,
      _patientName: patient?.fullName ?? ' ',
      _profile: profile,
      _testName: profile?.name ?? '-',
      _approvedDate: r.approvedDate
    };
  });
}, [results, ordersMap, patientsMap, profilesMap]);


    const columns = useMemo(
      () => [
        {
        key: 'patient',
        title: <Translate>PATIENT NAME</Translate>,
        render: (r: any) => r._patientName

        },

        {
          key: 'approvedAt',
          title: <Translate>RESULT DATE</Translate>,
          render: (row: any) =>
            formatDateWithoutSeconds(row.approvedDate)
        },
        {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        render: (row: any) => (
            <>
            {row._profile?.name ?? '-'}
            <br />
            <span style={{ fontSize: 10, color: '#666' }}>
                {row._profile?.testName ?? ''}
            </span>
            </>
        )
        },
        {
          key: 'result',
          title: <Translate>TEST RESULT, UNIT</Translate>,
          render: (row: any) =>
            row.resultValueText ??
            row.resultValueNumber ??
            ' '
        },
        {
          key: 'normalRange',
          title: <Translate>NORMAL RANGE</Translate>,
          render: (row: any) => row.viewNormalRange ?? ' '
        },
        {
          key: 'marker',
          title: <Translate>MARKER</Translate>,
          align: 'center',
          render: (row: any) => renderMarker(row.viewMarker)
        },
        {
          key: 'comments',
          title: <Translate>COMMENTS</Translate>,
          align: 'center',
          render: (row: any) => (
            <FontAwesomeIcon
              icon={faComment}
              style={{
                cursor: 'pointer',
                color: row.hasNote ? '#1675e0' : 'gray'
              }}
              onClick={() => {
                setSelectedResult(row);
                setOpenNotesModal(true);
              }}
            />
          )
        },
        {
          key: 'action',
          title: <Translate>ACTION</Translate>,
          align: 'center',
          render: (row: any) => (
            <HStack spacing={10}>
              <Whisper speaker={<Tooltip>Approve</Tooltip>}>
                <FontAwesomeIcon icon={faCheck} onClick={() => handleApprove(row)} />
              </Whisper>
              <Whisper speaker={<Tooltip>Reject</Tooltip>}>
                <FontAwesomeIcon
                  icon={faXmark}
                  onClick={() => {
                    setSelectedResult(row);
                    setOpenRejectModal(true);
                  }}
                />
              </Whisper>
              <FontAwesomeIcon icon={faPrint} />
              <FontAwesomeIcon icon={faFileLines} />
            </HStack>
          )
        }
      ],
      [patientsMap, selectedResult]
    );

    const filters = () => (
      <Form fluid>
          <MyInput fieldType="date" fieldLabel="Approval From Date" fieldName="fromDate" record={approvalDate} setRecord={setApprovalDate} />
          <MyInput fieldType="date" fieldLabel="Approval To Date" fieldName="toDate" record={approvalDate} setRecord={setApprovalDate} />
          <MyInput fieldType="date" fieldLabel="Order From Date" fieldName="fromDate" record={orderDate} setRecord={setOrderDate} />
          <MyInput fieldType="date" fieldLabel="Order To Date" fieldName="toDate" record={orderDate} setRecord={setOrderDate} />
          <Checkbox checked={showReview} onChange={() => setShowReview(!showReview)}>Show Review Result</Checkbox>
          <Checkbox checked={showAbnormal} onChange={() => setShowAbnormal(!showAbnormal)}>Show Abnormal Result</Checkbox>
        <AdvancedSearchFilters />
      </Form>
    );


useEffect(() => {
  console.log('[RESULTS]', results.map(r => ({
    id: r.id,
    orderId: r.orderId,
    orderTestId: r.orderTestId
  })));
}, [results]);




    console.log("results", results);
    return (
      <Panel defaultExpanded>
        <MyTable
          filters={filters()}
          columns={columns}
          data={normalizedResults}
          loading={loading || isFetching}
          page={page}
          rowsPerPage={size}
          totalCount={totalCount}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
          onRowClick={row => setSelectedResult(row)}
        />

        <ChatModal
          open={openNotesModal}
          setOpen={setOpenNotesModal}
          title="Comments"
          list={notesResponse ?? []}
          fieldShowName="note"
          handleSendMessage={handleSendNote}
          loading={sendingNote}
        />

        <CancellationModal
          open={openRejectModal}
          setOpen={setOpenRejectModal}
          fieldName="rejectedReason"
          handleCancle={handleReject}
          object={{ rejectedReason: rejectReason }}
          setObject={(obj: any) => setRejectReason(obj.rejectedReason)}
          fieldLabel="Reject Reason"
          title="Reject Result"
        />
      </Panel>
    );
  }
);

export default Result;
