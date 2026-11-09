import React, { useRef, useState } from 'react';
import MyModal from '../MyModal/MyModal';
import MyButton from '../MyButton/MyButton';
import Translate from '../Translate';
import { Form } from 'rsuite';
import { useSelector } from 'react-redux';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import './styles.less';

type CodesExcelCsvImportModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  title?: string;
  excelTemplateUrl?: string;
  excelTemplateFileName?: string;
  onDownloadTemplate?: () => Promise<void> | void;
  onImport: (file: File) => Promise<void> | void;
};

const CodesExcelCsvImportModal: React.FC<CodesExcelCsvImportModalProps> = ({
  open,
  setOpen,
  title = 'Codes Import',
  excelTemplateUrl,
  excelTemplateFileName = 'Codes_Template.xlsx',
  onDownloadTemplate,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const mode = useSelector((state: any) => state.ui.mode);

  const handleDownloadExcelTemplate = async () => {
    if (onDownloadTemplate) {
      await onDownloadTemplate();
      return;
    }

    if (!excelTemplateUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = `${excelTemplateUrl}?v=${Date.now()}`;
    link.download = excelTemplateFileName;
    link.click();
  };

  const handleClickUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleImportClick = async () => {
    if (!selectedFile) return;
    try {
      setIsImporting(true);
      await onImport(selectedFile);
      setSelectedFile(null);
      setOpen(false);
    } catch {
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const content = (
    <div className={`codes-import-wrapper ${mode === 'dark' ? 'dark' : 'light'}`}>
      <p className="codes-import-subtitle">
        <Translate>
          Download the template, fill the rows, then upload the Excel or CSV file.
        </Translate>
      </p>

      <Form className="codes-import-card codes-import-instructions">
        <div className="codes-import-card-header">
          <span className="codes-import-card-title">
            <Translate>How it works</Translate>
          </span>
        </div>
        <ol className="codes-import-steps">
          <li>
            <Translate>Download the Excel template.</Translate>
          </li>
          <li>
            <Translate>Fill in the data according to the template columns.</Translate>
          </li>
          <li>
            <Translate>Upload the Excel (.xlsx) file, or save as CSV and upload.</Translate>
          </li>
          <li>
            <Translate>Click Import to load the data into the system.</Translate>
          </li>
        </ol>
      </Form>

      <div className="codes-import-card">
        <div className="codes-import-buttons">
          <MyButton
            prefixIcon={() => <FileDownloadIcon />}
            color="var(--deep-blue)"
            onClick={handleDownloadExcelTemplate}
          >
            Download Template
          </MyButton>
        </div>
      </div>

      <div className="codes-import-card codes-import-upload">
        <div className="codes-import-upload-header">
          <span className="codes-import-upload-label">
            <Translate>Upload Excel / CSV file</Translate>
          </span>
        </div>

        <p className="codes-import-upload-subtext">
          <Translate>Supports</Translate> <strong>.xlsx</strong>, <strong>.xls</strong>,{' '}
          <Translate>and</Translate> <strong>.csv</strong>.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />

        <div className="codes-import-upload-row">
          <div className="codes-import-file-display">
            {selectedFile ? selectedFile.name : <Translate>No file selected</Translate>}
          </div>
          <MyButton
            color="var(--deep-blue)"
            onClick={handleClickUpload}
            width="125px"
          >
            Choose File
          </MyButton>
        </div>

        <MyButton
          prefixIcon={() => <FileUploadIcon />}
          color="var(--deep-blue)"
          onClick={handleImportClick}
          disabled={!selectedFile || isImporting}
          loading={isImporting}
          width="125px"
        >
          Import
        </MyButton>
      </div>
    </div>
  );

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>{title}</Translate>}
      size="500px"
      position="right"
      hideActionBtn
      hideBack
      content={<div dir={dir}>{content}</div>}
    />
  );
};

export default CodesExcelCsvImportModal;
