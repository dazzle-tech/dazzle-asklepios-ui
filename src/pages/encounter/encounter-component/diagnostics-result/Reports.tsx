import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import {
  useLazyGetDiagnosticOrderByIdQuery,
  useFilterDiagnosticOrdersQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import {
  useLazyGetDiagnosticOrderTestByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useGetReportCommentsByReportIdQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportCommentsService';
import {
  useFilterRadiologyReportsQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import {
  useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faFileLines, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useMemo, useState } from 'react';
import { MdAttachFile } from 'react-icons/md';
import { Form, HStack, Tooltip, Whisper } from 'rsuite';
import { useLazyGetRadiologyReportByIdQuery, useLazyGetRadiologyReportPdfQuery } from '@/services/reports/radiologyReportService';
import MyButton from '@/components/MyButton/MyButton';

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
  const patientId = patient?.id;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
  const [testsMap, setTestsMap] = useState<Record<string, any>>({});
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedReportForAttachments, setSelectedReportForAttachments] =
    useState<any>(null);

  const [orderDate, setOrderDate] = useState({
    fromDate: today,
    toDate: today
  });

  const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
  const [fetchDiagnosticTestById] = useLazyGetDiagnosticTestByIdQuery();
  const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();

  const [fetchRadiologyReportPdfData, { isFetching: isGeneratingReport }] =
    useLazyGetRadiologyReportPdfQuery();

  const ordersQueryParams = useMemo(() => {
    if (!patientId) return skipToken;

    return {
      patientId,
      page: 0,
      size: 1000,
      sort: 'id,desc'
    };
  }, [patientId]);

  const {
    data: ordersResponse,
    isFetching: isOrdersFetching
  } = useFilterDiagnosticOrdersQuery(ordersQueryParams);

  const orders = ordersResponse?.data ?? [];

  const orderIds = useMemo(
    () => orders.map((o: any) => o.id).filter(Boolean),
    [orders]
  );

  const queryParams = useMemo(() => {
    if (!patientId) return null;
    if (isOrdersFetching) return null;
    if (!orderIds.length) return null;

    return {
      processingStatus: 'RESULT_APPROVED',
      reviewed: true,
      orderIdIn: orderIds,
      ...(orderDate.fromDate
        ? { approvedDateFrom: startOfDay(orderDate.fromDate).toISOString() }
        : {}),
      ...(orderDate.toDate
        ? { approvedDateTo: endOfDay(orderDate.toDate).toISOString() }
        : {})
    };
  }, [patientId, isOrdersFetching, orderIds, orderDate]);

  const {
    data,
    isFetching
  } = useFilterRadiologyReportsQuery(
    queryParams
      ? {
          page,
          size: rowsPerPage,
          sort: 'id,desc',
          params: queryParams
        }
      : skipToken
  );

  const reports = Array.isArray(data?.data) ? data.data : [];
  const totalCount = data?.totalCount ?? 0;

  const orderTestIds = useMemo(() => {
    if (!Array.isArray(reports)) return [];

    return reports
      .map((r) => r.orderTestId)
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
    orderTestIds.every((id) => orderTestsMap[id]) &&
    testIds.every((id) => testsMap[id]);

  const { data: comments } = useGetReportCommentsByReportIdQuery(
    openNoteResultModal && selectedReport?.id
      ? selectedReport.id
      : skipToken
  );

 
const handleGenerateReport = async () => {
  if (!selectedReport?.id) return;

  try {
    const blob = await fetchRadiologyReportPdfData({
      reportId: selectedReport.id,
    }).unwrap();

    const pdfBlob = new Blob([blob], {
      type: 'application/pdf',
    });

    const fileURL = window.URL.createObjectURL(pdfBlob);

    const win = window.open(fileURL, '_blank');

    if (win) {
      win.focus();
    } else {
      dispatch(
        notify({
          msg: 'Popup blocked. Please allow popups for this site.',
          sev: 'warning',
        })
      );
    }

    // لا تعمل revokeObjectURL هنا
  } catch (error) {
    dispatch(
      notify({
        msg: 'Failed to generate report PDF',
        sev: 'error',
      })
    );
  }
};
  const reportColumns: ColumnConfig[] = [
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      render: (rowData: any) => {
        const ot = orderTestsMap[String(rowData.orderTestId)];
        return ot?.orderId ?? '—';
      }
    },
    {
      key: 'testName',
      title: <Translate>TEST NAME</Translate>,
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
      render: (rowData: any) =>
        rowData.createdDate
          ? new Date(rowData.createdDate).toLocaleString()
          : ''
    },
    {
      key: 'report',
      title: <Translate>Report</Translate>,
      render: (rowData: any) => {
        const isSelected = selectedReport?.id === rowData.id;

        return (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faFileLines}
              style={{
                cursor: 'pointer',
                color: isSelected ? '#1675e0' : '#666'
              }}
              onClick={() => {
                setSelectedReport(rowData);
              }}
            />
            {isSelected && (
              <span style={{ color: '#1675e0', fontSize: 12 }}>
                Selected
              </span>
            )}
          </HStack>
        );
      }
    },
    {
      key: 'comment',
      title: 'COMMENTS',
      width: 100,
      align: 'center',
      render: (row: any) => {
        const hasComment = !!row?.hasNote;
        return (
          <Whisper speaker={<Tooltip>Comments</Tooltip>}>
            <span style={{ cursor: 'pointer' }}>
              <FontAwesomeIcon
                className='icon-radiologist-worklist-size'
                icon={faComment}
                style={{
                  color: hasComment ? '#1675e0' : '#999'
                }}
                onClick={() => {
                  setSelectedReport(row);
                  setOpenNoteResultModal(true);
                }}
              />
            </span>
          </Whisper>
        );
      }
    },
    {
      key: 'status',
      title: <Translate>REPORT STATUS</Translate>,
      render: (rowData: any) => formatEnumString(rowData.processingStatus)
    },
    {
      key: 'attachment',
      title: <Translate>ATTACHMENT</Translate>,
      render: (rowData: any) => (
        <MdAttachFile
          size={18}
          style={{ cursor: 'pointer', color: '#666' }}
          onClick={async () => {
            const ot = orderTestsMap[String(rowData.orderTestId)];
            if (!ot?.orderId) return;

            try {
              const order = await fetchOrderById(ot.orderId).unwrap();
              const orderData = order?.data ?? order;

              if (!orderData?.encounterId) {
                dispatch(
                  notify({
                    msg: 'Encounter not found',
                    sev: 'warning'
                  })
                );
                return;
              }

              setSelectedReportForAttachments({
                reportId: rowData.id,
                encounterId: orderData.encounterId
              });

              setAttachmentsModalOpen(true);
            } catch {
              dispatch(
                notify({
                  msg: 'Failed to load encounter',
                  sev: 'error'
                })
              );
            }
          }}
        />
      )
    },
    {
      key: 'review',
      title: <Translate>Review At/By</Translate>,
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

  const tableButtons = (
   
    <MyButton
          onClick={handleGenerateReport}
          loading={isGeneratingReport}
          disabled={selectedReport?.id ? false : true}
          appearance='ghost'
          prefixIcon={() => (
            <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
          )}
        >
          <Translate>Generate Report</Translate>
        </MyButton>
  );

  const closeModal = () => {
    setOpenReportModal(false);
    setSelectedReport(null);
  };

  useEffect(() => {
    orderTestIds.forEach((id) => {
      if (orderTestsMap[id]) return;

      fetchOrderTestById(Number(id))
        .unwrap()
        .then((res) => {
          if (!res) return;
          setOrderTestsMap((prev) => ({
            ...prev,
            [id]: res
          }));
        })
        .catch(() => {});
    });
  }, [orderTestIds, fetchOrderTestById, orderTestsMap]);

  useEffect(() => {
    testIds.forEach((id) => {
      if (testsMap[id]) return;

      fetchDiagnosticTestById(id)
        .unwrap()
        .then((res) => {
          const test = res?.data ?? res;
          if (!test) return;

          setTestsMap((prev) => ({
            ...prev,
            [id]: test
          }));
        })
        .catch(() => {});
    });
  }, [testIds, fetchDiagnosticTestById, testsMap]);

  useEffect(() => {
    setPage(0);
  }, [patientId, orderDate]);

  if (!patientId) {
    return null;
  }

  return (
    <>
      <MyTable
        filters={filters}
        tableButtons={tableButtons}
        columns={reportColumns}
        data={reports}
        loading={isOrdersFetching || isFetching || (!!reports.length && !isDataLoaded)}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value);
          setPage(0);
        }}
        onRowClick={(rowData) => {
          setSelectedReport(rowData);
        }}
        rowClassName={(rowData) => (selectedReport?.id === rowData.id ? 'selected' : '')}
      />

      <ChatModal
        open={openNoteResultModal}
        setOpen={setOpenNoteResultModal}
        handleSendMessage={() => {}}
        title="Comments"
        list={comments ?? []}
        fieldShowName="note"
        disabled
      />

      {openReportModal && selectedReport && (
        <AddReportModal
          key={selectedReport.id}
          open={openReportModal}
          setOpen={closeModal}
          report={selectedReport}
          setReport={setSelectedReport}
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
              source="RADIOLOGIST_WORKLIST_ATTACHMENT"
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