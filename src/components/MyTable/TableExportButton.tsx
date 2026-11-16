import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf, faFileWord } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import type { ColumnConfig } from './MyTable';
import { exportTableRecords, TableExportFormat } from './exportTableRecords';

type Props = {
  columns: ColumnConfig[];
  data: any[];
  fileName?: string;
  disabled?: boolean;
};

const formats: { format: TableExportFormat; label: string; icon: typeof faFilePdf }[] = [
  { format: 'pdf', label: 'PDF', icon: faFilePdf },
  { format: 'xlsx', label: 'Excel', icon: faFileExcel },
  { format: 'docx', label: 'Word', icon: faFileWord }
];

const TableExportButton: React.FC<Props> = ({ columns, data, fileName, disabled }) => {
  const dispatch = useAppDispatch();
  const screenName = useSelector((state: any) => state.div?.divElement);
  const downloadName = fileName?.trim() || screenName?.trim() || undefined;
  const [exporting, setExporting] = useState<TableExportFormat | null>(null);

  const handleExport = async (format: TableExportFormat) => {
    setExporting(format);
    try {
      await exportTableRecords(format, columns, data, downloadName);
    } catch (error) {
      dispatch(
        notify({
          msg: error instanceof Error ? error.message : 'Could not export the table.',
          sev: 'error'
        })
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="my-table-export-header">
      <span className="my-table-export-title">
        <Translate>Export</Translate>
      </span>
      <div className="my-table-export-actions">
        {formats.map(item => (
          <button
            key={item.format}
            type="button"
            className={`my-table-export-button ${item.format}${exporting === item.format ? ' is-busy' : ''}`}
            disabled={disabled || Boolean(exporting)}
            onClick={() => handleExport(item.format)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <Translate>{item.label}</Translate>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableExportButton;
