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
    const latestJsonRef = useRef<string | null>(templateJson ?? null);
    const cacheTimerRef = useRef<number | null>(null);

    const cacheJson = (json?: string | null) => {
      if (typeof json === 'string' && json.trim()) {
        latestJsonRef.current = json;
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
      if (templateJsonRef.current) {
        try {
          report.load(templateJsonRef.current);
        } catch {
          // empty / invalid template — keep a blank report with schema bound
        }
      }

      const previousBeginProcessData = report.onBeginProcessData;
      report.onBeginProcessData = (args: any, callback?: any) => {
        prepareStimulsoftDataRequest(report, args);
        previousBeginProcessData?.call(report, args, callback);
        tryFulfillStimulsoftApiRequest(args, callback);
      };

      registerSchemaOnReport(Stimulsoft, report, schemaRef.current);
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

      designer.onCreateReport = (args: any) => {
        if (args?.report) {
          const created = args.report;
          attachStimulsoftProxyHeaders(created);
          const previousCreatedBegin = created.onBeginProcessData;
          created.onBeginProcessData = (processArgs: any, callback?: any) => {
            prepareStimulsoftDataRequest(created, processArgs);
            previousCreatedBegin?.call(created, processArgs, callback);
            tryFulfillStimulsoftApiRequest(processArgs, callback);
          };
          registerSchemaOnReport(Stimulsoft, created, schemaRef.current);
          enableDynamicStimulsoftApis(Stimulsoft, created);
          reportRef.current = created;
        }
      };

      container.innerHTML = '';
      designer.renderHtml(container);

      const jsObject = designer.jsObject;
      const originalReceive =
        typeof jsObject?.receveFromServer === 'function'
          ? jsObject.receveFromServer.bind(jsObject)
          : null;
      if (jsObject && originalReceive) {
        jsObject.receveFromServer = (...args: any[]) => {
          const result = originalReceive(...args);
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
