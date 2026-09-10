import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { MdPrint, MdVisibility } from 'react-icons/md';

import MyTable from '@/components/MyTable';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatEnumString } from '@/utils';
import { useAppSelector } from '@/hooks';
import { MODULE_REPORTS_SCREENS } from '@/config/modules-config';
import {
  StimulsoftReportTemplate,
  useGetPrintableStimulsoftReportsQuery,
} from '@/services/reports/stimulsoftReportService';
import PrintReportDialog, {
  type ReportDialogMode,
} from '@/components/ModuleReportsMenu/PrintReportDialog';

const ModuleReportsPage = () => {
  const dispatch = useDispatch();
  const params = useParams<{ moduleCode?: string }>();
  const module = String(params.moduleCode || '').toUpperCase();
  const selectedDepartment = useAppSelector(state => state.auth.selectedDepartment);
  const departmentId = selectedDepartment?.departmentId ?? selectedDepartment?.id;
  const facilityId = selectedDepartment?.facilityId;

  const [selected, setSelected] = useState<StimulsoftReportTemplate | null>(null);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ReportDialogMode>('print');

  const handleDialogOpen = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSelected(null);
  }, []);

  const openReport = (row: StimulsoftReportTemplate, nextMode: ReportDialogMode) => {
    setSelected(row);
    setDialogMode(nextMode);
    setOpen(true);
  };

  const { data: reports = [], isFetching } = useGetPrintableStimulsoftReportsQuery(
    {
      module,
      facilityId,
      departmentId,
    },
    { skip: !module, refetchOnMountOrArgChange: true }
  );

  const visibleReports = useMemo(
    () => reports.filter(item => item.isActive !== false && item.code),
    [reports]
  );

  useEffect(() => {
    const screenCode =
      MODULE_REPORTS_SCREENS[module]?.screenCode || `${module}_MODULE_REPORTS`;
    dispatch(setPageCode(screenCode));
    dispatch(setDivContent(`${formatEnumString(module) || 'Module'} Reports`));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, module]);

  const columns = [
    { key: 'name', title: 'Report', dataKey: 'name', width: 280 },
    { key: 'code', title: 'Code', dataKey: 'code', width: 160 },
    {
      key: 'description',
      title: 'Description',
      dataKey: 'description',
      width: 320,
      render: (row: StimulsoftReportTemplate) => row.description || '—',
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      align: 'center' as const,
      render: (row: StimulsoftReportTemplate) => (
        <>
          <IconButton
            size="small"
            title="View report"
            onClick={event => {
              event.stopPropagation();
              openReport(row, 'view');
            }}
          >
            <MdVisibility style={{ color: 'var(--primary-blue)' }} />
          </IconButton>
          <IconButton
            size="small"
            title="Print"
            onClick={event => {
              event.stopPropagation();
              openReport(row, 'print');
            }}
          >
            <MdPrint style={{ color: 'var(--primary-blue)' }} />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Panel>
      <MyTable
        data={visibleReports}
        totalCount={visibleReports.length}
        loading={isFetching}
        columns={columns}
      />
      <PrintReportDialog
        open={open}
        setOpen={handleDialogOpen}
        report={selected}
        mode={dialogMode}
        context={{ departmentId, facilityId }}
      />
    </Panel>
  );
};

export default ModuleReportsPage;
