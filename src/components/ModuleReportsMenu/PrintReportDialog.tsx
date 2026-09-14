import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Form, Input, Modal, SelectPicker } from 'rsuite';
import { useDispatch } from 'react-redux';
import { IconButton } from '@mui/material';
import { MdClose, MdCloseFullscreen, MdOpenInFull } from 'react-icons/md';
import dayjs from 'dayjs';

import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import { downloadPdfBlob } from '@/reports/stimulsoft/openStimulsoftPdf';
import { exportStimulsoftTemplatePdf } from '@/reports/stimulsoft/exportStimulsoftTemplatePdf';
import config from '../../../app-config';
import { getStimulsoftAuthHeaders } from '@/reports/stimulsoft/stimulsoftAuth';
import {
  extractReportPrintParameters,
  pickTemplateJson,
  templateJsonToString,
  valuesFromParameters,
  type ReportPrintParameter,
} from '@/reports/stimulsoft/reportPrintParameters';
import {
  StimulsoftReportTemplate,
  toStimulsoftPdfParams,
  useLazyGetStimulsoftReportTemplateByIdQuery,
} from '@/services/reports/stimulsoftReportService';
import {
  useGetActiveDepartmentByFacilityListQuery,
  useGetAllDepartmentsWithoutPaginationQuery,
} from '@/services/security/departmentService';
import type { ModuleReportContext } from './types';

const StimulsoftViewerHost = React.lazy(
  () =>
    import(
      /* webpackChunkName: "stimulsoft-viewer-host" */
      '@/reports/stimulsoft/StimulsoftViewerHost'
    )
);

export type ReportDialogMode = 'print' | 'view';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  report: StimulsoftReportTemplate | null;
  context?: ModuleReportContext;
  mode?: ReportDialogMode;
};

const toParamValue = (raw: unknown) => {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return dayjs(raw).format('YYYY-MM-DD');
  }
  return String(raw ?? '').trim();
};

const applyContextDefaults = (
  parameters: ReportPrintParameter[],
  context?: ModuleReportContext
) => {
  const next = valuesFromParameters(parameters);
  Object.entries(context || {}).forEach(([key, raw]) => {
    if (raw == null || raw === '') return;
    const param = parameters.find(
      item => item.name.toLowerCase() === key.toLowerCase()
    );
    if (param) next[param.name] = String(raw);
  });
  return next;
};

const departmentOptions = (list: unknown) => {
  const record =
    list && typeof list === 'object' && !Array.isArray(list)
      ? (list as Record<string, unknown>)
      : null;
  const rows = Array.isArray(list)
    ? list
    : Array.isArray(record?.data)
      ? record.data
      : Array.isArray(record?.content)
        ? record.content
        : [];
  return rows
    .map((item: any) => {
      const id = Number(item?.id ?? item?.departmentId);
      if (!Number.isFinite(id) || id <= 0) return null;
      return { label: String(item?.name || item?.departmentName || id), value: String(id) };
    })
    .filter(Boolean) as { label: string; value: string }[];
};

const isAbortError = (error: unknown) => {
  const err = error as { name?: string; status?: string; message?: string; error?: string };
  const text = `${err?.name || ''} ${err?.status || ''} ${err?.message || ''} ${err?.error || ''}`;
  return /abort|cancel/i.test(text);
};

const fetchTemplateById = async (
  id: number
): Promise<StimulsoftReportTemplate | null> => {
  const headers = new Headers();
  getStimulsoftAuthHeaders().forEach(header => headers.set(header.key, header.value));
  const backend = String(config.backendBaseURL || '').replace(/\/$/, '');
  const urls = [`/api/analytics/reports/templates/${id}`];
  if (backend) urls.push(`${backend}/api/analytics/reports/templates/${id}`);

  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      if (!response.ok) continue;
      const body = await response.json();
      const json = pickTemplateJson(body);
      const text = templateJsonToString(json);
      if (!text) continue;
      const record = (
        body?.data && typeof body.data === 'object' ? body.data : body
      ) as StimulsoftReportTemplate;
      return { ...record, templateJson: text };
    } catch {
      /* try next origin */
    }
  }
  return null;
};

const PrintReportDialog = ({
  open,
  setOpen,
  report,
  context,
  mode = 'print',
}: Props) => {
  const dispatch = useDispatch();
  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [printing, setPrinting] = useState(false);
  const [loadingParams, setLoadingParams] = useState(false);
  const [parameters, setParameters] = useState<ReportPrintParameter[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [resolved, setResolved] = useState<StimulsoftReportTemplate | null>(null);
  const [viewerSession, setViewerSession] = useState<{
    key: number;
    templateJson: string;
    params: Record<string, string>;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const templateCode = String(resolved?.code || report?.code || '').trim();
  const titleName = resolved?.name || report?.name;
  const isView = mode === 'view';
  const hasDepartmentParam = parameters.some(param => param.type === 'department');
  const facilityId = Number(context?.facilityId) || 0;
  const { data: facilityDepartments, isFetching: facilityDepartmentsLoading } =
    useGetActiveDepartmentByFacilityListQuery(
      { facilityId },
      { skip: !open || !hasDepartmentParam || !facilityId }
    );
  const { data: allDepartments, isFetching: allDepartmentsLoading } =
    useGetAllDepartmentsWithoutPaginationQuery(undefined, {
      skip: !open || !hasDepartmentParam || !!facilityId,
    });
  const departments = useMemo(
    () =>
      departmentOptions(facilityId ? facilityDepartments : allDepartments),
    [allDepartments, facilityDepartments, facilityId]
  );
  const departmentsLoading = facilityDepartmentsLoading || allDepartmentsLoading;

  useEffect(() => {
    if (!open || !report) {
      setParameters([]);
      setValues({});
      setResolved(null);
      setLoadingParams(false);
      setViewerSession(null);
      setExpanded(false);
      return;
    }

    let cancelled = false;
    const prepare = async () => {
      setLoadingParams(true);
      setParameters([]);
      setValues({});
      setResolved(report);
      setViewerSession(null);

      let template = report;
      if (report.id) {
        const fetched = await fetchTemplateById(report.id);
        if (fetched?.templateJson) {
          template = { ...report, ...fetched };
        } else {
          try {
            template = await loadTemplate(report.id, false).unwrap();
          } catch (error) {
            if (cancelled) return;
            if (isAbortError(error)) {
              try {
                template = await loadTemplate(report.id, false).unwrap();
              } catch {
                template = report;
              }
            } else {
              template = report;
            }
          }
        }
      }

      if (cancelled) return;

      const extra = extractReportPrintParameters(
        pickTemplateJson(template) ?? template.templateJson ?? report.templateJson
      );
      if (cancelled) return;

      setResolved({
        ...report,
        ...template,
        templateJson: templateJsonToString(
          template.templateJson ?? report.templateJson
        ),
      });
      setParameters(extra);
      setValues(applyContextDefaults(extra, context));
      setLoadingParams(false);
    };

    prepare().catch(() => {
      if (!cancelled) setLoadingParams(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, report, loadTemplate, context]);

  const handleClose = () => {
    setViewerSession(null);
    setExpanded(false);
    setOpen(false);
  };

  const toggleExpanded = () => {
    setExpanded(current => !current);
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  };

  const collectPrintParams = () => {
    const formParams = Object.entries(values).reduce<Record<string, string>>(
      (acc, [name, raw]) => {
        const value = toParamValue(raw);
        if (value) acc[name] = value;
        return acc;
      },
      {}
    );
    const hiddenContext = { ...(context || {}) };
    parameters.forEach(param => {
      Object.keys(hiddenContext).forEach(key => {
        if (key.toLowerCase() === param.name.toLowerCase()) {
          delete hiddenContext[key];
        }
      });
    });
    const params = toStimulsoftPdfParams(templateCode, {
      ...hiddenContext,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...formParams,
    });
    const { templateCode: _code, ...printParams } = params;
    return printParams;
  };

  const handleSubmit = async () => {
    if (!templateCode) {
      dispatch(notify({ msg: 'This report has no template code.', sev: 'error' }));
      return;
    }

    const missing = parameters.find(
      param => param.required && !toParamValue(values[param.name])
    );
    if (missing) {
      dispatch(
        notify({
          msg: `Please enter ${missing.label}.`,
          sev: 'warning',
        })
      );
      return;
    }

    try {
      setPrinting(true);
      const templateJson = resolved?.templateJson;
      if (!templateJson) {
        throw new Error('This report has no template to print.');
      }
      const printParams = collectPrintParams();
      if (isView) {
        setViewerSession({
          key: Date.now(),
          templateJson,
          params: printParams,
        });
        return;
      }
      const blob = await exportStimulsoftTemplatePdf(templateJson, printParams);
      await downloadPdfBlob(
        blob,
        resolved?.name || resolved?.code || 'report'
      );
      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.message ||
            error?.data?.message ||
            error?.data?.detail ||
            (isView ? 'Error while opening report' : 'Error while opening report PDF'),
          sev: 'error',
        })
      );
    } finally {
      setPrinting(false);
    }
  };

  const parameterFields = (
    <Form fluid>
      {loadingParams && <div>Loading report parameters…</div>}
      {!loadingParams && parameters.length === 0 && (
        <div>This report has no extra parameters.</div>
      )}
      {!loadingParams &&
        parameters
          .filter(
            param =>
              typeof param.name === 'string' &&
              /^[A-Za-z_][A-Za-z0-9_]*$/.test(param.name)
          )
          .map(param => (
            <Form.Group key={`${resolved?.id || report?.id}-${param.name}`}>
              <Form.ControlLabel>
                {param.label || param.name}
                {param.required ? ' *' : ''}
              </Form.ControlLabel>
              {param.type === 'date' ? (
                <input
                  type="date"
                  className="rs-input"
                  style={{ width: '100%', height: 36, boxSizing: 'border-box' }}
                  value={String(values[param.name] || '')}
                  onChange={event =>
                    setValues(current => ({
                      ...current,
                      [param.name]: event.target.value,
                    }))
                  }
                />
              ) : param.type === 'department' ? (
                <SelectPicker
                  data={departments}
                  value={String(values[param.name] || '') || null}
                  onChange={value =>
                    setValues(current => ({
                      ...current,
                      [param.name]: value || '',
                    }))
                  }
                  placeholder="Select department"
                  searchable
                  cleanable
                  block
                  loading={departmentsLoading}
                />
              ) : (
                <Input
                  value={values[param.name] ?? ''}
                  onChange={value =>
                    setValues(current => ({
                      ...current,
                      [param.name]: value,
                    }))
                  }
                />
              )}
            </Form.Group>
          ))}
    </Form>
  );

  if (isView) {
    const viewerHeight = expanded ? 'calc(100vh - 280px)' : '48vh';
    return (
      <Modal
        open={open}
        onClose={handleClose}
        size={expanded ? 'full' : 'lg'}
        overflow={false}
        enforceFocus={false}
      >
        <Modal.Header closeButton={false}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Modal.Title style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              {titleName || 'View report'}
            </Modal.Title>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              <IconButton
                size="small"
                title={expanded ? 'Exit full screen' : 'Expand to full screen'}
                onClick={toggleExpanded}
              >
                {expanded ? (
                  <MdCloseFullscreen style={{ color: 'var(--primary-blue)' }} />
                ) : (
                  <MdOpenInFull style={{ color: 'var(--primary-blue)' }} />
                )}
              </IconButton>
              <IconButton size="small" title="Close" onClick={handleClose}>
                <MdClose />
              </IconButton>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'flex-end',
              marginBottom: 12,
            }}
          >
            <div style={{ flex: '1 1 320px', minWidth: 240 }}>{parameterFields}</div>
            <MyButton
              onClick={handleSubmit}
              disabled={!templateCode || printing || loadingParams}
              loading={printing || loadingParams}
            >
              Generate Report
            </MyButton>
          </div>
          {viewerSession ? (
            <Suspense fallback={<div>Loading report viewer…</div>}>
              <StimulsoftViewerHost
                sessionKey={viewerSession.key}
                templateJson={viewerSession.templateJson}
                params={viewerSession.params}
                height={viewerHeight}
                onError={message => dispatch(notify({ msg: message, sev: 'error' }))}
              />
            </Suspense>
          ) : (
            <div style={{ padding: '24px 0', color: 'var(--rs-text-secondary)' }}>
              Enter parameters and click Generate Report to preview and export.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <MyButton appearance="subtle" onClick={handleClose}>
            Close
          </MyButton>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} size="xs">
      <Modal.Header>
        <Modal.Title>
          {titleName ? `Print ${titleName}` : 'Print report'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{parameterFields}</Modal.Body>
      <Modal.Footer>
        <MyButton appearance="subtle" onClick={handleClose}>
          Cancel
        </MyButton>
        <MyButton
          onClick={handleSubmit}
          disabled={!templateCode || printing || loadingParams}
          loading={printing || loadingParams}
        >
          Print
        </MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default PrintReportDialog;
