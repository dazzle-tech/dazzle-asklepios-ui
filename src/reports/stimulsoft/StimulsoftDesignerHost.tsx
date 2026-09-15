import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import {
  applyStimulsoftWebServer,
  attachStimulsoftProxyHeaders,
  patchStimulsoftDesignerRuntime,
  patchStimulsoftDictionaryHelper,
} from './loadStimulsoftDesigner';
import {
  enableDynamicStimulsoftApis,
  patchStimulsoftParsePath,
  prepareStimulsoftDataRequest,
  setActiveStimulsoftReport,
  tryFulfillStimulsoftApiRequest,
} from './stimulsoftApiProxy';
import {
  applyDesignerSchema,
  DesignerSchema,
  ensureDictionaryCollections,
  syncReportDictionary,
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

const refreshDesignerDictionary = (designer: any, report?: any) => {
  const js = designer?.jsObject;
  const target = report ?? designer?.report ?? js?.options?.report;
  if (target) {
    ensureDictionaryCollections(target);
    syncReportDictionary(target);
  }
  if (!js) return;
  patchStimulsoftDictionaryHelper(window.Stimulsoft);
  patchZoomPage(js);
  if (typeof js.SendCommandSynchronizeDictionary === 'function') {
    try {
      js.SendCommandSynchronizeDictionary.call(js);
    } catch {
      // designer still booting
    }
  }
};

const patchZoomPage = (js: any) => {
  if (!js || typeof js.ZoomPage !== 'function' || js.__stiZoomPatched) return;
  const original = js.ZoomPage;
  js.ZoomPage = function patchedZoomPage(...args: any[]) {
    try {
      return original.apply(this, args);
    } catch {
      // paintPanel/currentPage is missing when the designer is hidden or still booting
    }
  };
  js.__stiZoomPatched = true;
};

const safeSetDesignerReport = (designer: any, report: any) => {
  if (!designer || report === undefined) return;
  try {
    if (designer.report === report) return;
    designer.report = report;
  } catch {
    // ZoomPage throws if the paint panel is not ready yet
  }
};

const isElementVisible = (el: HTMLElement) => {
  if (!el.isConnected) return false;
  if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return true;
};

const waitUntilVisible = (
  el: HTMLElement,
  cancelled: () => boolean
) =>
  new Promise<void>(resolve => {
    if (cancelled() || isElementVisible(el)) {
      resolve();
      return;
    }
    const finish = () => {
      observer.disconnect();
      window.clearInterval(timer);
      resolve();
    };
    const observer = new ResizeObserver(() => {
      if (cancelled() || isElementVisible(el)) finish();
    });
    let node: HTMLElement | null = el;
    while (node) {
      observer.observe(node);
      node = node.parentElement;
    }
    const timer = window.setInterval(() => {
      if (cancelled() || isElementVisible(el)) finish();
    }, 50);
  });

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
    const dictionaryTimerRef = useRef<number | null>(null);

    const cacheJson = (json?: string | null) => {
      const text = templateJsonToString(json);
      if (text.trim()) {
        latestJsonRef.current = text;
      }
    };

    const applySavedTemplate = (report: any, json?: string | null) => {
      const text = templateJsonToString(json);
      if (!report || !text.trim()) return false;
      if (report.__stiLoadedJson === text) {
        ensureDictionaryCollections(report);
        syncReportDictionary(report);
        return true;
      }
      try {
        report.load(text);
        report.__stiLoadedJson = text;
        loadedJsonRef.current = text;
        cacheJson(text);
        ensureDictionaryCollections(report);
        syncReportDictionary(report);
        return true;
      } catch {
        return false;
      }
    };

    const prepareReportDictionary = (targetReport: any) => {
      if (!targetReport) return;
      applySavedTemplate(targetReport, templateJsonRef.current);
      applyDesignerSchema(window.Stimulsoft, targetReport, schemaRef.current);
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
      if (!applySavedTemplate(report, text) || !designer) return;
      applyDesignerSchema(window.Stimulsoft, report, schemaRef.current);
      refreshDesignerDictionary(designer, report);
    }, [templateJson]);

    useImperativeHandle(ref, () => ({
      getTemplateJson: () => readLiveJson(),
    }));

    useEffect(() => {
      const Stimulsoft = window.Stimulsoft;
      const container = hostRef.current;
      if (!Stimulsoft?.Designer?.StiDesigner || !container) return;

      let cancelled = false;
      let designer: any = null;
      let jsObject: any = null;
      let originalReceive: ((...args: any[]) => any) | null = null;
      let previousReady: ((...args: any[]) => any) | undefined;
      const visibilityObserver = new ResizeObserver(() => {
        if (cancelled || !designer?.jsObject || !isElementVisible(container)) return;
        patchZoomPage(designer.jsObject);
        try {
          designer.jsObject.UpdateInterface?.call(designer.jsObject);
        } catch {
          // layout refresh is best-effort after the host is shown again
        }
      });
      visibilityObserver.observe(container);

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

      const start = async () => {
        await waitUntilVisible(container, () => cancelled);
        if (cancelled || !hostRef.current) return;

        applyStimulsoftWebServer(Stimulsoft);
        patchStimulsoftParsePath(Stimulsoft);
        patchStimulsoftDictionaryHelper(Stimulsoft);
        patchStimulsoftDesignerRuntime(Stimulsoft);

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

        designer = new Stimulsoft.Designer.StiDesigner(
          options,
          `StiDesigner_${Date.now()}`,
          false
        );
        if (cancelled) {
          try {
            designer.destroy?.();
          } catch {
            // designer never rendered
          }
          designer = null;
          return;
        }

        const report = new Stimulsoft.Report.StiReport();
        attachStimulsoftProxyHeaders(report);
        prepareReportDictionary(report);

        const bindActiveReport = (targetReport?: any) => {
          const next = targetReport || designer.report || reportRef.current;
          if (!next) return;
          attachStimulsoftProxyHeaders(next);
          bindDataRequest(next);
          enableDynamicStimulsoftApis(Stimulsoft, next);
          reportRef.current = next;
        };

        bindDataRequest(report);
        enableDynamicStimulsoftApis(Stimulsoft, report);
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
          const created = args.report;
          attachStimulsoftProxyHeaders(created);
          bindDataRequest(created);
          prepareReportDictionary(created);
          enableDynamicStimulsoftApis(Stimulsoft, created);
          reportRef.current = created;
        };

        if (typeof designer.onOpenedReport !== 'undefined') {
          const previousOpened = designer.onOpenedReport;
          designer.onOpenedReport = (args: any, callback?: any) => {
            const opened = args?.report;
            if (opened) {
              attachStimulsoftProxyHeaders(opened);
              bindDataRequest(opened);
              prepareReportDictionary(opened);
              enableDynamicStimulsoftApis(Stimulsoft, opened);
              reportRef.current = opened;
            }
            previousOpened?.call(designer, args, callback);
            refreshDesignerDictionary(designer, reportRef.current);
          };
        }

        if (typeof designer.onAssignedReport !== 'undefined') {
          const previousAssigned = designer.onAssignedReport;
          designer.onAssignedReport = (args: any) => {
            const assigned = args?.report;
            if (assigned) {
              attachStimulsoftProxyHeaders(assigned);
              bindDataRequest(assigned);
              applyDesignerSchema(Stimulsoft, assigned, schemaRef.current);
              enableDynamicStimulsoftApis(Stimulsoft, assigned);
              reportRef.current = assigned;
            }
            previousAssigned?.call(designer, args);
            refreshDesignerDictionary(designer, reportRef.current);
          };
        }

        const liveReport = reportRef.current || report;
        safeSetDesignerReport(designer, liveReport);
        container.innerHTML = '';
        designer.renderHtml(container);
        jsObject = designer.jsObject;
        patchStimulsoftDesignerRuntime(Stimulsoft);
        patchZoomPage(jsObject);
        safeSetDesignerReport(designer, reportRef.current || liveReport);
        refreshDesignerDictionary(designer, reportRef.current || liveReport);

        originalReceive =
          typeof jsObject?.receveFromServer === 'function'
            ? jsObject.receveFromServer.bind(jsObject)
            : null;
        if (jsObject && originalReceive) {
          jsObject.receveFromServer = (...args: any[]) => {
            const result = originalReceive?.(...args);
            bindActiveReport(designer.report);
            if (cacheTimerRef.current) window.clearTimeout(cacheTimerRef.current);
            cacheTimerRef.current = window.setTimeout(() => {
              readLiveJson();
            }, 300);
            return result;
          };
        }
        previousReady = jsObject?.onready;
        if (jsObject) {
          jsObject.onready = (...args: any[]) => {
            previousReady?.apply(jsObject, args);
            patchZoomPage(jsObject);
            refreshDesignerDictionary(designer, reportRef.current);
          };
        }
        window.setTimeout(() => {
          if (cancelled) return;
          patchZoomPage(designer.jsObject);
          refreshDesignerDictionary(designer, reportRef.current);
          readLiveJson();
        }, 0);
        dictionaryTimerRef.current = window.setTimeout(() => {
          if (cancelled) return;
          refreshDesignerDictionary(designer, reportRef.current);
        }, 250);
      };

      start();

      return () => {
        cancelled = true;
        visibilityObserver.disconnect();
        if (cacheTimerRef.current) window.clearTimeout(cacheTimerRef.current);
        if (dictionaryTimerRef.current) {
          window.clearTimeout(dictionaryTimerRef.current);
        }
        if (jsObject && originalReceive) {
          jsObject.receveFromServer = originalReceive;
        }
        if (jsObject && previousReady) {
          jsObject.onready = previousReady;
        }
        try {
          designer?.destroy?.();
        } catch {
          // older Stimulsoft builds have no destroy
        }
        loadedJsonRef.current = null;
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
