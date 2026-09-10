import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import {
  applyStimulsoftWebServer,
  attachStimulsoftProxyHeaders,
} from './loadStimulsoftDesigner';
import {
  enableDynamicStimulsoftApis,
  patchStimulsoftParsePath,
  prepareStimulsoftDataRequest,
  setActiveStimulsoftReport,
  tryFulfillStimulsoftApiRequest,
} from './stimulsoftApiProxy';
import {
  DesignerSchema,
  registerSchemaOnReport,
} from './reportDesignerSchema';
import { templateJsonToString } from './reportPrintParameters';

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
    const loadedJsonRef = useRef<string | null>(null);
    const reportRef = useRef<any>(null);
    const designerRef = useRef<any>(null);
    const latestJsonRef = useRef<string | null>(
      templateJsonToString(templateJson) || null
    );
    const cacheTimerRef = useRef<number | null>(null);

    const cacheJson = (json?: string | null) => {
      const text = templateJsonToString(json);
      if (text.trim()) {
        latestJsonRef.current = text;
      }
    };

    const applySavedTemplate = (report: any, json?: string | null) => {
      const text = templateJsonToString(json);
      if (!report || !text.trim()) return false;
      if (loadedJsonRef.current === text) return true;
      try {
        report.load(text);
        loadedJsonRef.current = text;
        cacheJson(text);
        return true;
      } catch {
        return false;
      }
    };

    const readLiveJson = () => {
      const report = designerRef.current?.report ?? reportRef.current;
      try {
        const json = report?.saveToJsonString?.() ?? null;
        cacheJson(json);
        return json || latestJsonRef.current;
      } catch {
        return latestJsonRef.current;
      }
    };

    useEffect(() => {
      onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
      schemaRef.current = schema;
    }, [schema]);

    useEffect(() => {
      templateJsonRef.current = templateJson;
      const text = templateJsonToString(templateJson);
      if (text.trim()) latestJsonRef.current = text;
      const report = reportRef.current;
      const designer = designerRef.current;
      if (!report || !text.trim()) return;
      if (applySavedTemplate(report, text) && designer) {
        designer.report = report;
      }
    }, [templateJson]);

    useImperativeHandle(ref, () => ({
      getTemplateJson: () => readLiveJson(),
    }));

    useEffect(() => {
      const Stimulsoft = window.Stimulsoft;
      const container = hostRef.current;
      if (!Stimulsoft?.Designer?.StiDesigner || !container) return;

      applyStimulsoftWebServer(Stimulsoft);
      patchStimulsoftParsePath(Stimulsoft);

      const options = new Stimulsoft.Designer.StiDesignerOptions();
      options.appearance.fullScreenMode = false;
      if (options.appearance.showSaveDialog !== undefined) {
        options.appearance.showSaveDialog = false;
      }
      if (options.toolbar) {
        options.toolbar.showSaveButton = false;
        options.toolbar.showFileMenuSave = false;
        options.toolbar.showFileMenuSaveAs = false;
      }

      const designer = new Stimulsoft.Designer.StiDesigner(
        options,
        'StiDesigner',
        false
      );

      const report = new Stimulsoft.Report.StiReport();
      attachStimulsoftProxyHeaders(report);
      applySavedTemplate(report, templateJsonRef.current);

      const bindDataRequest = (targetReport: any) => {
        if (!targetReport || targetReport.__stiBeginBound) return;
        targetReport.__stiBeginBound = true;
        const previousBegin = targetReport.onBeginProcessData;
        targetReport.onBeginProcessData = (args: any, callback?: any) => {
          prepareStimulsoftDataRequest(targetReport, args);
          if (tryFulfillStimulsoftApiRequest(args, callback)) {
            return;
          }
          previousBegin?.call(targetReport, args, callback);
        };
      };

      const bindActiveReport = (targetReport?: any) => {
        const next = targetReport || designer.report || reportRef.current;
        if (!next) return;
        attachStimulsoftProxyHeaders(next);
        bindDataRequest(next);
        enableDynamicStimulsoftApis(Stimulsoft, next);
        reportRef.current = next;
      };

      bindDataRequest(report);

      if (!templateJsonToString(templateJsonRef.current).trim()) {
        registerSchemaOnReport(Stimulsoft, report, schemaRef.current);
      }
      enableDynamicStimulsoftApis(Stimulsoft, report);
      designer.report = report;
      reportRef.current = report;
      designerRef.current = designer;
      cacheJson(templateJsonRef.current);

      const takeSavedJson = (args: any) => {
        if (args) args.preventDefault = true;
        const json =
          args?.report?.saveToJsonString?.() ??
          report.saveToJsonString?.() ??
          latestJsonRef.current;
        cacheJson(json);
        return onSaveRef.current?.(json);
      };

      designer.onSaveReport = takeSavedJson;
      designer.onSaveAsReport = takeSavedJson;

      if (typeof designer.onBeginProcessData !== 'undefined') {
        designer.onBeginProcessData = (args: any, callback?: any) => {
          const target = args?.report || designer.report || reportRef.current;
          bindActiveReport(target);
          prepareStimulsoftDataRequest(target, args);
          if (tryFulfillStimulsoftApiRequest(args, callback)) {
            return;
          }
        };
      }

      const bindPreviewReport = (previewReport: any) => {
        if (!previewReport || previewReport.__stiPreviewBound) return;
        previewReport.__stiPreviewBound = true;
        attachStimulsoftProxyHeaders(previewReport);
        bindDataRequest(previewReport);
        enableDynamicStimulsoftApis(Stimulsoft, previewReport);
      };

      if (typeof designer.onPreviewReport !== 'undefined') {
        const previousPreviewReport = designer.onPreviewReport;
        designer.onPreviewReport = (args: any) => {
          bindPreviewReport(args?.report);
          return previousPreviewReport?.call(designer, args);
        };
      }

      designer.onCreateReport = (args: any) => {
        if (!args?.report) return;
        const saved = templateJsonToString(templateJsonRef.current);
        if (saved.trim() && reportRef.current) {
          args.report = reportRef.current;
          designer.report = reportRef.current;
          return;
        }
        const created = args.report;
        attachStimulsoftProxyHeaders(created);
        bindDataRequest(created);
        registerSchemaOnReport(Stimulsoft, created, schemaRef.current);
        enableDynamicStimulsoftApis(Stimulsoft, created);
        reportRef.current = created;
      };

      container.innerHTML = '';
      designer.renderHtml(container);
      if (reportRef.current) {
        designer.report = reportRef.current;
      }

      const jsObject = designer.jsObject;
      const originalReceive =
        typeof jsObject?.receveFromServer === 'function'
          ? jsObject.receveFromServer.bind(jsObject)
          : null;
      if (jsObject && originalReceive) {
        jsObject.receveFromServer = (...args: any[]) => {
          const result = originalReceive(...args);
          bindActiveReport(designer.report);
          if (cacheTimerRef.current) window.clearTimeout(cacheTimerRef.current);
          cacheTimerRef.current = window.setTimeout(() => {
            readLiveJson();
          }, 300);
          return result;
        };
      }
      window.setTimeout(() => readLiveJson(), 0);

      return () => {
        if (cacheTimerRef.current) window.clearTimeout(cacheTimerRef.current);
        if (jsObject && originalReceive) {
          jsObject.receveFromServer = originalReceive;
        }
        try {
          designer.report = null;
        } catch {
          // designer may already be disposed
        }
        setActiveStimulsoftReport(null);
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
