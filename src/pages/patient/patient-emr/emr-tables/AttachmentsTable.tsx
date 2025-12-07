import React, { useEffect, useMemo, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faEye } from '@fortawesome/free-solid-svg-icons';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  formatDateWithoutSeconds,
  formatEnumString,
  conjureValueBasedOnKeyFromList,
} from '@/utils';

import {
  useGetPatientAttachmentsQuery,
  useGetDownloadUrlMutation as useGetPatientDownloadUrlMutation,
} from '@/services/patients/attachmentService';

import {
  useGetDownloadUrlMutation as useGetEncounterDownloadUrlMutation,
  useGetEncounterAttachmentsByEncounterIdsQuery,
} from '@/services/encounters/attachmentsService';

import { useGetEncountersQuery } from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest } from '@/types/types';
import { PatientAttachment as PatientAttachmentType } from '@/types/model-types-new';
import { PreviewModal } from '@/components/AttachmentModals';

const AttachmentsTable = ({ localPatient }) => {
  const dispatch = useAppDispatch();

  const [selectedAttachment, setSelectedAttachment] =
    useState<PatientAttachmentType | null>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [previewFileType, setPreviewFileType] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const patientId = localPatient?.id || localPatient?.key;
  const hasPatient = Boolean(patientId);

  // API hooks
  const [getPatientDownloadUrl] = useGetPatientDownloadUrlMutation();
  const [getEncounterDownloadUrl] = useGetEncounterDownloadUrlMutation();

  // LOV
  const { data: attachmentsLovQueryResponse } =
    useGetLovValuesByCodeQuery('ATTACH_TYPE');
  const attachmentTypesLov = attachmentsLovQueryResponse?.object ?? [];

  // Encounters for patient
  const { data: encountersResponse, isLoading: loadingEncounters } =
    useGetEncountersQuery(
      {
        ...initialListRequest,
        pageSize: 1000,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: patientId,
          },
        ],
      },
      { skip: !hasPatient }
    );

  const patientEncounters = encountersResponse?.object || [];
  const encounterIds = patientEncounters
    .map((enc) => enc.id || enc.key)
    .filter(Boolean);

  // Patient attachments
  const {
    data: patientAttachmentsResponse,
    refetch: attachmentRefetch,
    isLoading: loadingPatientAttachments,
  } = useGetPatientAttachmentsQuery(
    { patientId },
    {
      skip: !hasPatient,
      refetchOnMountOrArgChange: true,
    }
  );

  // Encounter attachments
  const {
    data: encounterAttachmentsResponse,
    refetch: encounterAttachmentsRefetch,
    isLoading: loadingEncounterAttachments,
  } = useGetEncounterAttachmentsByEncounterIdsQuery(
    { encounterIds },
    {
      skip: encounterIds.length === 0,
      refetchOnMountOrArgChange: true,
    }
  );

  const patientAttachments = patientAttachmentsResponse?.data || [];
  const encounterAttachments = encounterAttachmentsResponse || [];

  // Combine attachments
  const combinedAttachments = useMemo(() => {
    return [
      ...patientAttachments.map((att) => ({
        ...att,
        attachmentType: 'patient' as const,
        encounterInfo: null,
      })),
      ...encounterAttachments.map((att) => {
        const encounter = patientEncounters.find(
          (enc) => (enc.id || enc.key) === att.encounterId
        );
        return {
          ...att,
          attachmentType: 'encounter' as const,
          encounterInfo: encounter,
        };
      }),
    ];
  }, [patientAttachments, encounterAttachments, patientEncounters]);

  const totalCount = combinedAttachments.length;
  const loading =
    loadingPatientAttachments || loadingEncounters || loadingEncounterAttachments;

  // Safe manual refetch when patient changes (guards prevent the error)
  useEffect(() => {
    if (!hasPatient) return;

    attachmentRefetch();

    if (encounterIds.length > 0) {
      encounterAttachmentsRefetch();
    }

    setPage(0);
    setSelectedAttachment(null);
  }, [hasPatient, patientId, encounterIds.length]);

  const isSelected = (rowData) =>
    rowData && selectedAttachment && selectedAttachment.id === rowData.id
      ? 'selected-row'
      : '';

  // Preview
  const handlePreviewSelectedAttachment = async (attachment: any) => {
    try {
      const downloadTicket =
        attachment.attachmentType === 'patient'
          ? await getPatientDownloadUrl(attachment.id).unwrap()
          : await getEncounterDownloadUrl(attachment.id).unwrap();

      setPreviewUrl(downloadTicket.url);
      setPreviewFileName(attachment.filename);
      setPreviewFileType(attachment.mimeType);
      setPreviewModalOpen(true);
    } catch {
      dispatch(notify({ msg: 'Failed to get preview URL', sev: 'error' }));
    }
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setPreviewUrl('');
    setPreviewFileName('');
    setPreviewFileType('');
  };

  // Download
  const handleDownloadSelectedAttachment = async (attachment: any) => {
    try {
      const downloadTicket =
        attachment.attachmentType === 'patient'
          ? await getPatientDownloadUrl(attachment.id).unwrap()
          : await getEncounterDownloadUrl(attachment.id).unwrap();

      const link = document.createElement('a');
      link.href = downloadTicket.url;
      link.download = attachment.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(notify({ msg: 'Download started', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Failed to get download URL', sev: 'error' }));
    }
  };

  // Pagination handlers
  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const columns = [
    {
      key: 'attachmentType',
      title: <Translate>Category</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor:
              rowData.attachmentType === 'patient' ? '#e3f2fd' : '#fff3e0',
            color:
              rowData.attachmentType === 'patient' ? '#1976d2' : '#f57c00',
            fontWeight: 500,
            fontSize: '12px',
          }}
        >
          {rowData.attachmentType === 'patient' ? 'Patient' : 'Encounter'}
        </span>
      ),
      fullText: true,
    },
    {
      key: 'filename',
      title: <Translate>Attachment Name</Translate>,
      flexGrow: 4,
      dataKey: 'filename',
      fullText: true,
    },
    {
      key: 'mimeType',
      title: <Translate>File Type</Translate>,
      flexGrow: 3,
      dataKey: 'mimeType',
      fullText: true,
    },
    {
      key: 'details',
      title: <Translate>Details</Translate>,
      flexGrow: 3,
      dataKey: 'details',
      fullText: true,
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) =>
        rowData.type
          ? conjureValueBasedOnKeyFromList(
              attachmentTypesLov,
              rowData.type,
              'lovDisplayVale'
            )
          : rowData.type,
      fullText: true,
    },
    {
      key: 'source',
      title: <Translate>Source</Translate>,
      flexGrow: 3,
      render: (row: any) => formatEnumString(row.source),
      fullText: true,
    },
    {
      key: 'encounter',
      title: <Translate>Encounter</Translate>,
      flexGrow: 3,
      render: (rowData: any) => {
        if (rowData.attachmentType === 'encounter' && rowData.encounterId) {
          const encounter = patientEncounters.find(
            (enc) => Number(enc.key) === Number(rowData.encounterId)
          );
          return encounter ? encounter.visitId : rowData.encounterId;
        }
        return '-';
      },
      fullText: true,
    },
    {
      key: 'preview',
      title: <Translate>Preview</Translate>,
      flexGrow: 2,
      render: (attachment: any) => (
        <MyButton
          appearance="link"
          onClick={() => handlePreviewSelectedAttachment(attachment)}
          prefixIcon={() => <FontAwesomeIcon icon={faEye} />}
        >
          Preview
        </MyButton>
      ),
      fullText: true,
    },
    {
      key: 'download',
      title: <Translate>Download</Translate>,
      flexGrow: 2,
      render: (attachment: any) => (
        <MyButton
          appearance="link"
          onClick={() => handleDownloadSelectedAttachment(attachment)}
          prefixIcon={() => <FontAwesomeIcon icon={faFileArrowDown} />}
        >
          Download
        </MyButton>
      ),
      fullText: true,
    },
    {
      key: 'createdDate',
      title: <Translate>Created By/At</Translate>,
      fullText: true,
      flexGrow: 3,
      render: (row: any) =>
        row?.createdDate ? (
          <>
            {row?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.createdDate)}
            </span>
          </>
        ) : (
          ' '
        ),
    },
    {
      key: 'lastModifiedDate',
      title: <Translate>Updated By/At</Translate>,
      fullText: true,
      flexGrow: 3,
      render: (row: any) =>
        row?.lastModifiedDate ? (
          <>
            {row?.lastModifiedBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(row.lastModifiedDate)}
            </span>
          </>
        ) : (
          ' '
        ),
    },
  ];

  return (
    <div className="tab-main-container">
      <MyTable
        height={200}
        loading={loading}
        data={combinedAttachments}
        columns={columns}
        onRowClick={(rowData) => setSelectedAttachment(rowData)}
        rowClassName={isSelected}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      <PreviewModal
        open={previewModalOpen}
        onClose={handleClosePreview}
        previewUrl={previewUrl}
        previewFileName={previewFileName}
        previewFileType={previewFileType}
      />
    </div>
  );
};

export default AttachmentsTable;
