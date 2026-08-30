import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Col, Form, Row } from 'rsuite';
import { MdCloudUpload, MdDownload, MdVisibility } from 'react-icons/md';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { extractApiErrorMessage } from '@/utils/apiErrorMessage';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  useCreateDocumentVersionMutation,
  useGetDocumentVersionsQuery,
  useLazyDownloadDocumentTemplateQuery,
  type DocumentDefinitionResponseVM,
  type DocumentVersionResponseVM
} from '@/services/patients/documentManagementService';
import DocumentTemplatePreviewModal from './DocumentTemplatePreviewModal';
import './styles.less';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const todayDate = () => dayjs().format('YYYY-MM-DD');

const emptyDates = () => ({
  effectiveFromDate: todayDate(),
  effectiveToDate: ''
});

const formatDateOnly = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : value;
};

const statusColor = (status?: string) => {
  const value = (status ?? '').toUpperCase();
  if (value === 'ACTIVE') return '#45b887';
  if (value === 'DRAFT') return '#5b8def';
  return '#969fb0';
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  document?: DocumentDefinitionResponseVM | null;
};

const DocumentVersionsModal: React.FC<Props> = ({ open, setOpen, document }) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dates, setDates] = useState(emptyDates);

  const documentId = document?.id;
  const {
    data: versions = [],
    isFetching,
    refetch
  } = useGetDocumentVersionsQuery(documentId ?? 0, {
    skip: !open || !documentId
  });

  const [createVersion, { isLoading: isUploading }] = useCreateDocumentVersionMutation();
  const [downloadTemplate] = useLazyDownloadDocumentTemplateQuery();
  const [busyVersionId, setBusyVersionId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setDates(emptyDates());
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setDates(emptyDates());
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      dispatch(notify({ msg: 'File size must be 10MB or less', sev: 'warning' }));
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!documentId) {
      dispatch(notify({ msg: 'Please select a document first', sev: 'warning' }));
      return;
    }
    if (!selectedFile) {
      dispatch(notify({ msg: 'Please choose a file to upload', sev: 'warning' }));
      return;
    }

    const effectiveFromDate = dates.effectiveFromDate?.trim();
    if (!effectiveFromDate) {
      dispatch(notify({ msg: 'Effective From is required', sev: 'warning' }));
      return;
    }

    const effectiveToDate = dates.effectiveToDate?.trim() || undefined;
    if (effectiveToDate && effectiveToDate < effectiveFromDate) {
      dispatch(notify({ msg: 'Effective To cannot be before Effective From', sev: 'warning' }));
      return;
    }

    try {
      await createVersion({
        documentId,
        file: selectedFile,
        effectiveFromDate,
        effectiveToDate
      }).unwrap();
      dispatch(notify({ msg: 'Document version uploaded successfully', sev: 'success' }));
      setSelectedFile(null);
      setDates(emptyDates());
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Upload failed',
          sev: 'warning'
        })
      );
    }
  };

  const resolveVersionUrl = async (row: DocumentVersionResponseVM) => {
    if (row.url) return row.url;
    if (!documentId) return null;

    const result = await downloadTemplate(documentId).unwrap();
    return result?.url || null;
  };

  const openVersionFile = (url: string, fileName?: string, mimeType?: string, asDownload = false) => {
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

  const handleOpenVersion = async (row: DocumentVersionResponseVM, asDownload: boolean) => {
    try {
      setBusyVersionId(row.id);
      const url = await resolveVersionUrl(row);
      if (!url) {
        dispatch(notify({ msg: 'Template download URL is not available', sev: 'warning' }));
        return;
      }
      openVersionFile(url, row.fileName, row.mimeType, asDownload);
    } catch (error) {
      dispatch(
        notify({
          msg: extractApiErrorMessage(error) || 'Failed to open template',
          sev: 'warning'
        })
      );
    } finally {
      setBusyVersionId(null);
    }
  };


  const columns = [
    {
      key: 'version',
      title: <Translate>Version</Translate>,
      render: (row: DocumentVersionResponseVM) => row.version
    },
    {
      key: 'fileName',
      title: <Translate>File Name</Translate>
    },
    {
      key: 'mimeType',
      title: <Translate>Type</Translate>
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (row: DocumentVersionResponseVM) => (
        <MyBadgeStatus
          color={statusColor(row.status)}
          contant={formatEnumString(row.status) || row.status || '-'}
        />
      )
    },
    {
      key: 'effectiveFromDate',
      title: <Translate>Effective From</Translate>,
      render: (row: DocumentVersionResponseVM) => formatDateOnly(row.effectiveFromDate)
    },
    {
      key: 'effectiveToDate',
      title: <Translate>Effective To</Translate>,
      render: (row: DocumentVersionResponseVM) => formatDateOnly(row.effectiveToDate)
    },
    {
      key: 'createdDate',
      title: <Translate>Created</Translate>,
      render: (row: DocumentVersionResponseVM) => formatDateWithoutSeconds(row.createdDate)
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      render: (row: DocumentVersionResponseVM) => (
        <div className="container-of-icons">
          <MdVisibility
            className="icons-style"
            title="View"
            size={22}
            fill="var(--primary-gray)"
            style={{ opacity: busyVersionId === row.id ? 0.5 : 1 }}
            onClick={event => {
              event.stopPropagation();
              handleOpenVersion(row, false);
            }}
          />
          <MdDownload
            className="icons-style"
            title="Download"
            size={22}
            fill="var(--deep-blue)"
            style={{ opacity: busyVersionId === row.id ? 0.5 : 1 }}
            onClick={event => {
              event.stopPropagation();
              handleOpenVersion(row, true);
            }}
          />
        </div>
      )
    }
  ];

  const content = () => (
    <div>
      <MyTable
        height={280}
        data={versions}
        loading={isFetching}
        columns={columns}
      />

      <p className="document-version-hint">
        <Translate>Upload a new file to create the next version. Maximum size 10MB.</Translate>
      </p>

      <Form fluid className="document-version-dates">
        <Row>
          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="date"
              fieldName="effectiveFromDate"
              fieldLabel="Effective From"
              record={dates}
              setRecord={setDates}
              required
            />
          </Col>
          <Col md={12}>
            <MyInput
              width="100%"
              fieldType="date"
              fieldName="effectiveToDate"
              fieldLabel="Effective To"
              record={dates}
              setRecord={setDates}
            />
          </Col>
        </Row>
      </Form>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />

      <div className="document-version-upload">
        <div className="document-version-file-name">
          {selectedFile ? selectedFile.name : <Translate>No file selected</Translate>}
        </div>
        <MyButton appearance="ghost" onClick={() => fileInputRef.current?.click()} width="120px">
          <Translate>Choose File</Translate>
        </MyButton>
      </div>
    </div>
  );

  return (
    <>
    <MyModal
      open={open}
      setOpen={setOpen}
      position="right"
      title={`${document?.name || 'Document'} Versions`}
      content={content}
      steps={[{ title: 'Versions', icon: <MdCloudUpload /> }]}
      size="55vw"
      actionButtonLabel="Upload"
      actionButtonFunction={handleUpload}
      actionButtonLoading={isUploading}
      isDisabledActionBtn={!selectedFile || !dates.effectiveFromDate || isUploading}
      enforceFocus={!previewOpen}
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

export default DocumentVersionsModal;
