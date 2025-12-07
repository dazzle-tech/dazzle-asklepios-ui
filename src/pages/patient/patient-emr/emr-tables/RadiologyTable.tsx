import React, { useEffect, useRef, useState } from 'react';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDiagnosticOrderTestRadReportListQuery, useGetDiagnosticOrderTestReportNotesByReportIdQuery } from '@/services/radService';
import { HStack } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faFileLines } from '@fortawesome/free-solid-svg-icons';
import AddReportModal from '@/pages/rad-module/AddReportModal';
import ChatModal from '@/components/ChatModal';
import { useGetPatientAttachmentsListQuery } from '@/services/attachmentService';
import { FaFileArrowDown } from 'react-icons/fa6';
import { useGetDiagnosticsTestListQuery } from '@/services/setupService';

const handleDownload = attachment => {
  const byteCharacters = atob(attachment.fileContent);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: attachment.contentType });

  // Create a temporary  element and trigger the download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};



const RadiologyTable = ({ patient }) => {
  const [openReportModal, setOpenReportModal] = useState(false);
  const [openNoteResultModal, setOpenNoteResultModal] = useState(false);
  const [test, setTest] = useState(null);
  const [report, setReport] = useState(null);

  const { data: messagesResultList, refetch: fecthResultNotes } =
    useGetDiagnosticOrderTestReportNotesByReportIdQuery(report?.key || undefined, {
      skip: report?.key == null
    });

  //to set notes modal scroll in tha last massage
  const endOfMessagesRef = useRef(null);
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesResultList]);


  const [listPrevResultResponse, setListPrevResultResponse] = useState<ListRequest>({
    ...initialListRequest,
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key || undefined
      }
    ]
  });
  useEffect(() => {
    setListPrevResultResponse(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key || undefined
        }
      ]
    }));
  }, [patient]);
  const [attachmentsListRequest, setAttachmentsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },

      {
        fieldName: 'attachment_type',
        operator: 'match',
        value: 'RADIOLOGY_REPORT'
      }
    ]
  });
  const { data: diagnosticTest } = useGetDiagnosticsTestListQuery({
   ...initialListRequest,
    pageSize: 1000
  });
 console.log("diagnosticTest", diagnosticTest);
  const { data: prevResultsList, refetch: prevResultFetch, isLoading } =
    useGetDiagnosticOrderTestRadReportListQuery({ ...listPrevResultResponse });
  const {
    data: fetchPatintAttachmentsResponce,
    refetch: attachmentRefetch,
    isLoading: loadAttachment
  } = useGetPatientAttachmentsListQuery(attachmentsListRequest);

  const isSelected = rowData => {
    if (rowData && report && rowData.key === report.key) {
      return 'selected-row';
    } else return '';
  };
  const reportColumns = [
    {
      key: 'testName',
      dataKey: 'testName',
      title: <Translate>TEST NAME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const test= diagnosticTest?.object?.find(item=> item?.key === rowData.medicalTestKey);
        return test?.testName;
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
              onClick={() => {
                setReport(rowData);
                setOpenReportModal(true)
              }}
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
            icon={faComments}
            style={{ fontSize: '1em' }}
            onClick={() => {
              setReport(rowData);
              setOpenNoteResultModal(true)
            }}
          />
        </HStack>
      )
    },
    {
      key: 'previousResult',
      title: <Translate>PREVIOUS RESULT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const prev = prevResultsList?.object?.[1];

        if (!prev) return prev?.reportValue;

        return null;
      }
    },
    {
      key: 'preDate',

      title: <Translate>PREVIOUS REPORT DATE</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return formatDateWithoutSeconds(prevResultsList?.object[0]?.createdAt);
      }
    },
    {
      key: 'statusLkey',
      dataKey: 'statusLkey',
      title: <Translate>REPORT SATUTS</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData?.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData?.statusLkey;
      }
    },
    {
      key: 'patientArrived',
      title: <Translate>ATTACHMENT</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const matchingAttachments = fetchPatintAttachmentsResponce?.object?.filter(
          item => item.referenceObjectKey === rowData.key
        );
        const lastAttachment = matchingAttachments?.[matchingAttachments.length - 1];

        return (
          <HStack spacing={2}>
            {lastAttachment && (
              <FaFileArrowDown
                size={20}
                fill="var(--primary-gray)"
                onClick={() => handleDownload(lastAttachment)}
                style={{ cursor: 'pointer' }}
              />
            )}
          </HStack>
        );
      }
    },


    {
      key: 'rejectedAt',
      dataKey: 'rejectedAt',
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
      key: 'approvedAt',
      dataKey: 'approvedAt',
      title: <Translate>Approved AT/BY</Translate>,
      flexGrow: 1,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.approvedBy}</span>
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.approvedAt)}
            </span>
          </>
        );
      }
    }
  ];


  const pageIndexReport = listPrevResultResponse.pageNumber - 1;

  // how many rows per page:
  const rowsPerPageReport = listPrevResultResponse.pageSize;

  // total number of items in the backend:
  const totalCountReport = prevResultsList?.extraNumeric ?? 0;

  // handler when the user clicks a new page number:
  const handlePageChangeReport = (_: unknown, newPage: number) => {
    // MUI gives you a zero-based page, so add 1 for your API
    setListPrevResultResponse({ ...listPrevResultResponse, pageNumber: newPage + 1 });
  };
  const handleRowsPerPageChangeReport = (event: React.ChangeEvent<HTMLInputElement>) => {

    setListPrevResultResponse({
      ...listPrevResultResponse,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // reset to first page
    });
  };

useEffect(() => {
  setListPrevResultResponse(prev => ({
    ...prev!,
    filters: [
      { fieldName: "patient_key", operator: "match", value: patient?.key }
    ],
    pageNumber: 1,
  }));
}, [patient?.key]);

  
  return (
    <>
      <MyTable
        columns={reportColumns}
        data={prevResultsList?.object ?? []}
        onRowClick={rowData => {
          setReport(rowData);
        }}
        rowClassName={isSelected}
        loading={isLoading}
        page={pageIndexReport}
        rowsPerPage={rowsPerPageReport}
        totalCount={totalCountReport}
        onPageChange={handlePageChangeReport}
        onRowsPerPageChange={handleRowsPerPageChangeReport}
        sortColumn={listPrevResultResponse.sortBy}
        sortType={listPrevResultResponse.sortType}
        onSortChange={(sortBy, sortType) => {
          setListPrevResultResponse({ ...listPrevResultResponse, sortBy, sortType });
        }}
      />
      <ChatModal
        open={openNoteResultModal}
        setOpen={setOpenNoteResultModal}
        disabled
        handleSendMessage={() => { }}
        title={'Comments'}
        list={messagesResultList?.object}
        fieldShowName={'notes'}
      />


      <AddReportModal
        open={openReportModal}
        setOpen={setOpenReportModal}
        test={test}
        setTest={setTest}
        resultFetch={() => { }}
        report={report}
        setReport={setReport}
        saveReport={() => { }}
        saveTest={() => { }}
        attachmentRefetch={() => { }}
        disableEdit={true}
      />
    </>
  );
};

export default RadiologyTable;
