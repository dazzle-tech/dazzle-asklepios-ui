import {
  applyLicense,
  applyStimulsoftWebServer,
  attachStimulsoftProxyHeaders,
  loadStimulsoftEngine,
  loadStimulsoftViewer,
} from './loadStimulsoftDesigner';
import {
  applyPrintParameterValues,
  enableDynamicStimulsoftApis,
  patchStimulsoftParsePath,
  prepareStimulsoftDataRequest,
  tryFulfillStimulsoftApiRequest,
} from './stimulsoftApiProxy';

export const bindStimulsoftDataRequest = (report: any) => {
  if (!report || report.__stiBeginBound) return;
  report.__stiBeginBound = true;
  const previousBegin = report.onBeginProcessData;
  report.onBeginProcessData = (args: any, callback?: any) => {
    prepareStimulsoftDataRequest(report, args);
    if (tryFulfillStimulsoftApiRequest(args, callback)) {
      return;
    }
    previousBegin?.call(report, args, callback);
  };
};

export const createPreparedStimulsoftReport = async (
  templateJson: string,
  params: Record<string, string> = {},
  options?: { withViewer?: boolean }
) => {
  if (!templateJson?.trim()) {
    throw new Error('This report has no template to print.');
  }

  const Stimulsoft = options?.withViewer
    ? await loadStimulsoftViewer()
    : await loadStimulsoftEngine();
  applyLicense(Stimulsoft);
  applyStimulsoftWebServer(Stimulsoft);
  patchStimulsoftParsePath(Stimulsoft);

  const report = new Stimulsoft.Report.StiReport();
  attachStimulsoftProxyHeaders(report);
  report.load(templateJson);
  enableDynamicStimulsoftApis(Stimulsoft, report);
  applyPrintParameterValues(report, params);
  bindStimulsoftDataRequest(report);

  return { Stimulsoft, report };
};
