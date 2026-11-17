import React, { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Panel } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { PreviewModal } from '@/components/AttachmentModals';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { extractErrorMessage, formatDateWithoutSeconds } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetDownloadUrlMutation,
  useLazyGetEncounterAttachmentsBySourceQuery
} from '@/services/encounters/attachmentsService';
import { ExternalRadiologyReport } from '@/types/model-types-new';
import {
  useGetExternalLabResultsByPatientQuery,
  useGetExternalRadiologyReportsByPatientQuery
} from '@/services/patients/externalResultService';
import AddReportModal from '@/pages/rad-module/radiologist-worklist/AddReportModal';
import { renderMarker } from './Result';

// Same source the Scan Document popup saves the file with
const ATTACHMENT_SOURCE = 'SCANNED_DOCUMENT_ATTACHMENT';

// The APIs return the whole list, so paging happens here
const usePaged = <T,>(rows: T[]) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pageRows = useMemo(() => rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [rows, page, rowsPerPage]);

  return {
    pageRows,
    page,
    rowsPerPage,
    totalCount: rows.length,
    onPageChange: (_: unknown, next: number) => setPage(next),
    onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(0);
    }
  };
};

// Opens the original uploaded file in the same preview used by the Attachments screen
const useDocumentPreview = () => {
  const dispatch = useAppDispatch();
  const [getDownloadUrl] = useGetDownloadUrlMutation();
  const [getAttachments] = useLazyGetEncounterAttachmentsBySourceQuery();
  const [preview, setPreview] = useState({ open: false, url: '', fileName: '', fileType: '' });

  const openDocument = async (attachmentId: number, encounterId: number) => {
    try {
      // Fetched on click, so a file saved a moment ago is always found
      const { data: attachments } = await getAttachments({ encounterId, source: ATTACHMENT_SOURCE }).unwrap();
      const attachment = attachments.find(item => Number(item.id) === Number(attachmentId));
      if (!attachment) {
        dispatch(notify({ msg: 'The original document is no longer available', sev: 'warning' }));
        return;
      }
      const ticket = await getDownloadUrl(attachment.id).unwrap();
      setPreview({ open: true, url: ticket.url, fileName: attachment.filename, fileType: attachment.mimeType });
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'Could not open the document. Please try again.', sev: 'warning' }));
    }
  };

  const documentColumn = {
    key: 'document',
    title: <Translate>DOCUMENT</Translate>,
    render: (row: { attachmentId?: number | null; encounterId?: number | null }) =>
      row.attachmentId && row.encounterId ? (
        <FontAwesomeIcon
          icon={faPaperclip}
          title="Open original document"
          style={{ cursor: 'pointer', color: '#a4a4a4' }}
          onClick={e => {
            e.stopPropagation();
            openDocument(row.attachmentId as number, row.encounterId as number);
          }}
        />
      ) : null
  };

  const previewModal = (
    <PreviewModal
      open={preview.open}
      onClose={() => setPreview(prev => ({ ...prev, open: false }))}
      previewUrl={preview.url}
      previewFileName={preview.fileName}
      previewFileType={preview.fileType}
    />
  );

  return { documentColumn, previewModal };
};

/* ===================== Lab ===================== */

export const ExternalLabResults = ({ patient }: { patient: any }) => {
  const { data = [], isFetching } = useGetExternalLabResultsByPatientQuery(patient?.id ? Number(patient.id) : skipToken);
  const { pageRows, ...paging } = usePaged(data);
  const { documentColumn, previewModal } = useDocumentPreview();

  const columns = [
    { key: 'resultDate', title: <Translate>Result Date</Translate>, dataKey: 'resultDate' },
    { key: 'testName', title: <Translate>Test Name</Translate>, dataKey: 'testName' },
    {
      key: 'resultValue',
      title: <Translate>Result</Translate>,
      render: (row: any) => [row.resultValue, row.unit].filter(Boolean).join(' ')
    },
    { key: 'normalRangeValue', title: <Translate>Normal Range</Translate>, dataKey: 'normalRangeValue' },
    { key: 'marker', title: <Translate>Marker</Translate>, render: (row: any) => renderMarker(row.marker) },
    { key: 'physicianName', title: <Translate>Physician Name</Translate>, dataKey: 'physicianName' },
    documentColumn,
    {
      key: 'createdDate',
      title: <Translate>Added On</Translate>,
      render: (row: any) => (row.createdDate ? formatDateWithoutSeconds(row.createdDate) : '')
    }
  ];

  return (
    <Panel defaultExpanded>
      <MyTable data={pageRows} columns={columns} loading={isFetching} dontTranslateData {...paging} />
      {previewModal}
    </Panel>
  );
};

/* ===================== Radiology ===================== */

export const ExternalRadiologyReports = ({ patient }: { patient: any }) => {
  const { data = [], isFetching } = useGetExternalRadiologyReportsByPatientQuery(
    patient?.id ? Number(patient.id) : skipToken
  );
  const { pageRows, ...paging } = usePaged(data);
  const [selected, setSelected] = useState<ExternalRadiologyReport | null>(null);
  const [openReportModal, setOpenReportModal] = useState(false);
  const { documentColumn, previewModal } = useDocumentPreview();

  // Same columns and report popup as the Reports tab
  const columns = [
    { key: 'testName', title: <Translate>TEST NAME</Translate>, dataKey: 'testName' },
    { key: 'reportDate', title: <Translate>Report Date</Translate>, dataKey: 'reportDate' },
    {
      key: 'report',
      title: <Translate>REPORT</Translate>,
      render: (row: ExternalRadiologyReport) => (
        <FontAwesomeIcon
          icon={faFileLines}
          style={{ cursor: 'pointer', color: '#a4a4a4' }}
          onClick={() => {
            setSelected(row);
            setOpenReportModal(true);
          }}
        />
      )
    },
    { key: 'physicianName', title: <Translate>Physician Name</Translate>, dataKey: 'physicianName' },
    documentColumn,
    {
      key: 'createdDate',
      title: <Translate>Added On</Translate>,
      render: (row: any) => (row.createdDate ? formatDateWithoutSeconds(row.createdDate) : '')
    }
  ];

  return (
    <Panel defaultExpanded>
      <MyTable
        data={pageRows}
        columns={columns}
        loading={isFetching}
        dontTranslateData
        onRowClick={row => setSelected(row)}
        rowClassName={row => (row?.id === selected?.id ? 'selected' : '')}
        {...paging}
      />

      {previewModal}

      {openReportModal && selected && (
        <AddReportModal
          key={selected.id}
          open={openReportModal}
          setOpen={setOpenReportModal}
          report={selected}
          setReport={setSelected}
          disableEdit
          disableDefaultTemplate
        />
      )}
    </Panel>
  );
};
