import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useDispatch } from 'react-redux';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { downloadPdfBlob } from '@/reports/stimulsoft/openStimulsoftPdf';
import { exportStimulsoftTemplatePdf } from '@/reports/stimulsoft/exportStimulsoftTemplatePdf';
import {
  DEFAULT_MODULE_PRINT_PARAMETERS,
  defaultDateValue,
  ReportPrintParameter,
} from '@/reports/stimulsoft/reportPrintParameters';
import {
  StimulsoftReportTemplate,
  toStimulsoftPdfParams,
  useLazyGetStimulsoftReportTemplateByIdQuery,
} from '@/services/reports/stimulsoftReportService';
import type { ModuleReportContext } from './types';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  report: StimulsoftReportTemplate | null;
  context?: ModuleReportContext;
};

const toParamValue = (raw: unknown) => {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  return String(raw ?? '').trim();
};

const defaultValues = () => {
  const next: Record<string, any> = {};
  DEFAULT_MODULE_PRINT_PARAMETERS.forEach(param => {
    next[param.name] = param.type === 'date' ? defaultDateValue(param.name) : '';
  });
  return next;
};

const PrintReportDialog = ({ open, setOpen, report, context }: Props) => {
  const dispatch = useDispatch();
  const [loadTemplate] = useLazyGetStimulsoftReportTemplateByIdQuery();
  const [printing, setPrinting] = useState(false);
  const [parameters] = useState<ReportPrintParameter[]>(DEFAULT_MODULE_PRINT_PARAMETERS);
  const [values, setValues] = useState<Record<string, any>>(defaultValues);

  const templateCode = String(report?.code || '').trim();

  useEffect(() => {
    if (!open) {
      setValues(defaultValues());
    }
  }, [open, report?.code]);

  const handlePrint = async () => {
    if (!templateCode) {
      dispatch(notify({ msg: 'This report has no template code.', sev: 'error' }));
      return;
    }

    const missing = parameters.find(
      param => param.type === 'date' && !toParamValue(values[param.name])
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

    const formParams = Object.entries(values).reduce<Record<string, string>>(
      (acc, [name, raw]) => {
        const value = toParamValue(raw);
        if (value) acc[name] = value;
        return acc;
      },
      {}
    );

    const params = toStimulsoftPdfParams(templateCode, {
      ...context,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...formParams,
    });
    const { templateCode: _code, ...printParams } = params;

    try {
      setPrinting(true);
      let template = report;
      if (!template?.templateJson && template?.id) {
        template = await loadTemplate(template.id).unwrap();
      }
      if (!template?.templateJson) {
        throw new Error('This report has no template to print.');
      }
      const blob = await exportStimulsoftTemplatePdf(template.templateJson, printParams);
      await downloadPdfBlob(blob, template.name || template.code || 'report');
      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.message ||
            error?.data?.message ||
            error?.data?.detail ||
            'Error while opening report PDF',
          sev: 'error',
        })
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={report?.name ? `Print ${report.name}` : 'Print report'}
      size="xs"
      actionButtonLabel="Print"
      actionButtonFunction={handlePrint}
      actionButtonLoading={printing}
      isDisabledActionBtn={!templateCode || printing}
      bodyheight="28vh"
      content={
        <Form fluid>
          {parameters.map(param => (
            <MyInput
              key={param.name}
              column
              width="100%"
              fieldLabel={param.label}
              fieldName={param.name}
              fieldType={param.type === 'date' ? 'date' : 'text'}
              record={values}
              setRecord={setValues}
              required={param.type === 'date'}
            />
          ))}
        </Form>
      }
    />
  );
};

export default PrintReportDialog;
