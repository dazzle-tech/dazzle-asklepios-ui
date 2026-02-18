import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import {
  useFilterRadiologyReportsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import {
  useGetReportCommentsByReportIdQuery,
  useCreateReportCommentMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Form, HStack } from 'rsuite';
import { formatEnumString } from '@/utils';
import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import { MdAttachFile } from 'react-icons/md';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import MyModal from '@/components/MyModal/MyModal';
import {
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';


const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const Reports = ({ patient }) => {
  const dispatch = useAppDispatch();

  const today = new Date();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [testsMap, setTestsMap] = useState<Record<string, any>>({});

  const [orderDate, setOrderDate] = useState({
    fromDate: today,
    toDate: today
  });

  const queryParams: any = {
    processingStatus: 'RESULT_APPROVED',
    reviewed: true,
    ...(orderDate.fromDate
      ? { approvedDateFrom: startOfDay(orderDate.fromDate).toISOString() }
      : {}),
    ...(orderDate.toDate
      ? { approvedDateTo: endOfDay(orderDate.toDate).toISOString() }
      : {})
  };

  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedReportForAttachments, setSelectedReportForAttachments] = useState<any>(null);
  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();

  const { data, isFetching, refetch } =
    useFilterRadiologyReportsQuery({
      page,
      size: rowsPerPage,
      sort: 'id,desc',
      params: queryParams
    });

  const reports = Array.isArray(data?.data) ? data.data : [];
  const totalCount = data?.totalCount ?? 0;


  const orderTestIds = useMemo(() => {
    if (!Array.isArray(reports)) return [];

    return reports
      .map(r => r.orderTestId)
      .filter(Boolean)
      .map(String)
      .filter((id, i, arr) => arr.indexOf(id) === i);
  }, [reports]);

    const testIds = useMemo(() => {
  return Object.values(orderTestsMap)
    .map((ot: any) => ot?.testId)
    .filter(Boolean)
    .map(String)
    .filter((id, i, arr) => arr.indexOf(id) === i);
  }, [orderTestsMap]);


  const isDataLoaded =
    orderTestIds.every(id => orderTestsMap[id]) &&
    testIds.every(id => testsMap[id]);



  /** Comments */
  const {
    data: comments,
    refetch: refetchComments
  } = useGetReportCommentsByReportIdQuery(
    openNoteResultModal && selectedReport?.id
      ? selectedReport.id
      : undefined
  );

  const [createComment] = useCreateReportCommentMutation();

  const handleSendComment = async (value: string) => {
    try {
      await createComment({
        reportId: selectedReport.id,
        orderTestId: selectedReport.orderTestId,
        note: value
      }).unwrap();

      dispatch(notify({ msg: 'Comment sent', sev: 'success' }));
      refetchComments();
    } catch {
      dispatch(notify({ msg: 'Send failed', sev: 'error' }));
    }
  };

  const reportColumns = [
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const ot = orderTestsMap[String(rowData.orderTestId)];
        return ot?.orderId ?? '—';
      }
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const ot = orderTestsMap[String(rowData.orderTestId)];
        if (!ot) return '';

        const test = testsMap[String(ot.testId)];
        return test?.name ?? '';
      }
    },
    {
      key: 'approvedAt',
      title: <Translate>Report Date</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>
        rowData.createdDate
          ? new Date(rowData.createdDate).toLocaleString()
          : ''
    },
    {
      key: 'report',
      title: <Translate>Report</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <HStack spacing={10}>
          <FontAwesomeIcon
            icon={faFileLines}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedReport(rowData);
              setOpenReportModal(true);
            }}
          />
        </HStack>
      )
    },
    {
      key: 'comment',
      title: <Translate>COMMENTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <HStack spacing={10}>
          <FontAwesomeIcon
            icon={faComment}
            style={{
              cursor: 'pointer',
              color: rowData.hasComments ? '#007bff' : 'gray'
            }}
            onClick={() => {
              setSelectedReport(rowData);
              setOpenNoteResultModal(true);
            }}
          />
        </HStack>
      )
    },
    {
      key: 'status',
      title: <Translate>REPORT STATUS</Translate>,
      flexGrow: 1,
      render: (rowData: any) =>
        formatEnumString(rowData.processingStatus)
    },
    {
      key: 'attachment',
      title: <Translate>ATTACHMENT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={18}
          style={{ cursor: 'pointer', color: '#666' }}
          onClick={async () => {
            const ot = orderTestsMap[String(rowData.orderTestId)];
            if (!ot?.orderId) return;

            try {
              const order = await fetchOrderById(ot.orderId).unwrap();

              if (!order?.encounterId) {
                dispatch(notify({
                  msg: 'Encounter not found',
                  sev: 'warning'
                }));
                return;
              }

              setSelectedReportForAttachments({
                reportId: rowData.id,
                encounterId: order.encounterId
              });

              setAttachmentsModalOpen(true);
            } catch {
              dispatch(notify({
                msg: 'Failed to load encounter',
                sev: 'error'
              }));
            }
          }}
        />
      )
    },
    {
      key: 'review',
      title: <Translate>Review At/By</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <>
          <span>{rowData.reviewBy}</span>
          <br />
          <span className="date-table-style">
            {rowData.reviewDate
              ? new Date(rowData.reviewDate).toLocaleString()
              : ''}
          </span>
        </>
      )
    }
  ];


  const filters = (
    <Form layout="inline" fluid>
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="From Date"
        fieldName="fromDate"
        record={orderDate}
        setRecord={setOrderDate}
      />
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="To Date"
        fieldName="toDate"
        record={orderDate}
        setRecord={setOrderDate}
      />
    </Form>
  );

  const closeModal = () => {
    setOpenReportModal(false);
    setSelectedReport(null);
  };


  useEffect(() => {
    orderTestIds.forEach(id => {
      if (orderTestsMap[id]) return;

      fetchOrderTestById(Number(id))
        .unwrap()
        .then(res => {
          if (!res) return;
          setOrderTestsMap(prev => ({
            ...prev,
            [id]: res
          }));
        })
        .catch(() => { });
    });
  }, [orderTestIds]);

  useEffect(() => {
    testIds.forEach(id => {
      if (testsMap[id]) return;

      fetchDiagnosticTestById(Number(id))
        .unwrap()
        .then(res => {
          const test = res?.data;
          if (!test) return;

          setTestsMap(prev => ({
            ...prev,
            [id]: test
          }));
        })
        .catch(() => {});
    });
  }, [testIds]);
  
  return (
    <>
      <MyTable
        filters={filters}
        columns={reportColumns}
        data={reports}
        loading={isFetching || !isDataLoaded}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => {
          setRowsPerPage(+e.target.value);
          setPage(0);
        }}
      />

      <ChatModal
        open={openNoteResultModal}
        setOpen={setOpenNoteResultModal}
        handleSendMessage={handleSendComment}
        title="Comments"
        list={comments ?? []}
        fieldShowName="note"
      />

      {openReportModal && selectedReport && (
        <AddReportModal
          key={selectedReport.id}
          open={openReportModal}
          setOpen={closeModal}
          report={selectedReport}
          setReport={setSelectedReport}
          orderTestId={selectedReport.orderTestId}
          disableEdit
          disableDefaultTemplate
        />
      )}



      <MyModal
        open={attachmentsModalOpen}
        setOpen={setAttachmentsModalOpen}
        title="Attachments - Radiology Report"
        size="lg"
        hideActionBtn
        content={
          selectedReportForAttachments && (
            <EncounterAttachment
              localEncounter={{ id: selectedReportForAttachments.encounterId }}
              source="RADIOLOGY_REPORT_ATTACHMENT"
              sourceId={Number(selectedReportForAttachments.reportId)}
              refetchAttachmentList={false}
              setRefetchAttachmentList={() => {}}
            />
          )
        }
      />

    </>
  );
};

export default Reports;
