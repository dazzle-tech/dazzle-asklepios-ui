import { templateJsonToString } from './reportPrintParameters';

export type StimulsoftDesignerMode = 'report' | 'dashboard';
export type StimulsoftTemplateType = 'REPORT' | 'DASHBOARD';

export const templateTypeFromMode = (
  mode: StimulsoftDesignerMode = 'report'
): StimulsoftTemplateType => (mode === 'dashboard' ? 'DASHBOARD' : 'REPORT');

export const isStimulsoftDashboardTemplate = (
  source?:
    | string
    | {
        templateType?: string | null;
        templateJson?: string | object | null;
      }
    | null
): boolean => {
  if (source && typeof source === 'object') {
    const stored = String(source.templateType ?? '').toUpperCase();
    if (stored === 'DASHBOARD') return true;
    if (stored === 'REPORT') return false;
  }
  const text =
    typeof source === 'string'
      ? source
      : templateJsonToString(source?.templateJson);
  return /StiDashboard/i.test(text);
};

export const matchesStimulsoftTemplateMode = (
  template: {
    templateType?: string | null;
    templateJson?: string | object | null;
  },
  mode: StimulsoftDesignerMode
): boolean => isStimulsoftDashboardTemplate(template) === (mode === 'dashboard');

export const createStimulsoftDocument = (
  Stimulsoft: any,
  mode: StimulsoftDesignerMode = 'report'
) => {
  if (
    mode === 'dashboard' &&
    typeof Stimulsoft?.Report?.StiReport?.createNewDashboard === 'function'
  ) {
    return Stimulsoft.Report.StiReport.createNewDashboard();
  }
  return new Stimulsoft.Report.StiReport();
};

export const applyStimulsoftDesignerModeOptions = (
  options: any,
  mode: StimulsoftDesignerMode
) => {
  if (!options) return options;
  const isDashboard = mode === 'dashboard';
  const appearance = options.appearance;
  const toolbar = options.toolbar;

  if (appearance) {
    if (appearance.showFileMenuNewDashboard !== undefined) {
      appearance.showFileMenuNewDashboard = isDashboard;
    }
    if (appearance.showFileMenuNewReport !== undefined) {
      appearance.showFileMenuNewReport = !isDashboard;
    }
    // PageWidth (50) fits the canvas to the window width and scrolls the height.
    // PageHeight would shrink every chart to fit the screen.
    if (isDashboard) {
      appearance.zoom = 50;
    }
  }

  if (toolbar) {
    if (toolbar.showNewDashboardButton !== undefined) {
      toolbar.showNewDashboardButton = isDashboard;
    }
    if (toolbar.showNewReportButton !== undefined) {
      toolbar.showNewReportButton = !isDashboard;
    }
  }

  return options;
};
