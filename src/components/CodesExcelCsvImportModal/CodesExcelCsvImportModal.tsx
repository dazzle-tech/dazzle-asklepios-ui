import React, { useRef, useState } from "react";
import MyModal from "../MyModal/MyModal";
import MyButton from "../MyButton/MyButton";
import Translate from "../Translate";
import "./styles.less";

type CodesExcelCsvImportModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  title?: string;
  excelTemplateUrl: string;
  excelTemplateFileName?: string;
  onImport: (file: File) => Promise<void> | void;
};

const CodesExcelCsvImportModal: React.FC<CodesExcelCsvImportModalProps> = ({
  open,
  setOpen,
  title = "Codes Import",
  excelTemplateUrl,
  excelTemplateFileName = "Codes_Template.xlsx",
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadExcelTemplate = () => {
    const link = document.createElement("a");
    link.href = excelTemplateUrl;
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const content = (
    <div className="codes-import-wrapper">
      {/* Header */}
      <div className="codes-import-header">
        <div className="codes-import-header-icon">📄</div>
        <div>
          <h3 className="codes-import-title">
            <Translate>{title}</Translate>
          </h3>
          <p className="codes-import-subtitle">
            <Translate>Import or update codes using Excel / CSV template.</Translate>
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="codes-import-card codes-import-instructions">
        <div className="codes-import-card-header">
          <span className="codes-import-card-icon">i</span>
          <span className="codes-import-card-title">
            <Translate>How it works</Translate>
          </span>
        </div>
        <ol className="codes-import-steps">
          <li>
            <Translate>Download the Excel template.</Translate>
          </li>
          <li>
            <Translate>Fill in codes data according to the template.</Translate>
          </li>
          <li>
            <Translate>In Excel, save the file as</Translate>{" "}
            <span className="codes-import-badge">
              CSV (Comma delimited) (*.csv)
            </span>
            .
          </li>
          <li>
            <Translate>Upload the saved .csv file and click Import.</Translate>
          </li>
        </ol>
      </div>
    
      {/* Template download button */}
      <div className="codes-import-card">
        <div className="codes-import-buttons">
          <MyButton onClick={handleDownloadExcelTemplate}>
            <Translate>Download Excel Template</Translate>
          </MyButton>
        </div>
      </div>

      {/* Upload CSV */}
      <div className="codes-import-card codes-import-upload">
        <div className="codes-import-upload-header">
          <span className="codes-import-upload-label">
            <Translate>Upload CSV file</Translate>
          </span>
        </div>

        <p className="codes-import-upload-subtext">
          <Translate>Supports</Translate> <strong>.csv</strong>{" "}
          <Translate>only. Make sure you saved the Excel as</Translate>{" "}
          <strong>CSV (Comma delimited) (*.csv)</strong>.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".csv"
          onChange={handleFileChange}
        />

        <div className="codes-import-upload-row">
          <div className="codes-import-file-display">
            {selectedFile ? (
              selectedFile.name
            ) : (
              <Translate>No file selected</Translate>
            )}
          </div>
          <MyButton appearance="ghost" onClick={handleClickUpload}>
            <Translate>Choose File</Translate>
          </MyButton>
        </div>

        <MyButton
          onClick={handleImportClick}
          disabled={!selectedFile || isImporting}
          loading={isImporting}
          width="100%"
        >
          <Translate>Import</Translate>
        </MyButton>
      </div>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>{title}</Translate>}
      size="500px"
      position="right"
      hideActionBtn
      hideBack
      content={content}
    />
  );
};

export default CodesExcelCsvImportModal;
