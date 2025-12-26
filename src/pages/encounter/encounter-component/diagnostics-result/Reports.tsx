import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AddReportModal from '@/pages/rad-module/AddReportModal';
import {
  useGetDiagnosticOrderTestRadReportListQuery,
  useGetDiagnosticOrderTestReportNotesByReportIdQuery,
  useSaveDiagnosticOrderTestReportNotesMutation
} from '@/services/radService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGenerateRadiologyPdfMutation } from '@/services/setup/radiologyReportApi';
import {
  newApDiagnosticOrderTests,
  newApDiagnosticOrderTestsRadReport,
  newApDiagnosticOrderTestsReportNotes
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  addFilterToListRequest,
  conjureValueBasedOnIDFromList,
  formatDateWithoutSeconds
} from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { faComment, faFileLines, faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Form, HStack, Loader, Tooltip, Whisper } from 'rsuite';

const Reports = ({ patient, user, encounter }) => {
  const dispatch = useAppDispatch();

  const [openReportModal, setOpenReportModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [report, setReport] = useState<any>({ ...newApDiagnosticOrderTestsRadReport });
  const [record, setRecord] = useState({});
  const [test, setTest] = useState<any>({ ...newApDiagnosticOrderTests });
  const [printingKey, setPrintingKey] = useState<string | null>(null);

  const [dateOrderFilter, setDateOrderFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const [listReportResponse, setListReportResponse] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'review_at', operator: 'notMatch', value: 0 }
    ]
  });

  const selectedFacility = useAppSelector(state => state.auth?.tenant?.selectedFacility);
  const authSlice = useAppSelector(state => state.auth);
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  const facilityName = conjureValueBasedOnIDFromList(
    facilityListResponse ?? [],
    selectedFacility?.id,
    'name'
  );

  const isSelected = rowData =>
    rowData && report && rowData.key === report.key ? 'selected-row' : '';

  const {
    data: reportList,
    refetch: reportFetch,
    isLoading
  } = useGetDiagnosticOrderTestRadReportListQuery({ ...listReportResponse });

  const { data: messagesResultList, refetch: fecthResultNotes } =
    useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, {
      skip: report.key == null
    });

  const [saveReportNote] = useSaveDiagnosticOrderTestReportNotesMutation();
  const [generateRadiologyPdf] = useGenerateRadiologyPdfMutation();

  useEffect(() => {
    setTest({ ...report?.test });
  }, [report]);

  useEffect(() => {
    setListReportResponse(prev => ({
      ...prev,
      filters: [
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'review_at', operator: 'notMatch', value: 0 }
      ]
    }));
  }, [dateOrderFilter.fromDate, dateOrderFilter.toDate]);

  useEffect(() => {
        const isDateRangeValid = dateOrderFilter.fromDate !== null && dateOrderFilter.toDate !== null;
        const isResultsLoaded = Array.isArray(reportList?.object) && reportList.object.length > 0;

        if (isDateRangeValid && isResultsLoaded) {
    const fromDate = new Date(dateOrderFilter.fromDate);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(dateOrderFilter.toDate);
    toDate.setHours(23, 59, 59, 999);

    const filtered = reportList.object.filter(item => {
      const createdAt = new Date(item.test?.order?.createdAt);
      return createdAt >= fromDate && createdAt <= toDate;
    });

            const value = filtered.map(order => `(${order.key})`).join(" ") || '("")';

            setListReportResponse(prev =>
                addFilterToListRequest("key", "in", value, prev)
            );
        }
  }, [dateOrderFilter, reportList]);

  const handleSendResultMessage = async value => {
    try {
      await saveReportNote({
        ...newApDiagnosticOrderTestsReportNotes,
        notes: value,
        testKey: report.test.key,
        reportKey: report.key
      }).unwrap();
      dispatch(notify({ msg: 'Send successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Send Failed', sev: 'error' }));
    }
    fecthResultNotes();
  };

  const handlePrintReport = async rowData => {
    try {
      setPrintingKey(rowData.key);
      console.log('encounter=====>', encounter);
      const request = {
        patient,
        encounter,
        reportKey: rowData.key,
        reportHtml: rowData.reportValue,
        reportStatus: rowData.statusLvalue?.lovDisplayVale,
        severity: rowData.severityLvalue?.lovDisplayVale,
        testName: rowData.test?.test?.testName,
        testCode: rowData.test?.test?.internalCode,
        orderId: rowData.test?.order?.orderId,
        reportDate: rowData.approvedAt,
        facilityName,
        authenticatedUserName: `${authSlice?.user?.firstName} ${authSlice?.user?.lastName}`,
        authenticatedUserEmail: authSlice?.user?.email
      };

      const blob = await generateRadiologyPdf(request).unwrap();

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Radiology_Report_${rowData.test?.order?.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      dispatch(notify({ msg: 'PDF downloaded successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Failed to generate PDF', sev: 'error' }));
    } finally {
      setPrintingKey(null);
    }
  };

  const reportColumns = [
    {
      key: 'orderId',
      title: <Translate>ORDER ID</Translate>,
      flexGrow: 1,

      render: (rowData: any) => {
        return rowData.test?.order?.orderId;
      }
    },

    {
      key: 'testName',
      dataKey: 'testName',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.test?.test?.testName;
      }
    },
    {
      key: 'approvedAt',
      title: <Translate>Report Date</Translate>,
      flexGrow: 1,

      render: (rowData: any) => {
        return formatDateWithoutSeconds(rowData.approvedAt);
      }
    },
    {
      key: 'report',
      dataKey: 'report',
      title: <Translate>Report</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return (
          <HStack spacing={10}>
            <FontAwesomeIcon
              icon={faFileLines}
              style={{ fontSize: '1em' }}
              onClick={() => setOpenReportModal(true)}
            />
          </HStack>
        );
      }
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
              fontSize: '1em',
              color: rowData.hasComments ? '#007bff' : 'gray'
            }}
            onClick={() => setOpenNoteResultModal(true)}
          />
        </HStack>
      )
    },

    {
      key: 'statusLkey',
      dataKey: 'statusLkey',
      title: <Translate>REPORT SATUTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue.lovDisplayVale : rowData.statusLkey;
      }
    },
    {
      key: 'lab',
      title: <Translate>EXTERNEL LAB NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }
    },
    {
      key: 'patientArrived',
      title: <Translate>ATTACHMENT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }
    },
    ,
    {
      key: 'file',

      title: <Translate>ATTACHED BY/DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return null;
      }
    },

    {
      key: 'print',
      title: <Translate>Print</Translate>,
      flexGrow: 1,
      render: rowData => (
        <HStack spacing={10}>
          <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print</Tooltip>}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {printingKey === rowData.key ? (
                <Loader size="xs" />
              ) : (
                <FontAwesomeIcon
                  icon={faPrint}
                  style={{ cursor: printingKey ? 'not-allowed' : 'pointer' }}
                  onClick={() => {
                    if (!printingKey) handlePrintReport(rowData);
                  }}
                />
              )}
            </span>
          </Whisper>
        </HStack>
      )
    },
    {
      key: '',
      title: <Translate>Review At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.reviewByUser?.fullName}</span>
            <br />
            <span className="date-table-style">
              {rowData.reviewAt ? new Date(rowData.reviewAt).toLocaleString() : ''}
            </span>
          </>
        );
      }
    }
  ];

  const pageIndexReport = listReportResponse.pageNumber - 1;
  const rowsPerPageReport = listReportResponse.pageSize;
  const totalCountReport = reportList?.extraNumeric ?? 0;

  const filters = () => (
    <Form layout="inline" fluid className="date-filter-form">
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="Order From Date"
        fieldName="fromDate"
        record={dateOrderFilter}
        setRecord={setDateOrderFilter}
      />
      <MyInput
        column
        width={180}
        fieldType="date"
        fieldLabel="Order To Date"
        fieldName="toDate"
        record={dateOrderFilter}
        setRecord={setDateOrderFilter}
      />
      <MyInput
        column
        width="100%"
        fieldType="text"
        fieldLabel="Test Name"
        fieldName="testName"
        record={record}
        setRecord={setRecord}
      />
    </Form>
  );

  return (
    <>
      <MyTable
        filters={filters()}
        columns={reportColumns}
        data={reportList?.object ?? []}
        onRowClick={setReport}
        rowClassName={isSelected}
        loading={isLoading}
        page={pageIndexReport}
        rowsPerPage={rowsPerPageReport}
        totalCount={totalCountReport}
        onPageChange={(_, p) => setListReportResponse({ ...listReportResponse, pageNumber: p + 1 })}
        onRowsPerPageChange={e =>
          setListReportResponse({
            ...listReportResponse,
            pageSize: parseInt(e.target.value, 10),
            pageNumber: 1
          })
        }
        sortColumn={listReportResponse.sortBy}
        sortType={listReportResponse.sortType}
        onSortChange={(sortBy, sortType) =>
          setListReportResponse({ ...listReportResponse, sortBy, sortType })
        }
      />

      <ChatModal
        open={openNoteResultModal}
        setOpen={setOpenNoteResultModal}
        handleSendMessage={handleSendResultMessage}
        title="Comments"
        list={messagesResultList?.object}
        fieldShowName="notes"
      />

      <AddReportModal
        open={openReportModal}
        setOpen={setOpenReportModal}
        test={test}
        setTest={setTest}
        resultFetch={reportFetch}
        report={report}
        setReport={setReport}
        saveReport={() => {}}
        saveTest={() => {}}
        disableEdit
        attachmentRefetch={() => {}}
      />
    </>
  );
};

export default Reports;
