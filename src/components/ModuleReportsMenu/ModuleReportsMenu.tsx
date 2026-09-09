import React, { useMemo, useState } from 'react';
import { Dropdown, Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import {
  StimulsoftReportTemplate,
  useGetPrintableStimulsoftReportsQuery,
} from '@/services/reports/stimulsoftReportService';
import PrintReportDialog, { type ReportDialogMode } from './PrintReportDialog';
import type { ModuleReportContext } from './types';

export type { ModuleReportContext };

type Props = {
  /** Must match the Module value saved on the report template. */
  module: string;
  context?: ModuleReportContext;
  disabled?: boolean;
};

const ModuleReportsMenu = ({ module, context, disabled }: Props) => {
  const { data: reports = [], isFetching } = useGetPrintableStimulsoftReportsQuery(
    {
      module,
      facilityId: context?.facilityId as number | undefined,
      departmentId: context?.departmentId as number | undefined,
    },
    { skip: !module }
  );

  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ReportDialogMode>('print');
  const [selected, setSelected] = useState<StimulsoftReportTemplate | null>(null);

  const visibleReports = useMemo(
    () => reports.filter(item => item.isActive !== false && item.code),
    [reports]
  );

  const openReport = (report: StimulsoftReportTemplate, mode: ReportDialogMode) => {
    setSelected(report);
    setDialogMode(mode);
    setOpen(true);
  };

  if (!module) {
    return null;
  }

  return (
    <>
      <Dropdown
        title={
          <span>
            <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
            <Translate>Print report</Translate>
          </span>
        }
        disabled={disabled}
        placement="bottomEnd"
      >
        {isFetching && (
          <Dropdown.Item disabled>
            <Loader size="xs" content="Loading reports…" />
          </Dropdown.Item>
        )}
        {!isFetching && visibleReports.length === 0 && (
          <Dropdown.Item disabled>No reports for this module</Dropdown.Item>
        )}
        {visibleReports.map(report => (
          <Dropdown.Menu key={report.id ?? report.code} title={report.name || report.code}>
            <Dropdown.Item onClick={() => openReport(report, 'view')}>View</Dropdown.Item>
            <Dropdown.Item onClick={() => openReport(report, 'print')}>Print</Dropdown.Item>
          </Dropdown.Menu>
        ))}
      </Dropdown>

      <PrintReportDialog
        open={open}
        setOpen={next => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
        report={selected}
        context={context}
        mode={dialogMode}
      />
    </>
  );
};

export default ModuleReportsMenu;
