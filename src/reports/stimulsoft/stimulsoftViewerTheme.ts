export type StimulsoftUiMode = 'light' | 'dark';

const LIGHT_PAGE_RGB = [255, 255, 255] as const;
const DARK_PAGE_RGB = [32, 32, 36] as const;

const eachComponent = (component: any, visit: (item: any) => void) => {
  if (!component) return;
  visit(component);
  const comps = component.components;
  const count = comps?.count ?? comps?.list?.length ?? 0;
  for (let i = 0; i < count; i++) {
    const child = comps.getByIndex?.(i) ?? comps.list?.[i];
    eachComponent(child, visit);
  }
};

const toDrawingColor = (Stimulsoft: any, r: number, g: number, b: number) => {
  const Color = Stimulsoft?.System?.Drawing?.Color;
  if (!Color) return null;
  if (typeof Color.fromArgb === 'function') {
    return Color.fromArgb(255, r, g, b);
  }
  if (typeof Color.fromArgb2 === 'function') {
    return Color.fromArgb2(r, g, b);
  }
  return null;
};

export const applyStimulsoftAppearanceTheme = (
  Stimulsoft: any,
  options: any,
  uiMode?: StimulsoftUiMode
) => {
  const themes = Stimulsoft?.Viewer?.StiViewerTheme;
  const appearance = options?.appearance;
  if (!themes || !appearance) return;

  const isDark = uiMode === 'dark';
  const theme = isDark
    ? (themes.Office2022BlackBlue ?? themes.Office2022DarkGrayBlue)
    : (themes.Office2022WhiteBlue ?? themes.Office2022White);

  if (theme != null) appearance.theme = theme;

  const background = toDrawingColor(
    Stimulsoft,
    ...(isDark ? ([18, 18, 18] as const) : LIGHT_PAGE_RGB)
  );
  if (background && appearance.backgroundColor != null) {
    appearance.backgroundColor = background;
  }
};

export const hideStimulsoftDashboardParameterControls = (
  _Stimulsoft: any,
  report: any
) => {
  if (!report?.pages) return;

  const typeNameOf = (item: any) =>
    [
      item?.ident,
      item?.componentId,
      item?.elementIdent,
      item?.constructor?.name,
      item?.serviceName,
    ]
      .filter(Boolean)
      .join(' ');

  const nameOf = (item: any) =>
    String(item?.name ?? item?.alias ?? item?.key ?? '').trim();

  const isParameterControl = (item: any) => {
    if (!item || item.isDashboard) return false;
    const typeName = typeNameOf(item);
    const name = nameOf(item);
    if (item.buttonType != null) return true;
    if (
      item.initialDateRangeSelection != null ||
      item.dateViewMode != null ||
      item.dateSelectionMode != null
    ) {
      return true;
    }
    if (/DatePicker|ButtonElement|StiButton/i.test(typeName)) return true;
    if (/^(startDate|endDate|fromDate|toDate|date)$/i.test(name)) return true;
    if (/^(submit|reset|apply)$/i.test(name)) return true;
    return false;
  };

  const pageCount = report.pages.count ?? report.pages.list?.length ?? 0;
  for (let i = 0; i < pageCount; i++) {
    const page = report.pages.getByIndex?.(i) ?? report.pages.list?.[i];
    if (!page?.isDashboard) continue;

    eachComponent(page, item => {
      if (!isParameterControl(item)) return;
      try {
        item.enabled = false;
      } catch {
        /* read-only */
      }
      try {
        item.visible = false;
      } catch {
        /* read-only */
      }
    });
  }

  const variables =
    report?.dictionary?.variables?.list ??
    report?.dictionary?.variables ??
    [];
  const list = Array.isArray(variables)
    ? variables
    : [];
  const count = report?.dictionary?.variables?.count ?? list.length;
  if (typeof report?.dictionary?.variables?.getByIndex === 'function' && count > 0) {
    for (let i = 0; i < count; i++) {
      const variable = report.dictionary.variables.getByIndex(i);
      try {
        variable.requestFromUser = false;
      } catch {
        /* read-only */
      }
    }
  } else {
    list.forEach((variable: any) => {
      try {
        variable.requestFromUser = false;
      } catch {
        /* read-only */
      }
    });
  }
};

export const applyStimulsoftDashboardColorMode = (
  Stimulsoft: any,
  report: any,
  uiMode?: StimulsoftUiMode
) => {
  if (!report?.pages) return;

  const isDark = uiMode === 'dark';
  const styleIdent = Stimulsoft?.Report?.Dashboard?.StiElementStyleIdent;
  const darkStyle =
    styleIdent?.DarkGray ?? styleIdent?.DarkBlue ?? styleIdent?.WhiteBlack;
  const StiSolidBrush = Stimulsoft?.Base?.Drawing?.StiSolidBrush;
  const pageRgb = isDark ? DARK_PAGE_RGB : LIGHT_PAGE_RGB;
  const pageColor = toDrawingColor(
    Stimulsoft,
    pageRgb[0],
    pageRgb[1],
    pageRgb[2]
  );

  const pageCount = report.pages.count ?? report.pages.list?.length ?? 0;
  for (let i = 0; i < pageCount; i++) {
    const page = report.pages.getByIndex?.(i) ?? report.pages.list?.[i];
    if (!page?.isDashboard) continue;

    if (isDark && darkStyle != null) {
      eachComponent(page, item => {
        if (item?.style != null) item.style = darkStyle;
      });
    }

    if (StiSolidBrush && pageColor) {
      try {
        page.brush = new StiSolidBrush(pageColor);
      } catch {
        /* brush type mismatch on this runtime */
      }
    }
  }
};
