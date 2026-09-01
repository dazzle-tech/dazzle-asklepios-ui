import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import {
  DesignerSchema,
  registerSchemaOnReport,
} from './reportDesignerSchema';

export type StimulsoftDesignerHostHandle = {
  getTemplateJson: () => string | null;
};

type Props = {
  templateJson?: string | null;
  schema: DesignerSchema;
  onSave?: (templateJson: string) => void | Promise<void>;
  height?: string | number;
};

/**
 * Renders Stimulsoft Designer into a host div.
 * Must only mount after loadStimulsoftDesigner() has resolved.
 */
const StimulsoftDesignerHost = forwardRef<StimulsoftDesignerHostHandle, Props>(
  ({ templateJson, schema, onSave, height = 'calc(100vh - 220px)' }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const onSaveRef = useRef(onSave);
    const schemaRef = useRef(schema);
    const templateJsonRef = useRef(templateJson);
    const reportRef = useRef<any>(null);
    const designerRef = useRef<any>(null);

    useEffect(() => {
      onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
      schemaRef.current = schema;
    }, [schema]);

    useImperativeHandle(ref, () => ({
      getTemplateJson: () => {
        const report = designerRef.current?.report ?? reportRef.current;
        try {
          return report?.saveToJsonString?.() ?? null;
        } catch {
          return null;
        }
      },
    }));

    useEffect(() => {
      const Stimulsoft = window.Stimulsoft;
      const container = hostRef.current;
      if (!Stimulsoft?.Designer?.StiDesigner || !container) return;

      const options = new Stimulsoft.Designer.StiDesignerOptions();
      options.appearance.fullScreenMode = false;
      if (options.appearance.showSaveDialog !== undefined) {
        options.appearance.showSaveDialog = false;
      }

      const designer = new Stimulsoft.Designer.StiDesigner(
        options,
        'StiDesigner',
        false
      );

      const report = new Stimulsoft.Report.StiReport();
      if (templateJsonRef.current) {
        try {
          report.load(templateJsonRef.current);
        } catch {
          // empty / invalid template — keep a blank report with schema bound
        }
      }

      registerSchemaOnReport(Stimulsoft, report, schemaRef.current);
      designer.report = report;
      reportRef.current = report;
      designerRef.current = designer;

      designer.onSaveReport = (args: any) => {
        if (args) args.preventDefault = true;
        const json =
          args?.report?.saveToJsonString?.() ?? report.saveToJsonString();
        return onSaveRef.current?.(json);
      };

      designer.onSaveAsReport = (args: any) => {
        if (args) args.preventDefault = true;
        const json =
          args?.report?.saveToJsonString?.() ?? report.saveToJsonString();
        return onSaveRef.current?.(json);
      };

      designer.onCreateReport = (args: any) => {
        if (args?.report) {
          registerSchemaOnReport(Stimulsoft, args.report, schemaRef.current);
          reportRef.current = args.report;
        }
      };

      container.innerHTML = '';
      designer.renderHtml(container);

      return () => {
        try {
          designer.report = null;
        } catch {
          // designer may already be disposed
        }
        reportRef.current = null;
        designerRef.current = null;
        if (hostRef.current) {
          hostRef.current.innerHTML = '';
        }
      };
    }, []);

    return (
      <div
        ref={hostRef}
        className="stimulsoft-designer-host"
        style={{ width: '100%', height, minHeight: 420 }}
      />
    );
  }
);

StimulsoftDesignerHost.displayName = 'StimulsoftDesignerHost';

export default StimulsoftDesignerHost;
