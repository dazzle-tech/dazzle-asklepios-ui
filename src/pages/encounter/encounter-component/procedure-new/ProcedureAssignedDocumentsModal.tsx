import React, { useMemo, useRef, useState } from 'react';
import { MdCloudUpload, MdDownload, MdVisibility } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DocumentTemplatePreviewModal from '@/pages/setup/document-management/DocumentTemplatePreviewModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useUploadAttachmentMutation } from '@/services/encounters/attachmentsService';
import {
  useLazyDownloadDocumentTemplateQuery,
  useSearchDocumentAssignmentsQuery,
  type DocumentAssignmentResponseVM,
  type DocumentVersionResponseVM
} from '@/services/patients/documentManagementService';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  procedureId?: number | null;
  procedureName?: string;
  encounterId?: number | null;
  procedureRequestId?: number | null;
  dir?: 'ltr' | 'rtl';
};

const defaultProcedureTargetType = 'PROCEDURE';
const PROCEDURE_ATTACHMENT_SOURCE = 'PROCEDURE_REQUEST_ATTACHMENT';

const getVersionDetails = (
  row: DocumentAssignmentResponseVM
): DocumentVersionResponseVM | null => {
  if (typeof row.documentVersion === 'object' && row.documentVersion != null) {
    return row.documentVersion;
  }
  return null;
};

const getDocumentVersionId = (row: DocumentAssignmentResponseVM): number | null => {
  const version = getVersionDetails(row);
  if (version?.id != null) return Number(version.id);
  if (row.documentVersionId != null) return Number(row.documentVersionId);
  return null;
};

const ProcedureAssignedDocumentsModal: React.FC<Props> = ({
  open,
  setOpen,
  procedureId,
  procedureName,
  encounterId,
  procedureRequestId,
  dir = 'ltr'
}) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadTemplate] = useLazyDownloadDocumentTemplateQuery();
  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();
  const [busyAssignmentId, setBusyAssignmentId] = useState<number | null>(null);
  const [uploadAssignment, setUploadAssignment] = useState<DocumentAssignmentResponseVM | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');

  const targetTypeOptions = useEnumOptions('DocumentTargetType');
  const procedureTargetType = useMemo(() => {
    const exact = targetTypeOptions.find(option => option.value.toUpperCase() === 'PROCEDURE');
    if (exact) return exact.value;
    return (
      targetTypeOptions.find(option => /PROCEDURE/i.test(option.value))?.value ??
      defaultProcedureTargetType
    );
  }, [targetTypeOptions]);

  const { data: generalAssignments = [], isLoading: isLoadingGeneral } =
    useSearchDocumentAssignmentsQuery(
      { targetType: procedureTargetType },
      { skip: !open }
    );

  const { data: specificAssignments = [], isLoading: isLoadingSpecific } =
    useSearchDocumentAssignmentsQuery(
      { targetType: procedureTargetType, targetId: procedureId ?? undefined },
      { skip: !open || procedureId == null }
    );

  const assignments = useMemo(() => {
    const merged = new Map<number, DocumentAssignmentResponseVM>();
    generalAssignments.forEach(item => {
      if (item.id != null) merged.set(item.id, item);
    });
    specificAssignments.forEach(item => {
      if (item.id != null) merged.set(item.id, item);
    });
    return Array.from(merged.values());
  }, [generalAssignments, specificAssignments]);

  const resolveAssignmentUrl = async (row: DocumentAssignmentResponseVM) => {
    const version = getVersionDetails(row);
    if (version?.url) return version.url;
    if (!row.documentId) return null;

    const result = await downloadTemplate(row.documentId).unwrap();
    return result?.url || null;
  };

  const openAssignmentFile = (
    url: string,
    fileName?: string,
    mimeType?: string,
    asDownload = false
  ) => {
    if (!asDownload) {
      setPreviewUrl(url);
      setPreviewFileName(fileName || 'Preview');
      setPreviewMimeType(mimeType || '');
      setPreviewOpen(true);
      return;
    }

    const link = window.document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (fileName) link.download = fileName;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenAssignment = async (
    row: DocumentAssignmentResponseVM,
    asDownload: boolean
  ) => {
    if (!row.documentId) {
      dispatch(notify({ msg: 'Document ID is missing', sev: 'warning' }));
      return;
    }

    try {
      setBusyAssignmentId(row.id);
      const url = await resolveAssignmentUrl(row);
      if (!url) {
        dispatch(notify({ msg: 'Template download URL is not available', sev: 'warning' }));
        return;
      }

      const version = getVersionDetails(row);
      openAssignmentFile(url, version?.fileName, version?.mimeType, asDownload);
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to open template',
          sev: 'warning'
        })
      );
    } finally {
      setBusyAssignmentId(null);
    }
  };

  const canUpload = encounterId != null && procedureRequestId != null;

  const handleUploadClick = (row: DocumentAssignmentResponseVM) => {
    if (!canUpload) {
      dispatch(
        notify({
          msg: 'Encounter or procedure request is missing for upload',
          sev: 'warning'
        })
      );
      return;
    }
    if (!row.documentId) {
      dispatch(notify({ msg: 'Document definition ID is missing', sev: 'warning' }));
      return;
    }
    if (getDocumentVersionId(row) == null) {
      dispatch(notify({ msg: 'Document version ID is missing', sev: 'warning' }));
      return;
    }

    setUploadAssignment(row);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleUploadFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const row = uploadAssignment;
    event.target.value = '';

    if (!file || !row) return;
    if (encounterId == null || procedureRequestId == null) {
      dispatch(
        notify({
          msg: 'Encounter or procedure request is missing for upload',
          sev: 'warning'
        })
      );
      return;
    }

    const documentVersionId = getDocumentVersionId(row);
    if (!row.documentId || documentVersionId == null) {
      dispatch(notify({ msg: 'Document definition/version ID is missing', sev: 'warning' }));
      return;
    }

    try {
      setBusyAssignmentId(row.id);
      await uploadAttachment({
        encounterId: Number(encounterId),
        file,
        source: PROCEDURE_ATTACHMENT_SOURCE,
        sourceId: Number(procedureRequestId),
        details: row.documentName || row.documentCode || undefined,
        documentDefinitionId: Number(row.documentId),
        documentVersionId
      }).unwrap();

      dispatch(notify({ msg: 'Document uploaded as procedure attachment', sev: 'success' }));
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to upload document attachment',
          sev: 'warning'
        })
      );
    } finally {
      setBusyAssignmentId(null);
      setUploadAssignment(null);
    }
  };

  const columns: ColumnConfig[] = [
    {
      key: 'actions',
      title: <Translate></Translate>,
      width: 120,
      align: 'right' as const,
      render: (row: DocumentAssignmentResponseVM) => {
        const isBusy = busyAssignmentId === row.id || (isUploading && uploadAssignment?.id === row.id);

        return (
          <div className="container-of-icons">
            <MdVisibility
              className="icons-style"
              title="View"
              size={22}
              fill="var(--primary-gray)"
              style={{ cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.5 : 1 }}
              onClick={event => {
                event.stopPropagation();
                if (!isBusy) handleOpenAssignment(row, false);
              }}
            />
            <MdDownload
              className="icons-style"
              title="Download"
              size={22}
              fill="var(--deep-blue)"
              style={{ cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.5 : 1 }}
              onClick={event => {
                event.stopPropagation();
                if (!isBusy) handleOpenAssignment(row, true);
              }}
            />
            <MdCloudUpload
              className="icons-style"
              title="Upload as attachment"
              size={22}
              fill={canUpload ? 'var(--deep-blue)' : '#ccc'}
              style={{
                cursor: !canUpload || isBusy ? 'not-allowed' : 'pointer',
                opacity: !canUpload || isBusy ? 0.5 : 1
              }}
              onClick={event => {
                event.stopPropagation();
                if (!isBusy && canUpload) handleUploadClick(row);
              }}
            />
          </div>
        );
      }
    },
    { key: 'documentCode', title: <Translate>Code</Translate> },
    { key: 'documentName', title: <Translate>Document</Translate> },
    {
      key: 'documentVersion',
      title: <Translate>Version</Translate>,
      render: (row: DocumentAssignmentResponseVM) => {
        const version =
          typeof row.documentVersion === 'object' && row.documentVersion != null
            ? row.documentVersion.version
            : row.documentVersion;
        return version != null ? `v${version}` : '-';
      }
    },
    {
      key: 'assignmentScope',
      title: <Translate>Scope</Translate>,
      render: (row: DocumentAssignmentResponseVM) =>
        row.targetId == null ? (
          <MyBadgeStatus contant="General" color="#d32f2f" />
        ) : (
          <MyBadgeStatus contant="Specific" color="#2264e5" />
        )
    },
    {
      key: 'trigger',
      title: <Translate>Trigger</Translate>,
      render: (row: DocumentAssignmentResponseVM) =>
        formatEnumString(row.trigger ?? (row.triggerType as string)) ||
        row.trigger ||
        row.triggerType ||
        '-'
    },
    {
      key: 'required',
      title: <Translate>Required</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (row.required ? 'Yes' : 'No')
    },
    {
      key: 'blocking',
      title: <Translate>Blocking</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (row.blocking ? 'Yes' : 'No')
    },
    {
      key: 'active',
      title: <Translate>Active</Translate>,
      render: (row: DocumentAssignmentResponseVM) => (
        <MyBadgeStatus
          color={row.active === false ? '#969fb0' : '#45b887'}
          contant={row.active === false ? 'Inactive' : 'Active'}
        />
      )
    }
  ];

  const isLoading = isLoadingGeneral || isLoadingSpecific;
  const titleName = procedureName?.trim() || 'Procedure';

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={`Assigned Documents - ${titleName}`}
        size="lg"
        hideActionBtn={true}
        content={
          <div dir={dir}>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleUploadFileChange}
            />
            <MyTable
              columns={columns}
              data={assignments}
              loading={isLoading}
              height={400}
            />
          </div>
        }
      />

      <DocumentTemplatePreviewModal
        open={previewOpen}
        setOpen={setPreviewOpen}
        url={previewUrl}
        fileName={previewFileName}
        mimeType={previewMimeType}
      />
    </>
  );
};

export default ProcedureAssignedDocumentsModal;
